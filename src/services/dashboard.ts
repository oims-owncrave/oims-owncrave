"use server";

import { and, count, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bahan,
  supplier,
  stok,
  barangMasuk,
  barangKeluar,
  penyesuaianStok,
  kategori,
  satuan,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export type DashboardStats = {
  totalBahanAktif: number;
  totalSupplierAktif: number;
  totalNilaiStok: number;
  barangMasukBulanIni: number;
  barangKeluarBulanIni: number;
  bahanKritis: number;
  transaksiHariIni: number;
  penyesuaianPending: number;
};

export type BahanKritisItem = {
  id: string;
  kode: string;
  nama: string;
  kategoriNama: string | null;
  satuanSingkatan: string | null;
  kuantitas: string;
  stokMinimum: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  const [
    [{ totalBahanAktif }],
    [{ totalSupplierAktif }],
    nilaiRows,
    [{ barangMasukBulanIni }],
    [{ barangKeluarBulanIni }],
    [{ bahanKritis }],
    masukHariIni,
    keluarHariIni,
    [{ penyesuaianPending }],
  ] = await Promise.all([
    // Total bahan aktif
    db
      .select({ totalBahanAktif: count() })
      .from(bahan)
      .where(and(isNull(bahan.deletedAt), eq(bahan.isActive, true))),

    // Total supplier aktif
    db
      .select({ totalSupplierAktif: count() })
      .from(supplier)
      .where(and(isNull(supplier.deletedAt), eq(supplier.isActive, true))),

    // Total nilai stok: SUM(kuantitas × hargaRataRata)
    db
      .select({
        nilai: sql<string>`SUM(${stok.kuantitas}::numeric * ${bahan.hargaRataRata}::numeric)`,
      })
      .from(stok)
      .innerJoin(bahan, eq(stok.bahanId, bahan.id))
      .where(isNull(bahan.deletedAt)),

    // Barang masuk bulan ini
    db
      .select({ barangMasukBulanIni: count() })
      .from(barangMasuk)
      .where(gte(barangMasuk.tanggal, startOfMonth)),

    // Barang keluar bulan ini
    db
      .select({ barangKeluarBulanIni: count() })
      .from(barangKeluar)
      .where(gte(barangKeluar.tanggal, startOfMonth)),

    // Bahan kritis (stok ≤ stokMinimum)
    db
      .select({ bahanKritis: count() })
      .from(stok)
      .innerJoin(bahan, eq(stok.bahanId, bahan.id))
      .where(
        and(
          isNull(bahan.deletedAt),
          sql`${stok.kuantitas}::numeric <= ${bahan.stokMinimum}::numeric`,
        ),
      ),

    // Masuk hari ini
    db
      .select({ count: count() })
      .from(barangMasuk)
      .where(
        and(
          gte(barangMasuk.tanggal, startOfToday),
          lt(barangMasuk.tanggal, endOfToday),
        ),
      ),

    // Keluar hari ini
    db
      .select({ count: count() })
      .from(barangKeluar)
      .where(
        and(
          gte(barangKeluar.tanggal, startOfToday),
          lt(barangKeluar.tanggal, endOfToday),
        ),
      ),

    // Penyesuaian pending
    db
      .select({ penyesuaianPending: count() })
      .from(penyesuaianStok)
      .where(eq(penyesuaianStok.status, "pending")),
  ]);

  return {
    totalBahanAktif,
    totalSupplierAktif,
    totalNilaiStok: Number(nilaiRows[0]?.nilai ?? 0),
    barangMasukBulanIni,
    barangKeluarBulanIni,
    bahanKritis,
    transaksiHariIni: (masukHariIni[0]?.count ?? 0) + (keluarHariIni[0]?.count ?? 0),
    penyesuaianPending,
  };
}

export async function getBahanKritisList(): Promise<BahanKritisItem[]> {
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
      kategoriNama: kategori.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: stok.kuantitas,
      stokMinimum: bahan.stokMinimum,
    })
    .from(stok)
    .innerJoin(bahan, eq(stok.bahanId, bahan.id))
    .leftJoin(kategori, eq(bahan.kategoriId, kategori.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(
      and(
        isNull(bahan.deletedAt),
        sql`${stok.kuantitas}::numeric <= ${bahan.stokMinimum}::numeric`,
      ),
    )
    .orderBy(bahan.nama)
    .limit(10);
}
