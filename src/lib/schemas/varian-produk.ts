import { z } from "zod";

// Form generate matrix: banyak warna x banyak ukuran sekaligus
export const varianGenerateSchema = z.object({
  warnaIds: z.array(z.string().uuid()).min(1, "Pilih minimal 1 warna"),
  ukuran: z.array(z.string().min(1)).min(1, "Pilih minimal 1 ukuran"),
  jenisKelamin: z.string().optional(),
});

export type VarianGenerateInput = z.infer<typeof varianGenerateSchema>;

// Edit satu varian
export const varianUpdateSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi").max(40, "SKU maksimal 40 karakter"),
  jenisKelamin: z.string().optional(),
  isActive: z.boolean(),
});

export type VarianUpdateInput = z.infer<typeof varianUpdateSchema>;
