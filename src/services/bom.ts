"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bom, bomDetail, produk, bahan, satuan, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { BomInput } from "@/lib/schemas/bom";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

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
    tabel: "bom",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listBom() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: bom.id,
      nomorDokumen: bom.nomorDokumen,
      produkId: bom.produkId,
      produkKode: produk.kode,
      produkNama: produk.nama,
      versi: bom.versi,
      status: bom.status,
      tanggalBerlaku: bom.tanggalBerlaku,
      jumlahBahan: sql<number>`(SELECT COUNT(*)::int FROM bom_detail WHERE bom_detail.bom_id = ${bom.id})`,
    })
    .from(bom)
    .innerJoin(produk, eq(bom.produkId, produk.id))
    .where(isNull(bom.deletedAt))
    .orderBy(desc(bom.createdAt));
}

export type BomListRow = Awaited<ReturnType<typeof listBom>>[number];

export async function getBomDetail(id: string) {
  await requireRole([...READ_ROLES]);
  const [header] = await db
    .select({
      id: bom.id,
      nomorDokumen: bom.nomorDokumen,
      produkId: bom.produkId,
      produkKode: produk.kode,
      produkNama: produk.nama,
      versi: bom.versi,
      status: bom.status,
      tanggalBerlaku: bom.tanggalBerlaku,
      catatan: bom.catatan,
      createdAt: bom.createdAt,
    })
    .from(bom)
    .innerJoin(produk, eq(bom.produkId, produk.id))
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: bomDetail.id,
      bahanId: bomDetail.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: bomDetail.kuantitas,
      toleransiPersen: bomDetail.toleransiPersen,
      berlakuUkuran: bomDetail.berlakuUkuran,
      keterangan: bomDetail.keterangan,
    })
    .from(bomDetail)
    .innerJoin(bahan, eq(bomDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(bomDetail.bomId, id))
    .orderBy(bahan.nama);

  return { ...header, details };
}

export type BomDetailData = NonNullable<Awaited<ReturnType<typeof getBomDetail>>>;

/**
 * Bahan resep dari BOM AKTIF sebuah produk — untuk prefill form barang masuk.
 * Kuantitas BOM sengaja tidak dikembalikan: pembelian diisi sesuai nota supplier,
 * bukan dihitung dari resep (keputusan Abu 14 Sep).
 */
export async function getBahanBomAktif(produkId: string) {
  await requireRole([...READ_ROLES]);

  const [aktif] = await db
    .select({ id: bom.id })
    .from(bom)
    .where(and(eq(bom.produkId, produkId), eq(bom.status, "aktif"), isNull(bom.deletedAt)))
    .limit(1);

  if (!aktif) return { error: "Produk ini belum punya BOM aktif" as const };

  const rows = await db
    .select({
      bahanId: bomDetail.bahanId,
      kode: bahan.kode,
      nama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      hargaRataRata: bahan.hargaRataRata,
    })
    .from(bomDetail)
    .innerJoin(bahan, eq(bomDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(and(eq(bomDetail.bomId, aktif.id), isNull(bahan.deletedAt)))
    .orderBy(bahan.nama);

  // satu bahan bisa muncul beberapa kali di BOM (beda berlakuUkuran) — di pembelian cukup sekali
  const unik = [...new Map(rows.map((r) => [r.bahanId, r])).values()];
  return { data: unik };
}

function detailValues(bomId: string, input: BomInput) {
  return input.details.map((d) => ({
    bomId,
    bahanId: d.bahanId,
    kuantitas: String(d.kuantitas),
    toleransiPersen: String(d.toleransiPersen),
    berlakuUkuran: d.berlakuUkuran?.trim() || null,
    keterangan: d.keterangan?.trim() || null,
  }));
}

export async function createBom(input: BomInput): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // versi = MAX+1 per produk (bukan count — count salah kalau ada versi terhapus)
        const [{ maxVersi }] = await tx
          .select({ maxVersi: sql<number>`COALESCE(MAX(${bom.versi}), 0)::int` })
          .from(bom)
          .where(eq(bom.produkId, input.produkId));

        const nomorDokumen = await generateDocNumber("BOM", "bom");

        const [header] = await tx
          .insert(bom)
          .values({
            nomorDokumen,
            produkId: input.produkId,
            versi: maxVersi + 1,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(bomDetail).values(detailValues(header.id, input));
        await writeAudit(tx, "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat BOM — coba lagi" };
}

export async function updateBom(id: string, input: BomInput): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(bom)
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);
  if (!before) return { error: "BOM tidak ditemukan" };
  if (before.status !== "draft") {
    return { error: "BOM non-draft tidak bisa diedit — buat versi baru" };
  }
  if (input.produkId !== before.produkId) {
    return { error: "Produk tidak bisa diganti — buat BOM baru untuk produk lain" };
  }

  return db.transaction(async (tx) => {
    const [header] = await tx
      .update(bom)
      .set({ catatan: input.catatan?.trim() || null, updatedAt: new Date() })
      .where(eq(bom.id, id))
      .returning();

    // bom_detail bukan ledger — replace boleh (mutasi_stok yang haram)
    await tx.delete(bomDetail).where(eq(bomDetail.bomId, id));
    await tx.insert(bomDetail).values(detailValues(id, input));

    await writeAudit(tx, "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

export async function activateBom(id: string): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole(["owner"]);

  const [target] = await db
    .select()
    .from(bom)
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);
  if (!target) return { error: "BOM tidak ditemukan" };
  if (target.status !== "draft") {
    return { error: "Hanya BOM draft yang bisa diaktifkan" };
  }

  return db.transaction(async (tx) => {
    // nonaktifkan versi aktif lama DULU — partial unique menolak 2 aktif per produk
    await tx
      .update(bom)
      .set({ status: "nonaktif", updatedAt: new Date() })
      .where(
        and(
          eq(bom.produkId, target.produkId),
          eq(bom.status, "aktif"),
          isNull(bom.deletedAt),
        ),
      );

    const [row] = await tx
      .update(bom)
      .set({
        status: "aktif",
        tanggalBerlaku: new Date(),
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bom.id, id))
      .returning();

    await writeAudit(tx, "APPROVE", id, target, row, user.id);
    return { data: row };
  });
}

export async function deactivateBom(id: string): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(bom)
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);
  if (!before) return { error: "BOM tidak ditemukan" };
  if (before.status !== "aktif") {
    return { error: "Hanya BOM aktif yang bisa dinonaktifkan" };
  }

  const [row] = await db
    .update(bom)
    .set({ status: "nonaktif", updatedAt: new Date() })
    .where(eq(bom.id, id))
    .returning();

  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function createNewVersion(id: string): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [source] = await db
    .select()
    .from(bom)
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);
  if (!source) return { error: "BOM tidak ditemukan" };

  const details = await db
    .select()
    .from(bomDetail)
    .where(eq(bomDetail.bomId, id));
  if (details.length === 0) return { error: "BOM sumber tidak punya detail" };

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [{ maxVersi }] = await tx
          .select({ maxVersi: sql<number>`COALESCE(MAX(${bom.versi}), 0)::int` })
          .from(bom)
          .where(eq(bom.produkId, source.produkId));

        const nomorDokumen = await generateDocNumber("BOM", "bom");

        const [header] = await tx
          .insert(bom)
          .values({
            nomorDokumen,
            produkId: source.produkId,
            versi: maxVersi + 1,
            catatan: source.catatan,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(bomDetail).values(
          details.map((d) => ({
            bomId: header.id,
            bahanId: d.bahanId,
            kuantitas: d.kuantitas,
            toleransiPersen: d.toleransiPersen,
            berlakuUkuran: d.berlakuUkuran,
            keterangan: d.keterangan,
          })),
        );

        await writeAudit(tx, "CREATE", header.id, { sumber: source.id }, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat versi baru — coba lagi" };
}

export async function softDeleteBom(id: string): Promise<{ data?: typeof bom.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(bom)
    .where(and(eq(bom.id, id), isNull(bom.deletedAt)))
    .limit(1);
  if (!before) return { error: "BOM tidak ditemukan" };
  if (before.status !== "draft") {
    return { error: "Hanya BOM draft yang bisa dihapus — nonaktifkan yang lain" };
  }

  const [row] = await db
    .update(bom)
    .set({ deletedAt: new Date() })
    .where(eq(bom.id, id))
    .returning();

  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}
