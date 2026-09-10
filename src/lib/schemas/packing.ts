import { z } from "zod";

export const packingDetailSchema = z.object({
  finishingDetailId: z.string().uuid(),
  varianId: z.string().uuid(),
  grade: z.enum(["a", "b", "c"]),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  kemasanId: z.string().uuid().optional().nullable(),
  batch: z.string().max(50).optional().nullable(),
  gudangTujuanId: z.string().uuid().optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
});

export const packingSchema = z.object({
  finishingId: z.string().uuid({ message: "Dokumen finishing wajib dipilih" }),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  picId: z.string().uuid().optional().nullable(),
  lokasiId: z.string().uuid().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
  details: z.array(packingDetailSchema).min(1, "Minimal satu baris packing"),
});

export const barangJadiSchema = z.object({
  packingId: z.string().uuid({ message: "Dokumen packing wajib dipilih" }),
  tanggalMasuk: z.string().min(1, "Tanggal wajib diisi"),
  gudangTujuanId: z.string().uuid({ message: "Gudang tujuan wajib dipilih" }),
  penyerah: z.string().max(100).optional().nullable(),
  penerimaId: z.string().uuid().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
});

export type PackingInput = z.output<typeof packingSchema>;
export type PackingFormValues = z.input<typeof packingSchema>;
export type BarangJadiInput = z.output<typeof barangJadiSchema>;
