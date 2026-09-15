"use server";

import { and, eq, isNull, sql, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { produk, varianProduk, auditLog, bom } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { ProdukInput } from "@/lib/schemas/produk";

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
    tabel: "produk",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listProduk() {
  // bomAktifId: null = produk belum punya resep. Kolom tambahan, bentuk lama tetap utuh
  // supaya pemakai lain (form barang masuk, PO, WO) tidak terpengaruh.
  return db
    .select({
      ...getTableColumns(produk),
      bomAktifId: sql<string | null>`(
        select b.id from bom b
        where b.produk_id = "produk"."id"
          and b.status = 'aktif'
          and b.deleted_at is null
        limit 1
      )`,
    })
    .from(produk)
    .where(isNull(produk.deletedAt))
    .orderBy(produk.nama);
}

export async function createProduk(input: ProdukInput) {
  const userId = await currentUserId();

  // Guard kode unik (hanya yang belum soft-deleted)
  const existing = await db
    .select({ id: produk.id })
    .from(produk)
    .where(and(eq(produk.kode, input.kode), isNull(produk.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db.insert(produk).values(input).returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateProduk(id: string, input: ProdukInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(produk)
    .where(eq(produk.id, id))
    .limit(1);

  if (!before) return { error: "Produk tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: produk.id })
      .from(produk)
      .where(and(eq(produk.kode, input.kode), isNull(produk.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(produk)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(produk.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteProduk(id: string) {
  const userId = await currentUserId();

  // Guard: tidak boleh hapus jika masih punya varian aktif
  const used = await db
    .select({ id: varianProduk.id })
    .from(varianProduk)
    .where(and(eq(varianProduk.produkId, id), isNull(varianProduk.deletedAt)))
    .limit(1);

  if (used.length > 0) {
    return {
      error: "Produk tidak bisa dihapus — masih punya varian. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(produk)
    .where(eq(produk.id, id))
    .limit(1);

  if (!before) return { error: "Produk tidak ditemukan" };

  const [row] = await db
    .update(produk)
    .set({ deletedAt: new Date() })
    .where(eq(produk.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
