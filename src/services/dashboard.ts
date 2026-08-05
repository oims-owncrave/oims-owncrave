"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bahan, stok, kategori, satuan } from "@/db/schema";
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

  const rows = await db.execute<{
    total_bahan_aktif: number;
    total_supplier_aktif: number;
    total_nilai_stok: string;
    barang_masuk_bulan_ini: number;
    barang_keluar_bulan_ini: number;
    bahan_kritis: number;
    transaksi_hari_ini: number;
    penyesuaian_pending: number;
  }>(sql`
    SELECT
      (SELECT count(*) FROM bahan WHERE deleted_at IS NULL AND is_active = true) AS total_bahan_aktif,
      (SELECT count(*) FROM supplier WHERE deleted_at IS NULL AND is_active = true) AS total_supplier_aktif,
      (SELECT COALESCE(SUM(s.kuantitas::numeric * b.harga_rata_rata::numeric), 0)
         FROM stok s JOIN bahan b ON s.bahan_id = b.id
        WHERE b.deleted_at IS NULL) AS total_nilai_stok,
      (SELECT count(*) FROM barang_masuk WHERE tanggal >= date_trunc('month', now())) AS barang_masuk_bulan_ini,
      (SELECT count(*) FROM barang_keluar WHERE tanggal >= date_trunc('month', now())) AS barang_keluar_bulan_ini,
      (SELECT count(*) FROM stok s JOIN bahan b ON s.bahan_id = b.id
        WHERE b.deleted_at IS NULL AND s.kuantitas::numeric <= b.stok_minimum::numeric) AS bahan_kritis,
      (SELECT count(*) FROM barang_masuk WHERE tanggal >= date_trunc('day', now()) AND tanggal < date_trunc('day', now()) + interval '1 day')
        + (SELECT count(*) FROM barang_keluar WHERE tanggal >= date_trunc('day', now()) AND tanggal < date_trunc('day', now()) + interval '1 day') AS transaksi_hari_ini,
      (SELECT count(*) FROM penyesuaian_stok WHERE status = 'pending') AS penyesuaian_pending
  `);

  const r = rows[0];

  return {
    totalBahanAktif: Number(r?.total_bahan_aktif ?? 0),
    totalSupplierAktif: Number(r?.total_supplier_aktif ?? 0),
    totalNilaiStok: Number(r?.total_nilai_stok ?? 0),
    barangMasukBulanIni: Number(r?.barang_masuk_bulan_ini ?? 0),
    barangKeluarBulanIni: Number(r?.barang_keluar_bulan_ini ?? 0),
    bahanKritis: Number(r?.bahan_kritis ?? 0),
    transaksiHariIni: Number(r?.transaksi_hari_ini ?? 0),
    penyesuaianPending: Number(r?.penyesuaian_pending ?? 0),
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
