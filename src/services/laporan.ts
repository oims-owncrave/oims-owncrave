"use server";

import { and, count, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  barangMasuk,
  barangMasukDetail,
  barangKeluar,
  barangKeluarDetail,
  stok,
  bahan,
  kategori,
  satuan,
  supplier,
  mutasiStok,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export type LaporanMasukItem = {
  id: string;
  nomorDokumen: string;
  tanggal: Date;
  supplierNama: string;
  nomorInvoice: string | null;
  bahanKode: string;
  bahanNama: string;
  satuanSingkatan: string | null;
  kuantitas: number;
  hargaSatuan: number;
  subtotal: number;
  createdByNama: string;
};

export type LaporanKeluarItem = {
  id: string;
  nomorDokumen: string;
  tanggal: Date;
  tujuan: string | null;
  bahanKode: string;
  bahanNama: string;
  satuanSingkatan: string | null;
  kuantitas: number;
  hargaSatuan: number;
  subtotal: number;
  createdByNama: string;
};

export type LaporanStokItem = {
  bahanId: string;
  kode: string;
  nama: string;
  kategoriNama: string | null;
  satuanSingkatan: string | null;
  kuantitas: number;
  stokMinimum: number;
  hargaRataRata: number;
  nilaiPersediaan: number;
  isKritis: boolean;
};

export type LaporanNilaiPersediaanKategori = {
  kategoriId: string;
  kategoriNama: string;
  jumlahBahan: number;
  totalNilai: number;
};

export async function getLaporanBarangMasuk(from?: string, to?: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);

  const conditions = [];
  if (from) conditions.push(gte(barangMasuk.tanggal, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(barangMasuk.tanggal, toDate));
  }

  const rows = await db
    .select({
      id: barangMasukDetail.id,
      nomorDokumen: barangMasuk.nomorDokumen,
      tanggal: barangMasuk.tanggal,
      supplierNama: supplier.nama,
      nomorInvoice: barangMasuk.nomorInvoice,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: barangMasukDetail.kuantitas,
      hargaSatuan: barangMasukDetail.hargaSatuan,
      subtotal: barangMasukDetail.subtotal,
      createdByNama: users.displayName,
    })
    .from(barangMasukDetail)
    .innerJoin(barangMasuk, eq(barangMasukDetail.barangMasukId, barangMasuk.id))
    .innerJoin(bahan, eq(barangMasukDetail.bahanId, bahan.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .leftJoin(supplier, eq(barangMasuk.supplierId, supplier.id))
    .leftJoin(users, eq(barangMasuk.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(barangMasuk.tanggal), desc(barangMasuk.createdAt));

  const items: LaporanMasukItem[] = rows.map((r) => ({
    id: r.id,
    nomorDokumen: r.nomorDokumen,
    tanggal: r.tanggal,
    supplierNama: r.supplierNama ?? "-",
    nomorInvoice: r.nomorInvoice,
    bahanKode: r.bahanKode,
    bahanNama: r.bahanNama,
    satuanSingkatan: r.satuanSingkatan,
    kuantitas: Number(r.kuantitas),
    hargaSatuan: Number(r.hargaSatuan),
    subtotal: Number(r.subtotal),
    createdByNama: r.createdByNama ?? "-",
  }));

  const totalKuantitas = items.reduce((sum, item) => sum + item.kuantitas, 0);
  const totalNilai = items.reduce((sum, item) => sum + item.subtotal, 0);

  return { items, totalKuantitas, totalNilai };
}

export async function getLaporanBarangKeluar(from?: string, to?: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);

  const conditions = [];
  if (from) conditions.push(gte(barangKeluar.tanggal, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(barangKeluar.tanggal, toDate));
  }

  const rows = await db
    .select({
      id: barangKeluarDetail.id,
      nomorDokumen: barangKeluar.nomorDokumen,
      tanggal: barangKeluar.tanggal,
      tujuan: barangKeluar.tujuan,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: barangKeluarDetail.kuantitas,
      hargaSatuan: barangKeluarDetail.hargaSatuan,
      subtotal: barangKeluarDetail.subtotal,
      createdByNama: users.displayName,
    })
    .from(barangKeluarDetail)
    .innerJoin(barangKeluar, eq(barangKeluarDetail.barangKeluarId, barangKeluar.id))
    .innerJoin(bahan, eq(barangKeluarDetail.bahanId, bahan.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .leftJoin(users, eq(barangKeluar.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(barangKeluar.tanggal), desc(barangKeluar.createdAt));

  const items: LaporanKeluarItem[] = rows.map((r) => ({
    id: r.id,
    nomorDokumen: r.nomorDokumen,
    tanggal: r.tanggal,
    tujuan: r.tujuan,
    bahanKode: r.bahanKode,
    bahanNama: r.bahanNama,
    satuanSingkatan: r.satuanSingkatan,
    kuantitas: Number(r.kuantitas),
    hargaSatuan: Number(r.hargaSatuan),
    subtotal: Number(r.subtotal),
    createdByNama: r.createdByNama ?? "-",
  }));

  const totalKuantitas = items.reduce((sum, item) => sum + item.kuantitas, 0);
  const totalNilai = items.reduce((sum, item) => sum + item.subtotal, 0);

  return { items, totalKuantitas, totalNilai };
}

export async function getLaporanStok(kategoriId?: string) {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);

  const conditions = [isNull(bahan.deletedAt)];
  if (kategoriId) conditions.push(eq(bahan.kategoriId, kategoriId));

  const rows = await db
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
    .orderBy(bahan.nama);

  const items: LaporanStokItem[] = rows.map((r) => {
    const qty = Number(r.kuantitas);
    const harga = Number(r.hargaRataRata);
    const min = Number(r.stokMinimum);
    return {
      bahanId: r.bahanId,
      kode: r.kode,
      nama: r.nama,
      kategoriNama: r.kategoriNama ?? "-",
      satuanSingkatan: r.satuanSingkatan,
      kuantitas: qty,
      stokMinimum: min,
      hargaRataRata: harga,
      nilaiPersediaan: qty * harga,
      isKritis: qty <= min,
    };
  });

  const totalNilai = items.reduce((sum, item) => sum + item.nilaiPersediaan, 0);

  return { items, totalNilai };
}

export async function getLaporanNilaiPersediaan() {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);

  const rows = await db
    .select({
      kategoriId: kategori.id,
      kategoriNama: kategori.nama,
      jumlahBahan: count(bahan.id),
      totalNilai: sql<string>`COALESCE(SUM(${stok.kuantitas}::numeric * ${bahan.hargaRataRata}::numeric), 0)`,
    })
    .from(kategori)
    .leftJoin(bahan, and(eq(bahan.kategoriId, kategori.id), isNull(bahan.deletedAt)))
    .leftJoin(stok, eq(stok.bahanId, bahan.id))
    .where(isNull(kategori.deletedAt))
    .groupBy(kategori.id, kategori.nama)
    .orderBy(kategori.nama);

  const items: LaporanNilaiPersediaanKategori[] = rows.map((r) => ({
    kategoriId: r.kategoriId,
    kategoriNama: r.kategoriNama,
    jumlahBahan: Number(r.jumlahBahan),
    totalNilai: Number(r.totalNilai),
  }));

  const totalOverall = items.reduce((sum, item) => sum + item.totalNilai, 0);

  return { items, totalOverall };
}
