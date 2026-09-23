import { z } from "zod";

export const bahanSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  ukuran: z.string().max(50).optional().nullable().or(z.literal("")),
  kategoriId: z.string().uuid("Kategori wajib dipilih"),
  satuanId: z.string().uuid("Satuan wajib dipilih"),
  warnaId: z.string().uuid().optional().nullable(),
  stokMinimum: z.number().min(0, "Stok minimum tidak boleh negatif"),
  isActive: z.boolean(),
  // Hanya dipakai saat create (form edit menyembunyikan field ini, updateBahan
  // tidak menyentuh harga) — wajib optional, kalau tidak validasi edit gagal
  // diam-diam karena defaultValues form edit tak pernah mengisi field ini.
  hargaAwal: z.number().min(0, "Harga tidak boleh negatif").optional(),
});

export type BahanInput = z.infer<typeof bahanSchema>;
