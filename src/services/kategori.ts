"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { kategori, bahan, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { KategoriInput } from "@/lib/schemas/kategori";

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
    tabel: "kategori",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listKategori() {
  return db
    .select()
    .from(kategori)
    .where(isNull(kategori.deletedAt))
    .orderBy(kategori.kode);
}

export async function createKategori(input: KategoriInput) {
  const userId = await currentUserId();

  // Guard kode unik (hanya yang belum soft-deleted)
  const existing = await db
    .select({ id: kategori.id })
    .from(kategori)
    .where(and(eq(kategori.kode, input.kode), isNull(kategori.deletedAt)))
    .limit(1);
  
  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db.insert(kategori).values(input).returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateKategori(id: string, input: KategoriInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(kategori)
    .where(eq(kategori.id, id))
    .limit(1);
    
  if (!before) return { error: "Kategori tidak ditemukan" };

  // Jika kode diubah, pastikan tidak konflik dengan yang lain
  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: kategori.id })
      .from(kategori)
      .where(and(eq(kategori.kode, input.kode), isNull(kategori.deletedAt)))
      .limit(1);
    
    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(kategori)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(kategori.id, id))
    .returning();
    
  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteKategori(id: string) {
  const userId = await currentUserId();

  // Guard: tidak boleh hapus jika ada bahan pakai kategori ini
  const used = await db
    .select({ id: bahan.id })
    .from(bahan)
    .where(and(eq(bahan.kategoriId, id), isNull(bahan.deletedAt)))
    .limit(1);
    
  if (used.length > 0) {
    return {
      error: "Kategori tidak bisa dihapus — masih dipakai bahan. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(kategori)
    .where(eq(kategori.id, id))
    .limit(1);
    
  if (!before) return { error: "Kategori tidak ditemukan" };

  const [row] = await db
    .update(kategori)
    .set({ deletedAt: new Date() })
    .where(eq(kategori.id, id))
    .returning();
    
  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
