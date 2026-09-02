import { z } from "zod";

export const SISA_JENIS = [
  { value: "kain_utuh", label: "Kain Utuh" },
  { value: "potongan_besar", label: "Potongan Besar" },
  { value: "potongan_kecil", label: "Potongan Kecil" },
  { value: "aksesoris_tidak_terpakai", label: "Aksesoris Tidak Terpakai" },
  { value: "bahan_berlebih", label: "Bahan Berlebih" },
] as const;

export const SISA_STATUS_LABEL: Record<string, string> = {
  disimpan_cutting: "Disimpan di Cutting",
  menunggu_gudang: "Menunggu Gudang",
  diterima_gudang: "Diterima Gudang",
  dialokasikan: "Dialokasikan ke PO Lain",
  tidak_layak: "Tidak Layak",
};

export const LIMBAH_JENIS = [
  { value: "potongan_kecil", label: "Potongan Kecil" },
  { value: "kain_cacat", label: "Kain Cacat" },
  { value: "salah_potong", label: "Salah Potong" },
  { value: "bahan_rusak", label: "Bahan Rusak" },
  { value: "noda", label: "Noda" },
  { value: "sampah_produksi", label: "Sampah Produksi" },
] as const;

export const LIMBAH_PENANGANAN = [
  { value: "dibuang", label: "Dibuang" },
  { value: "disimpan", label: "Disimpan" },
  { value: "dijual", label: "Dijual" },
  { value: "sampel", label: "Untuk Sampel" },
  { value: "aksesori", label: "Untuk Aksesori" },
  { value: "retur_supplier", label: "Dikembalikan Supplier" },
] as const;

export const sisaSchema = z.object({
  bahanId: z.string().min(1, "Pilih bahan"),
  jumlah: z.number({ message: "Jumlah wajib diisi" }).positive("Jumlah harus > 0"),
  jenis: z.enum(["kain_utuh", "potongan_besar", "potongan_kecil", "aksesoris_tidak_terpakai", "bahan_berlebih"]),
  catatan: z.string().optional(),
});

export type SisaInput = z.infer<typeof sisaSchema>;

export const limbahSchema = z.object({
  bahanId: z.string().min(1, "Pilih bahan"),
  jumlah: z.number({ message: "Jumlah wajib diisi" }).positive("Jumlah harus > 0"),
  jenis: z.enum(["potongan_kecil", "kain_cacat", "salah_potong", "bahan_rusak", "noda", "sampah_produksi"]),
  penanganan: z.enum(["dibuang", "disimpan", "dijual", "sampel", "aksesori", "retur_supplier"]),
  penyebab: z.string().optional(),
  catatan: z.string().optional(),
});

export type LimbahInput = z.infer<typeof limbahSchema>;
