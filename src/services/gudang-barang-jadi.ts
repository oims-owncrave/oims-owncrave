"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { gudangBarangJadi, auditLog } from "@/db/schema";
import type { GudangBarangJadi } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { GudangBarangJadiInput } from "@/lib/schemas/gudang-barang-jadi";
import { requireRole } from "@/lib/auth";

/** Union eksplisit: tanpa ini TS menyempitkan ke cabang {data} saja saat semua
 * return di dalam transaksi sukses, lalu res.error di hook jadi error tipe. */
type GudangResult = { data?: GudangBarangJadi; error?: string };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function writeAudit(
  tx: Tx,
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string | null,
) {
  await tx.insert(auditLog).values({
    userId: userId ?? undefined,
    aksi,
    tabel: "gudang_barang_jadi",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listGudangBarangJadi() {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  return db
    .select()
    .from(gudangBarangJadi)
    .where(isNull(gudangBarangJadi.deletedAt))
    .orderBy(gudangBarangJadi.kode);
}

/**
 * Lepas flag default dari gudang lain — dipanggil DALAM transaksi yang sama
 * dengan insert/update, supaya tak pernah ada dua default (pola aktivasi tarif
 * berversi oims-eba.4: nonaktifkan lama dulu, baru set yang baru).
 */
async function lepasDefaultLain(tx: Tx, exceptId?: string) {
  const conds = [eq(gudangBarangJadi.isDefault, true), isNull(gudangBarangJadi.deletedAt)];
  if (exceptId) conds.push(ne(gudangBarangJadi.id, exceptId));

  await tx
    .update(gudangBarangJadi)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(...conds));
}

export async function createGudangBarangJadi(input: GudangBarangJadiInput): Promise<GudangResult> {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const existing = await db
    .select({ id: gudangBarangJadi.id })
    .from(gudangBarangJadi)
    .where(and(eq(gudangBarangJadi.kode, input.kode), isNull(gudangBarangJadi.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kode "${input.kode}" sudah dipakai` };
  }

  return db.transaction(async (tx) => {
    if (input.isDefault) await lepasDefaultLain(tx);

    const [row] = await tx
      .insert(gudangBarangJadi)
      .values({
        ...input,
        alamat: input.alamat || null,
        picNama: input.picNama || null,
      })
      .returning();

    await writeAudit(tx, "CREATE", row.id, null, row, userId);
    return { data: row };
  });
}

export async function updateGudangBarangJadi(id: string, input: GudangBarangJadiInput): Promise<GudangResult> {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(gudangBarangJadi)
    .where(eq(gudangBarangJadi.id, id))
    .limit(1);

  if (!before) return { error: "Gudang tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: gudangBarangJadi.id })
      .from(gudangBarangJadi)
      .where(and(eq(gudangBarangJadi.kode, input.kode), isNull(gudangBarangJadi.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Kode "${input.kode}" sudah dipakai` };
    }
  }

  return db.transaction(async (tx) => {
    if (input.isDefault) await lepasDefaultLain(tx, id);

    const [row] = await tx
      .update(gudangBarangJadi)
      .set({
        ...input,
        alamat: input.alamat || null,
        picNama: input.picNama || null,
        updatedAt: new Date(),
      })
      .where(eq(gudangBarangJadi.id, id))
      .returning();

    await writeAudit(tx, "UPDATE", id, before, row, userId);
    return { data: row };
  });
}

export async function softDeleteGudangBarangJadi(id: string): Promise<GudangResult> {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  // TODO(oims-ckp.13): guard referensi stok_barang_jadi + barang_jadi
  // (tabelnya belum ada di gelombang ini)

  const [before] = await db
    .select()
    .from(gudangBarangJadi)
    .where(eq(gudangBarangJadi.id, id))
    .limit(1);

  if (!before) return { error: "Gudang tidak ditemukan" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(gudangBarangJadi)
      .set({ deletedAt: new Date(), isDefault: false })
      .where(eq(gudangBarangJadi.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, userId);
    return { data: row };
  });
}
