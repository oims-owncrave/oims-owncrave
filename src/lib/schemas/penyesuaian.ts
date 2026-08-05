import { z } from "zod";

export const penyesuaianSchema = z.object({
  bahanId: z.string().uuid("Bahan wajib dipilih"),
  kuantitasSetelah: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
  alasan: z.string().min(1, "Alasan wajib diisi").max(500),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
});

export type PenyesuaianFormInput = z.input<typeof penyesuaianSchema>;
export type PenyesuaianInput = z.output<typeof penyesuaianSchema>;
