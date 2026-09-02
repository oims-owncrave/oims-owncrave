"use server";

import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { produk, varianProduk, warna, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type {
  VarianGenerateInput,
  VarianUpdateInput,
} from "@/lib/schemas/varian-produk";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getProdukDetail(produkId: string) {
  const [item] = await db
    .select()
    .from(produk)
    .where(and(eq(produk.id, produkId), isNull(produk.deletedAt)))
    .limit(1);

  if (!item) return null;

  const varian = await db
    .select({
      id: varianProduk.id,
      sku: varianProduk.sku,
      ukuran: varianProduk.ukuran,
      jenisKelamin: varianProduk.jenisKelamin,
      isActive: varianProduk.isActive,
      warnaId: varianProduk.warnaId,
      warnaNama: warna.nama,
      warnaKode: warna.kode,
    })
    .from(varianProduk)
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(and(eq(varianProduk.produkId, produkId), isNull(varianProduk.deletedAt)))
    .orderBy(warna.nama, varianProduk.ukuran);

  return { produk: item, varian };
}

export type ProdukDetail = NonNullable<Awaited<ReturnType<typeof getProdukDetail>>>;
export type VarianRow = ProdukDetail["varian"][number];

export async function generateVarian(produkId: string, input: VarianGenerateInput) {
  const userId = await currentUserId();

  const [item] = await db
    .select()
    .from(produk)
    .where(and(eq(produk.id, produkId), isNull(produk.deletedAt)))
    .limit(1);
  if (!item) return { error: "Produk tidak ditemukan" };

  const warnaRows = await db
    .select()
    .from(warna)
    .where(and(inArray(warna.id, input.warnaIds), isNull(warna.deletedAt)));
  if (warnaRows.length === 0) return { error: "Warna tidak ditemukan" };

  // Pre-fetch existing SEKALI: kombinasi + SKU aktif produk ini
  const existing = await db
    .select({
      warnaId: varianProduk.warnaId,
      ukuran: varianProduk.ukuran,
      sku: varianProduk.sku,
    })
    .from(varianProduk)
    .where(and(eq(varianProduk.produkId, produkId), isNull(varianProduk.deletedAt)));

  const existingCombo = new Set(existing.map((e) => `${e.warnaId}|${e.ukuran}`));
  const existingSku = new Set(existing.map((e) => e.sku));

  const jenisKelamin = input.jenisKelamin?.trim() || null;
  const toInsert: (typeof varianProduk.$inferInsert)[] = [];
  const skipped: string[] = [];

  for (const w of warnaRows) {
    for (const rawUkuran of input.ukuran) {
      const ukuran = rawUkuran.trim().toUpperCase();
      if (!ukuran) continue;
      const sku = `${item.kode}-${w.kode}-${ukuran}`.toUpperCase();
      if (existingCombo.has(`${w.id}|${ukuran}`) || existingSku.has(sku)) {
        skipped.push(`${w.nama} / ${ukuran}`);
        continue;
      }
      existingCombo.add(`${w.id}|${ukuran}`);
      existingSku.add(sku);
      toInsert.push({ produkId, warnaId: w.id, ukuran, jenisKelamin, sku });
    }
  }

  if (toInsert.length === 0) {
    return { data: { created: 0, skipped } };
  }

  const rows = await db.transaction(async (tx) => {
    const inserted = await tx.insert(varianProduk).values(toInsert).returning();
    await tx.insert(auditLog).values(
      inserted.map((row) => ({
        userId: userId ?? undefined,
        aksi: "CREATE",
        tabel: "varian_produk",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      })),
    );
    return inserted;
  });

  return { data: { created: rows.length, skipped } };
}

export async function updateVarian(id: string, input: VarianUpdateInput) {
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(varianProduk)
    .where(and(eq(varianProduk.id, id), isNull(varianProduk.deletedAt)))
    .limit(1);
  if (!before) return { error: "Varian tidak ditemukan" };

  const sku = input.sku.trim().toUpperCase();
  if (sku !== before.sku) {
    const conflict = await db
      .select({ id: varianProduk.id })
      .from(varianProduk)
      .where(
        and(
          eq(varianProduk.sku, sku),
          isNull(varianProduk.deletedAt),
          ne(varianProduk.id, id),
        ),
      )
      .limit(1);
    if (conflict.length > 0) {
      return { error: `SKU "${sku}" sudah dipakai varian lain` };
    }
  }

  const [row] = await db
    .update(varianProduk)
    .set({
      sku,
      jenisKelamin: input.jenisKelamin?.trim() || null,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(varianProduk.id, id))
    .returning();

  await db.insert(auditLog).values({
    userId: userId ?? undefined,
    aksi: "UPDATE",
    tabel: "varian_produk",
    recordId: id,
    dataBefore: JSON.stringify(before),
    dataAfter: JSON.stringify(row),
  });

  return { data: row };
}

export async function softDeleteVarian(id: string) {
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(varianProduk)
    .where(and(eq(varianProduk.id, id), isNull(varianProduk.deletedAt)))
    .limit(1);
  if (!before) return { error: "Varian tidak ditemukan" };

  const [row] = await db
    .update(varianProduk)
    .set({ deletedAt: new Date() })
    .where(eq(varianProduk.id, id))
    .returning();

  await db.insert(auditLog).values({
    userId: userId ?? undefined,
    aksi: "DELETE",
    tabel: "varian_produk",
    recordId: id,
    dataBefore: JSON.stringify(before),
    dataAfter: JSON.stringify(row),
  });

  return { data: row };
}
