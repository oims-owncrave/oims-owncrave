"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { lokasiProduksi, penjahit, vendor, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { LokasiProduksiInput } from "@/lib/schemas/lokasi-produksi";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function writeAudit(
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string | null,
) {
  await db.insert(auditLog).values({
    userId: userId ?? undefined,
    aksi,
    tabel: "lokasi_produksi",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Kode lokasi otomatis: LOK-NNNN. */
export async function generateLokasiKode(): Promise<string> {
  const rows = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(NULLIF(regexp_replace(kode, '\D', '', 'g'), '')::int), 0) AS max
        FROM lokasi_produksi WHERE kode LIKE 'LOK-%'`,
  );
  return `LOK-${String(Number(rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

function normalize(input: LokasiProduksiInput) {
  return {
    kode: input.kode,
    nama: input.nama,
    jenis: input.jenis,
    alamat: input.alamat || null,
    kota: input.kota || null,
    pic: input.pic || null,
    telepon: input.telepon || null,
    vendorId: input.vendorId || null,
    catatan: input.catatan || null,
    isActive: input.isActive,
  };
}

/** Lokasi + nama vendor (untuk kolom tabel tanpa query tambahan di client). */
export async function listLokasiProduksi() {
  return db
    .select({
      id: lokasiProduksi.id,
      kode: lokasiProduksi.kode,
      nama: lokasiProduksi.nama,
      jenis: lokasiProduksi.jenis,
      alamat: lokasiProduksi.alamat,
      kota: lokasiProduksi.kota,
      pic: lokasiProduksi.pic,
      telepon: lokasiProduksi.telepon,
      vendorId: lokasiProduksi.vendorId,
      vendorNama: vendor.nama,
      catatan: lokasiProduksi.catatan,
      isActive: lokasiProduksi.isActive,
    })
    .from(lokasiProduksi)
    .leftJoin(vendor, eq(lokasiProduksi.vendorId, vendor.id))
    .where(isNull(lokasiProduksi.deletedAt))
    .orderBy(lokasiProduksi.kode);
}

export async function createLokasiProduksi(input: LokasiProduksiInput) {
  const userId = await currentUserId();

  const existing = await db
    .select({ id: lokasiProduksi.id })
    .from(lokasiProduksi)
    .where(and(eq(lokasiProduksi.kode, input.kode), isNull(lokasiProduksi.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Lokasi dengan kode "${input.kode}" sudah ada` };
  }

  const [row] = await db.insert(lokasiProduksi).values(normalize(input)).returning();

  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateLokasiProduksi(id: string, input: LokasiProduksiInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(lokasiProduksi)
    .where(eq(lokasiProduksi.id, id))
    .limit(1);

  if (!before) return { error: "Lokasi tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: lokasiProduksi.id })
      .from(lokasiProduksi)
      .where(and(eq(lokasiProduksi.kode, input.kode), isNull(lokasiProduksi.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Lokasi dengan kode "${input.kode}" sudah ada` };
    }
  }

  const [row] = await db
    .update(lokasiProduksi)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(lokasiProduksi.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteLokasiProduksi(id: string) {
  const userId = await currentUserId();

  const [penjahitRef] = await db
    .select({ id: penjahit.id })
    .from(penjahit)
    .where(and(eq(penjahit.lokasiId, id), isNull(penjahit.deletedAt)))
    .limit(1);

  if (penjahitRef) {
    return {
      error: "Lokasi tidak bisa dihapus — masih dipakai penjahit. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(lokasiProduksi)
    .where(eq(lokasiProduksi.id, id))
    .limit(1);

  if (!before) return { error: "Lokasi tidak ditemukan" };

  const [row] = await db
    .update(lokasiProduksi)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(lokasiProduksi.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
