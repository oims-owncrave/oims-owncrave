"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  bahan,
  kategori,
  satuan,
  stok,
  barangMasukDetail,
  barangKeluarDetail,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import type { BahanInput } from "@/lib/schemas/bahan";

async function writeAudit(
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await db.insert(auditLog).values({
    userId,
    aksi,
    tabel: "bahan",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

async function generateKodeBahan(kategoriId: string): Promise<string> {
  const [kat] = await db
    .select({ kode: kategori.kode })
    .from(kategori)
    .where(eq(kategori.id, kategoriId))
    .limit(1);

  if (!kat) throw new Error("Kategori tidak ditemukan");

  // count bahan di kategori ini (termasuk soft-deleted)
  const existing = await db
    .select({ id: bahan.id })
    .from(bahan)
    .where(eq(bahan.kategoriId, kategoriId));

  const nomor = String(existing.length + 1).padStart(3, "0");
  return `BH-${kat.kode}-${nomor}`;
}

export async function listBahan() {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  return db
    .select({
      id: bahan.id,
      kode: bahan.kode,
      nama: bahan.nama,
      kategoriId: bahan.kategoriId,
      kategoriNama: kategori.nama,
      satuanId: bahan.satuanId,
      satuanNama: satuan.nama,
      satuanSingkatan: satuan.singkatan,
      stokMinimum: bahan.stokMinimum,
      hargaRataRata: bahan.hargaRataRata,
      isActive: bahan.isActive,
    })
    .from(bahan)
    .leftJoin(kategori, eq(bahan.kategoriId, kategori.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(isNull(bahan.deletedAt))
    .orderBy(bahan.kode);
}

export async function createBahan(input: BahanInput) {
  const user = await requireRole(["owner", "admin_gudang"]);
  const kode = await generateKodeBahan(input.kategoriId);

  // Transaction: bahan + stok row wajib atomik (bahan invariant: selalu punya stok row)
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bahan)
      .values({
        kode,
        nama: input.nama,
        kategoriId: input.kategoriId,
        satuanId: input.satuanId,
        stokMinimum: String(input.stokMinimum),
        isActive: input.isActive,
        hargaRataRata: String(input.hargaAwal ?? 0),
      })
      .returning();

    // baris stok awal 0 (cache; sumber kebenaran = mutasi_stok)
    await tx.insert(stok).values({ bahanId: row.id, kuantitas: "0" });
    return row;
  });

  await writeAudit("CREATE", created.id, null, created, user.id);
  return { data: created, error: undefined };
}

export async function updateBahan(id: string, input: BahanInput) {
  const user = await requireRole(["owner", "admin_gudang"]);

  const [before] = await db
    .select()
    .from(bahan)
    .where(eq(bahan.id, id))
    .limit(1);

  if (!before) return { error: "Bahan tidak ditemukan" };

  // kode TIDAK diubah walau kategori berubah (kode = identitas permanen)
  const [updated] = await db
    .update(bahan)
    .set({
      nama: input.nama,
      kategoriId: input.kategoriId,
      satuanId: input.satuanId,
      stokMinimum: String(input.stokMinimum),
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(bahan.id, id))
    .returning();

  await writeAudit("UPDATE", id, before, updated, user.id);
  return { data: updated, error: undefined };
}

export async function softDeleteBahan(id: string) {
  const user = await requireRole(["owner", "admin_gudang"]);

  // guard: bahan tak boleh dihapus jika ada di barang masuk/keluar detail
  const usedMasuk = await db
    .select({ id: barangMasukDetail.id })
    .from(barangMasukDetail)
    .where(eq(barangMasukDetail.bahanId, id))
    .limit(1);
  const usedKeluar = await db
    .select({ id: barangKeluarDetail.id })
    .from(barangKeluarDetail)
    .where(eq(barangKeluarDetail.bahanId, id))
    .limit(1);

  if (usedMasuk.length > 0 || usedKeluar.length > 0) {
    return {
      error:
        "Bahan tidak bisa dihapus — sudah punya transaksi. Nonaktifkan saja.",
    };
  }

  const [before] = await db
    .select()
    .from(bahan)
    .where(eq(bahan.id, id))
    .limit(1);

  if (!before) return { error: "Bahan tidak ditemukan" };

  const [updated] = await db
    .update(bahan)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(bahan.id, id))
    .returning();

  await writeAudit("DELETE", id, before, updated, user.id);
  return { data: updated, error: undefined };
}
