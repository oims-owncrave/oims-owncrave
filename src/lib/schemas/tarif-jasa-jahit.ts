import { z } from "zod";
import { JENIS_PEKERJAAN } from "./vendor";

export const DASAR_TARIF = [
  "per_pcs",
  "per_bundel",
  "per_lusin",
  "per_tahap",
  "borongan",
  "per_jam",
] as const;

export const DASAR_TARIF_LABEL: Record<(typeof DASAR_TARIF)[number], string> = {
  per_pcs: "Per Pcs",
  per_bundel: "Per Bundel",
  per_lusin: "Per Lusin",
  per_tahap: "Per Tahap",
  borongan: "Borongan",
  per_jam: "Per Jam",
};

export const TARIF_STATUS_LABEL: Record<"draft" | "aktif" | "nonaktif", string> = {
  draft: "Draft",
  aktif: "Aktif",
  nonaktif: "Nonaktif",
};

export const tarifJasaJahitSchema = z
  .object({
    produkId: z.string().uuid("Produk wajib dipilih"),
    varianId: z.string().uuid().nullable(), // null = berlaku semua varian
    jenisPekerjaan: z.enum(JENIS_PEKERJAAN),
    pihak: z.enum(["vendor", "penjahit"]),
    vendorId: z.string().uuid().nullable(),
    penjahitId: z.string().uuid().nullable(),
    dasarTarif: z.enum(DASAR_TARIF),
    nominal: z.number().min(0, "Nominal tidak boleh negatif"),
    tanggalBerlaku: z.string().min(1, "Tanggal berlaku wajib diisi"),
    catatan: z.string().max(500).optional().or(z.literal("")),
  })
  // cermin DB CHECK tarif_pihak_tunggal
  .refine((v) => v.pihak !== "vendor" || !!v.vendorId, {
    message: "Vendor wajib dipilih",
    path: ["vendorId"],
  })
  .refine((v) => v.pihak !== "penjahit" || !!v.penjahitId, {
    message: "Penjahit wajib dipilih",
    path: ["penjahitId"],
  });

export type TarifJasaJahitInput = z.infer<typeof tarifJasaJahitSchema>;
