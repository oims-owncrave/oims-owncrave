import { z } from "zod";
import { JENIS_PEKERJAAN } from "./vendor";
import { DASAR_TARIF } from "./tarif-jasa-jahit";

export const PRIORITAS = ["rendah", "normal", "tinggi", "urgent"] as const;

export const PENUGASAN_STATUS_LABEL: Record<
  "draft" | "aktif" | "selesai" | "dibatalkan",
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  aktif: {
    label: "Aktif",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  selesai: {
    label: "Selesai",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  dibatalkan: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export const penugasanDetailSchema = z.object({
  bundlingId: z.string().min(1, "Pilih bundel"),
  tarif: z.number({ message: "Tarif wajib diisi" }).min(0, "Tarif tidak boleh negatif"),
  dasarTarif: z.enum(DASAR_TARIF),
});

export const penugasanSchema = z
  .object({
    poId: z.string().min(1, "Pilih PO"),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    pihak: z.enum(["vendor", "penjahit"]),
    vendorId: z.string().nullable(),
    penjahitId: z.string().nullable(),
    lokasiTujuanId: z.string().nullable(),
    jenisPekerjaan: z.enum(JENIS_PEKERJAAN),
    rencanaKirim: z.string().optional(),
    targetSelesai: z.string().min(1, "Target selesai wajib diisi"),
    prioritas: z.enum(PRIORITAS),
    catatan: z.string().optional(),
    details: z.array(penugasanDetailSchema).min(1, "Minimal 1 bundel"),
  })
  // cermin DB CHECK penugasan_pihak_tunggal
  .refine((v) => v.pihak !== "vendor" || !!v.vendorId, {
    message: "Vendor wajib dipilih",
    path: ["vendorId"],
  })
  .refine((v) => v.pihak !== "penjahit" || !!v.penjahitId, {
    message: "Penjahit wajib dipilih",
    path: ["penjahitId"],
  });

export type PenugasanInput = z.infer<typeof penugasanSchema>;
