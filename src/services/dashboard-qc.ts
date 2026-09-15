"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  hasilQc,
  hasilQcDetail,
  workOrderQc,
  penerimaanQc,
  penerimaanQcDetail,
  perbaikanInternal,
  returQcVendor,
  karantinaRejectDetail,
  karantinaReject,
  finishing,
  finishingDetail,
  packing,
  stokBarangJadi,
  bahan,
  stok,
  produk,
  varianProduk,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { stokSiapJualSql } from "@/lib/qc/stok-fg";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;

/**
 * Rumus PRD §28-29 dikumpulkan di satu tempat.
 * Pelajaran Tahap 3: rumus yang dicopy ke tiap halaman bikin angka beda-beda.
 *
 * COPQ: komponen yang sumbernya belum ada (Tahap 5 di-skip) dikembalikan null,
 * BUKAN 0 — supaya UI bisa menampilkan N/A dan tidak terlihat seperti fakta.
 */
export async function getRingkasanQc() {
  await requireRole([...READ_ROLES]);

  const [qc] = await db
    .select({
      diperiksa: sql<number>`COALESCE(SUM(${hasilQcDetail.jumlahDiperiksa}), 0)::int`,
      gradeA: sql<number>`COALESCE(SUM(${hasilQcDetail.gradeA}), 0)::int`,
      gradeB: sql<number>`COALESCE(SUM(${hasilQcDetail.gradeB}), 0)::int`,
      gradeC: sql<number>`COALESCE(SUM(${hasilQcDetail.gradeC}), 0)::int`,
      perbaikan: sql<number>`COALESCE(SUM(${hasilQcDetail.perbaikan}), 0)::int`,
      reject: sql<number>`COALESCE(SUM(${hasilQcDetail.reject}), 0)::int`,
    })
    .from(hasilQcDetail)
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .where(isNull(hasilQc.deletedAt));

  const diperiksa = Number(qc?.diperiksa ?? 0);
  const gradeA = Number(qc?.gradeA ?? 0);
  const bermasalah =
    Number(qc?.gradeB ?? 0) + Number(qc?.gradeC ?? 0) + Number(qc?.perbaikan ?? 0) + Number(qc?.reject ?? 0);

  // First Pass Yield = lolos QC PERTAMA (baris tanpa rework sama sekali)
  /**
   * First Pass Yield = pcs yang lolos pemeriksaan PERTAMA, yaitu grade A.
   *
   * JANGAN menyaring baris yang punya rework: QC dicatat agregat per varian,
   * jadi satu baris bisa berisi 17 grade A sekaligus 3 perbaikan. Menyaring
   * baris membuang 17 pcs yang justru lolos sekali jalan — FPY jadi 0% padahal
   * seharusnya 68%. Grade A menurut definisinya belum pernah di-rework; pcs
   * yang lolos SETELAH rework tercatat di re_qc, bukan di sini.
   */
  const [fpy] = await db
    .select({
      lolosTanpaRework: sql<number>`COALESCE(SUM(${hasilQcDetail.gradeA}), 0)::int`,
    })
    .from(hasilQcDetail)
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .where(isNull(hasilQc.deletedAt));

  const [antrean] = await db
    .select({
      pcs: sql<number>`COALESCE(SUM(${penerimaanQcDetail.jumlahPcs}), 0)::int`,
    })
    .from(penerimaanQcDetail)
    .innerJoin(penerimaanQc, eq(penerimaanQcDetail.penerimaanQcId, penerimaanQc.id))
    .where(
      and(
        isNull(penerimaanQc.deletedAt),
        sql`NOT EXISTS (
          SELECT 1 FROM work_order_qc_detail wd
          JOIN work_order_qc w ON w.id = wd.work_order_qc_id
          WHERE wd.penerimaan_qc_detail_id = ${penerimaanQcDetail.id}
            AND w.deleted_at IS NULL AND w.status <> 'dibatalkan'
        )`,
      ),
    );

  const [sedangDiperiksa] = await db
    .select({ jumlah: sql<number>`COUNT(*)::int` })
    .from(workOrderQc)
    .where(and(isNull(workOrderQc.deletedAt), eq(workOrderQc.status, "berjalan")));

  return {
    antreanPcs: Number(antrean?.pcs ?? 0),
    woBerjalan: Number(sedangDiperiksa?.jumlah ?? 0),
    diperiksa,
    gradeA,
    perbaikan: Number(qc?.perbaikan ?? 0),
    reject: Number(qc?.reject ?? 0),
    defectRate: diperiksa > 0 ? (bermasalah / diperiksa) * 100 : 0,
    qcYield: diperiksa > 0 ? (gradeA / diperiksa) * 100 : 0,
    firstPassYield: diperiksa > 0 ? (Number(fpy?.lolosTanpaRework ?? 0) / diperiksa) * 100 : 0,
  };
}

export async function getRingkasanFinishingPacking() {
  await requireRole([...READ_ROLES]);

  const [fin] = await db
    .select({
      berjalan: sql<number>`COUNT(*) FILTER (WHERE ${finishing.status} = 'berjalan')::int`,
      selesai: sql<number>`COUNT(*) FILTER (WHERE ${finishing.status} = 'selesai')::int`,
    })
    .from(finishing)
    .where(isNull(finishing.deletedAt));

  const [pck] = await db
    .select({
      berjalan: sql<number>`COUNT(*) FILTER (WHERE ${packing.status} = 'berjalan')::int`,
      selesai: sql<number>`COUNT(*) FILTER (WHERE ${packing.status} = 'selesai')::int`,
    })
    .from(packing)
    .where(isNull(packing.deletedAt));

  const [menungguPacking] = await db
    .select({
      pcs: sql<number>`COALESCE(SUM(${finishingDetail.jumlah}), 0)::int - COALESCE((
        SELECT SUM(pd.jumlah)::int FROM packing_detail pd
        JOIN packing p ON p.id = pd.packing_id
        JOIN finishing_detail fd2 ON fd2.id = pd.finishing_detail_id
        JOIN finishing f2 ON f2.id = fd2.finishing_id
        WHERE f2.status = 'selesai' AND p.deleted_at IS NULL AND p.status <> 'dibatalkan'
      ), 0)`,
    })
    .from(finishingDetail)
    .innerJoin(finishing, eq(finishingDetail.finishingId, finishing.id))
    .where(and(isNull(finishing.deletedAt), eq(finishing.status, "selesai")));

  // bahan label/kemasan di bawah stok minimum
  const kurangBahan = await db
    .select({
      id: bahan.id,
      kode: bahan.kode,
      nama: bahan.nama,
      kuantitas: stok.kuantitas,
      stokMinimum: bahan.stokMinimum,
    })
    .from(bahan)
    .leftJoin(stok, eq(stok.bahanId, bahan.id))
    .where(
      and(
        isNull(bahan.deletedAt),
        sql`COALESCE(${stok.kuantitas}, 0) < ${bahan.stokMinimum}`,
      ),
    )
    .limit(10);

  return {
    finishingBerjalan: Number(fin?.berjalan ?? 0),
    finishingSelesai: Number(fin?.selesai ?? 0),
    packingBerjalan: Number(pck?.berjalan ?? 0),
    packingSelesai: Number(pck?.selesai ?? 0),
    menungguPackingPcs: Math.max(0, Number(menungguPacking?.pcs ?? 0)),
    kurangBahan,
  };
}

export async function getRingkasanBarangJadi() {
  await requireRole([...READ_ROLES]);

  const [total] = await db
    .select({
      siapJual: sql<number>`COALESCE(SUM(${stokSiapJualSql}), 0)::int`,
      kuantitas: sql<number>`COALESCE(SUM(${stokBarangJadi.kuantitas}), 0)::int`,
      ditahan: sql<number>`COALESCE(SUM(${stokBarangJadi.stokDitahan}), 0)::int`,
      rusak: sql<number>`COALESCE(SUM(${stokBarangJadi.stokRusak}), 0)::int`,
      nilai: sql<number>`COALESCE(SUM(${stokBarangJadi.kuantitas} * ${stokBarangJadi.hppRataRata}), 0)::numeric`,
      gradeA: sql<number>`COALESCE(SUM(${stokBarangJadi.kuantitas}) FILTER (WHERE ${stokBarangJadi.grade} = 'a'), 0)::int`,
      gradeB: sql<number>`COALESCE(SUM(${stokBarangJadi.kuantitas}) FILTER (WHERE ${stokBarangJadi.grade} = 'b'), 0)::int`,
      gradeC: sql<number>`COALESCE(SUM(${stokBarangJadi.kuantitas}) FILTER (WHERE ${stokBarangJadi.grade} = 'c'), 0)::int`,
    })
    .from(stokBarangJadi);

  const skuRendah = await db
    .select({
      sku: varianProduk.sku,
      produkNama: produk.nama,
      grade: stokBarangJadi.grade,
      siapJual: stokSiapJualSql,
    })
    .from(stokBarangJadi)
    .innerJoin(varianProduk, eq(stokBarangJadi.varianId, varianProduk.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(sql`${stokSiapJualSql} > 0 AND ${stokSiapJualSql} <= 10`)
    .orderBy(stokSiapJualSql)
    .limit(10);

  return {
    siapJual: Number(total?.siapJual ?? 0),
    kuantitas: Number(total?.kuantitas ?? 0),
    ditahan: Number(total?.ditahan ?? 0),
    rusak: Number(total?.rusak ?? 0),
    nilai: Number(total?.nilai ?? 0),
    gradeA: Number(total?.gradeA ?? 0),
    gradeB: Number(total?.gradeB ?? 0),
    gradeC: Number(total?.gradeC ?? 0),
    skuRendah,
  };
}

/**
 * Cost of Poor Quality PRD §29.
 * Komponen tanpa sumber data dikembalikan null → UI tampilkan N/A, jangan 0.
 */
export async function getCopq() {
  await requireRole([...READ_ROLES]);

  const [rework] = await db
    .select({
      estimasi: sql<number>`COALESCE(SUM(${perbaikanInternal.estimasiBiaya}), 0)::numeric`,
    })
    .from(perbaikanInternal)
    .where(and(isNull(perbaikanInternal.deletedAt), sql`${perbaikanInternal.status} <> 'dibatalkan'`));

  const [reject] = await db
    .select({
      nilai: sql<number>`COALESCE(SUM(${karantinaRejectDetail.jumlah} * ${karantinaRejectDetail.nilaiPerPcs}), 0)::numeric`,
    })
    .from(karantinaRejectDetail)
    .innerJoin(karantinaReject, eq(karantinaRejectDetail.karantinaRejectId, karantinaReject.id))
    .where(isNull(karantinaReject.deletedAt));

  const [retur] = await db
    .select({
      potongan: sql<number>`COALESCE((
        SELECT SUM(rd.jumlah * rd.potongan) FROM retur_qc_vendor_detail rd
        JOIN retur_qc_vendor r ON r.id = rd.retur_qc_vendor_id
        WHERE r.deleted_at IS NULL AND r.status <> 'dibatalkan'
      ), 0)::numeric`,
    })
    .from(returQcVendor)
    .limit(1);

  const biayaRework = Number(rework?.estimasi ?? 0);
  const nilaiReject = Number(reject?.nilai ?? 0);
  const biayaRetur = Number(retur?.potongan ?? 0);

  return {
    biayaRework,
    nilaiReject,
    biayaRetur,
    // butuh HPP per unit (Tahap 5, di-skip) — jangan karang angka
    biayaTambahanFinishing: null as number | null,
    penurunanNilaiGrade: null as number | null,
    totalTerhitung: biayaRework + nilaiReject + biayaRetur,
    adaKomponenTakTerhitung: true,
  };
}
