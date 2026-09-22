import { z } from "zod";

export const PENGIRIMAN_STATUS_LABEL: Record<
  "dikirim" | "diterima" | "dibatalkan",
  { label: string; className: string }
> = {
  dikirim: {
    label: "Dalam Perjalanan",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  diterima: {
    label: "Diterima Vendor",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  dibatalkan: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export const KONDISI_BUNDEL = [
  "lengkap",
  "bungkus_rusak",
  "panel_kurang",
  "aksesoris_kurang",
  "salah_produk",
  "salah_warna",
  "salah_ukuran",
  "ditolak",
] as const;

export const KONDISI_BUNDEL_LABEL: Record<(typeof KONDISI_BUNDEL)[number], string> = {
  lengkap: "Lengkap",
  bungkus_rusak: "Bungkus Rusak",
  panel_kurang: "Panel Kurang",
  aksesoris_kurang: "Aksesoris Kurang",
  salah_produk: "Salah Produk",
  salah_warna: "Salah Warna",
  salah_ukuran: "Salah Ukuran",
  ditolak: "Ditolak",
};

export const pengirimanDetailSchema = z.object({
  penugasanDetailId: z.string().min(1),
  kelengkapanPanel: z.boolean(),
  aksesoris: z.string().optional(),
  catatan: z.string().optional(),
});

export const pengirimanSchema = z.object({
  penugasanId: z.string().min(1, "Pilih penugasan"),
  tanggalJam: z.string().min(1, "Tanggal/jam wajib diisi"),
  lokasiAsalId: z.string().nullable(),
  lokasiTujuanId: z.string().nullable(),
  pengirimId: z.string().uuid().optional().or(z.literal("")),
  kontakVendorId: z.string().uuid().optional().or(z.literal("")).nullable(),
  penerima: z.string().optional(),
  kendaraan: z.string().optional(),
  kurir: z.string().optional(),
  buktiFotoUrl: z.string().optional(),
  catatan: z.string().optional(),
  details: z.array(pengirimanDetailSchema).min(1, "Pilih minimal 1 bundel"),
});

export type PengirimanInput = z.infer<typeof pengirimanSchema>;

export const serahTerimaDetailSchema = z.object({
  pengirimanDetailId: z.string().min(1),
  jumlahDiterima: z.number({ message: "Wajib angka" }).int().min(0),
  kondisi: z.enum(KONDISI_BUNDEL),
  catatan: z.string().optional(),
});

export const serahTerimaSchema = z.object({
  tanggalJam: z.string().min(1, "Tanggal/jam wajib diisi"),
  kontakVendorId: z.string().uuid().optional().or(z.literal("")).nullable(),
  penerima: z.string().min(1, "Nama penerima wajib diisi"),
  lokasiId: z.string().nullable(),
  fotoUrl: z.string().optional(),
  catatan: z.string().optional(),
  details: z.array(serahTerimaDetailSchema).min(1),
});

export type SerahTerimaInput = z.infer<typeof serahTerimaSchema>;
