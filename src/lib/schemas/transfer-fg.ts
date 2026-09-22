import { z } from "zod";

const gradeEnum = z.enum(["a", "b", "c", "reject"]);

export const transferFgDetailSchema = z.object({
  varianId: z.string().uuid(),
  grade: gradeEnum,
  batch: z.string().max(50).optional().nullable(),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
});

export const transferFgSchema = z
  .object({
    gudangAsalId: z.string().uuid({ message: "Gudang asal wajib dipilih" }),
    gudangTujuanId: z.string().uuid({ message: "Gudang tujuan wajib dipilih" }),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    pengirimId: z.string().uuid().optional().or(z.literal("")).nullable(),
    pengirim: z.string().max(100).optional().nullable(),
    penerimaId: z.string().uuid().optional().or(z.literal("")).nullable(),
    penerima: z.string().max(100).optional().nullable(),
    catatan: z.string().max(500).optional().nullable(),
    details: z.array(transferFgDetailSchema).min(1, "Minimal satu baris transfer"),
  })
  .refine((v) => v.gudangAsalId !== v.gudangTujuanId, {
    message: "Gudang asal dan tujuan tidak boleh sama",
    path: ["gudangTujuanId"],
  });

export const penyesuaianFgSchema = z.object({
  varianId: z.string().uuid({ message: "Produk wajib dipilih" }),
  grade: gradeEnum,
  gudangId: z.string().uuid({ message: "Gudang wajib dipilih" }),
  batch: z.string().max(50).optional().nullable(),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  stokFisik: z.coerce.number().int().min(0, "Stok fisik tidak boleh negatif"),
  alasan: z.string().min(1, "Alasan wajib diisi").max(500),
  buktiUrl: z.string().max(500).optional().nullable(),
});

export type TransferFgInput = z.output<typeof transferFgSchema>;
export type TransferFgFormValues = z.input<typeof transferFgSchema>;
export type PenyesuaianFgInput = z.output<typeof penyesuaianFgSchema>;
export type PenyesuaianFgFormValues = z.input<typeof penyesuaianFgSchema>;
