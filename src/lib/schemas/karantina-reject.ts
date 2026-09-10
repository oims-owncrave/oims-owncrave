import { z } from "zod";

export const rejectPenyebabValues = [
  "cacat_bahan_berat",
  "salah_cutting",
  "salah_ukuran_berat",
  "kerusakan_permanen",
  "noda_permanen",
  "tidak_sesuai_desain",
  "rusak_saat_finishing",
] as const;

export const rejectTindakanValues = [
  "perbaiki_jadi_grade_b",
  "jual_minor_defect",
  "sampel",
  "training",
  "bongkar_aksesori",
  "musnahkan",
  "donasi",
  "keputusan_lain",
] as const;

export const karantinaRejectDetailSchema = z.object({
  hasilQcDetailId: z.string().uuid().optional().nullable(),
  varianId: z.string().uuid(),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  penyebab: z.enum(rejectPenyebabValues),
  jenisCacatId: z.string().uuid().optional().nullable(),
  nilaiPerPcs: z.coerce.number().min(0),
  fotoUrl: z.string().max(500).optional().nullable(),
});

export const karantinaRejectSchema = z
  .object({
    hasilQcId: z.string().uuid().optional().nullable(),
    reQcId: z.string().uuid().optional().nullable(),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    lokasiSimpan: z.string().max(100).optional().nullable(),
    picId: z.string().uuid().optional().nullable(),
    catatan: z.string().max(500).optional().nullable(),
    details: z.array(karantinaRejectDetailSchema).min(1, "Minimal satu baris reject"),
  })
  .refine((v) => !!v.hasilQcId || !!v.reQcId, {
    message: "Sumber karantina wajib: hasil QC atau Re-QC",
    path: ["hasilQcId"],
  });

export const tindakanRejectSchema = z.object({
  karantinaRejectDetailId: z.string().uuid(),
  tindakan: z.enum(rejectTindakanValues),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  catatan: z.string().max(500).optional().nullable(),
  buktiUrl: z.string().max(500).optional().nullable(),
});

export type KarantinaRejectInput = z.output<typeof karantinaRejectSchema>;
export type KarantinaRejectFormValues = z.input<typeof karantinaRejectSchema>;
export type TindakanRejectInput = z.output<typeof tindakanRejectSchema>;
