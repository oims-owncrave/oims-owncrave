import type { ComponentType } from "react";
import {
  DashboardIcon,
  MasterIcon,
  InventoryIcon,
  ProduksiIcon,
  VendorIcon,
  QcIcon,
  MonitoringIcon,
  LaporanIcon,
  SistemIcon,
} from "../icons";

export type NavSubItem = {
  title: string;
  url: string;
  /** Belum tersedia (tahap berikutnya) — tampil abu-abu, tidak bisa diklik. */
  disabled?: boolean;
};

export type NavItem = {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  items: NavSubItem[];
  disabled?: boolean;
};

export type NavSection = {
  label: string;
  ownerOnly?: boolean;
  items: NavItem[];
};

/**
 * Struktur nav per AREA KERJA (bukan per dokumen) — ikut app lama
 * (docs/referensi-oims-production.md §11). Alasan: peran = area (gudang tak perlu
 * lihat menu QC), dan tiap tahap baru menambah ~6 entri — pengelompokan per area
 * yang menahan pertumbuhan. Menu Tahap 3-4 sudah disiapkan sebagai disabled.
 */
export const NAV_DATA: NavSection[] = [
  {
    label: "MENU UTAMA",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: DashboardIcon,
        items: [],
      },
    ],
  },
  {
    label: "DATA INDUK",
    items: [
      {
        title: "Master Data",
        icon: MasterIcon,
        items: [
          { title: "Kategori", url: "/master/kategori" },
          { title: "Satuan", url: "/master/satuan" },
          { title: "Warna", url: "/master/warna" },
          { title: "Bahan", url: "/master/bahan" },
          { title: "Supplier", url: "/master/supplier" },
          { title: "Produk", url: "/produksi/produk" },
          { title: "BOM", url: "/produksi/bom" },
          { title: "Vendor", url: "/vendor/daftar" },
          { title: "Penjahit", url: "/vendor/penjahit" },
          { title: "Lokasi Produksi", url: "/vendor/lokasi" },
          { title: "Tarif Jasa Jahit", url: "/vendor/tarif" },
          { title: "Standar QC", url: "/qc/standar" },
          { title: "Jenis Cacat", url: "/master/jenis-cacat" },
          { title: "Kemasan", url: "/master/kemasan" },
          { title: "Gudang Barang Jadi", url: "/master/gudang-jadi" },
        ],
      },
    ],
  },
  {
    label: "OPERASIONAL",
    items: [
      {
        title: "Persediaan",
        icon: InventoryIcon,
        items: [
          { title: "Stok Bahan", url: "/inventory/stok" },
          { title: "Barang Masuk", url: "/inventory/barang-masuk" },
          { title: "Barang Keluar", url: "/inventory/barang-keluar" },
          { title: "Mutasi Stok", url: "/inventory/mutasi" },
          { title: "Penyesuaian Stok", url: "/inventory/penyesuaian" },
        ],
      },
      {
        title: "Produksi",
        icon: ProduksiIcon,
        items: [
          { title: "PO Produksi", url: "/produksi/po" },
          { title: "Permintaan Bahan", url: "/produksi/permintaan-bahan" },
          { title: "Cutting", url: "/produksi/cutting" },
          { title: "Bundle", url: "/produksi/bundling" },
        ],
      },
      {
        title: "Vendor & Gudang",
        icon: VendorIcon,
        items: [
          { title: "Penugasan Jahit", url: "/vendor/penugasan" },
          { title: "Pengiriman Vendor", url: "/vendor/pengiriman" },
          { title: "Surat Jalan", url: "/vendor/surat-jalan" },
          { title: "Penerimaan Hasil", url: "/vendor/penerimaan" },
          { title: "Retur & Perbaikan", url: "/vendor/retur" },
          { title: "Selisih & Kasus", url: "/vendor/selisih" },
          { title: "Biaya Jasa Jahit", url: "/vendor/biaya" },
        ],
      },
      {
        title: "Sablon & Bordir",
        icon: VendorIcon,
        items: [
          { title: "Pekerjaan Dekorasi", url: "/vendor/dekorasi" },
          { title: "Template Dekorasi", url: "/vendor/dekorasi/template" },
        ],
      },
      {
        title: "Quality Control",
        icon: QcIcon,
        items: [
          { title: "Penerimaan QC", url: "/qc/penerimaan" },
          { title: "Antrean QC", url: "/qc/antrean" },
          { title: "Work Order QC", url: "/qc/wo" },
          { title: "Pemeriksaan QC", url: "/qc/pemeriksaan" },
          { title: "Rework", url: "/qc/rework" },
          { title: "Re-QC", url: "/qc/re-qc" },
          { title: "Karantina Reject", url: "/qc/reject" },
          { title: "Finishing", url: "/qc/finishing" },
          { title: "Packing", url: "/qc/packing" },
          { title: "Stok Barang Jadi", url: "/qc/stok-jadi" },
        ],
      },
    ],
  },
  {
    label: "ANALITIK",
    items: [
      {
        title: "Monitoring",
        icon: MonitoringIcon,
        items: [
          { title: "WIP Produksi", url: "/produksi/wip" },
          { title: "WIP Jahit", url: "/vendor/wip" },
        ],
      },
      {
        title: "Laporan",
        icon: LaporanIcon,
        items: [
          { title: "Barang Masuk", url: "/laporan/barang-masuk" },
          { title: "Barang Keluar", url: "/laporan/barang-keluar" },
          { title: "Stok", url: "/laporan/stok" },
          { title: "Nilai Persediaan", url: "/laporan/nilai-persediaan" },
          { title: "Mutasi Stok", url: "/laporan/mutasi" },
        ],
      },
    ],
  },
  {
    label: "BANTUAN",
    items: [
      {
        title: "Dokumentasi",
        icon: SistemIcon,
        items: [{ title: "Panduan Pemakaian", url: "/dokumentasi" }],
      },
    ],
  },
  {
    label: "SISTEM",
    ownerOnly: true,
    items: [
      {
        title: "Sistem",
        icon: SistemIcon,
        items: [
          { title: "Pengguna", url: "/sistem/pengguna" },
          { title: "Log Aktivitas", url: "/sistem/log" },
          { title: "Pengaturan", url: "/sistem/pengaturan" },
        ],
      },
    ],
  },
];

export function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";

  // Exact match
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.url === pathname) return item.title;
      for (const sub of item.items) {
        if (sub.url === pathname) return sub.title;
      }
    }
  }

  // Sub-route match (e.g. /inventory/barang-masuk/baru)
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      for (const sub of item.items) {
        if (pathname.startsWith(sub.url + "/")) {
          const subPath = pathname.replace(sub.url + "/", "");
          if (subPath === "baru") return `Tambah ${sub.title}`;
          return `Detail ${sub.title}`;
        }
      }
    }
  }

  return "OIMS";
}
