"use server";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bagianProduk, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { BagianProdukInput } from "@/lib/schemas/bagian-produk";
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
    tabel: "bagian_produk",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Kode bagian produk otomatis: BP-NN (counter global). */
export async function generateBagianProdukKode(): Promise<string> {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const rows = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(NULLIF(regexp_replace(kode, '\\D', '', 'g'), '')::int), 0) AS max
        FROM bagian_produk WHERE kode LIKE 'BP-%'`,
  );
  return `BP-${String(Number(rows[0]?.max ?? 0) + 1).padStart(2, "0")}`;
}

export async function listBagianProduk() {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  return db
    .select()
    .from(bagianProduk)
    .where(isNull(bagianProduk.deletedAt))
    .orderBy(asc(bagianProduk.urutan));
}

export type BagianProdukRow = Awaited<ReturnType<typeof listBagianProduk>>[number];

export async function createBagianProduk(input: BagianProdukInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  // Guard kode unik aktif — pesan ramah sebelum kena partial unique index DB
  const existing = await db
    .select({ id: bagianProduk.id })
    .from(bagianProduk)
    .where(and(eq(bagianProduk.kode, input.kode), isNull(bagianProduk.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db
    .insert(bagianProduk)
    .values(input)
    .returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateBagianProduk(id: string, input: BagianProdukInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(bagianProduk)
    .where(eq(bagianProduk.id, id))
    .limit(1);

  if (!before) return { error: "Bagian produk tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: bagianProduk.id })
      .from(bagianProduk)
      .where(and(eq(bagianProduk.kode, input.kode), isNull(bagianProduk.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(bagianProduk)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(bagianProduk.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteBagianProduk(id: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(bagianProduk)
    .where(eq(bagianProduk.id, id))
    .limit(1);

  if (!before) return { error: "Bagian produk tidak ditemukan" };

  const [row] = await db
    .update(bagianProduk)
    .set({ deletedAt: new Date() })
    .where(eq(bagianProduk.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
