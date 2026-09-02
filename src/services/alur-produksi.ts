"use server";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  poProduksi,
  workOrderCutting,
  hasilCuttingDetail,
  hasilCutting,
  bundling,
  penugasanJahit,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getRekapDetailPenugasan } from "@/lib/jahit/rekap";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;

// PO yang masih berjalan (belum selesai/batal)
const PO_AKTIF = [
  "disetujui",
  "menunggu_bahan",
  "bahan_disiapkan",
  "sedang_cutting",
  "cutting_selesai",
  "bundling_selesai",
  "siap_jahit",
] as const;

/**
 * Alur produksi lintas tahap untuk dashboard owner (pola app lama, referensi §11):
 * PO Aktif → Di Cutting → Masih di Vendor → Menunggu QC → Stok Jadi.
 * Semua angka DERIVED. Kolom QC & Stok Jadi menyusul di Tahap 4 (sekarang null).
 */
export async function getAlurProduksi() {
  await requireRole([...READ_ROLES]);

  const [po] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(poProduksi)
    .where(and(sql`${poProduksi.status} IN ${PO_AKTIF}`, isNull(poProduksi.deletedAt)));

  // di area cutting = hasil cutting baik yang BELUM masuk bundel (masih di meja potong)
  const [cut] = await db
    .select({
      baik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
    })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .where(isNull(hasilCutting.deletedAt));

  const [bdl] = await db
    .select({ pcs: sql<number>`COALESCE(SUM(${bundling.jumlahPcs}), 0)::int` })
    .from(bundling)
    .where(and(ne(bundling.status, "dibatalkan"), isNull(bundling.deletedAt)));

  // bundel siap kirim tapi belum ditugaskan — antre menuju vendor
  const [antreJahit] = await db
    .select({ pcs: sql<number>`COALESCE(SUM(${bundling.jumlahPcs}), 0)::int` })
    .from(bundling)
    .where(
      and(
        eq(bundling.status, "siap_dikirim"),
        isNull(bundling.deletedAt),
        sql`NOT EXISTS (
          SELECT 1 FROM penugasan_jahit_detail d JOIN penugasan_jahit p ON p.id = d.penugasan_id
          WHERE d.bundling_id = ${bundling.id} AND p.status <> 'dibatalkan' AND p.deleted_at IS NULL
        )`,
      ),
    );

  // masih di vendor = Σ sisa WIP penugasan aktif (rumus tunggal di lib/jahit/rekap.ts)
  const penugasanAktif = await db
    .select({ id: penugasanJahit.id })
    .from(penugasanJahit)
    .where(and(eq(penugasanJahit.status, "aktif"), isNull(penugasanJahit.deletedAt)));

  let diVendor = 0;
  for (const p of penugasanAktif) {
    const rekap = await getRekapDetailPenugasan(db, p.id);
    diVendor += rekap.reduce((s, r) => s + r.sisa, 0);
  }

  // selesai jahit = baik yang sudah diterima dari penugasan selesai → antre QC (Tahap 4)
  const [siapQc] = await db
    .select({ n: sql<number>`COALESCE(SUM(hd.jumlah_baik), 0)::int` })
    .from(sql`penerimaan_hasil_jahit h JOIN penerimaan_hasil_jahit_detail hd ON hd.penerimaan_id = h.id`)
    .where(sql`h.deleted_at IS NULL`);

  const diCutting = Math.max(0, (cut?.baik ?? 0) - (bdl?.pcs ?? 0));

  return {
    poAktif: po?.n ?? 0,
    diCutting,
    antreJahit: antreJahit?.pcs ?? 0,
    diVendor,
    siapQc: siapQc?.n ?? 0,
    // Tahap 4 — belum ada modulnya
    menungguQc: null as number | null,
    stokJadi: null as number | null,
  };
}

export type AlurProduksi = Awaited<ReturnType<typeof getAlurProduksi>>;
