import { z } from "zod";

export const hasilQcDetailSchema = z
  .object({
    workOrderQcDetailId: z.string().uuid(),
    varianId: z.string().uuid(),
    jumlahDiperiksa: z.coerce.number().int().min(0),
    gradeA: z.coerce.number().int().min(0),
    gradeB: z.coerce.number().int().min(0),
    gradeC: z.coerce.number().int().min(0),
    perbaikan: z.coerce.number().int().min(0),
    reject: z.coerce.number().int().min(0),
    catatan: z.string().max(255).optional().nullable(),
  })
  // PRD §13 — sumber angka yield/COPQ. Kalau bocor, seluruh laporan T4 salah.
  // Di-guard tiga lapis: Zod, Server Action, dan DB CHECK hasil_qc_detail_seimbang.
  .refine(
    (d) => d.jumlahDiperiksa === d.gradeA + d.gradeB + d.gradeC + d.perbaikan + d.reject,
    {
      message: "Rincian grade harus sama dengan jumlah diperiksa",
      path: ["jumlahDiperiksa"],
    },
  );

export const hasilQcSchema = z.object({
  workOrderQcId: z.string().uuid({ message: "Work Order QC wajib dipilih" }),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  petugasId: z.string().uuid().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
  details: z
    .array(hasilQcDetailSchema)
    .min(1, "Minimal satu baris hasil pemeriksaan")
    .refine((rows) => rows.some((r) => r.jumlahDiperiksa > 0), {
      message: "Isi minimal satu baris dengan jumlah diperiksa lebih dari 0",
    }),
});

export type HasilQcInput = z.output<typeof hasilQcSchema>;
export type HasilQcFormValues = z.input<typeof hasilQcSchema>;
export type HasilQcDetailInput = z.output<typeof hasilQcDetailSchema>;
