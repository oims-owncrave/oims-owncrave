import { z } from "zod";

export const woDetailSchema = z.object({
  varianId: z.string().min(1, "Pilih varian"),
  targetCutting: z
    .number({ message: "Target wajib diisi" })
    .int("Target harus bilangan bulat")
    .min(1, "Minimal 1 pcs"),
});

export const woSchema = z.object({
  poId: z.string().min(1, "Pilih PO"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  pic: z.string().optional(),
  mejaCutting: z.string().optional(),
  prioritas: z.enum(["rendah", "normal", "tinggi", "urgent"]),
  jumlahLayer: z.number().int().min(0).optional().or(z.nan()),
  panjangMarker: z.number().min(0).optional().or(z.nan()),
  lebarKain: z.number().min(0).optional().or(z.nan()),
  nomorPola: z.string().optional(),
  catatan: z.string().optional(),
  details: z.array(woDetailSchema).min(1, "Minimal 1 varian"),
});

export type WoInput = z.infer<typeof woSchema>;

// Pemakaian bahan aktual (oims-5yr.9)
export const pemakaianSchema = z.object({
  bahanId: z.string().min(1, "Pilih bahan"),
  jumlahDiterima: z.number({ message: "Wajib angka" }).min(0),
  jumlahDigunakan: z.number({ message: "Wajib angka" }).min(0),
  jumlahSisa: z.number({ message: "Wajib angka" }).min(0),
  jumlahLimbah: z.number({ message: "Wajib angka" }).min(0),
  catatan: z.string().optional(),
});

export type PemakaianInput = z.infer<typeof pemakaianSchema>;

// Hasil cutting (oims-5yr.10)
export const hasilDetailSchema = z.object({
  varianId: z.string().min(1),
  jumlahBaik: z.number({ message: "Wajib angka" }).int().min(0),
  jumlahRusak: z.number({ message: "Wajib angka" }).int().min(0),
});

export const hasilSchema = z
  .object({
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    catatan: z.string().optional(),
    details: z.array(hasilDetailSchema).min(1),
  })
  .refine((v) => v.details.some((d) => d.jumlahBaik + d.jumlahRusak > 0), {
    message: "Minimal 1 pcs hasil dicatat",
    path: ["details"],
  });

export type HasilInput = z.infer<typeof hasilSchema>;
