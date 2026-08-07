"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { warna, bahan, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { WarnaInput } from "@/lib/schemas/warna";

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
    tabel: "warna",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listWarna() {
  return db
    .select()
    .from(warna)
    .where(isNull(warna.deletedAt))
    .orderBy(warna.kode);
}

export async function createWarna(input: WarnaInput) {
  const userId = await currentUserId();

  const existing = await db
    .select({ id: warna.id })
    .from(warna)
    .where(and(eq(warna.kode, input.kode), isNull(warna.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db.insert(warna).values(input).returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateWarna(id: string, input: WarnaInput) {
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(warna)
    .where(eq(warna.id, id))
    .limit(1);

  if (!before) return { error: "Warna tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: warna.id })
      .from(warna)
      .where(and(eq(warna.kode, input.kode), isNull(warna.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(warna)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(warna.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteWarna(id: string) {
  const userId = await currentUserId();

  const used = await db
    .select({ id: bahan.id })
    .from(bahan)
    .where(and(eq(bahan.warnaId, id), isNull(bahan.deletedAt)))
    .limit(1);

  if (used.length > 0) {
    return {
      error: "Warna tidak bisa dihapus — masih dipakai bahan. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(warna)
    .where(eq(warna.id, id))
    .limit(1);

  if (!before) return { error: "Warna tidak ditemukan" };

  const [row] = await db
    .update(warna)
    .set({ deletedAt: new Date() })
    .where(eq(warna.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
