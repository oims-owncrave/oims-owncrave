/**
 * Proses finishing PRD §20 — konstanta murni (BUKAN "use server").
 * Disimpan sebagai jsonb checklist per baris detail, bukan tabel per pcs.
 */
export const PROSES_FINISHING = [
  { key: "trimming", label: "Trimming" },
  { key: "bersih_kapur", label: "Membersihkan kapur" },
  { key: "bersih_noda", label: "Membersihkan noda" },
  { key: "cek_aksesori", label: "Memeriksa aksesori" },
  { key: "cek_resleting", label: "Memeriksa resleting" },
  { key: "steam", label: "Steam" },
  { key: "bentuk_produk", label: "Membentuk produk" },
  { key: "pasang_label", label: "Memasang label" },
  { key: "pasang_hangtag", label: "Memasang hangtag" },
  { key: "pasang_barcode", label: "Memasang barcode" },
  { key: "periksa_akhir", label: "Pemeriksaan akhir" },
  { key: "folding", label: "Folding" },
] as const;

/** Checklist packing PRD §23 — di-guard saat transisi ke selesai. */
export const CHECKLIST_PACKING = [
  { key: "sku_benar", label: "SKU benar" },
  { key: "ukuran_benar", label: "Ukuran benar" },
  { key: "warna_benar", label: "Warna benar" },
  { key: "produk_dilipat", label: "Produk dilipat" },
  { key: "hangtag_terpasang", label: "Hangtag terpasang" },
  { key: "barcode_sesuai", label: "Barcode sesuai" },
  { key: "kemasan_bersih", label: "Kemasan bersih" },
  { key: "jumlah_sesuai", label: "Jumlah sesuai" },
  { key: "kemasan_tertutup", label: "Kemasan tertutup" },
  { key: "barcode_terpindai", label: "Barcode dapat dipindai" },
] as const;

export function checklistLengkap(checklist: Record<string, boolean> | null | undefined) {
  if (!checklist) return false;
  return CHECKLIST_PACKING.every((c) => checklist[c.key] === true);
}
