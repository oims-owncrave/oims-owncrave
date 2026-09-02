import type { PoListRow } from "@/services/po-produksi";

export const PO_STATUS_BADGE: Record<
  PoListRow["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  menunggu_persetujuan: {
    label: "Menunggu Persetujuan",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  disetujui: {
    label: "Disetujui",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  menunggu_bahan: {
    label: "Menunggu Bahan",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  bahan_disiapkan: {
    label: "Bahan Disiapkan",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  sedang_cutting: {
    label: "Sedang Cutting",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  cutting_selesai: {
    label: "Cutting Selesai",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  bundling_selesai: {
    label: "Bundling Selesai",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  siap_jahit: {
    label: "Siap Jahit",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  selesai: {
    label: "Selesai",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  dibatalkan: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
};

export const PO_PRIORITAS_LABEL: Record<string, string> = {
  rendah: "Rendah",
  normal: "Normal",
  tinggi: "Tinggi",
  urgent: "Urgent",
};

export const PO_JENIS_LABEL: Record<PoListRow["jenis"], string> = {
  reguler: "Reguler",
  restock: "Restock",
  produk_baru: "Produk Baru",
  sampel: "Sampel",
  pre_order: "Pre-Order",
  pesanan_khusus: "Pesanan Khusus",
};
