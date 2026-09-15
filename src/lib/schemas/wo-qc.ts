import { z } from "zod";

export const qcMetodeValues = ["seratus_persen", "sampling"] as const;
export const woQcStatusValues = ["draft", "berjalan", "selesai", "dibatalkan"] as const;

export const woQcDetailSchema = z.object({
  penerimaanQcDetailId: z.string().uuid(),
  varianId: z.string().uuid(),
  jumlahPcs: z.coerce.number().int().min(1, "Jumlah minimal 1 pcs"),
});

/**
 * Schema FORM — tanpa `details`. Baris dipilih lewat state lokal komponen;
 * kalau `details` ikut divalidasi rhf, submit ditolak diam-diam (array kosong).
 */
export const woQcFormSchema = z
  .object({
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    targetSelesai: z.string().optional().nullable(),
    picId: z.string().uuid().optional().nullable(),
    supervisorId: z.string().uuid().optional().nullable(),
    metode: z.enum(qcMetodeValues),
    standarQcId: z.string().uuid().optional().nullable(),
    populasi: z.coerce.number().int().min(0).optional().nullable(),
    jumlahSampel: z.coerce.number().int().min(0).optional().nullable(),
    batasDiterima: z.coerce.number().int().min(0).optional().nullable(),
    batasDitolak: z.coerce.number().int().min(0).optional().nullable(),
    alasanSampling: z.string().max(500).optional().nullable(),
    catatan: z.string().max(500).optional().nullable(),
  })
  // sampling tanpa angka batas = tak bisa diputuskan terima/tolak
  .refine(
    (v) =>
      v.metode !== "sampling" ||
      (!!v.jumlahSampel && v.jumlahSampel > 0 && v.batasDiterima != null && v.batasDitolak != null),
    {
      message: "Metode sampling wajib isi jumlah sampel, batas diterima, dan batas ditolak",
      path: ["jumlahSampel"],
    },
  );

/** Schema PAYLOAD — dipakai Server Action; di sini `details` wajib ada. */
export const woQcSchema = z.intersection(
  woQcFormSchema,
  z.object({
    details: z.array(woQcDetailSchema).min(1, "Minimal satu baris pemeriksaan"),
  }),
);

export type WoQcInput = z.output<typeof woQcSchema>;
export type WoQcFormValues = z.input<typeof woQcFormSchema>;
