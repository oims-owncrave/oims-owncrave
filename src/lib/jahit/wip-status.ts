/**
 * Status WIP jahit — konstanta murni (BUKAN "use server").
 * 18 status PRD §13 dipadatkan jadi 7 label DERIVED dari record turunan
 * (app lama pakai 3 dan cukup; kolom status manual rawan basi).
 */
export type WipJahitStatus =
  | "menunggu_penugasan"
  | "menunggu_pengiriman"
  | "dalam_perjalanan"
  | "di_vendor"
  | "diterima_sebagian"
  | "perlu_perbaikan"
  | "selesai_jahit";

export const WIP_JAHIT_LABEL: Record<WipJahitStatus, { label: string; className: string }> = {
  menunggu_penugasan: {
    label: "Menunggu Penugasan",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  menunggu_pengiriman: {
    label: "Menunggu Pengiriman",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  dalam_perjalanan: {
    label: "Dalam Perjalanan",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  di_vendor: {
    label: "Di Vendor (Dijahit)",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  diterima_sebagian: {
    label: "Diterima Sebagian",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  perlu_perbaikan: {
    label: "Perlu Perbaikan",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  selesai_jahit: {
    label: "Selesai Jahit — Siap QC",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
};

/** Umur WIP (hari) sejak dikirim; null kalau belum dikirim. */
export function umurWip(tanggalKirim: Date | string | null): number | null {
  if (!tanggalKirim) return null;
  const ms = Date.now() - new Date(tanggalKirim).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Keterlambatan (hari) vs target selesai; 0 = tepat waktu, >0 = terlambat. */
export function keterlambatan(targetSelesai: Date | string, selesai: boolean): number {
  if (selesai) return 0;
  const ms = Date.now() - new Date(targetSelesai).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
