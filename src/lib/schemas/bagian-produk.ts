import { z } from "zod";

export const bagianProdukSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter")
    .transform((v) => v.trim().toUpperCase()),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  urutan: z.number({ message: "Urutan harus angka" }).int("Urutan harus bilangan bulat").min(0, "Minimal 0"),
  isActive: z.boolean(),
});

export type BagianProdukInput = z.infer<typeof bagianProdukSchema>;
