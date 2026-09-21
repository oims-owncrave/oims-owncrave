"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  returJahit,
  returJahitDetail,
  penerimaanHasilJahit,
  penerimaanHasilJahitDetail,
  penugasanJahit,
  penugasanJahitDetail,
  bundling,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  penjahit,
  jenisCacat,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { refreshPenugasanSelesai } from "@/lib/jahit/rekap";
import type { ReturInput } from "@/lib/schemas/retur-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type Row = typeof returJahit.$inferSelect;
type Result = { data?: Row; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505";
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
    tabel: "retur_jahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

export async function listRetur() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: returJahit.id,
      nomorDokumen: returJahit.nomorDokumen,
      penugasanId: returJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      penerimaanAsalNomor: penerimaanHasilJahit.nomorDokumen,
      tanggalRetur: returJahit.tanggalRetur,
      targetKembali: returJahit.targetKembali,
      alasan: returJahit.alasan,
      status: returJahit.status,
      totalPcs: sql<number>`(SELECT COALESCE(SUM(d.jumlah), 0)::int FROM retur_jahit_detail d WHERE d.retur_id = ${returJahit.id})`,
      biayaPerbaikan: sql<string>`(SELECT COALESCE(SUM(CASE WHEN d.penanggung_biaya = 'owncrave' THEN d.jumlah * d.tarif_perbaikan ELSE 0 END), 0) FROM retur_jahit_detail d WHERE d.retur_id = ${returJahit.id})`,
    })
    .from(returJahit)
    .innerJoin(penugasanJahit, eq(returJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(penerimaanHasilJahit, eq(returJahit.penerimaanAsalId, penerimaanHasilJahit.id))
    .where(isNull(returJahit.deletedAt))
    .orderBy(desc(returJahit.tanggalRetur));
}

export type ReturListRow = Awaited<ReturnType<typeof listRetur>>[number];

export async function getReturDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: returJahit.id,
      nomorDokumen: returJahit.nomorDokumen,
      penugasanId: returJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      penerimaanAsalId: returJahit.penerimaanAsalId,
      penerimaanAsalNomor: penerimaanHasilJahit.nomorDokumen,
      tanggalRetur: returJahit.tanggalRetur,
      targetKembali: returJahit.targetKembali,
      alasan: returJahit.alasan,
      status: returJahit.status,
      catatan: returJahit.catatan,
      createdAt: returJahit.createdAt,
    })
    .from(returJahit)
    .innerJoin(penugasanJahit, eq(returJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(penerimaanHasilJahit, eq(returJahit.penerimaanAsalId, penerimaanHasilJahit.id))
    .where(and(eq(returJahit.id, id), isNull(returJahit.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: returJahitDetail.id,
      penugasanDetailId: returJahitDetail.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlah: returJahitDetail.jumlah,
      jenisCacatId: returJahitDetail.jenisCacatId,
      jenisCacatNama: jenisCacat.nama,
      jenisCacatKode: jenisCacat.kode,
      instruksi: returJahitDetail.instruksi,
      tarifPerbaikan: returJahitDetail.tarifPerbaikan,
      penanggungBiaya: returJahitDetail.penanggungBiaya,
      fotoUrl: returJahitDetail.fotoUrl,
      // hasil perbaikan yang sudah kembali untuk retur ini
      sudahKembali: sql<number>`(
        SELECT COALESCE(SUM(h.jumlah_baik + h.jumlah_rusak), 0)::int
        FROM penerimaan_hasil_jahit_detail h JOIN penerimaan_hasil_jahit p ON p.id = h.penerimaan_id
        WHERE h.penugasan_detail_id = ${returJahitDetail.penugasanDetailId} AND p.retur_id = ${id} AND p.deleted_at IS NULL
      )`,
    })
    .from(returJahitDetail)
    .innerJoin(penugasanJahitDetail, eq(returJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .leftJoin(jenisCacat, eq(returJahitDetail.jenisCacatId, jenisCacat.id))
    .where(eq(returJahitDetail.returId, id))
    .orderBy(bundling.nomorDokumen);

  const penerimaanKembali = await db
    .select({
      id: penerimaanHasilJahit.id,
      nomorDokumen: penerimaanHasilJahit.nomorDokumen,
      tanggalJam: penerimaanHasilJahit.tanggalJam,
      totalBaik: sql<number>`(SELECT COALESCE(SUM(h.jumlah_baik), 0)::int FROM penerimaan_hasil_jahit_detail h WHERE h.penerimaan_id = ${penerimaanHasilJahit.id})`,
      totalRusak: sql<number>`(SELECT COALESCE(SUM(h.jumlah_rusak), 0)::int FROM penerimaan_hasil_jahit_detail h WHERE h.penerimaan_id = ${penerimaanHasilJahit.id})`,
    })
    .from(penerimaanHasilJahit)
    .where(and(eq(penerimaanHasilJahit.returId, id), isNull(penerimaanHasilJahit.deletedAt)))
    .orderBy(desc(penerimaanHasilJahit.tanggalJam));

  return { ...header, details, penerimaanKembali };
}

export type ReturDetailData = NonNullable<Awaited<ReturnType<typeof getReturDetail>>>;

/** Baris rusak dari satu penerimaan yang belum diretur — kandidat retur. */
export async function listRusakBisaDiretur(penerimaanId: string) {
  await requireRole([...WRITE_ROLES]);
  const rows = await db
    .select({
      penugasanDetailId: penerimaanHasilJahitDetail.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahRusak: penerimaanHasilJahitDetail.jumlahRusak,
      sudahDiretur: sql<number>`(
        SELECT COALESCE(SUM(rd.jumlah), 0)::int FROM retur_jahit_detail rd
        JOIN retur_jahit r ON r.id = rd.retur_id
        WHERE rd.penugasan_detail_id = ${penerimaanHasilJahitDetail.penugasanDetailId}
          AND r.penerimaan_asal_id = ${penerimaanId} AND r.status <> 'dibatalkan' AND r.deleted_at IS NULL
      )`,
    })
    .from(penerimaanHasilJahitDetail)
    .innerJoin(penugasanJahitDetail, eq(penerimaanHasilJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(and(eq(penerimaanHasilJahitDetail.penerimaanId, penerimaanId), sql`${penerimaanHasilJahitDetail.jumlahRusak} > 0`))
    .orderBy(bundling.nomorDokumen);
  return rows.map((r) => ({ ...r, sisaBisaDiretur: r.jumlahRusak - r.sudahDiretur }));
}

export type RusakBisaDiretur = Awaited<ReturnType<typeof listRusakBisaDiretur>>[number];

function detailValues(returId: string, input: ReturInput) {
  return input.details
    .filter((d) => d.jumlah > 0)
    .map((d) => ({
      returId,
      penugasanDetailId: d.penugasanDetailId,
      jumlah: d.jumlah,
      jenisCacatId: d.jenisCacatId || null,
      instruksi: d.instruksi?.trim() || null,
      tarifPerbaikan: String(d.tarifPerbaikan),
      penanggungBiaya: d.penanggungBiaya,
      fotoUrl: d.fotoUrl?.trim() || null,
    }));
}

/** Guard: jumlah retur ≤ rusak di penerimaan asal − yang sudah diretur (kecuali retur ini). */
async function assertCap(
  tx: Pick<typeof db, "select">,
  input: ReturInput,
  excludeReturId?: string,
): Promise<string | null> {
  const [asal] = await tx
    .select({ id: penerimaanHasilJahit.id })
    .from(penerimaanHasilJahit)
    .where(and(eq(penerimaanHasilJahit.id, input.penerimaanAsalId), eq(penerimaanHasilJahit.penugasanId, input.penugasanId), isNull(penerimaanHasilJahit.deletedAt)))
    .limit(1);
  if (!asal) return "Penerimaan asal tidak ditemukan / bukan milik penugasan ini";

  const rusak = await tx
    .select({
      penugasanDetailId: penerimaanHasilJahitDetail.penugasanDetailId,
      cap: sql<number>`${penerimaanHasilJahitDetail.jumlahRusak} - (
        SELECT COALESCE(SUM(rd.jumlah), 0)::int FROM retur_jahit_detail rd JOIN retur_jahit r ON r.id = rd.retur_id
        WHERE rd.penugasan_detail_id = ${penerimaanHasilJahitDetail.penugasanDetailId}
          AND r.penerimaan_asal_id = ${input.penerimaanAsalId} AND r.status <> 'dibatalkan' AND r.deleted_at IS NULL
          ${excludeReturId ? sql`AND r.id <> ${excludeReturId}` : sql``}
      )`,
    })
    .from(penerimaanHasilJahitDetail)
    .where(eq(penerimaanHasilJahitDetail.penerimaanId, input.penerimaanAsalId));
  const capMap = new Map(rusak.map((r) => [r.penugasanDetailId, Number(r.cap)]));

  for (const d of input.details.filter((x) => x.jumlah > 0)) {
    const cap = capMap.get(d.penugasanDetailId);
    if (cap === undefined) return "Ada bundel yang bukan bagian penerimaan asal";
    if (d.jumlah > cap) return `Jumlah retur melebihi rusak yang tersedia (sisa ${cap} pcs)`;
  }
  return null;
}

export async function createRetur(input: ReturInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const capErr = await assertCap(tx, input);
        if (capErr) return { error: capErr };

        const nomorDokumen = await generateDocNumber("RTN-JHT", "retur_jahit");
        const [header] = await tx
          .insert(returJahit)
          .values({
            nomorDokumen,
            penugasanId: input.penugasanId,
            penerimaanAsalId: input.penerimaanAsalId,
            tanggalRetur: new Date(input.tanggalRetur),
            targetKembali: input.targetKembali ? new Date(input.targetKembali) : null,
            alasan: input.alasan.trim(),
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();
        await tx.insert(returJahitDetail).values(detailValues(header.id, input));

        // retur terbuka menahan penugasan dari status selesai
        await refreshPenugasanSelesai(tx, input.penugasanId);
        await writeAudit(tx, "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat retur — coba lagi" };
}

export async function updateRetur(id: string, input: ReturInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(returJahit)
    .where(and(eq(returJahit.id, id), isNull(returJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Retur tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya retur draft yang bisa diedit" };

  return db.transaction(async (tx) => {
    const capErr = await assertCap(tx, input, id);
    if (capErr) return { error: capErr };

    const [header] = await tx
      .update(returJahit)
      .set({
        tanggalRetur: new Date(input.tanggalRetur),
        targetKembali: input.targetKembali ? new Date(input.targetKembali) : null,
        alasan: input.alasan.trim(),
        catatan: input.catatan?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(returJahit.id, id))
      .returning();
    await tx.delete(returJahitDetail).where(eq(returJahitDetail.returId, id));
    await tx.insert(returJahitDetail).values(detailValues(id, input));
    await writeAudit(tx, "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ["dikirim", "dibatalkan"],
  dikirim: ["dibatalkan"], // → diterima_kembali otomatis lewat penerimaan hasil ber-retur_id
  diterima_kembali: ["selesai"],
  selesai: [],
  dibatalkan: [],
};

export async function setReturStatus(id: string, status: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(returJahit)
    .where(and(eq(returJahit.id, id), isNull(returJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Retur tidak ditemukan" };
  if (!TRANSITIONS[before.status]?.includes(status)) {
    return { error: `Transisi dari "${before.status}" ke "${status}" tidak diizinkan` };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(returJahit)
      .set({ status: status as Row["status"], updatedAt: new Date() })
      .where(eq(returJahit.id, id))
      .returning();
    await refreshPenugasanSelesai(tx, before.penugasanId);
    await writeAudit(tx, status === "dibatalkan" ? "CANCEL" : "UPDATE", id, before, row, user.id);
    return { data: row };
  });
}

export async function softDeleteRetur(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(returJahit)
    .where(and(eq(returJahit.id, id), isNull(returJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Retur tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya retur draft yang bisa dihapus" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(returJahit)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(returJahit.id, id))
      .returning();
    await refreshPenugasanSelesai(tx, before.penugasanId);
    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}

/** Penerimaan (non-retur) yang masih punya rusak belum diretur — pilihan asal retur. */
export async function listPenerimaanPunyaRusak() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: penerimaanHasilJahit.id,
      nomorDokumen: penerimaanHasilJahit.nomorDokumen,
      penugasanId: penerimaanHasilJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      pihakNama,
      tanggalJam: penerimaanHasilJahit.tanggalJam,
    })
    .from(penerimaanHasilJahit)
    .innerJoin(penugasanJahit, eq(penerimaanHasilJahit.penugasanId, penugasanJahit.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(
      and(
        isNull(penerimaanHasilJahit.deletedAt),
        inArray(penugasanJahit.status, ["aktif", "selesai"]),
        sql`EXISTS (
          SELECT 1 FROM penerimaan_hasil_jahit_detail h
          WHERE h.penerimaan_id = ${penerimaanHasilJahit.id} AND h.jumlah_rusak > (
            SELECT COALESCE(SUM(rd.jumlah), 0) FROM retur_jahit_detail rd JOIN retur_jahit r ON r.id = rd.retur_id
            WHERE rd.penugasan_detail_id = h.penugasan_detail_id AND r.penerimaan_asal_id = ${penerimaanHasilJahit.id}
              AND r.status <> 'dibatalkan' AND r.deleted_at IS NULL
          )
        )`,
      ),
    )
    .orderBy(desc(penerimaanHasilJahit.tanggalJam));
}

export type PenerimaanPunyaRusak = Awaited<ReturnType<typeof listPenerimaanPunyaRusak>>[number];
