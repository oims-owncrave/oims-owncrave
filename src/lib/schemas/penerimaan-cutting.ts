import { z } from "zod";

export const KONDISI_TERIMA = [
  { value: "baik", label: "Baik" },
  { value: "kurang", label: "Kurang" },
  { value: "lebih", label: "Lebih" },
  { value: "rusak", label: "Rusak" },
  { value: "warna_tidak_sesuai", label: "Warna Tidak Sesuai" },
  { value: "spesifikasi_tidak_sesuai", label: "Spesifikasi Tidak Sesuai" },
] as const;

const kondisiEnum = z.enum([
  "baik",
  "kurang",
  "lebih",
  "rusak",
  "warna_tidak_sesuai",
  "spesifikasi_tidak_sesuai",
]);

export const penerimaanDetailSchema = z.object({
  bahanId: z.string().min(1),
  jumlahDiterima: z
    .number({ message: "Jumlah wajib diisi" })
    .min(0, "Minimal 0"),
  kondisi: kondisiEnum,
  catatan: z.string().optional(),
});

export const penerimaanSchema = z.object({
  barangKeluarId: z.string().min(1, "Pilih barang keluar"),
  tanggalTerima: z.string().min(1, "Tanggal terima wajib diisi"),
  catatan: z.string().optional(),
  details: z.array(penerimaanDetailSchema).min(1, "Minimal 1 bahan"),
});

export type PenerimaanInput = z.infer<typeof penerimaanSchema>;
