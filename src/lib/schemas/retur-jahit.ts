import { z } from "zod";

export const RETUR_STATUS_LABEL: Record<
  "draft" | "dikirim" | "diterima_kembali" | "selesai" | "dibatalkan",
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  dikirim: { label: "Dikirim ke Vendor", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  diterima_kembali: { label: "Hasil Perbaikan Diterima", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  selesai: { label: "Selesai", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  dibatalkan: { label: "Dibatalkan", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export const PENANGGUNG_LABEL: Record<"vendor" | "owncrave", string> = {
  vendor: "Vendor (gratis)",
  owncrave: "Owncrave (bayar tarif perbaikan)",
};

export const returDetailSchema = z.object({
  penugasanDetailId: z.string().min(1),
  jumlah: z.number({ message: "Jumlah wajib diisi" }).int().min(0),
  jenisCacatId: z.string().uuid().optional().or(z.literal("")),
  instruksi: z.string().optional(),
  tarifPerbaikan: z.number({ message: "Wajib angka" }).min(0),
  penanggungBiaya: z.enum(["vendor", "owncrave"]),
  fotoUrl: z.string().optional(),
});

export const returSchema = z
  .object({
    penugasanId: z.string().min(1),
    penerimaanAsalId: z.string().min(1, "Pilih penerimaan asal"),
    tanggalRetur: z.string().min(1, "Tanggal retur wajib diisi"),
    targetKembali: z.string().optional(),
    alasan: z.string().min(1, "Alasan wajib diisi"),
    catatan: z.string().optional(),
    details: z.array(returDetailSchema).min(1),
  })
  .refine((v) => v.details.some((d) => d.jumlah > 0), {
    message: "Minimal 1 pcs diretur",
    path: ["details"],
  });

export type ReturInput = z.infer<typeof returSchema>;
