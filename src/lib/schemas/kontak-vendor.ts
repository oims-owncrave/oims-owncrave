import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const kontakVendorSchema = z.object({
  vendorId: z.string().uuid("Pilih vendor"),
  nama: z.string().min(1, "Nama wajib diisi").max(100).trim(),
  jabatan: optionalText(100),
  telepon: optionalText(30),
  isActive: z.boolean(),
});

export type KontakVendorInput = z.infer<typeof kontakVendorSchema>;
