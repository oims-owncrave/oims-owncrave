import { z } from "zod";

export const DEKORASI_JENIS = ["sablon", "bordir"] as const;
export const DEKORASI_JENIS_LABEL: Record<(typeof DEKORASI_JENIS)[number], string> = {
  sablon: "Sablon",
  bordir: "Bordir",
};

export const DEKORASI_POSISI = [
  "dada_kiri",
  "dada_kanan",
  "badan_depan",
  "badan_belakang",
  "lengan_kiri",
  "lengan_kanan",
  "punggung",
  "kerah",
  "lainnya",
] as const;

export const DEKORASI_POSISI_LABEL: Record<(typeof DEKORASI_POSISI)[number], string> = {
  dada_kiri: "Dada Kiri",
  dada_kanan: "Dada Kanan",
  badan_depan: "Badan Depan",
  badan_belakang: "Badan Belakang",
  lengan_kiri: "Lengan Kiri",
  lengan_kanan: "Lengan Kanan",
  punggung: "Punggung",
  kerah: "Kerah",
  lainnya: "Lainnya",
};

export const DEKORASI_STATUS_LABEL: Record<
  "draft" | "dikirim" | "selesai" | "dibatalkan",
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  dikirim: { label: "Di Vendor Dekorasi", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  selesai: { label: "Selesai", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  dibatalkan: { label: "Dibatalkan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export const templateSchema = z.object({
  produkId: z.string().min(1, "Pilih produk"),
  jenis: z.enum(DEKORASI_JENIS),
  posisi: z.enum(DEKORASI_POSISI),
  deskripsi: z.string().max(300).optional(),
  tarifDefault: z.number({ message: "Wajib angka" }).min(0),
  isActive: z.boolean(),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export const pekerjaanDekorasiSchema = z.object({
  woId: z.string().min(1, "Pilih WO cutting"),
  templateId: z.string().min(1, "Pilih template dekorasi"),
  vendorId: z.string().min(1, "Pilih vendor dekorasi"),
  lokasiTujuanId: z.string().nullable(),
  jumlah: z.number({ message: "Jumlah wajib diisi" }).int().min(1, "Minimal 1 pcs"),
  tarif: z.number({ message: "Tarif wajib diisi" }).min(0),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  targetSelesai: z.string().optional(),
  pengirim: z.string().optional(),
  kurir: z.string().optional(),
  catatan: z.string().optional(),
});

export type PekerjaanDekorasiInput = z.infer<typeof pekerjaanDekorasiSchema>;

export const penerimaanDekorasiSchema = z
  .object({
    tanggalJam: z.string().min(1, "Tanggal/jam wajib diisi"),
    penerimaId: z.string().uuid().optional().or(z.literal("")).nullable(),
    penerima: z.string().min(1, "Nama penerima wajib diisi"),
    jumlahSelesai: z.number({ message: "Wajib angka" }).int().min(0),
    jumlahRusak: z.number({ message: "Wajib angka" }).int().min(0),
    catatan: z.string().optional(),
  })
  .refine((v) => v.jumlahSelesai + v.jumlahRusak > 0, {
    message: "Minimal 1 pcs diterima",
    path: ["jumlahSelesai"],
  });

export type PenerimaanDekorasiInput = z.infer<typeof penerimaanDekorasiSchema>;
