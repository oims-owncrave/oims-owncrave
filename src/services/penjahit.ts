"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penjahit,
  penjahitProduk,
  vendor,
  lokasiProduksi,
  tarifJasaJahit,
  auditLog,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { PenjahitInput } from "@/lib/schemas/penjahit";
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
    tabel: "penjahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Kode penjahit otomatis: JHT-INT-NNNN (internal/sampel) atau JHT-EXT-NNNN. */
export async function generatePenjahitKode(jenis: string): Promise<string> {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const prefix = jenis === "internal" || jenis === "sampel" ? "JHT-INT" : "JHT-EXT";
  const like = `${prefix}-%`;
  const rows = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(NULLIF(regexp_replace(split_part(kode, '-', 3), '\\D', '', 'g'), '')::int), 0) AS max
        FROM penjahit WHERE kode LIKE ${like}`,
  );
  return `${prefix}-${String(Number(rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

function normalize(input: PenjahitInput) {
  return {
    kode: input.kode,
    nama: input.nama,
    jenis: input.jenis,
    // jenis selain anggota_vendor WAJIB null (DB CHECK menolak kalau terisi)
    vendorId: input.jenis === "anggota_vendor" ? input.vendorId || null : null,
    lokasiId: input.lokasiId || null,
    telepon: input.telepon || null,
    alamat: input.alamat || null,
    kapasitasHarian: input.kapasitasHarian ?? null,
    keahlian: input.keahlian,
    catatan: input.catatan || null,
    isActive: input.isActive,
  };
}

export async function listPenjahit() {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  const rows = await db
    .select({
      id: penjahit.id,
      kode: penjahit.kode,
      nama: penjahit.nama,
      jenis: penjahit.jenis,
      vendorId: penjahit.vendorId,
      vendorNama: vendor.nama,
      lokasiId: penjahit.lokasiId,
      lokasiNama: lokasiProduksi.nama,
      telepon: penjahit.telepon,
      alamat: penjahit.alamat,
      kapasitasHarian: penjahit.kapasitasHarian,
      keahlian: penjahit.keahlian,
      catatan: penjahit.catatan,
      isActive: penjahit.isActive,
    })
    .from(penjahit)
    .leftJoin(vendor, eq(penjahit.vendorId, vendor.id))
    .leftJoin(lokasiProduksi, eq(penjahit.lokasiId, lokasiProduksi.id))
    .where(isNull(penjahit.deletedAt))
    .orderBy(penjahit.kode);

  if (rows.length === 0) return [];

  // produk yang biasa dikerjakan (M2M) — satu query untuk semua baris
  const links = await db
    .select({ penjahitId: penjahitProduk.penjahitId, produkId: penjahitProduk.produkId })
    .from(penjahitProduk)
    .where(inArray(penjahitProduk.penjahitId, rows.map((r) => r.id)));

  return rows.map((r) => ({
    ...r,
    produkIds: links.filter((l) => l.penjahitId === r.id).map((l) => l.produkId),
  }));
}

/** Sinkronkan M2M produk (tabel link, bukan ledger — replace boleh). */
async function syncProduk(
  tx: Pick<typeof db, "delete" | "insert">,
  penjahitId: string,
  produkIds: string[],
) {
  await tx.delete(penjahitProduk).where(eq(penjahitProduk.penjahitId, penjahitId));
  if (produkIds.length > 0) {
    await tx
      .insert(penjahitProduk)
      .values(produkIds.map((produkId) => ({ penjahitId, produkId })));
  }
}

export async function createPenjahit(input: PenjahitInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const existing = await db
    .select({ id: penjahit.id })
    .from(penjahit)
    .where(and(eq(penjahit.kode, input.kode), isNull(penjahit.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Penjahit dengan kode "${input.kode}" sudah ada` };
  }

  // header + link produk satu transaksi — jangan sisakan penjahit tanpa link kalau gagal
  const row = await db.transaction(async (tx) => {
    const [r] = await tx.insert(penjahit).values(normalize(input)).returning();
    await syncProduk(tx, r.id, input.produkIds);
    return r;
  });

  await writeAudit("CREATE", row.id, null, row, userId);
  return { data: row };
}

export async function updatePenjahit(id: string, input: PenjahitInput) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();
  const [before] = await db.select().from(penjahit).where(eq(penjahit.id, id)).limit(1);

  if (!before) return { error: "Penjahit tidak ditemukan" };

  if (input.kode !== before.kode) {
    const existing = await db
      .select({ id: penjahit.id })
      .from(penjahit)
      .where(and(eq(penjahit.kode, input.kode), isNull(penjahit.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Penjahit dengan kode "${input.kode}" sudah ada` };
    }
  }

  const row = await db.transaction(async (tx) => {
    const [r] = await tx
      .update(penjahit)
      .set({ ...normalize(input), updatedAt: new Date() })
      .where(eq(penjahit.id, id))
      .returning();
    await syncProduk(tx, id, input.produkIds);
    return r;
  });

  await writeAudit("UPDATE", id, before, row, userId);
  return { data: row };
}

export async function softDeletePenjahit(id: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const userId = await currentUserId();

  const [tarifRef] = await db
    .select({ id: tarifJasaJahit.id })
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.penjahitId, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (tarifRef) {
    return {
      error: "Penjahit tidak bisa dihapus — masih punya tarif jasa. Nonaktifkan saja.",
    };
  }

  const [before] = await db.select().from(penjahit).where(eq(penjahit.id, id)).limit(1);
  if (!before) return { error: "Penjahit tidak ditemukan" };

  const [row] = await db
    .update(penjahit)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(penjahit.id, id))
    .returning();

  await writeAudit("DELETE", id, before, row, userId);
  return { data: row };
}
