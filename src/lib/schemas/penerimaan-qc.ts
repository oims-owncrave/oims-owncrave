import { z } from "zod";

export const qcPrioritasValues = [
  "normal",
  "tinggi",
  "mendesak",
  "launching",
  "pesanan_khusus",
  "produksi_terlambat",
] as const;

export const penerimaanQcDetailSchema = z.object({
  penerimaanHasilDetailId: z.string().uuid(),
  varianId: z.string().uuid(),
  jumlahPcs: z.coerce.number().int().min(1, "Jumlah minimal 1 pcs"),
  catatan: z.string().max(255).optional().nullable(),
});

export const penerimaanQcSchema = z.object({
  penerimaanHasilJahitId: z.string().uuid({ message: "Penerimaan hasil jahit wajib dipilih" }),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  lokasiId: z.string().uuid().optional().nullable(),
  penerima: z.string().min(1, "Penerima wajib diisi").max(100),
  prioritas: z.enum(qcPrioritasValues),
  targetSelesai: z.string().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
  details: z
    .array(penerimaanQcDetailSchema)
    .min(1, "Minimal satu baris bundel dikirim ke QC"),
});

export type PenerimaanQcInput = z.output<typeof penerimaanQcSchema>;
export type PenerimaanQcFormValues = z.input<typeof penerimaanQcSchema>;
