import { z } from "zod";

export const JENIS_PEKERJAAN = [
  "jahit_penuh",
  "jahit_sebagian",
  "obras",
  "pasang_resleting",
  "finishing",
  "packing",
  "jahit_qc",
  "jahit_sampai_jadi",
] as const;

export const KAPABILITAS = ["jahit", "sablon", "bordir"] as const;

export const JENIS_PEKERJAAN_LABEL: Record<(typeof JENIS_PEKERJAAN)[number], string> = {
  jahit_penuh: "Jahit Penuh",
  jahit_sebagian: "Jahit Sebagian",
  obras: "Obras",
  pasang_resleting: "Pasang Resleting",
  finishing: "Finishing",
  packing: "Packing",
  jahit_qc: "Jahit + QC",
  jahit_sampai_jadi: "Jahit sampai Barang Jadi",
};

export const KAPABILITAS_LABEL: Record<(typeof KAPABILITAS)[number], string> = {
  jahit: "Jahit",
  sablon: "Sablon",
  bordir: "Bordir",
};

export const QC_MODE_LABEL: Record<"internal" | "vendor", string> = {
  internal: "QC Internal (di Owncrave)",
  vendor: "QC di Vendor",
};

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const vendorSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20),
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  pemilik: optionalText(150),
  kontak: optionalText(100),
  telepon: optionalText(30),
  email: z.string().email("Email tidak valid").max(150).optional().or(z.literal("")),
  alamat: optionalText(300),
  kota: optionalText(100),
  kapasitasHarian: z.number().int().min(0).nullable(),
  jenisPekerjaan: z.array(z.enum(JENIS_PEKERJAAN)),
  kapabilitas: z
    .array(z.enum(KAPABILITAS))
    .min(1, "Pilih minimal satu kapabilitas"),
  bankNama: optionalText(100),
  bankNomorRekening: optionalText(50),
  bankAtasNama: optionalText(150),
  terminHari: z.number().int().min(0).nullable(),
  leadTimeHari: z.number().int().min(0).nullable(),
  qcMode: z.enum(["internal", "vendor"]),
  qcOfficer: optionalText(150),
  catatan: optionalText(500),
  isActive: z.boolean(),
});

export type VendorInput = z.infer<typeof vendorSchema>;
