import { z } from "zod";

export const perbaikanInternalDetailSchema = z.object({
  hasilQcDetailId: z.string().uuid(),
  varianId: z.string().uuid(),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  jenisCacatId: z.string().uuid().optional().nullable(),
  instruksi: z.string().max(500).optional().nullable(),
});

export const perbaikanInternalSchema = z.object({
  hasilQcId: z.string().uuid({ message: "Hasil QC wajib dipilih" }),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  picId: z.string().uuid().optional().nullable(),
  targetSelesai: z.string().optional().nullable(),
  estimasiBiaya: z.coerce.number().min(0),
  catatan: z.string().max(500).optional().nullable(),
  details: z.array(perbaikanInternalDetailSchema).min(1, "Minimal satu baris perbaikan"),
});

export const returQcVendorDetailSchema = z.object({
  hasilQcDetailId: z.string().uuid(),
  varianId: z.string().uuid(),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  jenisCacatId: z.string().uuid().optional().nullable(),
  instruksi: z.string().max(500).optional().nullable(),
  fotoUrl: z.string().max(500).optional().nullable(),
  potongan: z.coerce.number().min(0),
});

export const returQcVendorSchema = z.object({
  hasilQcId: z.string().uuid({ message: "Hasil QC wajib dipilih" }),
  penugasanJahitId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  tanggalKirim: z.string().min(1, "Tanggal kirim wajib diisi"),
  targetKembali: z.string().optional().nullable(),
  penanggungBiaya: z.enum(["vendor", "owncrave"]),
  catatan: z.string().max(500).optional().nullable(),
  details: z.array(returQcVendorDetailSchema).min(1, "Minimal satu baris retur"),
});

export type PerbaikanInternalInput = z.output<typeof perbaikanInternalSchema>;
export type PerbaikanInternalFormValues = z.input<typeof perbaikanInternalSchema>;
export type ReturQcVendorInput = z.output<typeof returQcVendorSchema>;
export type ReturQcVendorFormValues = z.input<typeof returQcVendorSchema>;
