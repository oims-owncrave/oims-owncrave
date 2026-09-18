"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { vendor, penjahit, lokasiProduksi, tarifJasaJahit, auditLog } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { VendorInput } from "@/lib/schemas/vendor";

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
    tabel: "vendor",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Kode vendor otomatis: VDR-NNNN (counter global, bukan per bulan). */
export async function generateVendorKode(): Promise<string> {
  const rows = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(NULLIF(regexp_replace(kode, '\\D', '', 'g'), '')::int), 0) AS max
        FROM vendor WHERE kode LIKE 'VDR-%'`,
  );
  return `VDR-${String(Number(rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

/** Normalisasi field opsional: string kosong -> null supaya tidak nyimpan "". */
function normalize(input: VendorInput) {
  return {
    kode: input.kode,
    nama: input.nama,
    pemilik: input.pemilik || null,
    kontak: input.kontak || null,
    telepon: input.telepon || null,
    email: input.email || null,
    alamat: input.alamat || null,
    kota: input.kota || null,
    kapasitasHarian: input.kapasitasHarian ?? null,
    jenisPekerjaan: input.jenisPekerjaan,
    kapabilitas: input.kapabilitas,
    bankNama: input.bankNama || null,
    bankNomorRekening: input.bankNomorRekening || null,
    bankAtasNama: input.bankAtasNama || null,
    terminHari: input.terminHari ?? null,
    leadTimeHari: input.leadTimeHari ?? null,
    qcMode: input.qcMode,
    qcOfficer: input.qcOfficer || null,
    catatan: input.catatan || null,
    isActive: input.isActive,
  };
}

export async function listVendor() {
  return db
    .select()
    .from(vendor)
    .where(isNull(vendor.deletedAt))
    .orderBy(vendor.kode);
}

export async function createVendor(input: VendorInput) {
  const userId = await currentUserId();

  const existing = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(and(eq(vendor.kode, input.kode), isNull(vendor.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Vendor dengan kode "${input.kode}" sudah ada` };
  }

  const [row] = await db.insert(vendor).values(normalize(input)).returning();

  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updateVendor(id: string, input: VendorInput) {
  const userId = await currentUserId();
  const [before] = await db.select().from(vendor).where(eq(vendor.id, id)).limit(1);

  if (!before) return { error: "Vendor tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: vendor.id })
      .from(vendor)
      .where(and(eq(vendor.kode, input.kode), isNull(vendor.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Vendor dengan kode "${input.kode}" sudah ada` };
    }
  }

  const [row] = await db
    .update(vendor)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(vendor.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeleteVendor(id: string) {
  const userId = await currentUserId();

  // Guard: vendor yang sudah dipakai penjahit/lokasi/tarif tidak boleh dihapus
  const [penjahitRef] = await db
    .select({ id: penjahit.id })
    .from(penjahit)
    .where(and(eq(penjahit.vendorId, id), isNull(penjahit.deletedAt)))
    .limit(1);

  if (penjahitRef) {
    return {
      error: "Vendor tidak bisa dihapus — masih punya penjahit terdaftar. Nonaktifkan saja.",
    };
  }

  const [lokasiRef] = await db
    .select({ id: lokasiProduksi.id })
    .from(lokasiProduksi)
    .where(and(eq(lokasiProduksi.vendorId, id), isNull(lokasiProduksi.deletedAt)))
    .limit(1);

  if (lokasiRef) {
    return {
      error: "Vendor tidak bisa dihapus — masih punya lokasi produksi. Nonaktifkan saja.",
    };
  }

  const [tarifRef] = await db
    .select({ id: tarifJasaJahit.id })
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.vendorId, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (tarifRef) {
    return {
      error: "Vendor tidak bisa dihapus — masih punya tarif jasa. Nonaktifkan saja.",
    };
  }

  const [before] = await db.select().from(vendor).where(eq(vendor.id, id)).limit(1);
  if (!before) return { error: "Vendor tidak ditemukan" };

  const [row] = await db
    .update(vendor)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(vendor.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
