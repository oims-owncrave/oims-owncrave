import type { ImportColumn } from "@/lib/import/types";

/** Kolom import Excel BOM — satu sumber, dipakai di produksi/bom & master/data-produk. */
export const BOM_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "produk", header: "Produk (kode/nama)", example: "NJK", required: true },
  { key: "bahan", header: "Bahan (kode/nama)", example: "BH-KTN-001", required: true },
  { key: "warna", header: "Warna", example: "HITAM", required: false },
  { key: "ukuran", header: "Ukuran", example: "Semua", required: false },
  { key: "kuantitas", header: "Kuantitas per Pcs", example: "1.8", required: true },
  { key: "keterangan", header: "Keterangan", example: "Bahan utama", required: false },
];
