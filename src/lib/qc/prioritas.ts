/**
 * Prioritas antrean QC — konstanta murni (BUKAN "use server").
 * Pola: src/lib/jahit/wip-status.ts
 */
export type QcPrioritas =
  | "normal"
  | "tinggi"
  | "mendesak"
  | "launching"
  | "pesanan_khusus"
  | "produksi_terlambat";

export const QC_PRIORITAS_LABEL: Record<QcPrioritas, { label: string; className: string }> = {
  normal: {
    label: "Normal",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  tinggi: {
    label: "Tinggi",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  mendesak: {
    label: "Mendesak",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  launching: {
    label: "Launching",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  pesanan_khusus: {
    label: "Pesanan Khusus",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  produksi_terlambat: {
    label: "Produksi Terlambat",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

export const QC_PRIORITAS_OPTIONS = Object.entries(QC_PRIORITAS_LABEL).map(
  ([value, { label }]) => ({ value, label }),
);

/** Umur antrean (hari) sejak barang diterima dari vendor. */
export function umurAntrean(tanggalTerima: Date | string | null): number {
  if (!tanggalTerima) return 0;
  const ms = Date.now() - new Date(tanggalTerima).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
