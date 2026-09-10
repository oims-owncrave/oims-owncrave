import { sql } from "drizzle-orm";
import { penerimaanHasilJahitDetail } from "@/db/schema";

/**
 * Rekap antrean QC — DERIVED murni (pola referensi §4, sama seperti
 * src/lib/jahit/rekap.ts). Tidak ada tabel antrean, tidak ada kolom sisa.
 *
 *   sisa siap QC = jumlah_baik − Σ yang sudah dikirim ke QC
 *
 * jumlah_baik = baik VISUAL dari Tahap 3 (bukan lolos QC — QC formal di sini).
 * Modul server-only tanpa "use server" supaya bisa dipakai di dalam transaksi.
 */

const h = penerimaanHasilJahitDetail;

/** Σ pcs dari baris penerimaan hasil ini yang SUDAH masuk dokumen IN-QC. */
export const sudahKeQcSql = sql<number>`(
  SELECT COALESCE(SUM(d.jumlah_pcs), 0)::int
  FROM penerimaan_qc_detail d
  JOIN penerimaan_qc p ON p.id = d.penerimaan_qc_id
  WHERE d.penerimaan_hasil_detail_id = ${h.id} AND p.deleted_at IS NULL
)`;

/** Sisa yang masih boleh dikirim ke QC. */
export const sisaSiapQcSql = sql<number>`(${h.jumlahBaik} - ${sudahKeQcSql})`;

// ─── Work Order QC (oims-ckp.5) ───────────────────────────────────────────────

/**
 * Satu penerimaan_qc_detail hanya boleh masuk SATU WO yang masih hidup
 * (pola guard bundel oims-eba.5). WO 'dibatalkan' melepas kembali barisnya.
 */
export const sudahMasukWoSql = sql<number>`(
  SELECT COUNT(*)::int
  FROM work_order_qc_detail wd
  JOIN work_order_qc w ON w.id = wd.work_order_qc_id
  WHERE wd.penerimaan_qc_detail_id = penerimaan_qc_detail.id
    AND w.deleted_at IS NULL AND w.status <> 'dibatalkan'
)`;

// ─── Hasil QC (oims-ckp.6) ────────────────────────────────────────────────────

/** Σ diperiksa untuk satu baris WO — dipakai hitung "belum diperiksa" (DERIVED). */
export const sudahDiperiksaSql = sql<number>`(
  SELECT COALESCE(SUM(hd.jumlah_diperiksa), 0)::int
  FROM hasil_qc_detail hd
  JOIN hasil_qc h ON h.id = hd.hasil_qc_id
  WHERE hd.work_order_qc_detail_id = work_order_qc_detail.id AND h.deleted_at IS NULL
)`;

// ─── Rework (oims-ckp.8) ──────────────────────────────────────────────────────

/**
 * Σ rework (internal + retur vendor) per baris hasil QC.
 * GUARD BERSAMA: total ini tak boleh melebihi hasil_qc_detail.perbaikan —
 * dihitung di satu tempat supaya dua jalur tak saling melampaui.
 */
export const sudahReworkSql = sql<number>`(
  (SELECT COALESCE(SUM(pd.jumlah), 0)::int
   FROM perbaikan_internal_detail pd
   JOIN perbaikan_internal p ON p.id = pd.perbaikan_internal_id
   WHERE pd.hasil_qc_detail_id = hasil_qc_detail.id
     AND p.deleted_at IS NULL AND p.status <> 'dibatalkan')
  +
  (SELECT COALESCE(SUM(rd.jumlah), 0)::int
   FROM retur_qc_vendor_detail rd
   JOIN retur_qc_vendor r ON r.id = rd.retur_qc_vendor_id
   WHERE rd.hasil_qc_detail_id = hasil_qc_detail.id
     AND r.deleted_at IS NULL AND r.status <> 'dibatalkan')
)`;

// ─── Karantina Reject (oims-ckp.10) ───────────────────────────────────────────

/** Σ reject yang sudah dikarantina per baris hasil QC. */
export const sudahDikarantinaSql = sql<number>`(
  SELECT COALESCE(SUM(kd.jumlah), 0)::int
  FROM karantina_reject_detail kd
  JOIN karantina_reject k ON k.id = kd.karantina_reject_id
  WHERE kd.hasil_qc_detail_id = hasil_qc_detail.id AND k.deleted_at IS NULL
)`;

/** Σ tindakan DISETUJUI per baris karantina — hanya yang approved yang berdampak. */
export const tindakanDisetujuiSql = sql<number>`(
  SELECT COALESCE(SUM(t.jumlah), 0)::int
  FROM tindakan_reject t
  WHERE t.karantina_reject_detail_id = karantina_reject_detail.id
    AND t.status = 'approved' AND t.deleted_at IS NULL
)`;

/** Σ tindakan yang belum ditolak (pending + approved) — batas input tindakan baru. */
export const tindakanTerpakaiSql = sql<number>`(
  SELECT COALESCE(SUM(t.jumlah), 0)::int
  FROM tindakan_reject t
  WHERE t.karantina_reject_detail_id = karantina_reject_detail.id
    AND t.status <> 'rejected' AND t.deleted_at IS NULL
)`;
