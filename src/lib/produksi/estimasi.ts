import { eq, inArray } from "drizzle-orm";
import type { db } from "@/db";
import { bahan, bomDetail, satuan, stok, warna } from "@/db/schema";
import { pcsBerlaku, varianTanpaBahanKhusus, type PcsVarian } from "@/lib/bom-ukuran";

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
  untuk: string[]; // label filter baris BOM, [] = semua
};

export type PcsPerVarian = PcsVarian;

export type EstimasiResult =
  | { error: string }
  | { bomNomor: string; bomVersi: number; rows: EstimasiRow[]; varianTanpaBahan: string[] };

export type PreviewEstimasiInput = {
  produkId: string;
  details: { varianId: string; jumlahTarget: number }[];
  lebihanBahan: { bahanId: string; lebihan: number }[];
};

/**
 * Hitung kebutuhan bahan berdasarkan BOM, target per ukuran, dan lebihan bahan per PO.
 *
 * RUMUS:
 * 1. standar = pcs varian yang ukuran & warnanya cocok * kuantitas
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
  pcsPerVarian: PcsPerVarian[],
  lebihanPerBahan: Map<string, number>,
): Promise<{ rows: EstimasiRow[]; varianTanpaBahan: string[] }> {
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
      berlakuWarnaIds: bomDetail.berlakuWarnaIds,
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

  const warnaIds = [
    ...new Set([
      ...bomRows.flatMap((r) => r.berlakuWarnaIds ?? []),
      ...pcsPerVarian.map((p) => p.warnaId).filter(Boolean),
    ]),
  ];
  const namaWarna = new Map(
    warnaIds.length
      ? (
          await tx.select({ id: warna.id, nama: warna.nama }).from(warna).where(inArray(warna.id, warnaIds))
        ).map((w) => [w.id, w.nama])
      : [],
  );
  const labelBaris = (r: (typeof bomRows)[number]) => {
    const w = (r.berlakuWarnaIds ?? []).map((id) => namaWarna.get(id) ?? "?").join("/");
    const u = r.berlakuUkuran?.trim() ?? "";
    return [w, u].filter(Boolean).join(" · "); // "" = semua
  };

  const agg = new Map<string, EstimasiRow>();
  for (const r of bomRows) {
    const pcs = pcsBerlaku(pcsPerVarian, r.berlakuUkuran, r.berlakuWarnaIds);
    const standar = pcs * Number(r.kuantitas);
    const denganToleransi = standar * (1 + Number(r.toleransiPersen) / 100);
    const label = labelBaris(r);

    const prev = agg.get(r.bahanId);
    if (prev) {
      prev.kebutuhanStandar += standar;
      prev.totalKebutuhan += denganToleransi;
      if (label && !prev.untuk.includes(label)) prev.untuk.push(label);
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
        untuk: label ? [label] : [],
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

  const varianTanpaBahan = varianTanpaBahanKhusus(pcsPerVarian, bomRows).map(
    (v) => `${namaWarna.get(v.warnaId) ?? "?"} ${v.ukuran}`,
  );

  return { rows, varianTanpaBahan };
}
