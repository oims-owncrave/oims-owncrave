import { z } from "zod";

export const kemasanJenisValues = [
  "polybag",
  "ziplock",
  "box",
  "dust_bag",
  "kertas",
  "stiker",
  "thank_you_card",
  "silica_gel",
] as const;

export const kemasanSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter")
    .transform((v) => v.trim().toUpperCase()),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  jenis: z.enum(kemasanJenisValues, { message: "Jenis wajib dipilih" }),
  ukuran: z.string().max(50).optional().nullable(),
  bahanKemasan: z.string().max(100).optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  // numeric di DB — form kirim string, coerce ke number lalu String() saat insert
  biaya: z.coerce.number().min(0, "Biaya tidak boleh negatif"),
  stokMinimum: z.coerce.number().min(0, "Stok minimum tidak boleh negatif"),
  isActive: z.boolean(),
});

/** Nilai SETELAH parse — biaya/stokMinimum sudah number. Dipakai Server Action. */
export type KemasanInput = z.output<typeof kemasanSchema>;

/** Nilai SEBELUM parse — form kirim string dari <input type="number">. Dipakai rhf. */
export type KemasanFormValues = z.input<typeof kemasanSchema>;
