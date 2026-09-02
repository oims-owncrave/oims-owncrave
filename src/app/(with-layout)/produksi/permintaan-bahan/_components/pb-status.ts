import type { PbListRow } from "@/services/permintaan-bahan";

export const PB_STATUS_BADGE: Record<
  PbListRow["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  diajukan: {
    label: "Diajukan",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  disetujui: {
    label: "Disetujui",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  ditolak: {
    label: "Ditolak",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
};
