import { z } from "zod";
import { qcTingkatValues } from "./jenis-cacat";

export const standarQcDetailSchema = z.object({
  tahap: z.string().min(1, "Tahap wajib diisi").max(100),
  bagianProdukId: z.string().uuid().optional().nullable().or(z.literal("")),
  kriteria: z.string().min(1, "Kriteria wajib diisi").max(500),
  metode: z.string().max(255).optional().nullable(),
  tingkatKepentingan: z.enum(qcTingkatValues),
  toleransi: z.string().max(100).optional().nullable(),
  jenisCacatId: z.string().uuid().optional().nullable(),
  tindakanJikaGagal: z.string().max(500).optional().nullable(),
  wajibFoto: z.boolean(),
  urutan: z.coerce.number().int().min(0),
});

export const standarQcSchema = z
  .object({
    nama: z.string().min(1, "Nama standar wajib diisi").max(150),
    produkId: z.string().uuid().optional().nullable(),
    kategoriId: z.string().uuid().optional().nullable(),
    tanggalBerlaku: z.string().min(1, "Tanggal berlaku wajib diisi"),
    catatan: z.string().max(500).optional().nullable(),
    details: z.array(standarQcDetailSchema).min(1, "Minimal satu kriteria pemeriksaan"),
  })
  // tanpa ini standar bisa "berlaku untuk apa saja" — tak bisa dipilih WO dengan benar
  .refine((v) => !!v.produkId || !!v.kategoriId, {
    message: "Isi minimal salah satu: produk atau kategori",
    path: ["produkId"],
  });

export type StandarQcInput = z.output<typeof standarQcSchema>;
export type StandarQcFormValues = z.input<typeof standarQcSchema>;
export type StandarQcDetailInput = z.output<typeof standarQcDetailSchema>;
