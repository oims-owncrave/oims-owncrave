import type { ComponentType } from "react";
import {
  DashboardIcon,
  MasterIcon,
  InventoryIcon,
  LaporanIcon,
  SistemIcon,
} from "../icons";

export type NavSubItem = {
  title: string;
  url: string;
};

export type NavItem = {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  items: NavSubItem[];
};

export type NavSection = {
  label: string;
  ownerOnly?: boolean;
  items: NavItem[];
};

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
    label: "MANAJEMEN",
    items: [
      {
        title: "Master Data",
        icon: MasterIcon,
        items: [
          { title: "Kategori", url: "/master/kategori" },
          { title: "Satuan", url: "/master/satuan" },
          { title: "Supplier", url: "/master/supplier" },
          { title: "Bahan", url: "/master/bahan" },
        ],
      },
      {
        title: "Inventory",
        icon: InventoryIcon,
        items: [
          { title: "Barang Masuk", url: "/inventory/barang-masuk" },
          { title: "Barang Keluar", url: "/inventory/barang-keluar" },
          { title: "Stok", url: "/inventory/stok" },
          { title: "Mutasi", url: "/inventory/mutasi" },
          { title: "Penyesuaian", url: "/inventory/penyesuaian" },
        ],
      },
    ],
  },
  {
    label: "ANALITIK",
    items: [
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
