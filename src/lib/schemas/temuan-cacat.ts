import { z } from "zod";
import { qcTingkatValues, cacatSumberValues } from "./jenis-cacat";

export const temuanCacatSchema = z.object({
  hasilQcDetailId: z.string().uuid(),
  jenisCacatId: z.string().uuid({ message: "Jenis cacat wajib dipilih" }),
  bagianProduk: z.string().max(100).optional().nullable(),
  keparahan: z.enum(qcTingkatValues),
  sumber: z.enum(cacatSumberValues),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  penyebabAwal: z.string().max(500).optional().nullable(),
  penanggungJawab: z.string().max(100).optional().nullable(),
  fotoUrl: z.string().max(500).optional().nullable(),
  tindakan: z.string().max(500).optional().nullable(),
});

export type TemuanCacatInput = z.output<typeof temuanCacatSchema>;
export type TemuanCacatFormValues = z.input<typeof temuanCacatSchema>;
