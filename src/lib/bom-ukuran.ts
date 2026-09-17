/** Urutan produksi standar — dipakai di mana pun ukuran ditampilkan/diurutkan. */
export const UKURAN_STANDAR = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

/** Urutkan ukuran sesuai UKURAN_STANDAR; ukuran di luar daftar ditaruh di akhir. */
export function urutkanUkuran(ukuran: string[]): string[] {
  const posisi = (u: string) => {
    const i = UKURAN_STANDAR.indexOf(u.toUpperCase() as (typeof UKURAN_STANDAR)[number]);
    return i === -1 ? UKURAN_STANDAR.length : i;
  };
  return [...ukuran].sort((a, b) => posisi(a) - posisi(b));
}

/**
 * bom_detail.berlaku_ukuran boleh berisi satu ukuran ("XXL") atau beberapa
 * dipisah koma ("S,M") — Excel klien memakai rentang begini. Kosong/null
 * berarti berlaku semua ukuran.
 */
export function cocokkanUkuranBerlaku(berlakuUkuran: string | null): string[] | null {
  const daftar = berlakuUkuran
    ?.toUpperCase()
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  return daftar?.length ? daftar : null;
}
