"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  barangMasuk,
  barangMasukDetail,
  mutasiStok,
  bahan,
  stok,
  supplier,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { BarangMasukInput } from "@/lib/schemas/barang-masuk";

/** Round ke 2 desimal (money numeric(15,2)) — cegah drift float antar detail line. */
function money2(n: number): string {
  return n.toFixed(2);
}

/**
 * Buat barang masuk (header + detail). Efek per detail:
 * - insert barang_masuk_detail
 * - append mutasi_stok (tipe masuk, immutable ledger)
 * - update bahan.hargaRataRata (weighted average)
 * - update stok.kuantitas cache (turunan dari mutasi, bukan edit arbitrary)
 *
 * FIX concurrency:
 * - FIX 1: SELECT ... FOR UPDATE di stok + bahan per line → cegah lost-update saat
 *   2 barang-masuk bahan sama concurrent (READ COMMITTED default Postgres).
 * - FIX 2: round money 2 desimal sebelum store.
 * - FIX 3: retry seluruh transaksi on unique-violation nomor dokumen (23505).
 * - FIX 4: loop detail SEQUENTIAL (for...of) — JANGAN Promise.all (race di 1 connection).
 */
export async function createBarangMasuk(
  input: BarangMasukInput,
): Promise<{ data?: typeof barangMasuk.$inferSelect; error?: string }> {
  const user = await requireRole(["owner", "admin_gudang"]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("BM", "barang_masuk");

        // 1. header
        const [header] = await tx
          .insert(barangMasuk)
          .values({
            nomorDokumen,
            supplierId: input.supplierId || null,
            nomorInvoice: input.nomorInvoice || null,
            tanggal: new Date(input.tanggal),
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // 2. per detail — SEQUENTIAL (FIX 4: jangan Promise.all, race di 1 connection)
        for (const d of input.detail) {
          const subtotal = d.kuantitas * d.hargaSatuan;

          await tx.insert(barangMasukDetail).values({
            barangMasukId: header.id,
            bahanId: d.bahanId,
            kuantitas: String(d.kuantitas),
            hargaSatuan: money2(d.hargaSatuan),
            subtotal: money2(subtotal),
          });

          // append mutasi (append-only ledger — JANGAN update/delete)
          await tx.insert(mutasiStok).values({
            bahanId: d.bahanId,
            tipe: "masuk",
            kuantitas: String(d.kuantitas),
            barangMasukId: header.id,
            createdBy: user.id,
          });

          // FIX 1: lock stok + bahan row → serialize concurrent barang-masuk bahan sama
          const [s] = await tx
            .select()
            .from(stok)
            .where(eq(stok.bahanId, d.bahanId))
            .for("update")
            .limit(1);
          const [b] = await tx
            .select()
            .from(bahan)
            .where(eq(bahan.id, d.bahanId))
            .for("update")
            .limit(1);

          const stokLama = Number(s?.kuantitas ?? 0);
          const hargaLama = Number(b.hargaRataRata);
          const totalQty = stokLama + d.kuantitas;
          const hargaBaru =
            totalQty > 0
              ? (stokLama * hargaLama + d.kuantitas * d.hargaSatuan) / totalQty
              : d.hargaSatuan;

          // weighted average (FIX 2: round 2 desimal)
          await tx
            .update(bahan)
            .set({ hargaRataRata: money2(hargaBaru), updatedAt: new Date() })
            .where(eq(bahan.id, d.bahanId));

          // update stok cache (turunan dari mutasi)
          await tx
            .update(stok)
            .set({ kuantitas: String(totalQty), updatedAt: new Date() })
            .where(eq(stok.bahanId, d.bahanId));
        }

        // audit (1 entry untuk header + detail)
        await tx.insert(auditLog).values({
          userId: user.id,
          aksi: "CREATE",
          tabel: "barang_masuk",
          recordId: header.id,
          dataBefore: null,
          dataAfter: JSON.stringify({ header, detail: input.detail }),
        });

        return { data: header };
      });
    } catch (e: unknown) {
      // FIX 3: retry on unique-violation nomor dokumen (race → DB reject → coba lagi)
      const code = (e as { code?: string })?.code;
      const isDupeDocNo =
        code === "23505" &&
        String((e as { message?: string })?.message ?? "").includes(
          "nomor_dokumen",
        );
      if (isDupeDocNo && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  // unreachable (loop return atau throw), tapi TS butuh
  return { error: "Gagal membuat nomor dokumen setelah beberapa percobaan" };
}

/** List barang masuk (header + supplier nama + total). Server-side pagination di consumer. */
export async function listBarangMasuk() {
  await requireRole(["owner", "admin_gudang", "keuangan", "viewer"]);
  return db
    .select({
      id: barangMasuk.id,
      nomorDokumen: barangMasuk.nomorDokumen,
      tanggal: barangMasuk.tanggal,
      supplierNama: supplier.nama,
      nomorInvoice: barangMasuk.nomorInvoice,
      createdAt: barangMasuk.createdAt,
    })
    .from(barangMasuk)
    .leftJoin(supplier, eq(barangMasuk.supplierId, supplier.id))
    .orderBy(desc(barangMasuk.tanggal), desc(barangMasuk.createdAt));
}

/** Detail 1 transaksi barang masuk (header + baris detail + nama bahan). Read-only. */
export async function getBarangMasukDetail(id: string) {
  await requireRole(["owner", "admin_gudang", "keuangan", "viewer"]);

  const [header] = await db
    .select({
      id: barangMasuk.id,
      nomorDokumen: barangMasuk.nomorDokumen,
      tanggal: barangMasuk.tanggal,
      supplierNama: supplier.nama,
      nomorInvoice: barangMasuk.nomorInvoice,
      catatan: barangMasuk.catatan,
      createdAt: barangMasuk.createdAt,
    })
    .from(barangMasuk)
    .leftJoin(supplier, eq(barangMasuk.supplierId, supplier.id))
    .where(eq(barangMasuk.id, id))
    .limit(1);

  if (!header) return { error: "Barang masuk tidak ditemukan" };

  const detail = await db
    .select({
      id: barangMasukDetail.id,
      bahanNama: bahan.nama,
      bahanKode: bahan.kode,
      kuantitas: barangMasukDetail.kuantitas,
      hargaSatuan: barangMasukDetail.hargaSatuan,
      subtotal: barangMasukDetail.subtotal,
    })
    .from(barangMasukDetail)
    .leftJoin(bahan, eq(barangMasukDetail.bahanId, bahan.id))
    .where(eq(barangMasukDetail.barangMasukId, id));

  return { data: { header, detail } };
}

/** Riwayat 5 harga pembelian terakhir untuk suatu bahan. */
export type RiwayatHargaBahanItem = {
  tanggal: Date;
  hargaSatuan: string;
};

export async function getRiwayatHargaBahan(
  bahanId: string,
): Promise<RiwayatHargaBahanItem[]> {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  if (!bahanId) return [];

  return db
    .select({
      tanggal: barangMasuk.tanggal,
      hargaSatuan: barangMasukDetail.hargaSatuan,
    })
    .from(barangMasukDetail)
    .innerJoin(barangMasuk, eq(barangMasukDetail.barangMasukId, barangMasuk.id))
    .where(eq(barangMasukDetail.bahanId, bahanId))
    .orderBy(desc(barangMasuk.tanggal))
    .limit(5);
}

