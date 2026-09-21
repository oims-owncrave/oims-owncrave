"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { jenisCacat, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { JenisCacatInput } from "@/lib/schemas/jenis-cacat";
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
    tabel: "jenis_cacat",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listJenisCacat() {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  return db
    .select()
    .from(jenisCacat)
    .where(isNull(jenisCacat.deletedAt))
    .orderBy(jenisCacat.kode);
}

export async function createJenisCacat(input: JenisCacatInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  // Guard kode unik aktif — pesan bagus sebelum kena partial unique index DB
  const existing = await db
    .select({ id: jenisCacat.id })
    .from(jenisCacat)
    .where(and(eq(jenisCacat.kode, input.kode), isNull(jenisCacat.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db
    .insert(jenisCacat)
    .values({ ...input, tindakanDefault: input.tindakanDefault || null })
    .returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateJenisCacat(id: string, input: JenisCacatInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();
  const [before] = await db
    .select()
    .from(jenisCacat)
    .where(eq(jenisCacat.id, id))
    .limit(1);

  if (!before) return { error: "Jenis cacat tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: jenisCacat.id })
      .from(jenisCacat)
      .where(and(eq(jenisCacat.kode, input.kode), isNull(jenisCacat.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(jenisCacat)
    .set({
      ...input,
      tindakanDefault: input.tindakanDefault || null,
      updatedAt: new Date(),
    })
    .where(eq(jenisCacat.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteJenisCacat(id: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  // TODO(oims-ckp.7 / oims-ckp.1): guard referensi temuan_cacat + standar_qc_detail
  // (tabelnya belum ada di gelombang ini — tambahkan saat issue tersebut dikerjakan)

  const [before] = await db
    .select()
    .from(jenisCacat)
    .where(eq(jenisCacat.id, id))
    .limit(1);

  if (!before) return { error: "Jenis cacat tidak ditemukan" };

  const [row] = await db
    .update(jenisCacat)
    .set({ deletedAt: new Date() })
    .where(eq(jenisCacat.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
