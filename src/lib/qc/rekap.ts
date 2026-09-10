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
