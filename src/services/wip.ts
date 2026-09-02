"use server";

import { and, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  poProduksi,
  produk,
  permintaanBahan,
  barangKeluar,
  penerimaanCutting,
  workOrderCutting,
  workOrderCuttingDetail,
  hasilCutting,
  hasilCuttingDetail,
  bundling,
  limbahCutting,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;

const PIPELINE_STATUS = [
  "disetujui",
  "menunggu_bahan",
  "bahan_disiapkan",
  "sedang_cutting",
  "cutting_selesai",
  "bundling_selesai",
  "siap_jahit",
] as const;

export type WipStatus =
  | "menunggu_bahan"
  | "menunggu_diterima"
  | "menunggu_wo"
  | "sedang_cutting"
  | "cutting_selesai"
  | "sedang_bundling"
  | "siap_dikirim";

export const WIP_LABEL: Record<WipStatus, string> = {
  menunggu_bahan: "Menunggu Bahan",
  menunggu_diterima: "Bahan Keluar — Menunggu Diterima",
  menunggu_wo: "Bahan Diterima — Menunggu WO",
  sedang_cutting: "Sedang Cutting",
  cutting_selesai: "Cutting Selesai — Menunggu Bundling",
  sedang_bundling: "Sedang Bundling",
  siap_dikirim: "Siap Dikirim ke Penjahit",
};

/**
 * WIP cutting per PO aktif. Status DERIVED murni dari record turunan
 * (pola referensi §4) — tidak ada kolom status yang di-update.
 */
export async function getWipCutting() {
  await requireRole([...READ_ROLES]);

  const poRows = await db
    .select({
      poId: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      tanggal: poProduksi.tanggal,
      targetSelesai: poProduksi.targetSelesai,
      totalTarget: sql<number>`(SELECT COALESCE(SUM(jumlah_target), 0)::int FROM po_produksi_detail WHERE po_produksi_detail.po_id = ${poProduksi.id})`,
    })
    .from(poProduksi)
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(and(inArray(poProduksi.status, [...PIPELINE_STATUS]), isNull(poProduksi.deletedAt)))
    .orderBy(poProduksi.createdAt);

  if (poRows.length === 0) return [];
  const poIds = poRows.map((p) => p.poId);

  // agregat per PO — masing-masing satu query
  const bkRows = await db
    .select({ poId: permintaanBahan.poId, n: sql<number>`COUNT(*)::int` })
    .from(barangKeluar)
    .innerJoin(permintaanBahan, eq(barangKeluar.permintaanBahanId, permintaanBahan.id))
    .where(inArray(permintaanBahan.poId, poIds))
    .groupBy(permintaanBahan.poId);

  const terimaRows = await db
    .select({ poId: penerimaanCutting.poId, n: sql<number>`COUNT(*)::int` })
    .from(penerimaanCutting)
    .where(and(inArray(penerimaanCutting.poId, poIds), isNull(penerimaanCutting.deletedAt)))
    .groupBy(penerimaanCutting.poId);

  const woRows = await db
    .select({
      poId: workOrderCutting.poId,
      n: sql<number>`COUNT(*)::int`,
      targetWo: sql<number>`COALESCE(SUM((SELECT COALESCE(SUM(target_cutting), 0) FROM work_order_cutting_detail WHERE work_order_cutting_detail.wo_id = ${workOrderCutting.id})), 0)::int`,
    })
    .from(workOrderCutting)
    .where(and(inArray(workOrderCutting.poId, poIds), isNull(workOrderCutting.deletedAt)))
    .groupBy(workOrderCutting.poId);

  const baikRows = await db
    .select({
      poId: workOrderCutting.poId,
      baik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
    })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .innerJoin(workOrderCutting, eq(hasilCutting.woId, workOrderCutting.id))
    .where(and(inArray(workOrderCutting.poId, poIds), isNull(hasilCutting.deletedAt)))
    .groupBy(workOrderCutting.poId);

  const bundelRows = await db
    .select({
      poId: workOrderCutting.poId,
      pcs: sql<number>`COALESCE(SUM(${bundling.jumlahPcs}), 0)::int`,
      siap: sql<number>`COALESCE(SUM(CASE WHEN ${bundling.status} = 'siap_dikirim' THEN 1 ELSE 0 END), 0)::int`,
    })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
    .where(
      and(
        inArray(workOrderCutting.poId, poIds),
        ne(bundling.status, "dibatalkan"),
        isNull(bundling.deletedAt),
      ),
    )
    .groupBy(workOrderCutting.poId);

  const m = <T extends { poId: string }>(rows: T[]) => new Map(rows.map((r) => [r.poId, r]));
  const bkMap = m(bkRows);
  const terimaMap = m(terimaRows);
  const woMap = m(woRows);
  const baikMap = m(baikRows);
  const bundelMap = m(bundelRows);

  const now = new Date();

  return poRows.map((po) => {
    const adaBk = (bkMap.get(po.poId)?.n ?? 0) > 0;
    const adaTerima = (terimaMap.get(po.poId)?.n ?? 0) > 0;
    const wo = woMap.get(po.poId);
    const baik = baikMap.get(po.poId)?.baik ?? 0;
    const bundel = bundelMap.get(po.poId);
    const dibundel = bundel?.pcs ?? 0;
    const adaBundelSiap = (bundel?.siap ?? 0) > 0;
    const targetWo = wo?.targetWo ?? 0;

    let status: WipStatus;
    if (baik > 0 && dibundel >= baik && adaBundelSiap) status = "siap_dikirim";
    else if (dibundel > 0) status = "sedang_bundling";
    else if (wo && targetWo > 0 && baik >= targetWo) status = "cutting_selesai";
    else if (wo && (wo.n ?? 0) > 0) status = "sedang_cutting";
    else if (adaTerima) status = "menunggu_wo";
    else if (adaBk) status = "menunggu_diterima";
    else status = "menunggu_bahan";

    const terlambat =
      po.targetSelesai !== null && new Date(po.targetSelesai) < now && status !== "siap_dikirim";
    const umurHari = Math.floor((now.getTime() - new Date(po.tanggal).getTime()) / 86400000);

    return {
      ...po,
      baik,
      dibundel,
      status,
      label: WIP_LABEL[status],
      terlambat,
      umurHari,
    };
  });
}

export type WipRow = Awaited<ReturnType<typeof getWipCutting>>[number];

/** Kartu ringkasan produksi bulan berjalan. */
export async function getRingkasanProduksi() {
  await requireRole([...READ_ROLES]);

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const [[hasilBulan], [limbahBulan], [bundelSiap]] = await Promise.all([
    db
      .select({
        baik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
        rusak: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahRusak}), 0)::int`,
      })
      .from(hasilCuttingDetail)
      .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
      .where(and(gte(hasilCutting.tanggal, awalBulan), isNull(hasilCutting.deletedAt))),
    db
      .select({
        nilai: sql<string>`COALESCE(SUM(${limbahCutting.jumlah} * ${limbahCutting.hargaRataRata}), 0)`,
      })
      .from(limbahCutting)
      .where(and(gte(limbahCutting.createdAt, awalBulan), isNull(limbahCutting.deletedAt))),
    db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(bundling)
      .where(and(eq(bundling.status, "siap_dikirim"), isNull(bundling.deletedAt))),
  ]);

  return {
    hasilBaikBulanIni: hasilBulan?.baik ?? 0,
    hasilRusakBulanIni: hasilBulan?.rusak ?? 0,
    nilaiLimbahBulanIni: Number(limbahBulan?.nilai ?? 0),
    bundelSiapKirim: bundelSiap?.n ?? 0,
  };
}

export type RingkasanProduksi = Awaited<ReturnType<typeof getRingkasanProduksi>>;
