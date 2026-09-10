import { z } from "zod";

export const cacatKategoriValues = [
  "bahan",
  "cutting",
  "jahit",
  "aksesori",
  "finishing",
  "packing",
  "ukuran",
  "warna",
  "label",
  "kebersihan",
] as const;

export const qcTingkatValues = ["critical", "major", "minor", "cosmetic"] as const;

export const cacatSumberValues = [
  "supplier",
  "gudang",
  "cutting",
  "bundling",
  "penjahit_internal",
  "vendor",
  "qc",
  "finishing",
  "tidak_diketahui",
] as const;

export const jenisCacatSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter")
    .transform((v) => v.trim().toUpperCase()),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  kategori: z.enum(cacatKategoriValues, { message: "Kategori wajib dipilih" }),
  keparahan: z.enum(qcTingkatValues, { message: "Keparahan wajib dipilih" }),
  sumber: z.enum(cacatSumberValues),
  dapatDiperbaiki: z.boolean(),
  tindakanDefault: z.string().max(500).optional().nullable(),
  isActive: z.boolean(),
});

export type JenisCacatInput = z.infer<typeof jenisCacatSchema>;
