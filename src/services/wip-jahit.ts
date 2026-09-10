"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penugasanJahit,
  pengirimanJahit,
  returJahit,
  poProduksi,
  produk,
  vendor,
  penjahit,
  bundling,
  workOrderCutting,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getRekapDetailPenugasan } from "@/lib/jahit/rekap";
import { umurWip, keterlambatan, type WipJahitStatus } from "@/lib/jahit/wip-status";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

/**
 * WIP jahit per penugasan — status DERIVED murni dari record turunan
 * (pola referensi §4), tidak ada kolom status yang di-update.
 */
export async function getWipJahit() {
  await requireRole([...READ_ROLES]);

  const rows = await db
    .select({
      penugasanId: penugasanJahit.id,
      nomorDokumen: penugasanJahit.nomorDokumen,
      penugasanStatus: penugasanJahit.status,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      internal: sql<boolean>`${penugasanJahit.penjahitId} IS NOT NULL`,
      targetSelesai: penugasanJahit.targetSelesai,
      // tanggal kirim = pengiriman non-batal paling awal
      tanggalKirim: sql<Date | null>`(
        SELECT MIN(p.tanggal_jam) FROM pengiriman_jahit p
        WHERE p.penugasan_id = ${penugasanJahit.id} AND p.status <> 'dibatalkan' AND p.deleted_at IS NULL
      )`,
      adaPengiriman: sql<boolean>`EXISTS (
        SELECT 1 FROM pengiriman_jahit p
        WHERE p.penugasan_id = ${penugasanJahit.id} AND p.status <> 'dibatalkan' AND p.deleted_at IS NULL
      )`,
      semuaDiterimaVendor: sql<boolean>`NOT EXISTS (
        SELECT 1 FROM pengiriman_jahit p
        WHERE p.penugasan_id = ${penugasanJahit.id} AND p.status = 'dikirim' AND p.deleted_at IS NULL
      )`,
      returTerbuka: sql<number>`(
        SELECT COUNT(*)::int FROM retur_jahit r
        WHERE r.penugasan_id = ${penugasanJahit.id}
          AND r.status IN ('draft', 'dikirim', 'diterima_kembali') AND r.deleted_at IS NULL
      )`,
      estimasiBiaya: sql<string>`(
        SELECT COALESCE(SUM(d.jumlah_pcs * d.tarif_snapshot), 0)
        FROM penugasan_jahit_detail d WHERE d.penugasan_id = ${penugasanJahit.id}
      )`,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(and(sql`${penugasanJahit.status} <> 'dibatalkan'`, isNull(penugasanJahit.deletedAt)))
    .orderBy(desc(penugasanJahit.createdAt));

  const out = [];
  for (const r of rows) {
    const rekap = await getRekapDetailPenugasan(db, r.penugasanId);
    const dikirim = rekap.filter((x) => x.dikirim).reduce((s, x) => s + x.jumlahPcs, 0);
    const totalPcs = rekap.reduce((s, x) => s + x.jumlahPcs, 0);
    const baik = rekap.reduce((s, x) => s + x.baik, 0);
    const rusak = rekap.reduce((s, x) => s + x.rusak, 0);
    const sisa = rekap.reduce((s, x) => s + x.sisa, 0);
    const selesai = r.penugasanStatus === "selesai";

    // status derived — urutan cek dari kondisi paling akhir ke paling awal
    let status: WipJahitStatus;
    if (selesai) status = "selesai_jahit";
    else if (r.returTerbuka > 0) status = "perlu_perbaikan";
    else if (baik + rusak > 0) status = "diterima_sebagian";
    else if (!r.adaPengiriman) status = r.penugasanStatus === "draft" ? "menunggu_penugasan" : "menunggu_pengiriman";
    else if (!r.semuaDiterimaVendor) status = "dalam_perjalanan";
    else status = "di_vendor";

    out.push({
      ...r,
      status,
      totalPcs,
      dikirim,
      baik,
      rusak,
      sisa,
      // progres derived dari setoran (bukan input manual vendor)
      progres: dikirim > 0 ? Math.round((baik / dikirim) * 100) : 0,
      umurHari: umurWip(r.tanggalKirim),
      terlambatHari: keterlambatan(r.targetSelesai, selesai),
    });
  }
  return out;
}

export type WipJahitRow = Awaited<ReturnType<typeof getWipJahit>>[number];

/** Kartu ringkasan Tahap 3 — dipakai halaman WIP dan dashboard. */
export async function getRingkasanJahit() {
  await requireRole([...READ_ROLES]);
  const wip = await getWipJahit();
  const aktif = wip.filter((w) => w.status !== "selesai_jahit");

  const bulanIni = new Date();
  bulanIni.setDate(1);
  bulanIni.setHours(0, 0, 0, 0);

  const [diterimaBulanIni] = await db
    .select({ n: sql<number>`COALESCE(SUM(hd.jumlah_baik), 0)::int` })
    .from(sql`penerimaan_hasil_jahit h JOIN penerimaan_hasil_jahit_detail hd ON hd.penerimaan_id = h.id`)
    .where(sql`h.deleted_at IS NULL AND h.tanggal_jam >= ${bulanIni.toISOString()}::timestamptz`);

  const [bundelSiap] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
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

  const [returTerbuka] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(returJahit)
    .where(and(sql`${returJahit.status} IN ('draft', 'dikirim', 'diterima_kembali')`, isNull(returJahit.deletedAt)));

  return {
    totalWip: aktif.reduce((s, w) => s + w.sisa, 0),
    wipInternal: aktif.filter((w) => w.internal).reduce((s, w) => s + w.sisa, 0),
    wipVendor: aktif.filter((w) => !w.internal).reduce((s, w) => s + w.sisa, 0),
    penugasanAktif: aktif.length,
    // deadline ≤ 3 hari lagi dan belum selesai
    mendekatiDeadline: aktif.filter((w) => {
      const sisaHari = Math.floor((new Date(w.targetSelesai).getTime() - Date.now()) / 86_400_000);
      return sisaHari >= 0 && sisaHari <= 3;
    }).length,
    terlambat: aktif.filter((w) => w.terlambatHari > 0).length,
    diterimaBulanIni: diterimaBulanIni?.n ?? 0,
    bundelBelumDitugaskan: bundelSiap?.n ?? 0,
    returTerbuka: returTerbuka?.n ?? 0,
    estimasiBiayaAktif: aktif.reduce((s, w) => s + Number(w.estimasiBiaya), 0),
  };
}

export type RingkasanJahit = Awaited<ReturnType<typeof getRingkasanJahit>>;
