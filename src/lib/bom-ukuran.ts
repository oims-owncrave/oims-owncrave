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

export type PcsVarian = { ukuran: string; warnaId: string; pcs: number };

/**
 * Total pcs yang memakai satu baris BOM: ukuran DAN warna harus cocok.
 * berlakuUkuran/berlakuWarnaIds kosong = berlaku semua.
 */
export function pcsBerlaku(
  pcsPerVarian: PcsVarian[],
  berlakuUkuran: string | null,
  berlakuWarnaIds: string[] | null,
): number {
  const ukuran = cocokkanUkuranBerlaku(berlakuUkuran);
  const warna = berlakuWarnaIds?.length ? berlakuWarnaIds : null;
  return pcsPerVarian
    .filter((p) => !ukuran || ukuran.includes(p.ukuran.toUpperCase()))
    .filter((p) => !warna || warna.includes(p.warnaId))
    .reduce((s, p) => s + p.pcs, 0);
}

export type FilterBaris = { berlakuUkuran: string | null; berlakuWarnaIds: string[] | null };

/**
 * Varian ber-target yang tidak cocok dengan baris BOM KHUSUS (punya filter warna/ukuran)
 * mana pun. BOM tanpa baris khusus → [] (tak ada yang bisa "terlewat").
 */
export function varianTanpaBahanKhusus(pcsPerVarian: PcsVarian[], baris: FilterBaris[]): PcsVarian[] {
  const khusus = baris.filter((b) => b.berlakuUkuran?.trim() || b.berlakuWarnaIds?.length);
  if (!khusus.length) return [];
  return pcsPerVarian.filter(
    (v) => v.pcs > 0 && !khusus.some((b) => pcsBerlaku([v], b.berlakuUkuran, b.berlakuWarnaIds) > 0),
  );
}
