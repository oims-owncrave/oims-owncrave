/**
 * Label enum Tahap 4 — konstanta murni (BUKAN "use server").
 * File "use server" hanya boleh export async function; taruh label di sini
 * supaya service tinggal import dan `next build` tidak gagal.
 */

export const QC_TINGKAT_LABEL: Record<string, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  cosmetic: "Cosmetic",
};

/** Warna badge keparahan — makin berat makin merah. */
export const QC_TINGKAT_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  major: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  minor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  cosmetic: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const CACAT_KATEGORI_LABEL: Record<string, string> = {
  bahan: "Bahan",
  cutting: "Cutting",
  jahit: "Jahit",
  aksesori: "Aksesori",
  finishing: "Finishing",
  packing: "Packing",
  ukuran: "Ukuran",
  warna: "Warna",
  label: "Label",
  kebersihan: "Kebersihan",
};

export const CACAT_SUMBER_LABEL: Record<string, string> = {
  supplier: "Supplier",
  gudang: "Gudang",
  cutting: "Cutting",
  bundling: "Bundling",
  penjahit_internal: "Penjahit Internal",
  vendor: "Vendor",
  qc: "QC",
  finishing: "Finishing",
  tidak_diketahui: "Tidak Diketahui",
};

export const KEMASAN_JENIS_LABEL: Record<string, string> = {
  polybag: "Polybag",
  ziplock: "Ziplock",
  box: "Box",
  dust_bag: "Dust Bag",
  kertas: "Kertas",
  stiker: "Stiker",
  thank_you_card: "Thank-you Card",
  silica_gel: "Silica Gel",
};

export const GUDANG_JENIS_LABEL: Record<string, string> = {
  gudang_utama: "Gudang Utama",
  gudang_online: "Gudang Online",
  toko_offline: "Toko Offline",
  studio: "Studio",
  lokasi_sample: "Lokasi Sample",
  transit: "Transit",
};

/** Helper dropdown: Record label → SelectOption[]. */
export function toOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
