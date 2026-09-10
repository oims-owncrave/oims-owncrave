import { z } from "zod";

export const PENJAHIT_JENIS = [
  "internal",
  "eksternal_individu",
  "anggota_vendor",
  "freelance",
  "sampel",
  "spesialis_perbaikan",
] as const;

export const PENJAHIT_JENIS_LABEL: Record<(typeof PENJAHIT_JENIS)[number], string> = {
  internal: "Internal",
  eksternal_individu: "Eksternal Individu",
  anggota_vendor: "Anggota Vendor",
  freelance: "Freelance",
  sampel: "Sampel",
  spesialis_perbaikan: "Spesialis Perbaikan",
};

/** Jenis yang kodenya pakai prefix JHT-INT (sisanya JHT-EXT). */
export const JENIS_INTERNAL = ["internal", "sampel"] as const;

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const penjahitSchema = z
  .object({
    kode: z.string().min(1, "Kode wajib diisi").max(30),
    nama: z.string().min(1, "Nama wajib diisi").max(150),
    jenis: z.enum(PENJAHIT_JENIS),
    vendorId: z.string().uuid().nullable(),
    lokasiId: z.string().uuid().nullable(),
    telepon: optionalText(30),
    alamat: optionalText(300),
    kapasitasHarian: z.number().int().min(0).nullable(),
    keahlian: z.array(z.string().max(60)),
    produkIds: z.array(z.string().uuid()),
    catatan: optionalText(500),
    isActive: z.boolean(),
  })
  // cermin DB CHECK penjahit_vendor_sesuai_jenis — pesan error bagus sebelum hit DB
  .refine((v) => v.jenis !== "anggota_vendor" || !!v.vendorId, {
    message: "Jenis 'Anggota Vendor' wajib pilih vendor",
    path: ["vendorId"],
  })
  .refine((v) => v.jenis === "anggota_vendor" || !v.vendorId, {
    message: "Vendor hanya boleh diisi untuk jenis 'Anggota Vendor'",
    path: ["vendorId"],
  });

export type PenjahitInput = z.infer<typeof penjahitSchema>;
