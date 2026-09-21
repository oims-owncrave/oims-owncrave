import type { ComponentType } from "react";
import {
  DashboardIcon,
  MasterIcon,
  InventoryIcon,
  ProduksiIcon,
  VendorIcon,
  DekorasiIcon,
  QcIcon,
  MonitoringIcon,
  LaporanIcon,
  SistemIcon,
} from "../icons";

import type { users } from "@/db/schema";

export type UserRole = (typeof users.$inferSelect)["role"];

/** Role yang boleh melihat entri ini. Tidak diisi = semua role. */
type RoleGuard = { roles?: UserRole[] };

export type NavSubItem = RoleGuard & {
  title: string;
  url: string;
  /** Belum tersedia (tahap berikutnya) — tampil abu-abu, tidak bisa diklik. */
  disabled?: boolean;
  /** Label pemisah sebelum item ini (mis. "Data Produk") — bukan link, cuma penanda visual. */
  heading?: string;
};

export type NavItem = RoleGuard & {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  items: NavSubItem[];
  disabled?: boolean;
};

export type NavSection = RoleGuard & {
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
        // Sebagian besar master (Kategori, Satuan, Warna, Supplier, Produk, Kemasan,
        // Vendor, Penjahit, Lokasi, Jenis Cacat) BELUM punya requireRole di service-nya
        // — terbuka untuk semua yang login. Menu sengaja tidak menyembunyikannya:
        // menyembunyikan tanpa guard server hanya ilusi (URL tetap jalan).
        // Lihat CLAUDE.md § Utang Teknis.
        icon: MasterIcon,
        items: [
          { title: "Data Bahan", url: "/master/data-bahan" },
          { title: "Data Produk", url: "/master/data-produk" },
          { title: "Data Mitra", url: "/master/data-mitra" },
          { title: "Data QC", url: "/master/data-qc" },
        ],
      },
    ],
  },
  {
    label: "OPERASIONAL",
    items: [
      {
        title: "Persediaan",
        // Server mengizinkan semua role membaca stok/mutasi/barang-masuk-keluar
        // (requireRole inline di stok.ts, mutasi.ts, barang-masuk.ts, barang-keluar.ts).
        // Menu mengikuti server — tidak lebih ketat, tidak lebih longgar.
        icon: InventoryIcon,
        items: [
          { title: "Stok Bahan", url: "/inventory/stok" },
          { title: "Barang Masuk", url: "/inventory/barang-masuk" },
          { title: "Barang Keluar", url: "/inventory/barang-keluar" },
          { title: "Mutasi Stok", url: "/inventory/mutasi" },
          { title: "Penyesuaian Stok", url: "/inventory/penyesuaian", roles: ["owner", "admin_gudang"] }, // requireRole penyesuaian.ts
        ],
      },
      {
        title: "Produksi",
        roles: ["owner", "admin_produksi"], // READ_ROLES po-produksi.ts, permintaan-bahan.ts
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
        // Union dari anak-anaknya: keuangan ikut karena Biaya Jasa Jahit.
        // Kalau induk lebih sempit dari anak, anak tak pernah sempat diperiksa.
        roles: ["owner", "admin_gudang", "admin_produksi", "keuangan"],
        icon: VendorIcon,
        items: [
          { title: "Penugasan Jahit", url: "/vendor/penugasan", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Pengiriman Vendor", url: "/vendor/pengiriman", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Surat Jalan", url: "/vendor/surat-jalan", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Penerimaan Hasil", url: "/vendor/penerimaan", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Retur & Perbaikan", url: "/vendor/retur", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Selisih & Kasus", url: "/vendor/selisih", roles: ["owner", "admin_gudang", "admin_produksi"] },
          { title: "Biaya Jasa Jahit", url: "/vendor/biaya", roles: ["owner", "admin_produksi", "keuangan"] }, // READ_ROLES biaya-jasa-jahit.ts
        ],
      },
      {
        title: "Sablon & Bordir",
        roles: ["owner", "admin_produksi"], // READ_ROLES dekorasi.ts
        icon: DekorasiIcon,
        items: [
          { title: "Pekerjaan Dekorasi", url: "/vendor/dekorasi" },
          { title: "Template Dekorasi", url: "/vendor/dekorasi/template" },
        ],
      },
      {
        title: "Quality Control",
        // Union: admin_gudang ikut karena Packing & Stok Barang Jadi.
        roles: ["owner", "admin_produksi", "admin_gudang"],
        icon: QcIcon,
        items: [
          { title: "Penerimaan QC", url: "/qc/penerimaan", roles: ["owner", "admin_gudang", "admin_produksi"] }, // READ_ROLES penerimaan-qc.ts
          { title: "Work Order QC", url: "/qc/wo", roles: ["owner", "admin_produksi"] },
          { title: "Pemeriksaan QC", url: "/qc/pemeriksaan", roles: ["owner", "admin_produksi"] },
          { title: "Rework", url: "/qc/rework", roles: ["owner", "admin_produksi"] },
          { title: "Karantina Reject", url: "/qc/reject", roles: ["owner", "admin_produksi"] },
          { title: "Finishing", url: "/qc/finishing", roles: ["owner", "admin_produksi"] },
          { title: "Packing", url: "/qc/packing", roles: ["owner", "admin_produksi", "admin_gudang"] }, // READ_ROLES packing.ts
          { title: "Stok Barang Jadi", url: "/qc/stok-jadi", roles: ["owner", "admin_produksi", "admin_gudang"] }, // READ_ROLES barang-jadi.ts
        ],
      },
    ],
  },
  {
    label: "ANALITIK",
    items: [
      {
        title: "Monitoring",
        roles: ["owner", "admin_produksi"], // WIP produksi & WIP jahit = layar produksi
        icon: MonitoringIcon,
        items: [
          { title: "WIP Produksi", url: "/produksi/wip" },
          { title: "WIP Jahit", url: "/vendor/wip" },
        ],
      },
      {
        title: "Laporan",
        // laporan.ts mengizinkan semua role (requireRole inline) — termasuk keuangan & viewer.
        url: "/laporan",
        icon: LaporanIcon,
        items: [],
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

const boleh = (roles: UserRole[] | undefined, role: UserRole) =>
  !roles || roles.includes(role);

/**
 * Saring NAV_DATA untuk satu role, sampai level subitem.
 * Section/item yang jadi kosong setelah disaring ikut dibuang — kalau tidak,
 * muncul judul section tanpa isi.
 */
export function navUntukRole(role: UserRole): NavSection[] {
  return NAV_DATA
    .filter((s) => (!s.ownerOnly || role === "owner") && boleh(s.roles, role))
    .map((s) => ({
      ...s,
      items: s.items
        .filter((i) => boleh(i.roles, role))
        .map((i) => ({ ...i, items: i.items.filter((si) => boleh(si.roles, role)) }))
        // item yang PUNYA subitem tapi semuanya tersaring habis = buang.
        // Item tanpa subitem (url langsung) tetap dipertahankan.
        .filter((i) => i.items.length > 0 || !!i.url),
    }))
    .filter((s) => s.items.length > 0);
}
