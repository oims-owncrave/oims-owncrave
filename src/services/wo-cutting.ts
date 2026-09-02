"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  workOrderCutting,
  workOrderCuttingDetail,
  pemakaianBahan,
  hasilCutting,
  hasilCuttingDetail,
  penerimaanCutting,
  penerimaanCuttingDetail,
  poProduksi,
  produk,
  varianProduk,
  warna,
  bahan,
  satuan,
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { WoInput, PemakaianInput, HasilInput } from "@/lib/schemas/wo-cutting";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type WoResult = Promise<{ data?: typeof workOrderCutting.$inferSelect; error?: string }>;

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
  tabel: string,
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await tx.insert(auditLog).values({
    userId,
    aksi,
    tabel,
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

// ─── Work Order (oims-5yr.8) ─────────────────────────────────────────────────

export async function listWo() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: workOrderCutting.id,
      nomorDokumen: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      tanggal: workOrderCutting.tanggal,
      picNama: users.displayName,
      prioritas: workOrderCutting.prioritas,
      status: workOrderCutting.status,
      totalTarget: sql<number>`(SELECT COALESCE(SUM(target_cutting), 0)::int FROM work_order_cutting_detail WHERE work_order_cutting_detail.wo_id = ${workOrderCutting.id})`,
      totalBaik: sql<number>`(SELECT COALESCE(SUM(d.jumlah_baik), 0)::int FROM hasil_cutting_detail d JOIN hasil_cutting h ON h.id = d.hasil_id WHERE h.wo_id = ${workOrderCutting.id} AND h.deleted_at IS NULL)`,
    })
    .from(workOrderCutting)
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(users, eq(workOrderCutting.pic, users.id))
    .where(isNull(workOrderCutting.deletedAt))
    .orderBy(desc(workOrderCutting.createdAt));
}

export type WoListRow = Awaited<ReturnType<typeof listWo>>[number];

export async function getWoDetail(id: string) {
  await requireRole([...READ_ROLES]);
  const [header] = await db
    .select({
      id: workOrderCutting.id,
      nomorDokumen: workOrderCutting.nomorDokumen,
      poId: workOrderCutting.poId,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      tanggal: workOrderCutting.tanggal,
      pic: workOrderCutting.pic,
      picNama: users.displayName,
      mejaCutting: workOrderCutting.mejaCutting,
      prioritas: workOrderCutting.prioritas,
      status: workOrderCutting.status,
      jumlahLayer: workOrderCutting.jumlahLayer,
      panjangMarker: workOrderCutting.panjangMarker,
      lebarKain: workOrderCutting.lebarKain,
      nomorPola: workOrderCutting.nomorPola,
      catatan: workOrderCutting.catatan,
      createdAt: workOrderCutting.createdAt,
    })
    .from(workOrderCutting)
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(users, eq(workOrderCutting.pic, users.id))
    .where(and(eq(workOrderCutting.id, id), isNull(workOrderCutting.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: workOrderCuttingDetail.id,
      varianId: workOrderCuttingDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      targetCutting: workOrderCuttingDetail.targetCutting,
    })
    .from(workOrderCuttingDetail)
    .innerJoin(varianProduk, eq(workOrderCuttingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(workOrderCuttingDetail.woId, id))
    .orderBy(varianProduk.sku);

  return { ...header, details };
}

export type WoDetailData = NonNullable<Awaited<ReturnType<typeof getWoDetail>>>;

/** PO yang bisa dibuatkan WO. */
export async function listPoSiapCutting() {
  await requireRole([...WRITE_ROLES]);
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
        inArray(poProduksi.status, ["disetujui", "menunggu_bahan", "bahan_disiapkan", "sedang_cutting"]),
        isNull(poProduksi.deletedAt),
      ),
    )
    .orderBy(desc(poProduksi.createdAt));
}

export type PoSiapCutting = Awaited<ReturnType<typeof listPoSiapCutting>>[number];

function woHeaderValues(input: WoInput) {
  const num = (v: number | undefined) =>
    v !== undefined && !Number.isNaN(v) ? v : null;
  return {
    tanggal: new Date(input.tanggal),
    pic: input.pic || null,
    mejaCutting: input.mejaCutting?.trim() || null,
    prioritas: input.prioritas,
    jumlahLayer: num(input.jumlahLayer),
    panjangMarker: num(input.panjangMarker) !== null ? String(input.panjangMarker) : null,
    lebarKain: num(input.lebarKain) !== null ? String(input.lebarKain) : null,
    nomorPola: input.nomorPola?.trim() || null,
    catatan: input.catatan?.trim() || null,
  };
}

export async function createWo(input: WoInput): WoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [po] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, input.poId), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!po) return { error: "PO tidak ditemukan" };
  const allowed = ["disetujui", "menunggu_bahan", "bahan_disiapkan", "sedang_cutting"];
  if (!allowed.includes(po.status)) {
    return { error: "WO hanya untuk PO yang sudah disetujui" };
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("WO-CUT", "work_order_cutting");
        const [header] = await tx
          .insert(workOrderCutting)
          .values({ nomorDokumen, poId: input.poId, ...woHeaderValues(input), createdBy: user.id })
          .returning();

        await tx.insert(workOrderCuttingDetail).values(
          input.details.map((d) => ({
            woId: header.id,
            varianId: d.varianId,
            targetCutting: d.targetCutting,
          })),
        );

        await writeAudit(tx, "work_order_cutting", "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat WO — coba lagi" };
}

export async function updateWo(id: string, input: WoInput): WoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, id), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!before) return { error: "WO tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya WO draft yang bisa diedit" };
  if (input.poId !== before.poId) return { error: "PO tidak bisa diganti — buat WO baru" };

  return db.transaction(async (tx) => {
    const [header] = await tx
      .update(workOrderCutting)
      .set({ ...woHeaderValues(input), updatedAt: new Date() })
      .where(eq(workOrderCutting.id, id))
      .returning();

    await tx.delete(workOrderCuttingDetail).where(eq(workOrderCuttingDetail.woId, id));
    await tx.insert(workOrderCuttingDetail).values(
      input.details.map((d) => ({ woId: id, varianId: d.varianId, targetCutting: d.targetCutting })),
    );

    await writeAudit(tx, "work_order_cutting", "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

// Transisi status yang sah per status sekarang (PRD §12)
const WO_TRANSITIONS: Record<string, string[]> = {
  draft: ["siap_dikerjakan"],
  siap_dikerjakan: ["sedang_dikerjakan"],
  sedang_dikerjakan: ["ditunda", "selesai_sebagian", "selesai"],
  ditunda: ["sedang_dikerjakan"],
  selesai_sebagian: ["sedang_dikerjakan", "selesai"],
  selesai: ["diverifikasi"],
};

export async function setWoStatus(id: string, status: string): WoResult {
  const roles = status === "diverifikasi" ? (["owner"] as const) : WRITE_ROLES;
  const user = await requireRole([...roles]);

  const [before] = await db
    .select()
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, id), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!before) return { error: "WO tidak ditemukan" };
  if (!WO_TRANSITIONS[before.status]?.includes(status)) {
    return { error: `Transisi status dari "${before.status}" ke "${status}" tidak diizinkan` };
  }

  const [row] = await db
    .update(workOrderCutting)
    .set({
      status: status as typeof before.status,
      updatedAt: new Date(),
      ...(status === "diverifikasi" ? { verifiedBy: user.id, verifiedAt: new Date() } : {}),
    })
    .where(eq(workOrderCutting.id, id))
    .returning();

  await writeAudit(db, "work_order_cutting", status === "diverifikasi" ? "APPROVE" : "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteWo(id: string): WoResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, id), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!before) return { error: "WO tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya WO draft yang bisa dihapus" };

  const [row] = await db
    .update(workOrderCutting)
    .set({ deletedAt: new Date() })
    .where(eq(workOrderCutting.id, id))
    .returning();

  await writeAudit(db, "work_order_cutting", "DELETE", id, before, row, user.id);
  return { data: row };
}

// ─── Pemakaian Bahan Aktual (oims-5yr.9) ─────────────────────────────────────

export async function listPemakaian(woId: string) {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: pemakaianBahan.id,
      bahanId: pemakaianBahan.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      jumlahDiterima: pemakaianBahan.jumlahDiterima,
      jumlahDigunakan: pemakaianBahan.jumlahDigunakan,
      jumlahSisa: pemakaianBahan.jumlahSisa,
      jumlahLimbah: pemakaianBahan.jumlahLimbah,
      hargaRataRata: pemakaianBahan.hargaRataRata,
      catatan: pemakaianBahan.catatan,
    })
    .from(pemakaianBahan)
    .innerJoin(bahan, eq(pemakaianBahan.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(and(eq(pemakaianBahan.woId, woId), isNull(pemakaianBahan.deletedAt)))
    .orderBy(bahan.nama);
}

export type PemakaianRow = Awaited<ReturnType<typeof listPemakaian>>[number];

/** Prefill jumlah diterima per bahan dari penerimaan cutting PO ini. */
export async function getDiterimaPerBahan(woId: string) {
  await requireRole([...READ_ROLES]);
  const [wo] = await db
    .select({ poId: workOrderCutting.poId })
    .from(workOrderCutting)
    .where(eq(workOrderCutting.id, woId))
    .limit(1);
  if (!wo) return [];

  return db
    .select({
      bahanId: penerimaanCuttingDetail.bahanId,
      total: sql<string>`COALESCE(SUM(${penerimaanCuttingDetail.jumlahDiterima}), 0)`,
    })
    .from(penerimaanCuttingDetail)
    .innerJoin(penerimaanCutting, eq(penerimaanCuttingDetail.penerimaanId, penerimaanCutting.id))
    .where(and(eq(penerimaanCutting.poId, wo.poId), isNull(penerimaanCutting.deletedAt)))
    .groupBy(penerimaanCuttingDetail.bahanId);
}

export async function upsertPemakaian(
  woId: string,
  input: PemakaianInput,
): Promise<{ data?: typeof pemakaianBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [wo] = await db
    .select()
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, woId), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!wo) return { error: "WO tidak ditemukan" };

  const [existing] = await db
    .select()
    .from(pemakaianBahan)
    .where(
      and(
        eq(pemakaianBahan.woId, woId),
        eq(pemakaianBahan.bahanId, input.bahanId),
        isNull(pemakaianBahan.deletedAt),
      ),
    )
    .limit(1);

  const values = {
    jumlahDiterima: String(input.jumlahDiterima),
    jumlahDigunakan: String(input.jumlahDigunakan),
    jumlahSisa: String(input.jumlahSisa),
    jumlahLimbah: String(input.jumlahLimbah),
    catatan: input.catatan?.trim() || null,
  };

  if (existing) {
    // koreksi rekonsiliasi — harga snapshot TIDAK berubah
    const [row] = await db
      .update(pemakaianBahan)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(pemakaianBahan.id, existing.id))
      .returning();
    await writeAudit(db, "pemakaian_bahan", "UPDATE", existing.id, existing, row, user.id);
    return { data: row };
  }

  // snapshot harga rata-rata saat pertama catat
  const [b] = await db
    .select({ hargaRataRata: bahan.hargaRataRata })
    .from(bahan)
    .where(eq(bahan.id, input.bahanId))
    .limit(1);
  if (!b) return { error: "Bahan tidak ditemukan" };

  const [row] = await db
    .insert(pemakaianBahan)
    .values({ woId, bahanId: input.bahanId, ...values, hargaRataRata: b.hargaRataRata, createdBy: user.id })
    .returning();
  await writeAudit(db, "pemakaian_bahan", "CREATE", row.id, null, row, user.id);
  return { data: row };
}

export async function softDeletePemakaian(
  id: string,
): Promise<{ data?: typeof pemakaianBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(pemakaianBahan)
    .where(and(eq(pemakaianBahan.id, id), isNull(pemakaianBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Pemakaian tidak ditemukan" };

  const [row] = await db
    .update(pemakaianBahan)
    .set({ deletedAt: new Date() })
    .where(eq(pemakaianBahan.id, id))
    .returning();
  await writeAudit(db, "pemakaian_bahan", "DELETE", id, before, row, user.id);
  return { data: row };
}

// ─── Hasil Cutting (oims-5yr.10) ─────────────────────────────────────────────

export async function listHasil(woId: string) {
  await requireRole([...READ_ROLES]);
  const docs = await db
    .select({
      id: hasilCutting.id,
      nomorDokumen: hasilCutting.nomorDokumen,
      tanggal: hasilCutting.tanggal,
      catatan: hasilCutting.catatan,
      totalBaik: sql<number>`(SELECT COALESCE(SUM(jumlah_baik), 0)::int FROM hasil_cutting_detail WHERE hasil_cutting_detail.hasil_id = ${hasilCutting.id})`,
      totalRusak: sql<number>`(SELECT COALESCE(SUM(jumlah_rusak), 0)::int FROM hasil_cutting_detail WHERE hasil_cutting_detail.hasil_id = ${hasilCutting.id})`,
    })
    .from(hasilCutting)
    .where(and(eq(hasilCutting.woId, woId), isNull(hasilCutting.deletedAt)))
    .orderBy(desc(hasilCutting.tanggal));
  return docs;
}

export type HasilDocRow = Awaited<ReturnType<typeof listHasil>>[number];

/** Rekap agregat hasil per varian vs target WO. */
export async function getRekapHasil(woId: string) {
  await requireRole([...READ_ROLES]);

  const targets = await db
    .select({
      varianId: workOrderCuttingDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      target: workOrderCuttingDetail.targetCutting,
    })
    .from(workOrderCuttingDetail)
    .innerJoin(varianProduk, eq(workOrderCuttingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(workOrderCuttingDetail.woId, woId))
    .orderBy(varianProduk.sku);

  const agg = await db
    .select({
      varianId: hasilCuttingDetail.varianId,
      baik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
      rusak: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahRusak}), 0)::int`,
    })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .where(and(eq(hasilCutting.woId, woId), isNull(hasilCutting.deletedAt)))
    .groupBy(hasilCuttingDetail.varianId);
  const aggMap = new Map(agg.map((a) => [a.varianId, a]));

  return targets.map((t) => {
    const a = aggMap.get(t.varianId);
    const baik = a?.baik ?? 0;
    const rusak = a?.rusak ?? 0;
    return { ...t, baik, rusak, total: baik + rusak, selisih: baik - t.target };
  });
}

export type RekapHasilRow = Awaited<ReturnType<typeof getRekapHasil>>[number];

export async function createHasil(
  woId: string,
  input: HasilInput,
): Promise<{ data?: typeof hasilCutting.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [wo] = await db
    .select()
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, woId), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!wo) return { error: "WO tidak ditemukan" };
  const allowed = ["sedang_dikerjakan", "selesai_sebagian", "selesai"];
  if (!allowed.includes(wo.status)) {
    return { error: "Hasil hanya bisa dicatat saat WO sedang/selesai dikerjakan" };
  }

  const rows = input.details.filter((d) => d.jumlahBaik + d.jumlahRusak > 0);
  if (rows.length === 0) return { error: "Minimal 1 pcs hasil dicatat" };

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("CUT", "hasil_cutting");
        const [header] = await tx
          .insert(hasilCutting)
          .values({
            nomorDokumen,
            woId,
            tanggal: new Date(input.tanggal),
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(hasilCuttingDetail).values(
          rows.map((d) => ({
            hasilId: header.id,
            varianId: d.varianId,
            jumlahBaik: d.jumlahBaik,
            jumlahRusak: d.jumlahRusak,
          })),
        );

        await writeAudit(tx, "hasil_cutting", "CREATE", header.id, null, { ...header, details: rows }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal mencatat hasil — coba lagi" };
}

export async function softDeleteHasil(
  id: string,
): Promise<{ data?: typeof hasilCutting.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(hasilCutting)
    .where(and(eq(hasilCutting.id, id), isNull(hasilCutting.deletedAt)))
    .limit(1);
  if (!before) return { error: "Dokumen hasil tidak ditemukan" };
  // guard "sudah jadi sumber bundel" ditambah di oims-5yr.12

  const [row] = await db
    .update(hasilCutting)
    .set({ deletedAt: new Date() })
    .where(eq(hasilCutting.id, id))
    .returning();
  await writeAudit(db, "hasil_cutting", "DELETE", id, before, row, user.id);
  return { data: row };
}
