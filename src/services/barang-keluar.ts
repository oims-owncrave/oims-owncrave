"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  barangKeluar,
  barangKeluarDetail,
  mutasiStok,
  bahan,
  stok,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { BarangKeluarInput } from "@/lib/schemas/barang-keluar";

/** Round ke 2 desimal (money numeric(15,2)) — cegah drift float antar detail line. */
function money2(n: number): string {
  return n.toFixed(2);
}

export async function createBarangKeluar(
  input: BarangKeluarInput,
): Promise<{ data?: typeof barangKeluar.$inferSelect; error?: string }> {
  const user = await requireRole(["owner", "admin_gudang"]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // GUARD stok cukup — agregasi qty per bahanId dulu (cegah duplicate bahanId lolos)
        // lalu lock row + cek tersedia sekaligus
        const qtyPerBahan = new Map<string, number>();
        for (const d of input.detail) {
          qtyPerBahan.set(d.bahanId, (qtyPerBahan.get(d.bahanId) ?? 0) + d.kuantitas);
        }

        // Map: bahanId → { stokRow, bahanRow } — cache hasil lock, reuse di detail loop
        type GuardCache = { kuantitas: number; hargaRataRata: number; namaBahan: string };
        const guardCache = new Map<string, GuardCache>();

        for (const [bahanId, totalQty] of qtyPerBahan) {
          const [s] = await tx
            .select()
            .from(stok)
            .where(eq(stok.bahanId, bahanId))
            .for("update")
            .limit(1);
          const [b] = await tx
            .select({ nama: bahan.nama, hargaRataRata: bahan.hargaRataRata })
            .from(bahan)
            .where(eq(bahan.id, bahanId))
            .limit(1);

          if (!b) throw new Error("Bahan tidak ditemukan");

          const tersedia = Number(s?.kuantitas ?? 0);
          if (totalQty > tersedia) {
            throw new Error(
              `Stok ${b.nama} tidak cukup (tersedia ${tersedia}, dibutuhkan ${totalQty})`,
            );
          }

          guardCache.set(bahanId, {
            kuantitas: tersedia,
            hargaRataRata: Number(b.hargaRataRata),
            namaBahan: b.nama,
          });
        }

        const nomorDokumen = await generateDocNumber("BK", "barang_keluar");

        // 1. header
        const [header] = await tx
          .insert(barangKeluar)
          .values({
            nomorDokumen,
            tujuan: input.tujuan || null,
            tanggal: new Date(input.tanggal),
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // 2. per detail — SEQUENTIAL (jangan Promise.all, race di 1 connection)
        // Reuse guardCache: snapshot harga dari guard loop, stok dikurangi bertahap
        const stokCache = new Map<string, number>(
          [...guardCache.entries()].map(([id, v]) => [id, v.kuantitas]),
        );

        for (const d of input.detail) {
          const cached = guardCache.get(d.bahanId)!;
          const hargaSnapshot = cached.hargaRataRata;
          const subtotal = d.kuantitas * hargaSnapshot;

          await tx.insert(barangKeluarDetail).values({
            barangKeluarId: header.id,
            bahanId: d.bahanId,
            kuantitas: String(d.kuantitas),
            hargaSatuan: money2(hargaSnapshot),
            subtotal: money2(subtotal),
          });

          // append mutasi — kuantitas NEGATIF
          await tx.insert(mutasiStok).values({
            bahanId: d.bahanId,
            tipe: "keluar",
            kuantitas: String(-d.kuantitas),
            barangKeluarId: header.id,
            createdBy: user.id,
          });

          // kurangi stok cache (in-memory, satu UPDATE per bahanId di akhir loop)
          stokCache.set(d.bahanId, (stokCache.get(d.bahanId) ?? 0) - d.kuantitas);
        }

        // Flush stok updates — satu UPDATE per bahanId (bukan per detail row)
        for (const [bahanId, stokBaru] of stokCache) {
          await tx
            .update(stok)
            .set({ kuantitas: String(stokBaru), updatedAt: new Date() })
            .where(eq(stok.bahanId, bahanId));
        }
        // hargaRataRata TIDAK diubah pada barang keluar

        await tx.insert(auditLog).values({
          userId: user.id,
          aksi: "CREATE",
          tabel: "barang_keluar",
          recordId: header.id,
          dataBefore: null,
          dataAfter: JSON.stringify({ header, detail: input.detail }),
        });

        return { data: header };
      });
    } catch (e: unknown) {
      // Return error ke client jika pesan error dari throw Error kami di block GUARD
      if (e instanceof Error && e.message.startsWith("Stok ")) {
        return { error: e.message };
      }

      // Retry on unique-violation nomor dokumen
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
  return { error: "Gagal membuat nomor dokumen setelah beberapa percobaan" };
}

export async function listBarangKeluar() {
  await requireRole(["owner", "admin_gudang", "keuangan", "viewer"]);
  return db
    .select({
      id: barangKeluar.id,
      nomorDokumen: barangKeluar.nomorDokumen,
      tanggal: barangKeluar.tanggal,
      tujuan: barangKeluar.tujuan,
      createdAt: barangKeluar.createdAt,
    })
    .from(barangKeluar)
    .orderBy(desc(barangKeluar.tanggal), desc(barangKeluar.createdAt));
}

export async function getBarangKeluarDetail(id: string) {
  await requireRole(["owner", "admin_gudang", "keuangan", "viewer"]);

  const [header] = await db
    .select({
      id: barangKeluar.id,
      nomorDokumen: barangKeluar.nomorDokumen,
      tanggal: barangKeluar.tanggal,
      tujuan: barangKeluar.tujuan,
      catatan: barangKeluar.catatan,
      createdAt: barangKeluar.createdAt,
    })
    .from(barangKeluar)
    .where(eq(barangKeluar.id, id))
    .limit(1);

  if (!header) return { error: "Barang keluar tidak ditemukan" };

  const detail = await db
    .select({
      id: barangKeluarDetail.id,
      bahanNama: bahan.nama,
      bahanKode: bahan.kode,
      kuantitas: barangKeluarDetail.kuantitas,
      hargaSatuan: barangKeluarDetail.hargaSatuan,
      subtotal: barangKeluarDetail.subtotal,
    })
    .from(barangKeluarDetail)
    .leftJoin(bahan, eq(barangKeluarDetail.bahanId, bahan.id))
    .where(eq(barangKeluarDetail.barangKeluarId, id));

  return { data: { header, detail } };
}
