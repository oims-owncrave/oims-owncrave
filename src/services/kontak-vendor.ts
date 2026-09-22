"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { kontakVendor, vendor, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { KontakVendorInput } from "@/lib/schemas/kontak-vendor";
import { requireRole } from "@/lib/auth";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

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
    tabel: "kontak_vendor",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listKontakVendor() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: kontakVendor.id,
      vendorId: kontakVendor.vendorId,
      vendorNama: vendor.nama,
      nama: kontakVendor.nama,
      jabatan: kontakVendor.jabatan,
      telepon: kontakVendor.telepon,
      isActive: kontakVendor.isActive,
      createdAt: kontakVendor.createdAt,
      updatedAt: kontakVendor.updatedAt,
    })
    .from(kontakVendor)
    .leftJoin(vendor, eq(kontakVendor.vendorId, vendor.id))
    .where(isNull(kontakVendor.deletedAt))
    .orderBy(asc(vendor.nama), asc(kontakVendor.nama));
}

export type KontakVendorRow = Awaited<ReturnType<typeof listKontakVendor>>[number];

/** List kontak aktif berdasarkan vendorId untuk dropdown di form. */
export async function listKontakByVendor(vendorId: string) {
  await requireRole([...READ_ROLES]);
  if (!vendorId) return [];
  return db
    .select({
      id: kontakVendor.id,
      vendorId: kontakVendor.vendorId,
      nama: kontakVendor.nama,
      jabatan: kontakVendor.jabatan,
      telepon: kontakVendor.telepon,
    })
    .from(kontakVendor)
    .where(
      and(
        eq(kontakVendor.vendorId, vendorId),
        eq(kontakVendor.isActive, true),
        isNull(kontakVendor.deletedAt),
      ),
    )
    .orderBy(asc(kontakVendor.nama));
}

export type KontakOption = Awaited<ReturnType<typeof listKontakByVendor>>[number];

export async function createKontakVendor(input: KontakVendorInput) {
  await requireRole([...WRITE_ROLES]);
  const userId = await currentUserId();

  // Guard partial unique: nama per vendor harus unik untuk baris aktif
  const existing = await db
    .select({ id: kontakVendor.id })
    .from(kontakVendor)
    .where(
      and(
        eq(kontakVendor.vendorId, input.vendorId),
        eq(kontakVendor.nama, input.nama),
        isNull(kontakVendor.deletedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: `Kontak dengan nama "${input.nama}" sudah terdaftar di vendor tersebut` };
  }

  const [row] = await db
    .insert(kontakVendor)
    .values({
      vendorId: input.vendorId,
      nama: input.nama,
      jabatan: input.jabatan || null,
      telepon: input.telepon || null,
      isActive: input.isActive,
    })
    .returning();

  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateKontakVendor(id: string, input: KontakVendorInput) {
  await requireRole([...WRITE_ROLES]);
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(kontakVendor)
    .where(eq(kontakVendor.id, id))
    .limit(1);

  if (!before) return { error: "Kontak vendor tidak ditemukan" };

  if (input.nama !== before.nama || input.vendorId !== before.vendorId) {
    const existing = await db
      .select({ id: kontakVendor.id })
      .from(kontakVendor)
      .where(
        and(
          eq(kontakVendor.vendorId, input.vendorId),
          eq(kontakVendor.nama, input.nama),
          isNull(kontakVendor.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      return { error: `Kontak dengan nama "${input.nama}" sudah terdaftar di vendor tersebut` };
    }
  }

  const [row] = await db
    .update(kontakVendor)
    .set({
      vendorId: input.vendorId,
      nama: input.nama,
      jabatan: input.jabatan || null,
      telepon: input.telepon || null,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(kontakVendor.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteKontakVendor(id: string) {
  await requireRole([...WRITE_ROLES]);
  const userId = await currentUserId();

  const [before] = await db
    .select()
    .from(kontakVendor)
    .where(eq(kontakVendor.id, id))
    .limit(1);

  if (!before) return { error: "Kontak vendor tidak ditemukan" };

  const [row] = await db
    .update(kontakVendor)
    .set({ deletedAt: new Date() })
    .where(eq(kontakVendor.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
