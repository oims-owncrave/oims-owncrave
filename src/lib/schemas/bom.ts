import { z } from "zod";

export const bomDetailSchema = z.object({
  bahanId: z.string().min(1, "Pilih bahan"),
  kuantitas: z
    .number({ message: "Kuantitas wajib diisi" })
    .positive("Kuantitas harus > 0"),
  toleransiPersen: z
    .number({ message: "Toleransi wajib angka" })
    .min(0, "Minimal 0")
    .max(100, "Maksimal 100")
    .optional(), // tidak ada di form (klien tidak pakai) — kosong = 0
  berlakuUkuran: z.string().optional(), // kosong = semua ukuran
  berlakuWarnaIds: z.array(z.string().uuid()).optional(), // kosong = semua warna
  keterangan: z.string().optional(),
});

export const bomSchema = z.object({
  produkId: z.string().min(1, "Pilih produk"),
  catatan: z.string().optional(),
  details: z.array(bomDetailSchema).min(1, "Minimal 1 bahan"),
});

export type BomInput = z.infer<typeof bomSchema>;
