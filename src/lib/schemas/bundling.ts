import { z } from "zod";

export const bundelSchema = z.object({
  woId: z.string().min(1, "Pilih WO"),
  varianId: z.string().min(1, "Pilih varian"),
  jumlahPcs: z
    .number({ message: "Jumlah wajib diisi" })
    .int("Jumlah harus bilangan bulat")
    .min(1, "Minimal 1 pcs"),
  tujuanPenjahit: z.string().optional(),
  keterangan: z.string().optional(),
});

export type BundelInput = z.infer<typeof bundelSchema>;

export const BUNDEL_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  siap_dikirim: "Siap Dikirim",
  sudah_dikirim: "Sudah Dikirim",
  dibatalkan: "Dibatalkan",
};
