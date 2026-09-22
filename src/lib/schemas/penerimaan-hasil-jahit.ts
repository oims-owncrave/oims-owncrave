import { z } from "zod";

export const penerimaanHasilDetailSchema = z.object({
  penugasanDetailId: z.string().min(1),
  jumlahBaik: z.number({ message: "Wajib angka" }).int().min(0),
  jumlahRusak: z.number({ message: "Wajib angka" }).int().min(0),
  catatan: z.string().optional(),
});

export const penerimaanHasilSchema = z
  .object({
    penugasanId: z.string().min(1, "Pilih penugasan"),
    returId: z.string().nullable(), // terisi = hasil perbaikan kembali
    tanggalJam: z.string().min(1, "Tanggal/jam wajib diisi"),
    penerimaId: z.string().uuid("Penerima wajib dipilih").optional().or(z.literal("")),
    lokasiId: z.string().nullable(),
    tanggalKirimVendor: z.string().optional(),
    kontakVendorId: z.string().uuid().optional().or(z.literal("")).nullable(),
    pengirimVendor: z.string().optional(),
    kurirResi: z.string().optional(),
    buktiUrl: z.string().optional(),
    catatan: z.string().optional(),
    details: z.array(penerimaanHasilDetailSchema).min(1),
  })
  .refine((v) => v.details.some((d) => d.jumlahBaik + d.jumlahRusak > 0), {
    message: "Minimal 1 pcs diterima",
    path: ["details"],
  });

export type PenerimaanHasilInput = z.infer<typeof penerimaanHasilSchema>;
