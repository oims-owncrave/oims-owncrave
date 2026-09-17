import { sql } from "drizzle-orm";
import { db } from "@/db";

type DocTable =
  | "barang_masuk"
  | "barang_keluar"
  | "penyesuaian_stok"
  | "bom"
  | "permintaan_bahan"
  | "penerimaan_cutting"
  | "work_order_cutting"
  | "hasil_cutting"
  | "bundling"
  | "penugasan_jahit"
  | "pengiriman_jahit"
  | "surat_jalan_jahit"
  | "penerimaan_bundel_vendor"
  | "penerimaan_hasil_jahit"
  | "retur_jahit"
  | "selisih_jahit"
  | "pekerjaan_dekorasi"
  | "penerimaan_dekorasi"
  | "penerimaan_qc"
  | "standar_qc"
  | "work_order_qc"
  | "hasil_qc"
  | "perbaikan_internal"
  | "retur_qc_vendor"
  | "re_qc"
  | "karantina_reject"
  | "finishing"
  | "packing"
  | "barang_jadi"
  | "transfer_barang_jadi"
  | "penyesuaian_stok_fg";

/** Cukup `execute` — `db` maupun `tx` transaksi sama-sama memenuhi ini. */
type Executor = Pick<typeof db, "execute">;

/**
 * Generate nomor dokumen: [TIPE]-YYYYMM-NNNN (counter reset per bulan).
 *
 * Pakai COUNT(*) baris bulan ini + 1. Ada TOCTOU gap (2 transaksi bersamaan bisa
 * dapat nomor sama) — TAPI kolom nomor_dokumen UNIQUE, jadi collision → DB reject.
 * Caller (createBarangMasuk) bungkus dalam retry-on-23505. Untuk konkurensi rendah
 * (segelintir admin gudang) collision hampir mustahil.
 *
 * WAJIB oper `tx` kalau dipanggil di dalam transaksi. Tanpa itu COUNT(*) jalan di
 * koneksi lain dan tidak melihat insert yang belum commit — dua panggilan dalam satu
 * transaksi akan mengembalikan nomor yang SAMA. Retry tidak menolong: bentrokannya
 * deterministik, jadi percobaan ulang menghasilkan tabrakan yang sama (app-qh4u).
 * ponytail: naive count + retry; upgrade ke DB sequence kalau collision muncul di log.
 */
export async function generateDocNumber(
  prefix:
    | "BM" | "BK" | "PS" | "BOM" | "PB" | "PC" | "WO-CUT" | "CUT" | "BND"
    | "ASG-JHT" | "SHP-JHT" | "SJ-JHT" | "STB-JHT"
    | "RCV-JHT" | "RTN-JHT" | "SLS-JHT" | "DEK" | "RCD-DEK"
    | "IN-QC" | "STD-QC" | "WO-QC" | "QC"
    | "RWK-INT" | "RTN-QC" | "RE-QC" | "RJT"
    | "FIN" | "PKG" | "FG" | "TRF-FG" | "PS-FG",
  tableName: DocTable,
  column: "nomor_dokumen" | "nomor_kasus" = "nomor_dokumen",
  executor: Executor = db,
): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const like = `${prefix}-${yyyymm}-%`;

  const rows = await executor.execute<{ count: number }>(
    sql`SELECT COUNT(*)::int AS count FROM ${sql.identifier(tableName)} WHERE ${sql.identifier(column)} LIKE ${like}`,
  );
  const count = Number(rows[0]?.count ?? 0);
  const nomor = String(count + 1).padStart(4, "0");
  return `${prefix}-${yyyymm}-${nomor}`;
}

/**
 * Pecah "SLS-JHT-202609-0003" jadi ["SLS-JHT-202609", 3].
 *
 * Dipakai saat satu transaksi perlu BEBERAPA nomor berurutan: ambil satu nomor lewat
 * generateDocNumber, lalu naikkan urutannya sendiri. Memanggil generateDocNumber per
 * baris tidak bisa — COUNT(*) belum melihat insert yang belum commit (app-qh4u).
 */
export function pisahNomor(nomor: string): [string, number] {
  const pisah = nomor.lastIndexOf("-");
  const urut = Number(nomor.slice(pisah + 1));
  if (pisah < 0 || !Number.isInteger(urut)) {
    throw new Error(`Nomor dokumen tidak dikenali: ${nomor}`);
  }
  return [nomor.slice(0, pisah), urut];
}
