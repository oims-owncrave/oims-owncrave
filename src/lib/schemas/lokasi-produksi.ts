import { z } from "zod";

export const LOKASI_JENIS = [
  "workshop_internal",
  "rumah_penjahit",
  "vendor_eksternal",
  "gudang_transit",
  "qc_vendor",
  "finishing_vendor",
] as const;

export const LOKASI_JENIS_LABEL: Record<(typeof LOKASI_JENIS)[number], string> = {
  workshop_internal: "Workshop Internal",
  rumah_penjahit: "Rumah Penjahit",
  vendor_eksternal: "Vendor Eksternal",
  gudang_transit: "Gudang Transit",
  qc_vendor: "QC Vendor",
  finishing_vendor: "Finishing Vendor",
};

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const lokasiProduksiSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20),
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  jenis: z.enum(LOKASI_JENIS),
  alamat: optionalText(300),
  kota: optionalText(100),
  pic: optionalText(150),
  telepon: optionalText(30),
  vendorId: z.string().uuid().nullable(),
  catatan: optionalText(500),
  isActive: z.boolean(),
});

export type LokasiProduksiInput = z.infer<typeof lokasiProduksiSchema>;
