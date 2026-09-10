import { z } from "zod";

export const gudangJenisValues = [
  "gudang_utama",
  "gudang_online",
  "toko_offline",
  "studio",
  "lokasi_sample",
  "transit",
] as const;

export const gudangBarangJadiSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter")
    .transform((v) => v.trim().toUpperCase()),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  jenis: z.enum(gudangJenisValues, { message: "Jenis wajib dipilih" }),
  alamat: z.string().max(255).optional().nullable(),
  picNama: z.string().max(100).optional().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type GudangBarangJadiInput = z.infer<typeof gudangBarangJadiSchema>;
