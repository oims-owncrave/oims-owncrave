import { z } from "zod";

export const finishingDetailSchema = z
  .object({
    hasilQcDetailId: z.string().uuid().optional().nullable(),
    reQcDetailId: z.string().uuid().optional().nullable(),
    varianId: z.string().uuid(),
    grade: z.enum(["a", "b", "c"]),
    jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  })
  .refine((d) => !!d.hasilQcDetailId || !!d.reQcDetailId, {
    message: "Sumber baris finishing wajib: hasil QC atau Re-QC",
    path: ["hasilQcDetailId"],
  });

export const finishingSchema = z.object({
  tanggalMasuk: z.string().min(1, "Tanggal wajib diisi"),
  targetSelesai: z.string().optional().nullable(),
  picId: z.string().uuid().optional().nullable(),
  lokasiId: z.string().uuid().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
  details: z.array(finishingDetailSchema).min(1, "Minimal satu baris finishing"),
});

export const finishingPemakaianSchema = z.object({
  finishingId: z.string().uuid(),
  bahanId: z.string().uuid({ message: "Bahan wajib dipilih" }),
  jumlah: z.coerce.number().min(0.001, "Jumlah harus lebih dari 0"),
  catatan: z.string().max(255).optional().nullable(),
});

export type FinishingInput = z.output<typeof finishingSchema>;
export type FinishingFormValues = z.input<typeof finishingSchema>;
export type FinishingPemakaianInput = z.output<typeof finishingPemakaianSchema>;
