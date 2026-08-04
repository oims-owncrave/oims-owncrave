"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { supplier, barangMasuk, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { SupplierInput } from "@/lib/schemas/supplier";

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
    tabel: "supplier",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listSupplier() {
  return db
    .select()
    .from(supplier)
    .where(isNull(supplier.deletedAt))
    .orderBy(supplier.kode);
}

export async function createSupplier(input: SupplierInput) {
  const userId = await currentUserId();

  // Guard unique code (only for active rows)
  const existing = await db
    .select({ id: supplier.id })
    .from(supplier)
    .where(and(eq(supplier.kode, input.kode), isNull(supplier.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Supplier dengan kode "${input.kode}" sudah ada` };
  }

  const [row] = await db
    .insert(supplier)
    .values({
      ...input,
      kontak: input.kontak || null,
      alamat: input.alamat || null,
    })
    .returning();

  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateSupplier(id: string, input: SupplierInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(supplier)
    .where(eq(supplier.id, id))
    .limit(1);

  if (!before) return { error: "Supplier tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: supplier.id })
      .from(supplier)
      .where(and(eq(supplier.kode, input.kode), isNull(supplier.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Supplier dengan kode "${input.kode}" sudah ada` };
    }
  }

  const [row] = await db
    .update(supplier)
    .set({
      ...input,
      kontak: input.kontak || null,
      alamat: input.alamat || null,
      updatedAt: new Date(),
    })
    .where(eq(supplier.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteSupplier(id: string) {
  const userId = await currentUserId();

  // Guard: tidak boleh hapus jika punya transaksi barang masuk
  const used = await db
    .select({ id: barangMasuk.id })
    .from(barangMasuk)
    .where(eq(barangMasuk.supplierId, id))
    .limit(1);

  if (used.length > 0) {
    return {
      error:
        "Supplier tidak bisa dihapus — punya transaksi barang masuk. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(supplier)
    .where(eq(supplier.id, id))
    .limit(1);

  if (!before) return { error: "Supplier tidak ditemukan" };

  const [row] = await db
    .update(supplier)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(supplier.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
