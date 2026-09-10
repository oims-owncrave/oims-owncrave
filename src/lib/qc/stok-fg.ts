import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stokBarangJadi, mutasiBarangJadi } from "@/db/schema";

/**
 * Mutasi stok barang jadi — SATU-SATUNYA jalur perubahan stok.
 *
 * Aturan proyek: kuantitas TIDAK PERNAH di-UPDATE sebagai edit arbitrary.
 * Semua perubahan append ke mutasi_barang_jadi, dan cache kuantitas
 * di-maintain di dalam transaksi yang sama.
 *
 * Proyek ini TIDAK memakai DB trigger (diverifikasi 2026-09-10) — pola
 * aslinya ada di src/services/barang-masuk.ts: SELECT ... FOR UPDATE sebelum
 * hitung, loop SEQUENTIAL, retry-on-23505 di caller.
 *
 * Modul server-only tanpa "use server" supaya bisa menerima tx.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type KunciStok = {
  varianId: string;
  grade: "a" | "b" | "c" | "reject";
  gudangId: string;
  batch?: string | null;
};

export type JenisMutasiFg =
  | "hasil_produksi"
  | "transfer"
  | "penyesuaian"
  | "barang_rusak"
  | "sample"
  | "giveaway"
  | "penjualan"
  | "retur_penjualan"
  | "pemusnahan"
  | "perubahan_grade";

/** Ambil baris stok untuk kunci komposit, buat kalau belum ada. Baris di-LOCK. */
async function ambilAtauBuatBarisStok(tx: Tx, kunci: KunciStok) {
  const batch = kunci.batch ?? "";

  const [ada] = await tx
    .select()
    .from(stokBarangJadi)
    .where(
      and(
        eq(stokBarangJadi.varianId, kunci.varianId),
        eq(stokBarangJadi.grade, kunci.grade),
        eq(stokBarangJadi.gudangId, kunci.gudangId),
        eq(stokBarangJadi.batch, batch),
      ),
    )
    .for("update")
    .limit(1);

  if (ada) return ada;

  const [baru] = await tx
    .insert(stokBarangJadi)
    .values({
      varianId: kunci.varianId,
      grade: kunci.grade,
      gudangId: kunci.gudangId,
      batch,
      kuantitas: 0,
    })
    .returning();

  return baru;
}

/**
 * Catat satu mutasi + perbarui cache kuantitas, dalam transaksi pemanggil.
 * jumlah positif = masuk, negatif = keluar.
 */
export async function catatMutasiFg(
  tx: Tx,
  args: {
    kunci: KunciStok;
    jenis: JenisMutasiFg;
    jumlah: number;
    referensiTipe?: string | null;
    referensiId?: string | null;
    catatan?: string | null;
    userId: string;
    /** true = tolak kalau stok jadi negatif (default true) */
    cegahNegatif?: boolean;
  },
): Promise<{ error?: string }> {
  if (args.jumlah === 0) return { error: "Jumlah mutasi tidak boleh nol" };

  const baris = await ambilAtauBuatBarisStok(tx, args.kunci);
  const stokBaru = baris.kuantitas + args.jumlah;

  if ((args.cegahNegatif ?? true) && stokBaru < 0) {
    return {
      error: `Stok tidak cukup (tersedia ${baris.kuantitas}, diminta ${Math.abs(args.jumlah)})`,
    };
  }

  await tx.insert(mutasiBarangJadi).values({
    stokBarangJadiId: baris.id,
    jenis: args.jenis,
    jumlah: args.jumlah,
    referensiTipe: args.referensiTipe ?? null,
    referensiId: args.referensiId ?? null,
    catatan: args.catatan ?? null,
    createdBy: args.userId,
  });

  // cache, bukan sumber kebenaran — sumbernya ledger mutasi di atas
  await tx
    .update(stokBarangJadi)
    .set({ kuantitas: stokBaru, updatedAt: new Date() })
    .where(eq(stokBarangJadi.id, baris.id));

  return {};
}

/** Stok siap jual DERIVED (PRD §25) — bukan kolom tersimpan. */
export const stokSiapJualSql = sql<number>`(
  ${stokBarangJadi.kuantitas} - ${stokBarangJadi.stokDitahan}
  - ${stokBarangJadi.stokRusak} - ${stokBarangJadi.stokReservasi}
)`;
