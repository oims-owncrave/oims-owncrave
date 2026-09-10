import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penugasanJahit,
  penugasanJahitDetail,
  bundling,
  varianProduk,
  warna,
  returJahit,
} from "@/db/schema";

/**
 * Rekap WIP per bundel — DERIVED murni (pola referensi §4), tidak ada kolom sisa.
 *   sisa = dikirim − baik − hilang disetujui − rusak final
 * baik = baik visual dari penerimaan hasil; hilang/rusak hanya yang PUNYA keputusan
 * final (approved). Modul server-only tanpa "use server" supaya bisa terima tx.
 */

type Tx = Pick<typeof db, "select" | "update">;

const d = penugasanJahitDetail;

// Σ baik / rusak dari penerimaan hasil (yang tidak dihapus)
export const baikSql = sql<number>`(
  SELECT COALESCE(SUM(h.jumlah_baik), 0)::int
  FROM penerimaan_hasil_jahit_detail h
  JOIN penerimaan_hasil_jahit p ON p.id = h.penerimaan_id
  WHERE h.penugasan_detail_id = ${d.id} AND p.deleted_at IS NULL
)`;

export const rusakSql = sql<number>`(
  SELECT COALESCE(SUM(h.jumlah_rusak), 0)::int
  FROM penerimaan_hasil_jahit_detail h
  JOIN penerimaan_hasil_jahit p ON p.id = h.penerimaan_id
  WHERE h.penugasan_detail_id = ${d.id} AND p.deleted_at IS NULL
)`;

// hilang yang disetujui (keputusan ada, bukan "ditemukan")
export const hilangDisetujuiSql = sql<number>`(
  SELECT COALESCE(SUM(s.jumlah), 0)::int FROM selisih_jahit s
  WHERE s.penugasan_detail_id = ${d.id} AND s.klasifikasi = 'hilang'
    AND s.keputusan IS NOT NULL AND s.keputusan <> 'ditemukan' AND s.deleted_at IS NULL
)`;

// rusak final = diputuskan ditanggung / dihapusbukukan (bukan "diperbaiki")
export const rusakFinalSql = sql<number>`(
  SELECT COALESCE(SUM(s.jumlah), 0)::int FROM selisih_jahit s
  WHERE s.penugasan_detail_id = ${d.id} AND s.klasifikasi = 'rusak'
    AND s.keputusan IN ('ditanggung_vendor', 'ditanggung_owncrave', 'dihapusbukukan')
    AND s.deleted_at IS NULL
)`;

export async function getRekapDetailPenugasan(tx: Tx, penugasanId: string) {
  const rows = await tx
    .select({
      penugasanDetailId: d.id,
      bundlingId: d.bundlingId,
      bundelNomor: bundling.nomorDokumen,
      bundelStatus: bundling.status,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: d.jumlahPcs,
      tarifSnapshot: d.tarifSnapshot,
      baik: baikSql,
      rusak: rusakSql,
      hilangDisetujui: hilangDisetujuiSql,
      rusakFinal: rusakFinalSql,
    })
    .from(d)
    .innerJoin(bundling, eq(d.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(d.penugasanId, penugasanId))
    .orderBy(bundling.nomorDokumen);

  return rows.map((r) => {
    const dikirim = r.bundelStatus === "sudah_dikirim";
    return {
      ...r,
      dikirim,
      sisa: dikirim ? r.jumlahPcs - r.baik - r.hilangDisetujui - r.rusakFinal : 0,
    };
  });
}

export type RekapDetail = Awaited<ReturnType<typeof getRekapDetailPenugasan>>[number];

/**
 * Penugasan selesai = semua bundel terkirim, sisa 0, tidak ada retur terbuka.
 * Dua arah: kalau kondisi tak lagi terpenuhi (mis. penerimaan dihapus) kembali ke aktif.
 */
export async function refreshPenugasanSelesai(tx: Tx, penugasanId: string) {
  const [p] = await tx
    .select({ status: penugasanJahit.status })
    .from(penugasanJahit)
    .where(and(eq(penugasanJahit.id, penugasanId), isNull(penugasanJahit.deletedAt)))
    .limit(1);
  if (!p || p.status === "draft" || p.status === "dibatalkan") return;

  const rekap = await getRekapDetailPenugasan(tx, penugasanId);
  const semuaTuntas = rekap.length > 0 && rekap.every((r) => r.dikirim && r.sisa <= 0);

  const [returTerbuka] = await tx
    .select({ id: returJahit.id })
    .from(returJahit)
    .where(
      and(
        eq(returJahit.penugasanId, penugasanId),
        inArray(returJahit.status, ["draft", "dikirim", "diterima_kembali"]),
        isNull(returJahit.deletedAt),
      ),
    )
    .limit(1);

  const target = semuaTuntas && !returTerbuka ? "selesai" : "aktif";
  if (target !== p.status) {
    await tx
      .update(penugasanJahit)
      .set({ status: target, updatedAt: new Date() })
      .where(eq(penugasanJahit.id, penugasanId));
  }
}
