import { z } from "zod";

export const barangKeluarDetailSchema = z.object({
  bahanId: z.string().uuid("Bahan wajib dipilih"),
  kuantitas: z.coerce.number().positive("Kuantitas harus > 0"),
});

export const barangKeluarSchema = z.object({
  tujuan: z.string().max(200).optional().or(z.literal("")),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  catatan: z.string().max(500).optional().or(z.literal("")),
  detail: z.array(barangKeluarDetailSchema).min(1, "Minimal 1 bahan"),
});

// FormInput = dari form (kuantitas masih string/number tergantung valueAsNumber)
// Input = sesudah coerce — untuk Server Action
export type BarangKeluarFormInput = z.input<typeof barangKeluarSchema>;
export type BarangKeluarInput = z.output<typeof barangKeluarSchema>;
