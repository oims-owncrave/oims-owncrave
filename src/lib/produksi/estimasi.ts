import { eq, inArray } from "drizzle-orm";
import type { db } from "@/db";
import { bahan, bomDetail, satuan, stok } from "@/db/schema";
import { cocokkanUkuranBerlaku } from "@/lib/bom-ukuran";

/**
 * Modul server-only TANPA "use server" supaya bisa menerima tx (Drizzle transaction).
 * Pola terbukti: src/lib/jahit/rekap.ts.
 */
type Tx = Pick<typeof db, "select">;

export type EstimasiRow = {
  bahanId: string;
  bahanKode: string;
  bahanNama: string;
  bahanUkuran?: string | null;
  satuanSingkatan: string;
  kebutuhanStandar: number; // pcs × BOM
  totalKebutuhan: number; // + toleransi + lebihan bahan
  lebihanBahan: number; // BARU — manual per PO
  stokTersedia: number;
  kekurangan: number;
  status: "tersedia" | "sebagian" | "tidak_tersedia";
};

export type PcsPerUkuran = { ukuran: string; pcs: number };

export type EstimasiResult =
  | { error: string }
  | { bomNomor: string; bomVersi: number; rows: EstimasiRow[] };

export type PreviewEstimasiInput = {
  produkId: string;
  details: { varianId: string; jumlahTarget: number }[];
  lebihanBahan: { bahanId: string; lebihan: number }[];
};

/**
 * Hitung kebutuhan bahan berdasarkan BOM, target per ukuran, dan lebihan bahan per PO.
 *
 * RUMUS:
 * 1. standar = pcs * bomDetail.kuantitas
 * 2. denganToleransi = standar * (1 + bomDetail.toleransiPersen / 100)
 * 3. totalKebutuhan = denganToleransi + (lebihanPerBahan.get(bahanId) ?? 0)
 *
 * CATATAN PENTING:
 * Lebihan bahan ditambahkan SETELAH toleransi, bukan sebelum.
 * Toleransi = susut per pcs (persen); lebihan = cadangan logistik tetap (angka).
 */
export async function hitungEstimasi(
  tx: Tx,
  bomId: string,
  pcsPerUkuran: PcsPerUkuran[],
  lebihanPerBahan: Map<string, number>,
): Promise<EstimasiRow[]> {
  const bomRows = await tx
    .select({
      bahanId: bomDetail.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      bahanUkuran: bahan.ukuran,
      satuanSingkatan: satuan.singkatan,
      kuantitas: bomDetail.kuantitas,
      toleransiPersen: bomDetail.toleransiPersen,
      berlakuUkuran: bomDetail.berlakuUkuran,
    })
    .from(bomDetail)
    .innerJoin(bahan, eq(bomDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(bomDetail.bomId, bomId));

  const bahanIds = [...new Set(bomRows.map((r) => r.bahanId))];
  const stokRows = bahanIds.length
    ? await tx.select().from(stok).where(inArray(stok.bahanId, bahanIds))
    : [];
  const stokMap = new Map(stokRows.map((s) => [s.bahanId, Number(s.kuantitas)]));

  const pcsEfektif = pcsPerUkuran.map((p) => ({
    ukuran: p.ukuran.toUpperCase(),
    pcs: p.pcs,
  }));

  const agg = new Map<string, EstimasiRow>();
  for (const r of bomRows) {
    const ukuranBerlaku = cocokkanUkuranBerlaku(r.berlakuUkuran);
    const applicable = ukuranBerlaku
      ? pcsEfektif.filter((p) => ukuranBerlaku.includes(p.ukuran))
      : pcsEfektif;
    const pcs = applicable.reduce((s, p) => s + p.pcs, 0);
    const standar = pcs * Number(r.kuantitas);
    const denganToleransi = standar * (1 + Number(r.toleransiPersen) / 100);

    const prev = agg.get(r.bahanId);
    if (prev) {
      prev.kebutuhanStandar += standar;
      prev.totalKebutuhan += denganToleransi;
    } else {
      agg.set(r.bahanId, {
        bahanId: r.bahanId,
        bahanKode: r.bahanKode,
        bahanNama: r.bahanNama,
        bahanUkuran: r.bahanUkuran,
        satuanSingkatan: r.satuanSingkatan,
        kebutuhanStandar: standar,
        totalKebutuhan: denganToleransi,
        lebihanBahan: lebihanPerBahan.get(r.bahanId) ?? 0,
        stokTersedia: stokMap.get(r.bahanId) ?? 0,
        kekurangan: 0,
        status: "tersedia",
      });
    }
  }

  const rows = [...agg.values()].map((row) => {
    const totalKebutuhan = row.totalKebutuhan + row.lebihanBahan;
    const kekurangan = Math.max(0, totalKebutuhan - row.stokTersedia);
    const status: EstimasiRow["status"] =
      row.stokTersedia >= totalKebutuhan
        ? "tersedia"
        : row.stokTersedia > 0
          ? "sebagian"
          : "tidak_tersedia";
    return { ...row, totalKebutuhan, kekurangan, status };
  });

  return rows;
}
