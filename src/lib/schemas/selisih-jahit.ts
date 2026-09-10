import { z } from "zod";

export const KLASIFIKASI = [
  "belum_selesai",
  "tertinggal",
  "hilang",
  "rusak",
  "salah_produk",
  "salah_ukuran",
  "salah_warna",
  "kelebihan",
  "salah_hitung",
  "ditahan_perbaikan",
] as const;

export const KLASIFIKASI_LABEL: Record<(typeof KLASIFIKASI)[number], string> = {
  belum_selesai: "Belum Selesai",
  tertinggal: "Tertinggal",
  hilang: "Hilang",
  rusak: "Rusak",
  salah_produk: "Salah Produk",
  salah_ukuran: "Salah Ukuran",
  salah_warna: "Salah Warna",
  kelebihan: "Kelebihan",
  salah_hitung: "Salah Hitung",
  ditahan_perbaikan: "Ditahan untuk Perbaikan",
};

export const SELISIH_STATUS_LABEL: Record<
  "dibuka" | "diselidiki" | "selesai",
  { label: string; className: string }
> = {
  dibuka: { label: "Dibuka", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  diselidiki: { label: "Diselidiki", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  selesai: { label: "Selesai", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

export const KEPUTUSAN = [
  "ditanggung_vendor",
  "ditanggung_owncrave",
  "ditemukan",
  "dihapusbukukan",
  "diperbaiki",
] as const;

export const KEPUTUSAN_LABEL: Record<(typeof KEPUTUSAN)[number], string> = {
  ditanggung_vendor: "Ditanggung Vendor (potong tagihan)",
  ditanggung_owncrave: "Ditanggung Owncrave",
  ditemukan: "Ditemukan (batal hilang)",
  dihapusbukukan: "Dihapusbukukan",
  diperbaiki: "Diperbaiki (lewat retur)",
};

export const RUSAK_TINGKAT = ["ringan", "sedang", "berat", "tidak_dapat_diperbaiki"] as const;
export const RUSAK_TINGKAT_LABEL: Record<(typeof RUSAK_TINGKAT)[number], string> = {
  ringan: "Ringan",
  sedang: "Sedang",
  berat: "Berat",
  tidak_dapat_diperbaiki: "Tidak Dapat Diperbaiki",
};

export const RUSAK_PENYEBAB = ["cacat_bahan", "kesalahan_cutting", "kesalahan_jahit", "kesalahan_aksesori"] as const;
export const RUSAK_PENYEBAB_LABEL: Record<(typeof RUSAK_PENYEBAB)[number], string> = {
  cacat_bahan: "Cacat Bahan",
  kesalahan_cutting: "Kesalahan Cutting",
  kesalahan_jahit: "Kesalahan Jahit",
  kesalahan_aksesori: "Kesalahan Aksesori",
};

export const selisihSchema = z.object({
  penugasanDetailId: z.string().min(1, "Pilih bundel"),
  penerimaanId: z.string().nullable(),
  klasifikasi: z.enum(KLASIFIKASI),
  jumlah: z.number({ message: "Jumlah wajib diisi" }).int().min(1, "Minimal 1 pcs"),
  nilaiPerPcs: z.number({ message: "Wajib angka" }).min(0),
  kronologi: z.string().optional(),
  penanggungJawab: z.string().optional(),
  buktiUrl: z.string().optional(),
  tingkatRusak: z.enum(RUSAK_TINGKAT).nullable(),
  penyebabRusak: z.enum(RUSAK_PENYEBAB).nullable(),
  catatan: z.string().optional(),
});

export type SelisihInput = z.infer<typeof selisihSchema>;

export const keputusanSchema = z.object({
  keputusan: z.enum(KEPUTUSAN),
  catatan: z.string().optional(),
});

export type KeputusanInput = z.infer<typeof keputusanSchema>;
