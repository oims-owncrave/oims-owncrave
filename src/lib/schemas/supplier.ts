import { z } from "zod";

export const supplierSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20),
  nama: z.string().min(1, "Nama wajib diisi").max(150),
  kontak: z.string().max(100).optional().or(z.literal("")),
  alamat: z.string().max(300).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
