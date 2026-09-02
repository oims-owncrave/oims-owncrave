import type { WoListRow } from "@/services/wo-cutting";

export const WO_STATUS_BADGE: Record<
  WoListRow["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  siap_dikerjakan: {
    label: "Siap Dikerjakan",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  sedang_dikerjakan: {
    label: "Sedang Dikerjakan",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  ditunda: {
    label: "Ditunda",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  selesai_sebagian: {
    label: "Selesai Sebagian",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  selesai: {
    label: "Selesai",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  diverifikasi: {
    label: "Diverifikasi",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
};

/** Aksi transisi yang ditawarkan UI per status (server tetap validasi). */
export const WO_NEXT_ACTIONS: Record<WoListRow["status"], { status: string; label: string }[]> = {
  draft: [{ status: "siap_dikerjakan", label: "Tandai Siap" }],
  siap_dikerjakan: [{ status: "sedang_dikerjakan", label: "Mulai Kerjakan" }],
  sedang_dikerjakan: [
    { status: "selesai_sebagian", label: "Selesai Sebagian" },
    { status: "selesai", label: "Tandai Selesai" },
    { status: "ditunda", label: "Tunda" },
  ],
  ditunda: [{ status: "sedang_dikerjakan", label: "Lanjutkan" }],
  selesai_sebagian: [
    { status: "sedang_dikerjakan", label: "Lanjutkan" },
    { status: "selesai", label: "Tandai Selesai" },
  ],
  selesai: [{ status: "diverifikasi", label: "Verifikasi (Owner)" }],
  diverifikasi: [],
};
