import { z } from "zod";

export const reQcHasilValues = ["lolos", "perbaikan_ulang", "grade_turun", "reject"] as const;
export const qcGradeValues = ["a", "b", "c", "reject"] as const;

export const reQcDetailSchema = z
  .object({
    hasilQcDetailId: z.string().uuid(),
    varianId: z.string().uuid(),
    jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
    cacatSebelumnyaId: z.string().uuid().optional().nullable(),
    hasilPerbaikan: z.string().max(500).optional().nullable(),
    hasilReQc: z.enum(reQcHasilValues),
    gradeAkhir: z.enum(qcGradeValues).optional().nullable(),
    catatan: z.string().max(255).optional().nullable(),
  })
  // lolos / grade_turun harus punya grade akhir, kalau tidak barang tak bisa masuk stok
  .refine((d) => !["lolos", "grade_turun"].includes(d.hasilReQc) || !!d.gradeAkhir, {
    message: "Hasil lolos atau grade turun wajib mengisi grade akhir",
    path: ["gradeAkhir"],
  });

export const reQcSchema = z
  .object({
    hasilQcAwalId: z.string().uuid(),
    perbaikanInternalId: z.string().uuid().optional().nullable(),
    returQcVendorId: z.string().uuid().optional().nullable(),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    petugasId: z.string().uuid().optional().nullable(),
    catatan: z.string().max(500).optional().nullable(),
    details: z.array(reQcDetailSchema).min(1, "Minimal satu baris hasil Re-QC"),
  })
  .refine((v) => !!v.perbaikanInternalId || !!v.returQcVendorId, {
    message: "Sumber Re-QC wajib: perbaikan internal atau retur vendor",
    path: ["perbaikanInternalId"],
  });

export type ReQcInput = z.output<typeof reQcSchema>;
export type ReQcFormValues = z.input<typeof reQcSchema>;
