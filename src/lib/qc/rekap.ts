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
