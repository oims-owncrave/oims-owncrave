import { z } from "zod";

export const BIAYA_STATUS = [
  "estimasi",
  "menunggu_qc",
  "menunggu_verifikasi",
  "diverifikasi_produksi",
  "diverifikasi_keuangan",
  "siap_dibayar",
  "dibayar",
  "ditahan",
  "disengketakan",
] as const;

export type BiayaStatus = (typeof BIAYA_STATUS)[number];

export const BIAYA_STATUS_LABEL: Record<BiayaStatus, { label: string; className: string }> = {
  estimasi: { label: "Estimasi", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  menunggu_qc: { label: "Menunggu QC", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  diverifikasi_produksi: { label: "Diverifikasi Produksi", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  diverifikasi_keuangan: { label: "Diverifikasi Keuangan", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  siap_dibayar: { label: "Siap Dibayar", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  dibayar: { label: "Dibayar", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  ditahan: { label: "Ditahan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  disengketakan: { label: "Disengketakan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

/**
 * Transisi status biaya. Tahap 3 berhenti di siap_dibayar —
 * "dibayar" butuh kas/hutang (Tahap 5, di-skip) jadi belum dibuka dari UI.
 */
export const BIAYA_TRANSITIONS: Record<BiayaStatus, BiayaStatus[]> = {
  estimasi: ["menunggu_qc", "menunggu_verifikasi", "ditahan"],
  menunggu_qc: ["menunggu_verifikasi", "ditahan", "disengketakan"],
  menunggu_verifikasi: ["diverifikasi_produksi", "ditahan", "disengketakan"],
  diverifikasi_produksi: ["diverifikasi_keuangan", "ditahan", "disengketakan"],
  diverifikasi_keuangan: ["siap_dibayar", "ditahan", "disengketakan"],
  siap_dibayar: ["ditahan", "disengketakan"],
  dibayar: [],
  ditahan: ["menunggu_verifikasi", "disengketakan"],
  disengketakan: ["menunggu_verifikasi", "ditahan"],
};

export const biayaSchema = z.object({
  bonus: z.number({ message: "Wajib angka" }).min(0),
  biayaTambahan: z.number({ message: "Wajib angka" }).min(0),
  potongan: z.number({ message: "Wajib angka" }).min(0),
  uangMuka: z.number({ message: "Wajib angka" }).min(0),
  catatan: z.string().max(500).optional(),
});

export type BiayaInput = z.infer<typeof biayaSchema>;
