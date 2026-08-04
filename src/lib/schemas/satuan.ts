import { z } from "zod";

export const satuanSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(50),
  singkatan: z.string().min(1, "Singkatan wajib diisi").max(10),
  isActive: z.boolean(),
});

export type SatuanInput = z.infer<typeof satuanSchema>;
