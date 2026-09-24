"use server";

import { and, eq, isNull, sql, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { produk, varianProduk, auditLog, bom, warna } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { urutkanUkuran } from "@/lib/bom-ukuran";
import type { ProdukInput } from "@/lib/schemas/produk";
import { requireRole } from "@/lib/auth";

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
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
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
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
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
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
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

/** Ukuran unik varian aktif per produk, dipakai buat isi pilihan MultiSelect di form BOM. */
export async function listUkuranPerProduk(): Promise<Record<string, string[]>> {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  const rows = await db
    .selectDistinct({ produkId: varianProduk.produkId, ukuran: varianProduk.ukuran })
    .from(varianProduk)
    .where(isNull(varianProduk.deletedAt));

  const map: Record<string, string[]> = {};
  for (const r of rows) {
    (map[r.produkId] ??= []).push(r.ukuran);
  }
  for (const produkId of Object.keys(map)) {
    map[produkId] = urutkanUkuran(map[produkId]);
  }
  return map;
}

/** Warna unik varian aktif per produk, dipakai buat isi pilihan MultiSelect di form BOM. */
export async function listWarnaPerProduk(): Promise<Record<string, { id: string; nama: string }[]>> {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  const rows = await db
    .selectDistinct({ produkId: varianProduk.produkId, id: warna.id, nama: warna.nama })
    .from(varianProduk)
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(isNull(varianProduk.deletedAt))
    .orderBy(warna.nama);
  const map: Record<string, { id: string; nama: string }[]> = {};
  for (const r of rows) (map[r.produkId] ??= []).push({ id: r.id, nama: r.nama });
  return map;
}

export async function softDeleteProduk(id: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
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
