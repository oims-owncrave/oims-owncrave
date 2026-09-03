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
  pemakaianBahan,
  bomDetail,
  bahan,
  satuan,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { WIP_LABEL, type WipStatus } from "@/lib/wip-status";

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

// ─── Grafik Dashboard Tahap 2 (PRD §21) ──────────────────────────────────────

export type GrafikTargetHasil = {
  poId: string;
  nomorDokumen: string;
  produkNama: string;
  target: number;
  baik: number;
  rusak: number;
  /** Efisiensi = hasil baik / target rencana cutting (%) */
  efisiensi: number;
};

export type GrafikHasilHarian = { tanggal: string; baik: number; rusak: number };
export type GrafikLimbah = { jenis: string; jumlah: number; nilai: number };
export type GrafikPemakaian = {
  bahanId: string;
  bahanKode: string;
  bahanNama: string;
  satuanSingkatan: string;
  standar: number;
  aktual: number;
  /** Varians = aktual − standar; positif berarti boros */
  varians: number;
};

/**
 * Data grafik dashboard Tahap 2 (PRD §21).
 * Semua agregat dihitung dari record turunan — tidak ada kolom ringkasan yang disimpan.
 */
export async function getGrafikProduksi() {
  await requireRole([...READ_ROLES]);

  // 1. Target vs hasil + efisiensi per PO (PO aktif & selesai, 20 terbaru)
  const targetHasil = await db
    .select({
      poId: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      target: sql<number>`(SELECT COALESCE(SUM(target_cutting), 0)::int
        FROM work_order_cutting_detail d
        JOIN work_order_cutting w ON w.id = d.wo_id
        WHERE w.po_id = ${poProduksi.id} AND w.deleted_at IS NULL)`,
      baik: sql<number>`(SELECT COALESCE(SUM(hd.jumlah_baik), 0)::int
        FROM hasil_cutting_detail hd
        JOIN hasil_cutting h ON h.id = hd.hasil_id
        JOIN work_order_cutting w ON w.id = h.wo_id
        WHERE w.po_id = ${poProduksi.id} AND h.deleted_at IS NULL)`,
      rusak: sql<number>`(SELECT COALESCE(SUM(hd.jumlah_rusak), 0)::int
        FROM hasil_cutting_detail hd
        JOIN hasil_cutting h ON h.id = hd.hasil_id
        JOIN work_order_cutting w ON w.id = h.wo_id
        WHERE w.po_id = ${poProduksi.id} AND h.deleted_at IS NULL)`,
    })
    .from(poProduksi)
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(isNull(poProduksi.deletedAt))
    .orderBy(sql`${poProduksi.createdAt} DESC`)
    .limit(20);

  const rowsTargetHasil: GrafikTargetHasil[] = targetHasil
    .filter((r) => r.target > 0)
    .map((r) => ({
      ...r,
      efisiensi: r.target > 0 ? Math.round((r.baik / r.target) * 1000) / 10 : 0,
    }));

  // 2. Hasil per hari (30 hari terakhir)
  const sejak = new Date();
  sejak.setDate(sejak.getDate() - 30);
  sejak.setHours(0, 0, 0, 0);

  const harianRows = await db
    .select({
      tanggal: sql<string>`to_char(${hasilCutting.tanggal}, 'YYYY-MM-DD')`,
      baik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
      rusak: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahRusak}), 0)::int`,
    })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .where(and(gte(hasilCutting.tanggal, sejak), isNull(hasilCutting.deletedAt)))
    .groupBy(sql`to_char(${hasilCutting.tanggal}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${hasilCutting.tanggal}, 'YYYY-MM-DD')`);

  // 3. Limbah per jenis (bulan berjalan)
  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const limbahRows = await db
    .select({
      jenis: limbahCutting.jenis,
      jumlah: sql<string>`COALESCE(SUM(${limbahCutting.jumlah}), 0)`,
      nilai: sql<string>`COALESCE(SUM(${limbahCutting.jumlah} * ${limbahCutting.hargaRataRata}), 0)`,
    })
    .from(limbahCutting)
    .where(and(gte(limbahCutting.createdAt, awalBulan), isNull(limbahCutting.deletedAt)))
    .groupBy(limbahCutting.jenis);

  // 4. Pemakaian standar vs aktual per bahan (agregat semua WO)
  const pemakaianRows = await db
    .select({
      bahanId: pemakaianBahan.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      aktual: sql<string>`COALESCE(SUM(${pemakaianBahan.jumlahDigunakan}), 0)`,
    })
    .from(pemakaianBahan)
    .innerJoin(bahan, eq(pemakaianBahan.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(isNull(pemakaianBahan.deletedAt))
    .groupBy(pemakaianBahan.bahanId, bahan.kode, bahan.nama, satuan.singkatan);

  // Standar = Σ (target cutting × kuantitas BOM) per bahan, dari BOM yang terkunci di PO
  const standarRows = await db
    .select({
      bahanId: bomDetail.bahanId,
      standar: sql<string>`COALESCE(SUM(
        ${bomDetail.kuantitas} * (
          SELECT COALESCE(SUM(d.target_cutting), 0)
          FROM work_order_cutting_detail d
          JOIN work_order_cutting w ON w.id = d.wo_id
          WHERE w.po_id = ${poProduksi.id} AND w.deleted_at IS NULL
        )
      ), 0)`,
    })
    .from(poProduksi)
    .innerJoin(bomDetail, eq(bomDetail.bomId, poProduksi.bomId))
    .where(isNull(poProduksi.deletedAt))
    .groupBy(bomDetail.bahanId);
  const standarMap = new Map(standarRows.map((r) => [r.bahanId, Number(r.standar)]));

  const rowsPemakaian: GrafikPemakaian[] = pemakaianRows.map((r) => {
    const aktual = Number(r.aktual);
    const standar = standarMap.get(r.bahanId) ?? 0;
    return {
      bahanId: r.bahanId,
      bahanKode: r.bahanKode,
      bahanNama: r.bahanNama,
      satuanSingkatan: r.satuanSingkatan,
      standar,
      aktual,
      varians: aktual - standar,
    };
  });

  return {
    targetHasil: rowsTargetHasil,
    hasilHarian: harianRows.map((r) => ({
      tanggal: r.tanggal,
      baik: r.baik,
      rusak: r.rusak,
    })) as GrafikHasilHarian[],
    limbahPerJenis: limbahRows.map((r) => ({
      jenis: r.jenis,
      jumlah: Number(r.jumlah),
      nilai: Number(r.nilai),
    })) as GrafikLimbah[],
    pemakaian: rowsPemakaian,
  };
}

export type GrafikProduksi = Awaited<ReturnType<typeof getGrafikProduksi>>;
