import { z } from "zod";

export const kategoriSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter"),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  isActive: z.boolean(),
});

export type KategoriInput = z.infer<typeof kategoriSchema>;
