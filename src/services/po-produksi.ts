"use server";

import { and, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  poProduksi,
  poProduksiDetail,
  produk,
  varianProduk,
  warna,
  bom,
  bomDetail,
  bahan,
  satuan,
  stok,
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { cocokkanUkuranBerlaku } from "@/lib/bom-ukuran";
import type { PoInput } from "@/lib/schemas/po-produksi";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type PoResult = Promise<{ data?: typeof poProduksi.$inferSelect; error?: string }>;

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

async function writeAudit(
  tx: Pick<typeof db, "insert">,
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await tx.insert(auditLog).values({
    userId,
    aksi,
    tabel: "po_produksi",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Nomor PO-YYYY-NNNN — reset per TAHUN (PRD §8), beda dari dokumen lain yang per bulan. */
async function generatePoNumber(): Promise<string> {
  const yyyy = String(new Date().getFullYear());
  const like = `PO-${yyyy}-%`;
  const rows = await db.execute<{ count: number }>(
    sql`SELECT COUNT(*)::int AS count FROM po_produksi WHERE nomor_dokumen LIKE ${like}`,
  );
  const count = Number(rows[0]?.count ?? 0);
  return `PO-${yyyy}-${String(count + 1).padStart(4, "0")}`;
}

export async function listPo() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      tanggal: poProduksi.tanggal,
      produkKode: produk.kode,
      produkNama: produk.nama,
      jenis: poProduksi.jenis,
      prioritas: poProduksi.prioritas,
      status: poProduksi.status,
      targetSelesai: poProduksi.targetSelesai,
      totalTarget: sql<number>`(SELECT COALESCE(SUM(jumlah_target), 0)::int FROM po_produksi_detail WHERE po_produksi_detail.po_id = ${poProduksi.id})`,
    })
    .from(poProduksi)
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(isNull(poProduksi.deletedAt))
    .orderBy(desc(poProduksi.createdAt));
}

export type PoListRow = Awaited<ReturnType<typeof listPo>>[number];

/** PO relevan untuk dropdown (mis. form barang keluar: tidak selesai/dibatalkan). */
export async function listActivePoOptions() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      produkNama: produk.nama,
    })
    .from(poProduksi)
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(
      and(
        notInArray(poProduksi.status, ["selesai", "dibatalkan"]),
        isNull(poProduksi.deletedAt),
      ),
    )
    .orderBy(desc(poProduksi.createdAt));
}

export type PoOption = Awaited<ReturnType<typeof listActivePoOptions>>[number];

export async function getPoDetail(id: string) {
  await requireRole([...READ_ROLES]);
  const [header] = await db
    .select({
      id: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      tanggal: poProduksi.tanggal,
      produkId: poProduksi.produkId,
      produkKode: produk.kode,
      produkNama: produk.nama,
      bomId: poProduksi.bomId,
      tanggalMulai: poProduksi.tanggalMulai,
      targetSelesai: poProduksi.targetSelesai,
      prioritas: poProduksi.prioritas,
      jenis: poProduksi.jenis,
      status: poProduksi.status,
      penanggungJawab: poProduksi.penanggungJawab,
      penanggungJawabNama: users.displayName,
      catatan: poProduksi.catatan,
      createdAt: poProduksi.createdAt,
    })
    .from(poProduksi)
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(users, eq(poProduksi.penanggungJawab, users.id))
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: poProduksiDetail.id,
      varianId: poProduksiDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahTarget: poProduksiDetail.jumlahTarget,
      lebihanPcs: poProduksiDetail.lebihanPcs,
    })
    .from(poProduksiDetail)
    .innerJoin(varianProduk, eq(poProduksiDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(poProduksiDetail.poId, id))
    .orderBy(varianProduk.sku);

  return { ...header, details };
}

export type PoDetailData = NonNullable<Awaited<ReturnType<typeof getPoDetail>>>;

function detailValues(poId: string, input: PoInput) {
  return input.details.map((d) => ({
    poId,
    varianId: d.varianId,
    jumlahTarget: d.jumlahTarget,
    lebihanPcs: d.lebihanPcs,
  }));
}

function headerValues(input: PoInput) {
  return {
    tanggal: new Date(input.tanggal),
    tanggalMulai: input.tanggalMulai ? new Date(input.tanggalMulai) : null,
    targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
    prioritas: input.prioritas,
    jenis: input.jenis,
    penanggungJawab: input.penanggungJawab || null,
    catatan: input.catatan?.trim() || null,
  };
}

export async function createPo(input: PoInput): PoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generatePoNumber();
        const [header] = await tx
          .insert(poProduksi)
          .values({
            nomorDokumen,
            produkId: input.produkId,
            ...headerValues(input),
            createdBy: user.id,
          })
          .returning();

        await tx.insert(poProduksiDetail).values(detailValues(header.id, input));
        await writeAudit(tx, "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat PO — coba lagi" };
}

export async function updatePo(id: string, input: PoInput): PoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!before) return { error: "PO tidak ditemukan" };
  if (before.status !== "draft") {
    return { error: "Hanya PO draft yang bisa diedit" };
  }
  if (input.produkId !== before.produkId) {
    return { error: "Produk tidak bisa diganti — buat PO baru" };
  }

  return db.transaction(async (tx) => {
    const [header] = await tx
      .update(poProduksi)
      .set({ ...headerValues(input), updatedAt: new Date() })
      .where(eq(poProduksi.id, id))
      .returning();

    await tx.delete(poProduksiDetail).where(eq(poProduksiDetail.poId, id));
    await tx.insert(poProduksiDetail).values(detailValues(id, input));

    await writeAudit(tx, "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

export async function submitPo(id: string): PoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!before) return { error: "PO tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya PO draft yang bisa diajukan" };

  const [row] = await db
    .update(poProduksi)
    .set({ status: "menunggu_persetujuan", updatedAt: new Date() })
    .where(eq(poProduksi.id, id))
    .returning();

  await writeAudit(db, "SUBMIT", id, before, row, user.id);
  return { data: row };
}

export async function approvePo(id: string): PoResult {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!before) return { error: "PO tidak ditemukan" };
  if (before.status !== "menunggu_persetujuan") {
    return { error: "Hanya PO menunggu persetujuan yang bisa disetujui" };
  }

  // Snapshot BOM aktif produk — approve butuh BOM supaya estimasi bahan bisa dihitung
  const [bomAktif] = await db
    .select({ id: bom.id })
    .from(bom)
    .where(
      and(eq(bom.produkId, before.produkId), eq(bom.status, "aktif"), isNull(bom.deletedAt)),
    )
    .limit(1);
  if (!bomAktif) {
    return { error: "Produk belum punya BOM aktif — aktifkan BOM dulu sebelum menyetujui PO" };
  }

  const [row] = await db
    .update(poProduksi)
    .set({
      status: "disetujui",
      bomId: bomAktif.id,
      approvedBy: user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(poProduksi.id, id))
    .returning();

  await writeAudit(db, "APPROVE", id, before, row, user.id);
  return { data: row };
}

export async function cancelPo(id: string): PoResult {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!before) return { error: "PO tidak ditemukan" };
  const cancellable = ["draft", "menunggu_persetujuan", "disetujui", "menunggu_bahan"];
  if (!cancellable.includes(before.status)) {
    return { error: "PO yang sudah masuk proses cutting tidak bisa dibatalkan" };
  }

  const [row] = await db
    .update(poProduksi)
    .set({ status: "dibatalkan", updatedAt: new Date() })
    .where(eq(poProduksi.id, id))
    .returning();

  await writeAudit(db, "CANCEL", id, before, row, user.id);
  return { data: row };
}

export async function softDeletePo(id: string): PoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, id), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!before) return { error: "PO tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya PO draft yang bisa dihapus — batalkan yang lain" };

  const [row] = await db
    .update(poProduksi)
    .set({ deletedAt: new Date() })
    .where(eq(poProduksi.id, id))
    .returning();

  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}

/** Opsi penanggung jawab PO — semua user aktif (listUsers owner-only, ini cukup id+nama). */
export async function listPicOptions() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.displayName);
}

export type PicOption = Awaited<ReturnType<typeof listPicOptions>>[number];

// ─── Estimasi Kebutuhan Bahan (oims-5yr.5) ────────────────────────────────────

export type EstimasiRow = {
  bahanId: string;
  bahanKode: string;
  bahanNama: string;
  bahanUkuran?: string | null;
  satuanSingkatan: string;
  kebutuhanStandar: number;
  totalKebutuhan: number;
  stokTersedia: number;
  kekurangan: number;
  status: "tersedia" | "sebagian" | "tidak_tersedia";
};

export type EstimasiResult =
  | { error: string }
  | { bomNomor: string; bomVersi: number; rows: EstimasiRow[] };

export async function getEstimasiBahan(poId: string): Promise<EstimasiResult> {
  await requireRole([...READ_ROLES]);

  const [po] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, poId), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!po) return { error: "PO tidak ditemukan" };

  // BOM: snapshot PO (setelah approve) ?? BOM aktif produk saat ini (preview draft)
  let bomRow: { id: string; nomorDokumen: string; versi: number } | undefined;
  if (po.bomId) {
    [bomRow] = await db
      .select({ id: bom.id, nomorDokumen: bom.nomorDokumen, versi: bom.versi })
      .from(bom)
      .where(eq(bom.id, po.bomId))
      .limit(1);
  } else {
    [bomRow] = await db
      .select({ id: bom.id, nomorDokumen: bom.nomorDokumen, versi: bom.versi })
      .from(bom)
      .where(and(eq(bom.produkId, po.produkId), eq(bom.status, "aktif"), isNull(bom.deletedAt)))
      .limit(1);
  }
  if (!bomRow) {
    return { error: "Produk belum punya BOM aktif — buat & aktifkan BOM dulu" };
  }

  const details = await db
    .select({
      varianUkuran: varianProduk.ukuran,
      jumlahTarget: poProduksiDetail.jumlahTarget,
      lebihanPcs: poProduksiDetail.lebihanPcs,
    })
    .from(poProduksiDetail)
    .innerJoin(varianProduk, eq(poProduksiDetail.varianId, varianProduk.id))
    .where(eq(poProduksiDetail.poId, poId));

  const bomRows = await db
    .select({
      bahanId: bomDetail.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      bahanUkuran: bahan.ukuran,
      satuanSingkatan: satuan.singkatan,
      kuantitas: bomDetail.kuantitas,
      toleransiPersen: bomDetail.toleransiPersen,
      berlakuUkuran: bomDetail.berlakuUkuran,
    })
    .from(bomDetail)
    .innerJoin(bahan, eq(bomDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(bomDetail.bomId, bomRow.id));

  const bahanIds = [...new Set(bomRows.map((r) => r.bahanId))];
  const stokRows = bahanIds.length
    ? await db.select().from(stok).where(inArray(stok.bahanId, bahanIds))
    : [];
  const stokMap = new Map(stokRows.map((s) => [s.bahanId, Number(s.kuantitas)]));

  // pcs efektif per varian = target + lebihan (pcs, istilah klien) = total rencana cutting
  const pcsEfektif = details.map((d) => ({
    ukuran: d.varianUkuran.toUpperCase(),
    pcs: d.jumlahTarget + d.lebihanPcs,
  }));

  const agg = new Map<string, EstimasiRow>();
  for (const r of bomRows) {
    const ukuranBerlaku = cocokkanUkuranBerlaku(r.berlakuUkuran);
    const applicable = ukuranBerlaku
      ? pcsEfektif.filter((p) => ukuranBerlaku.includes(p.ukuran))
      : pcsEfektif;
    const pcs = applicable.reduce((s, p) => s + p.pcs, 0);
    const standar = pcs * Number(r.kuantitas);
    const total = standar * (1 + Number(r.toleransiPersen) / 100);

    const prev = agg.get(r.bahanId);
    if (prev) {
      prev.kebutuhanStandar += standar;
      prev.totalKebutuhan += total;
    } else {
      agg.set(r.bahanId, {
        bahanId: r.bahanId,
        bahanKode: r.bahanKode,
        bahanNama: r.bahanNama,
        bahanUkuran: r.bahanUkuran,
        satuanSingkatan: r.satuanSingkatan,
        kebutuhanStandar: standar,
        totalKebutuhan: total,
        stokTersedia: stokMap.get(r.bahanId) ?? 0,
        kekurangan: 0,
        status: "tersedia",
      });
    }
  }

  const rows = [...agg.values()].map((row) => {
    const kekurangan = Math.max(0, row.totalKebutuhan - row.stokTersedia);
    const status: EstimasiRow["status"] =
      row.stokTersedia >= row.totalKebutuhan
        ? "tersedia"
        : row.stokTersedia > 0
          ? "sebagian"
          : "tidak_tersedia";
    return { ...row, kekurangan, status };
  });

  return { bomNomor: bomRow.nomorDokumen, bomVersi: bomRow.versi, rows };
}
