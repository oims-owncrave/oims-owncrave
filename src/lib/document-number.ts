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
  | "penerimaan_dekorasi";

/**
 * Generate nomor dokumen: [TIPE]-YYYYMM-NNNN (counter reset per bulan).
 *
 * Pakai COUNT(*) baris bulan ini + 1. Ada TOCTOU gap (2 transaksi bersamaan bisa
 * dapat nomor sama) — TAPI kolom nomor_dokumen UNIQUE, jadi collision → DB reject.
 * Caller (createBarangMasuk) bungkus dalam retry-on-23505. Untuk konkurensi rendah
 * (segelintir admin gudang) collision hampir mustahil.
 * ponytail: naive count + retry; upgrade ke DB sequence kalau collision muncul di log.
 */
export async function generateDocNumber(
  prefix:
    | "BM" | "BK" | "PS" | "BOM" | "PB" | "PC" | "WO-CUT" | "CUT" | "BND"
    | "ASG-JHT" | "SHP-JHT" | "SJ-JHT" | "STB-JHT"
    | "RCV-JHT" | "RTN-JHT" | "SLS-JHT" | "DEK" | "RCD-DEK",
  tableName: DocTable,
  column: "nomor_dokumen" | "nomor_kasus" = "nomor_dokumen",
): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const like = `${prefix}-${yyyymm}-%`;

  const rows = await db.execute<{ count: number }>(
    sql`SELECT COUNT(*)::int AS count FROM ${sql.identifier(tableName)} WHERE ${sql.identifier(column)} LIKE ${like}`,
  );
  const count = Number(rows[0]?.count ?? 0);
  const nomor = String(count + 1).padStart(4, "0");
  return `${prefix}-${yyyymm}-${nomor}`;
}
