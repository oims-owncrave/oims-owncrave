import { z } from "zod";

export const produkSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(20, "Kode maksimal 20 karakter"),
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  deskripsi: z.string().max(1000).optional(),
  dekorasiProses: z.enum(["none", "sablon", "bordir", "keduanya"]),
  isActive: z.boolean(),
});

export type ProdukInput = z.infer<typeof produkSchema>;

export const DEKORASI_PROSES_LABEL: Record<"none" | "sablon" | "bordir" | "keduanya", string> = {
  none: "Tanpa Dekorasi",
  sablon: "Sablon",
  bordir: "Bordir",
  keduanya: "Sablon + Bordir",
};
