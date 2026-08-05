"use server";

import { and, desc, eq, gte, ilike, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  mutasiStok,
  bahan,
  satuan,
  users,
  barangMasuk,
  barangKeluar,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { sql } from "drizzle-orm";

export type MutasiRow = {
  id: string;
  createdAt: Date;
  bahanNama: string;
  bahanKode: string;
  satuanSingkatan: string | null;
  tipe: "masuk" | "keluar" | "penyesuaian" | "retur_masuk";
  kuantitas: string;
  nomorDokumen: string | null; // dari barangMasuk / barangKeluar / penyesuaian
  createdByNama: string;
};

export type MutasiFilter = {
  bahanId?: string;
  tipe?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
};

const PAGE_SIZE = 50;

export async function listMutasi(
  filter?: MutasiFilter,
  page = 1,
): Promise<{ rows: MutasiRow[]; total: number; page: number; pageSize: number }> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const conditions = [];
  if (filter?.bahanId) conditions.push(eq(mutasiStok.bahanId, filter.bahanId));
  if (filter?.tipe) conditions.push(eq(mutasiStok.tipe, filter.tipe as MutasiRow["tipe"]));
  if (filter?.from) conditions.push(gte(mutasiStok.createdAt, new Date(filter.from)));
  if (filter?.to) {
    // to = end of day
    const to = new Date(filter.to);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(mutasiStok.createdAt, to));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // COUNT untuk total
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(mutasiStok)
    .where(where);

  const offset = (page - 1) * PAGE_SIZE;

  const raw = await db
    .select({
      id: mutasiStok.id,
      createdAt: mutasiStok.createdAt,
      bahanNama: bahan.nama,
      bahanKode: bahan.kode,
      satuanSingkatan: satuan.singkatan,
      tipe: mutasiStok.tipe,
      kuantitas: mutasiStok.kuantitas,
      nomorDokumenMasuk: barangMasuk.nomorDokumen,
      nomorDokumenKeluar: barangKeluar.nomorDokumen,
      createdByNama: users.displayName,
    })
    .from(mutasiStok)
    .innerJoin(bahan, eq(mutasiStok.bahanId, bahan.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .leftJoin(users, eq(mutasiStok.createdBy, users.id))
    .leftJoin(barangMasuk, eq(mutasiStok.barangMasukId, barangMasuk.id))
    .leftJoin(barangKeluar, eq(mutasiStok.barangKeluarId, barangKeluar.id))
    .where(where)
    .orderBy(desc(mutasiStok.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows: MutasiRow[] = raw.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    bahanNama: r.bahanNama,
    bahanKode: r.bahanKode,
    satuanSingkatan: r.satuanSingkatan,
    tipe: r.tipe,
    kuantitas: r.kuantitas,
    nomorDokumen: r.nomorDokumenMasuk ?? r.nomorDokumenKeluar ?? null,
    createdByNama: r.createdByNama ?? "-",
  }));

  return { rows, total: count, page, pageSize: PAGE_SIZE };
}

/** Semua bahan aktif untuk ComboSelect filter */
export async function listBahanForMutasiFilter() {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);
  return db
    .select({ id: bahan.id, kode: bahan.kode, nama: bahan.nama })
    .from(bahan)
    .where(isNull(bahan.deletedAt))
    .orderBy(bahan.nama);
}
