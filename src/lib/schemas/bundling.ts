import { z } from "zod";

export const bundelSchema = z
  .object({
    woId: z.string().min(1, "Pilih WO"),
    varianId: z.string().min(1, "Pilih varian"),
    jumlahPcs: z
      .number({ message: "Jumlah wajib diisi" })
      .int("Jumlah harus bilangan bulat")
      .min(1, "Minimal 1 pcs"),
    vendorId: z.string().uuid().optional().or(z.literal("")),
    penjahitId: z.string().uuid().optional().or(z.literal("")),
    keterangan: z.string().optional(),
  })
  .refine(
    (data) => !(data.vendorId && data.penjahitId),
    {
      message: "Pilih salah satu saja — vendor atau penjahit",
      path: ["penjahitId"],
    },
  );

export type BundelInput = z.infer<typeof bundelSchema>;

export const BUNDEL_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  siap_dikirim: "Siap Dikirim",
  sudah_dikirim: "Sudah Dikirim",
  dibatalkan: "Dibatalkan",
};
