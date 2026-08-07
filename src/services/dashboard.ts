"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bahan, stok, kategori, satuan } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export type DashboardStats = {
  totalBahanAktif: number;
  totalNilaiStok: number;
  bahanKritis: number;
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
    total_nilai_stok: string;
    bahan_kritis: number;
    penyesuaian_pending: number;
  }>(sql`
    SELECT
      (SELECT count(*) FROM bahan WHERE deleted_at IS NULL AND is_active = true) AS total_bahan_aktif,
      (SELECT COALESCE(SUM(s.kuantitas::numeric * b.harga_rata_rata::numeric), 0)
         FROM stok s JOIN bahan b ON s.bahan_id = b.id
        WHERE b.deleted_at IS NULL) AS total_nilai_stok,
      (SELECT count(*) FROM stok s JOIN bahan b ON s.bahan_id = b.id
        WHERE b.deleted_at IS NULL AND s.kuantitas::numeric <= b.stok_minimum::numeric) AS bahan_kritis,
      (SELECT count(*) FROM penyesuaian_stok WHERE status = 'pending') AS penyesuaian_pending
  `);

  const r = rows[0];

  return {
    totalBahanAktif: Number(r?.total_bahan_aktif ?? 0),
    totalNilaiStok: Number(r?.total_nilai_stok ?? 0),
    bahanKritis: Number(r?.bahan_kritis ?? 0),
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

// ─── Aktivitas Transaksi (Masuk + Keluar by date range + prev comparison) ───────

export type AktivitasTransaksiData = {
  masukCount: number;
  masukNilai: number;
  masukCountPrev: number;
  keluarCount: number;
  keluarNilai: number;
  keluarCountPrev: number;
};

function getPreviousDateRange(fromStr: string, toStr: string) {
  const fromDate = new Date(fromStr + "T00:00:00");
  const toDate = new Date(toStr + "T00:00:00");

  const diffTime = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const prevToDate = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
  const prevFromDate = new Date(prevToDate.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return { prevFrom: fmt(prevFromDate), prevTo: fmt(prevToDate) };
}

/** `from` dan `to` dalam format YYYY-MM-DD (inclusive). */
export async function getAktivitasTransaksi(
  from: string,
  to: string,
): Promise<AktivitasTransaksiData> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const { prevFrom, prevTo } = getPreviousDateRange(from, to);

  const rows = await db.execute<{
    masuk_count: string;
    masuk_nilai: string;
    masuk_count_prev: string;
    keluar_count: string;
    keluar_nilai: string;
    keluar_count_prev: string;
  }>(sql`
    SELECT
      (SELECT count(*)
         FROM barang_masuk
        WHERE tanggal >= ${from}::date
          AND tanggal <  ${to}::date + interval '1 day') AS masuk_count,
      (SELECT COALESCE(SUM(bmd.subtotal::numeric), 0)
         FROM barang_masuk_detail bmd
         JOIN barang_masuk bm ON bmd.barang_masuk_id = bm.id
        WHERE bm.tanggal >= ${from}::date
          AND bm.tanggal <  ${to}::date + interval '1 day') AS masuk_nilai,
      (SELECT count(*)
         FROM barang_masuk
        WHERE tanggal >= ${prevFrom}::date
          AND tanggal <  ${prevTo}::date + interval '1 day') AS masuk_count_prev,
      (SELECT count(*)
         FROM barang_keluar
        WHERE tanggal >= ${from}::date
          AND tanggal <  ${to}::date + interval '1 day') AS keluar_count,
      (SELECT COALESCE(SUM(bkd.subtotal::numeric), 0)
         FROM barang_keluar_detail bkd
         JOIN barang_keluar bk ON bkd.barang_keluar_id = bk.id
        WHERE bk.tanggal >= ${from}::date
          AND bk.tanggal <  ${to}::date + interval '1 day') AS keluar_nilai,
      (SELECT count(*)
         FROM barang_keluar
        WHERE tanggal >= ${prevFrom}::date
          AND tanggal <  ${prevTo}::date + interval '1 day') AS keluar_count_prev
  `);

  const r = rows[0];
  return {
    masukCount: Number(r?.masuk_count ?? 0),
    masukNilai: Number(r?.masuk_nilai ?? 0),
    masukCountPrev: Number(r?.masuk_count_prev ?? 0),
    keluarCount: Number(r?.keluar_count ?? 0),
    keluarNilai: Number(r?.keluar_nilai ?? 0),
    keluarCountPrev: Number(r?.keluar_count_prev ?? 0),
  };
}

// ─── Top 10 Bahan Keluar ─────────────────────────────────────────────────────

export type Top10BahanKeluarItem = {
  bahanId: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  totalKeluar: number;
};

export async function getTop10BahanKeluar(): Promise<Top10BahanKeluarItem[]> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const rows = await db.execute<{
    bahan_id: string;
    kode: string;
    nama: string;
    satuan_singkatan: string | null;
    total_keluar: string;
  }>(sql`
    SELECT
      b.id        AS bahan_id,
      b.kode      AS kode,
      b.nama      AS nama,
      s.singkatan AS satuan_singkatan,
      SUM(bkd.kuantitas::numeric) AS total_keluar
    FROM barang_keluar_detail bkd
    JOIN barang_keluar bk ON bkd.barang_keluar_id = bk.id
    JOIN bahan b           ON bkd.bahan_id        = b.id
    LEFT JOIN satuan s     ON b.satuan_id         = s.id
    WHERE b.deleted_at IS NULL
    GROUP BY b.id, b.kode, b.nama, s.singkatan
    ORDER BY total_keluar DESC
    LIMIT 10
  `);

  return rows.map((r) => ({
    bahanId: r.bahan_id,
    kode: r.kode,
    nama: r.nama,
    satuanSingkatan: r.satuan_singkatan ?? null,
    totalKeluar: Number(r.total_keluar ?? 0),
  }));
}
