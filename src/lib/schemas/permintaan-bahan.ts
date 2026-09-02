import { z } from "zod";

export const pbDetailSchema = z.object({
  bahanId: z.string().min(1, "Pilih bahan"),
  kebutuhan: z.number({ message: "Kebutuhan wajib angka" }).min(0),
  jumlahDiminta: z
    .number({ message: "Jumlah wajib diisi" })
    .positive("Jumlah harus > 0"),
});

export const pbSchema = z.object({
  poId: z.string().min(1, "Pilih PO"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tanggalDibutuhkan: z.string().optional(),
  catatan: z.string().optional(),
  details: z.array(pbDetailSchema).min(1, "Minimal 1 bahan"),
});

export type PbInput = z.infer<typeof pbSchema>;
