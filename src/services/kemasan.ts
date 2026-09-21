"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { kemasan, supplier, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { KemasanInput } from "@/lib/schemas/kemasan";
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
    tabel: "kemasan",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export type KemasanRow = typeof kemasan.$inferSelect & { supplierNama: string | null };

export async function listKemasan(): Promise<KemasanRow[]> {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  const rows = await db
    .select({
      kemasan: kemasan,
      supplierNama: supplier.nama,
    })
    .from(kemasan)
    .leftJoin(supplier, eq(kemasan.supplierId, supplier.id))
    .where(isNull(kemasan.deletedAt))
    .orderBy(kemasan.kode);

  return rows.map((r) => ({ ...r.kemasan, supplierNama: r.supplierNama }));
}

/** numeric Drizzle terima string — konversi di satu tempat. */
function toValues(input: KemasanInput) {
  return {
    kode: input.kode,
    nama: input.nama,
    jenis: input.jenis,
    ukuran: input.ukuran || null,
    bahanKemasan: input.bahanKemasan || null,
    supplierId: input.supplierId || null,
    biaya: String(input.biaya),
    stokMinimum: String(input.stokMinimum),
    isActive: input.isActive,
  };
}

export async function createKemasan(input: KemasanInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const existing = await db
    .select({ id: kemasan.id })
    .from(kemasan)
    .where(and(eq(kemasan.kode, input.kode), isNull(kemasan.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  const [row] = await db.insert(kemasan).values(toValues(input)).returning();
  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateKemasan(id: string, input: KemasanInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();
  const [before] = await db.select().from(kemasan).where(eq(kemasan.id, id)).limit(1);

  if (!before) return { error: "Kemasan tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: kemasan.id })
      .from(kemasan)
      .where(and(eq(kemasan.kode, input.kode), isNull(kemasan.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  const [row] = await db
    .update(kemasan)
    .set({ ...toValues(input), updatedAt: new Date() })
    .where(eq(kemasan.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteKemasan(id: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  // TODO(oims-ckp.12): guard referensi packing_detail (tabel belum ada di gelombang ini)

  const [before] = await db.select().from(kemasan).where(eq(kemasan.id, id)).limit(1);
  if (!before) return { error: "Kemasan tidak ditemukan" };

  const [row] = await db
    .update(kemasan)
    .set({ deletedAt: new Date() })
    .where(eq(kemasan.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
