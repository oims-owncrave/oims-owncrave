"use server";

import { and, eq, isNull, lte, asc } from "drizzle-orm";
import { db } from "@/db";
import { stok, bahan, kategori, satuan } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export type StokRow = {
  bahanId: string;
  kode: string;
  nama: string;
  kategoriNama: string | null;
  satuanSingkatan: string | null;
  kuantitas: string;
  stokMinimum: string;
  hargaRataRata: string;
  nilai: number; // kuantitas × hargaRataRata — dihitung di JS
  isKritis: boolean; // kuantitas <= stokMinimum
};

export type StokSummary = {
  totalJenis: number;
  totalNilai: number;
  totalKritis: number;
};

export async function listStok(filter?: {
  kategoriId?: string;
  kritisOnly?: boolean;
}): Promise<{ rows: StokRow[]; summary: StokSummary }> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const conditions = [isNull(bahan.deletedAt)];
  if (filter?.kategoriId) {
    conditions.push(eq(bahan.kategoriId, filter.kategoriId));
  }

  const rawRows = await db
    .select({
      bahanId: bahan.id,
      kode: bahan.kode,
      nama: bahan.nama,
      kategoriNama: kategori.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: stok.kuantitas,
      stokMinimum: bahan.stokMinimum,
      hargaRataRata: bahan.hargaRataRata,
    })
    .from(bahan)
    .innerJoin(stok, eq(stok.bahanId, bahan.id))
    .leftJoin(kategori, eq(bahan.kategoriId, kategori.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(and(...conditions))
    .orderBy(asc(bahan.nama));

  const rows: StokRow[] = rawRows.map((r) => {
    const qty = Number(r.kuantitas);
    const min = Number(r.stokMinimum);
    const harga = Number(r.hargaRataRata);
    return {
      ...r,
      nilai: qty * harga,
      isKritis: qty <= min,
    };
  });

  // Apply filter kritis setelah komputasi
  const filteredRows = filter?.kritisOnly ? rows.filter((r) => r.isKritis) : rows;

  const summary: StokSummary = {
    totalJenis: rows.length,
    totalNilai: rows.reduce((s, r) => s + r.nilai, 0),
    totalKritis: rows.filter((r) => r.isKritis).length,
  };

  return { rows: filteredRows, summary };
}

/** List kategori untuk filter dropdown */
export async function listKategoriForFilter() {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);
  return db
    .select({ id: kategori.id, nama: kategori.nama })
    .from(kategori)
    .where(isNull(kategori.deletedAt))
    .orderBy(asc(kategori.nama));
}
