import { z } from "zod";

export const PO_PRIORITAS = ["rendah", "normal", "tinggi", "urgent"] as const;

export const PO_JENIS = [
  { value: "reguler", label: "Produksi Reguler" },
  { value: "restock", label: "Restock" },
  { value: "produk_baru", label: "Produk Baru" },
  { value: "sampel", label: "Sampel" },
  { value: "pre_order", label: "Pre-Order" },
  { value: "pesanan_khusus", label: "Pesanan Khusus" },
] as const;

export const poDetailSchema = z.object({
  varianId: z.string().min(1, "Pilih varian"),
  jumlahTarget: z
    .number({ message: "Target wajib diisi" })
    .int("Target harus bilangan bulat")
    .min(1, "Minimal 1 pcs"),
  lebihanPcs: z
    .number({ message: "Lebihan wajib angka" })
    .int("Lebihan harus bilangan bulat")
    .min(0, "Minimal 0"),
});

export const poSchema = z.object({
  produkId: z.string().min(1, "Pilih produk"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tanggalMulai: z.string().optional(),
  targetSelesai: z.string().optional(),
  prioritas: z.enum(PO_PRIORITAS),
  jenis: z.enum(["reguler", "restock", "produk_baru", "sampel", "pre_order", "pesanan_khusus"]),
  penanggungJawab: z.string().optional(),
  catatan: z.string().optional(),
  details: z.array(poDetailSchema).min(1, "Minimal 1 varian"),
});

export type PoInput = z.infer<typeof poSchema>;
