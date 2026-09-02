import { z } from "zod";

export const produkSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter"),
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  kategori: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  jenis: z.string().max(100).optional(),
  deskripsi: z.string().max(1000).optional(),
  isActive: z.boolean(),
});

export type ProdukInput = z.infer<typeof produkSchema>;
