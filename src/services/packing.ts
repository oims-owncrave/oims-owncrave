"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  packing,
  packingDetail,
  finishing,
  finishingDetail,
  barangJadi,
  kemasan,
  gudangBarangJadi,
  poProduksi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { Packing } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { CHECKLIST_PACKING } from "@/lib/qc/proses-finishing";
import type { PackingInput } from "@/lib/schemas/packing";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi", "admin_gudang"] as const;

type Result = { data?: Packing; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505"
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
    tabel: "packing",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Baris finishing selesai yang belum dipacking. */
export async function listBarisSiapPacking() {
  await requireRole([...READ_ROLES]);

  const rows = await db
    .select({
      finishingDetailId: finishingDetail.id,
      finishingId: finishing.id,
      nomorFinishing: finishing.nomorDokumen,
      varianId: finishingDetail.varianId,
      grade: finishingDetail.grade,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlah: finishingDetail.jumlah,
      sudah: sql<number>`(
        SELECT COALESCE(SUM(pd.jumlah), 0)::int
        FROM packing_detail pd
        JOIN packing p ON p.id = pd.packing_id
        WHERE pd.finishing_detail_id = ${finishingDetail.id}
          AND p.deleted_at IS NULL AND p.status <> 'dibatalkan'
      )`,
    })
    .from(finishingDetail)
    .innerJoin(finishing, eq(finishingDetail.finishingId, finishing.id))
    .innerJoin(varianProduk, eq(finishingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(and(isNull(finishing.deletedAt), eq(finishing.status, "selesai")))
    .orderBy(desc(finishing.tanggalMasuk));

  return rows
    .map((r) => ({ ...r, sisa: r.jumlah - Number(r.sudah) }))
    .filter((r) => r.sisa > 0);
}

export type BarisPackingRow = Awaited<ReturnType<typeof listBarisSiapPacking>>[number];

export async function listPacking() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: packing.id,
      nomorDokumen: packing.nomorDokumen,
      tanggal: packing.tanggal,
      status: packing.status,
      checklist: packing.checklist,
      nomorFinishing: finishing.nomorDokumen,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM packing_detail d WHERE d.packing_id = ${packing.id}
      )`,
      sudahMasukGudang: sql<number>`(
        SELECT COALESCE(SUM(bd.jumlah), 0)::int
        FROM barang_jadi_detail bd
        JOIN barang_jadi bj ON bj.id = bd.barang_jadi_id
        WHERE bj.packing_id = ${packing.id} AND bj.deleted_at IS NULL
      )`,
    })
    .from(packing)
    .leftJoin(finishing, eq(packing.finishingId, finishing.id))
    .leftJoin(poProduksi, eq(packing.poId, poProduksi.id))
    .leftJoin(users, eq(packing.picId, users.id))
    .where(isNull(packing.deletedAt))
    .orderBy(desc(packing.tanggal));
}

export type PackingRow = Awaited<ReturnType<typeof listPacking>>[number];

export async function getPackingDetail(id: string) {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: packingDetail.id,
      varianId: packingDetail.varianId,
      grade: packingDetail.grade,
      jumlah: packingDetail.jumlah,
      batch: packingDetail.batch,
      barcode: packingDetail.barcode,
      kemasanNama: kemasan.nama,
      gudangNama: gudangBarangJadi.nama,
      gudangTujuanId: packingDetail.gudangTujuanId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
    })
    .from(packingDetail)
    .innerJoin(varianProduk, eq(packingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(kemasan, eq(packingDetail.kemasanId, kemasan.id))
    .leftJoin(gudangBarangJadi, eq(packingDetail.gudangTujuanId, gudangBarangJadi.id))
    .where(eq(packingDetail.packingId, id))
    .orderBy(varianProduk.sku);
}

export async function createPacking(input: PackingInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [f] = await tx
          .select({ id: finishing.id, status: finishing.status, poId: finishing.poId })
          .from(finishing)
          .where(and(eq(finishing.id, input.finishingId), isNull(finishing.deletedAt)))
          .limit(1);

        if (!f) return { error: "Dokumen finishing tidak ditemukan" };
        if (f.status !== "selesai") {
          return { error: "Finishing belum selesai — selesaikan dulu sebelum packing" };
        }

        // GUARD: tak boleh melebihi finishing selesai yang belum dipacking
        for (const d of input.details) {
          const [k] = await tx
            .select({
              jumlah: finishingDetail.jumlah,
              sudah: sql<number>`(
                SELECT COALESCE(SUM(pd.jumlah), 0)::int
                FROM packing_detail pd
                JOIN packing p ON p.id = pd.packing_id
                WHERE pd.finishing_detail_id = ${finishingDetail.id}
                  AND p.deleted_at IS NULL AND p.status <> 'dibatalkan'
              )`,
            })
            .from(finishingDetail)
            .where(eq(finishingDetail.id, d.finishingDetailId))
            .limit(1);

          if (!k) return { error: "Baris finishing tidak ditemukan" };
          const sisa = k.jumlah - Number(k.sudah);
          if (d.jumlah > sisa) {
            return { error: `Jumlah packing melebihi hasil finishing (sisa ${sisa} pcs)` };
          }
        }

        const nomorDokumen = await generateDocNumber("PKG", "packing");

        const [header] = await tx
          .insert(packing)
          .values({
            nomorDokumen,
            poId: f.poId,
            finishingId: input.finishingId,
            tanggal: new Date(input.tanggal),
            picId: input.picId || null,
            lokasiId: input.lokasiId || null,
            checklist: {},
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(packingDetail).values({
            packingId: header.id,
            finishingDetailId: d.finishingDetailId,
            varianId: d.varianId,
            grade: d.grade,
            jumlah: d.jumlah,
            kemasanId: d.kemasanId || null,
            batch: d.batch || null,
            gudangTujuanId: d.gudangTujuanId || null,
            barcode: d.barcode || null,
          });
        }

        await writeAudit(tx, "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

export async function updateChecklistPacking(
  id: string,
  checklist: Record<string, boolean>,
): Promise<{ error?: string }> {
  await requireRole([...WRITE_ROLES]);

  await db.update(packing).set({ checklist, updatedAt: new Date() }).where(eq(packing.id, id));
  return {};
}

/**
 * Transisi status. Status 'selesai' DITOLAK kalau checklist belum lengkap —
 * kalau tidak di-guard, checklist cuma dekorasi.
 */
export async function updateStatusPacking(
  id: string,
  status: "berjalan" | "selesai" | "dibatalkan",
): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(packing)
    .where(and(eq(packing.id, id), isNull(packing.deletedAt)))
    .limit(1);

  if (!before) return { error: "Packing tidak ditemukan" };

  const boleh: Record<string, string[]> = {
    draft: ["berjalan", "dibatalkan"],
    berjalan: ["selesai", "dibatalkan"],
    selesai: [],
    dibatalkan: [],
  };

  if (!(boleh[before.status] ?? []).includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  if (status === "selesai") {
    const checklist = (before.checklist ?? {}) as Record<string, boolean>;
    const kurang = CHECKLIST_PACKING.filter((c) => checklist[c.key] !== true);
    if (kurang.length > 0) {
      return {
        error: `Checklist belum lengkap — ${kurang.length} item belum dicentang (${kurang[0].label}${kurang.length > 1 ? ", dst" : ""})`,
      };
    }
  }

  const [row] = await db
    .update(packing)
    .set({ status, updatedAt: new Date() })
    .where(eq(packing.id, id))
    .returning();

  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeletePacking(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(packing)
    .where(and(eq(packing.id, id), isNull(packing.deletedAt)))
    .limit(1);

  if (!before) return { error: "Packing tidak ditemukan" };

  const [sudahMasuk] = await db
    .select({ id: barangJadi.id })
    .from(barangJadi)
    .where(and(eq(barangJadi.packingId, id), isNull(barangJadi.deletedAt)))
    .limit(1);

  if (sudahMasuk) {
    return { error: "Packing sudah masuk gudang barang jadi — tidak bisa dihapus" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(packing)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(packing.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}
