import { z } from "zod";

export const bahanSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  kategoriId: z.string().uuid("Kategori wajib dipilih"),
  satuanId: z.string().uuid("Satuan wajib dipilih"),
  stokMinimum: z.number().min(0, "Stok minimum tidak boleh negatif"),
  isActive: z.boolean(),
});

export type BahanInput = z.infer<typeof bahanSchema>;
