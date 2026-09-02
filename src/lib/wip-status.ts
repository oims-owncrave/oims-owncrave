/**
 * Status WIP cutting — konstanta murni (bukan "use server").
 * Dipisah dari services/wip.ts: file "use server" hanya boleh export async function,
 * export objek bikin build gagal ("A use server file can only export async functions").
 */
export type WipStatus =
  | "menunggu_bahan"
  | "menunggu_diterima"
  | "menunggu_wo"
  | "sedang_cutting"
  | "cutting_selesai"
  | "sedang_bundling"
  | "siap_dikirim";

export const WIP_LABEL: Record<WipStatus, string> = {
  menunggu_bahan: "Menunggu Bahan",
  menunggu_diterima: "Bahan Keluar — Menunggu Diterima",
  menunggu_wo: "Bahan Diterima — Menunggu WO",
  sedang_cutting: "Sedang Cutting",
  cutting_selesai: "Cutting Selesai — Menunggu Bundling",
  sedang_bundling: "Sedang Bundling",
  siap_dikirim: "Siap Dikirim ke Penjahit",
};
