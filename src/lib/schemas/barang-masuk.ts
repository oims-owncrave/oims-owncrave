import { z } from "zod";

export const barangMasukDetailSchema = z.object({
  bahanId: z.string().uuid("Bahan wajib dipilih"),
  kuantitas: z.coerce.number().positive("Kuantitas harus > 0"),
  hargaSatuan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
});

export const barangMasukSchema = z.object({
  supplierId: z.string().uuid().optional().or(z.literal("")),
  nomorInvoice: z.string().max(100).optional().or(z.literal("")),
  tanggal: z.string().min(1, "Tanggal wajib diisi"), // ISO date dari input
  catatan: z.string().max(500).optional().or(z.literal("")),
  detail: z.array(barangMasukDetailSchema).min(1, "Minimal 1 bahan"),
});

// Input = sebelum coerce (dari form: string), Output = sesudah coerce (number) — untuk Server Action
export type BarangMasukFormInput = z.input<typeof barangMasukSchema>;
export type BarangMasukInput = z.output<typeof barangMasukSchema>;
export type BarangMasukDetailInput = z.output<typeof barangMasukDetailSchema>;
