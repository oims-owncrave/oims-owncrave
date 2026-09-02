"use server";

import { and, desc, eq, isNull, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penerimaanCutting,
  penerimaanCuttingDetail,
  barangKeluar,
  barangKeluarDetail,
  permintaanBahan,
  poProduksi,
  produk,
  bahan,
  satuan,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { PenerimaanInput } from "@/lib/schemas/penerimaan-cutting";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

export async function listPenerimaan() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: penerimaanCutting.id,
      nomorDokumen: penerimaanCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      bkNomor: barangKeluar.nomorDokumen,
      tanggalTerima: penerimaanCutting.tanggalTerima,
      jumlahBahan: sql<number>`(SELECT COUNT(*)::int FROM penerimaan_cutting_detail WHERE penerimaan_cutting_detail.penerimaan_id = ${penerimaanCutting.id})`,
      adaSelisih: sql<boolean>`EXISTS (SELECT 1 FROM penerimaan_cutting_detail d WHERE d.penerimaan_id = ${penerimaanCutting.id} AND d.jumlah_diterima <> d.jumlah_gudang)`,
    })
    .from(penerimaanCutting)
    .innerJoin(poProduksi, eq(penerimaanCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(barangKeluar, eq(penerimaanCutting.barangKeluarId, barangKeluar.id))
    .where(isNull(penerimaanCutting.deletedAt))
    .orderBy(desc(penerimaanCutting.createdAt));
}

export type PenerimaanListRow = Awaited<ReturnType<typeof listPenerimaan>>[number];

export async function getPenerimaanDetail(id: string) {
  await requireRole([...READ_ROLES]);
  const [header] = await db
    .select({
      id: penerimaanCutting.id,
      nomorDokumen: penerimaanCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      bkNomor: barangKeluar.nomorDokumen,
      tanggalSerah: penerimaanCutting.tanggalSerah,
      tanggalTerima: penerimaanCutting.tanggalTerima,
      catatan: penerimaanCutting.catatan,
      createdAt: penerimaanCutting.createdAt,
    })
    .from(penerimaanCutting)
    .innerJoin(poProduksi, eq(penerimaanCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(barangKeluar, eq(penerimaanCutting.barangKeluarId, barangKeluar.id))
    .where(and(eq(penerimaanCutting.id, id), isNull(penerimaanCutting.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: penerimaanCuttingDetail.id,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      jumlahGudang: penerimaanCuttingDetail.jumlahGudang,
      jumlahDiterima: penerimaanCuttingDetail.jumlahDiterima,
      kondisi: penerimaanCuttingDetail.kondisi,
      catatan: penerimaanCuttingDetail.catatan,
    })
    .from(penerimaanCuttingDetail)
    .innerJoin(bahan, eq(penerimaanCuttingDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(penerimaanCuttingDetail.penerimaanId, id))
    .orderBy(bahan.nama);

  return { ...header, details };
}

export type PenerimaanDetailData = NonNullable<Awaited<ReturnType<typeof getPenerimaanDetail>>>;

/** BK ber-PB yang belum diterima cutting — kandidat penerimaan. */
export async function listBkSiapTerima() {
  await requireRole([...WRITE_ROLES]);

  const sudahDiterima = db
    .select({ id: penerimaanCutting.barangKeluarId })
    .from(penerimaanCutting)
    .where(isNull(penerimaanCutting.deletedAt));

  return db
    .select({
      id: barangKeluar.id,
      nomorDokumen: barangKeluar.nomorDokumen,
      tanggal: barangKeluar.tanggal,
      pbNomor: permintaanBahan.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
    })
    .from(barangKeluar)
    .innerJoin(permintaanBahan, eq(barangKeluar.permintaanBahanId, permintaanBahan.id))
    .innerJoin(poProduksi, eq(permintaanBahan.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(notInArray(barangKeluar.id, sudahDiterima))
    .orderBy(desc(barangKeluar.tanggal));
}

export type BkSiapTerima = Awaited<ReturnType<typeof listBkSiapTerima>>[number];

/** Baris prefill form penerimaan: detail BK + info bahan. */
export async function getBkPrefill(barangKeluarId: string) {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      bahanId: barangKeluarDetail.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      kuantitas: barangKeluarDetail.kuantitas,
    })
    .from(barangKeluarDetail)
    .innerJoin(bahan, eq(barangKeluarDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(barangKeluarDetail.barangKeluarId, barangKeluarId))
    .orderBy(bahan.nama);
}

export type BkPrefillRow = Awaited<ReturnType<typeof getBkPrefill>>[number];

export async function createPenerimaan(
  input: PenerimaanInput,
): Promise<{ data?: typeof penerimaanCutting.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  // Re-derive rantai server-side: BK → PB → PO (jangan percaya client)
  const [bk] = await db
    .select()
    .from(barangKeluar)
    .where(eq(barangKeluar.id, input.barangKeluarId))
    .limit(1);
  if (!bk) return { error: "Barang keluar tidak ditemukan" };
  if (!bk.permintaanBahanId) {
    return { error: "Barang keluar ini tidak ter-link permintaan bahan — tidak bisa diterima cutting" };
  }

  const [pb] = await db
    .select({ poId: permintaanBahan.poId })
    .from(permintaanBahan)
    .where(eq(permintaanBahan.id, bk.permintaanBahanId))
    .limit(1);
  if (!pb) return { error: "Permintaan bahan tidak ditemukan" };

  const [existing] = await db
    .select({ id: penerimaanCutting.id })
    .from(penerimaanCutting)
    .where(
      and(
        eq(penerimaanCutting.barangKeluarId, input.barangKeluarId),
        isNull(penerimaanCutting.deletedAt),
      ),
    )
    .limit(1);
  if (existing) return { error: "Barang keluar ini sudah pernah diterima" };

  // jumlah_gudang otoritatif dari barang_keluar_detail (bukan dari client)
  const bkDetails = await db
    .select({ bahanId: barangKeluarDetail.bahanId, kuantitas: barangKeluarDetail.kuantitas })
    .from(barangKeluarDetail)
    .where(eq(barangKeluarDetail.barangKeluarId, input.barangKeluarId));
  const gudangMap = new Map(bkDetails.map((d) => [d.bahanId, d.kuantitas]));

  for (const d of input.details) {
    if (!gudangMap.has(d.bahanId)) {
      return { error: "Ada bahan yang tidak berasal dari barang keluar ini" };
    }
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("PC", "penerimaan_cutting");
        const [header] = await tx
          .insert(penerimaanCutting)
          .values({
            nomorDokumen,
            poId: pb.poId,
            barangKeluarId: input.barangKeluarId,
            tanggalSerah: bk.tanggal,
            tanggalTerima: new Date(input.tanggalTerima),
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(penerimaanCuttingDetail).values(
          input.details.map((d) => ({
            penerimaanId: header.id,
            bahanId: d.bahanId,
            jumlahGudang: gudangMap.get(d.bahanId)!,
            jumlahDiterima: String(d.jumlahDiterima),
            kondisi: d.kondisi,
            catatan: d.catatan?.trim() || null,
          })),
        );

        await tx.insert(auditLog).values({
          userId: user.id,
          aksi: "CREATE",
          tabel: "penerimaan_cutting",
          recordId: header.id,
          dataBefore: null,
          dataAfter: JSON.stringify({ header, details: input.details }),
        });

        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat penerimaan — coba lagi" };
}
