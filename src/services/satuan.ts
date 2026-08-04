"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { satuan, bahan, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { SatuanInput } from "@/lib/schemas/satuan";

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
    tabel: "satuan",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listSatuan() {
  return db
    .select()
    .from(satuan)
    .where(isNull(satuan.deletedAt))
    .orderBy(satuan.nama);
}

export async function createSatuan(input: SatuanInput) {
  const userId = await currentUserId();

  // Guard nama unik (hanya yang belum soft-deleted)
  const existing = await db
    .select({ id: satuan.id })
    .from(satuan)
    .where(and(eq(satuan.nama, input.nama), isNull(satuan.deletedAt)))
    .limit(1);
  
  if (existing.length > 0) {
    return { error: `Satuan "${input.nama}" sudah ada` };
  }

  const [row] = await db.insert(satuan).values(input).returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateSatuan(id: string, input: SatuanInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(satuan)
    .where(eq(satuan.id, id))
    .limit(1);
    
  if (!before) return { error: "Satuan tidak ditemukan" };

  // Jika nama diubah, pastikan tidak konflik dengan yang lain
  if (input.nama !== before.nama) {
    const existing = await db
      .select({ id: satuan.id })
      .from(satuan)
      .where(and(eq(satuan.nama, input.nama), isNull(satuan.deletedAt)))
      .limit(1);
    
    if (existing.length > 0) {
      return { error: `Satuan "${input.nama}" sudah ada` };
    }
  }

  // NOTE: satuan schema DOES NOT have updatedAt
  const [row] = await db
    .update(satuan)
    .set({ ...input })
    .where(eq(satuan.id, id))
    .returning();
    
  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteSatuan(id: string) {
  const userId = await currentUserId();

  // Guard: tidak boleh hapus jika ada bahan pakai satuan ini
  const used = await db
    .select({ id: bahan.id })
    .from(bahan)
    .where(and(eq(bahan.satuanId, id), isNull(bahan.deletedAt)))
    .limit(1);
    
  if (used.length > 0) {
    return {
      error: "Satuan tidak bisa dihapus — masih dipakai bahan. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(satuan)
    .where(eq(satuan.id, id))
    .limit(1);
    
  if (!before) return { error: "Satuan tidak ditemukan" };

  const [row] = await db
    .update(satuan)
    .set({ deletedAt: new Date() })
    .where(eq(satuan.id, id))
    .returning();
    
  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
