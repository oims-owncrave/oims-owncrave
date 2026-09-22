"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penerimaanQc,
  penerimaanQcDetail,
  penerimaanHasilJahit,
  penerimaanHasilJahitDetail,
  penugasanJahit,
  penugasanJahitDetail,
  bundling,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  penjahit,
  lokasiProduksi,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { sudahKeQcSql } from "@/lib/qc/rekap";
import type { PenerimaanQcInput } from "@/lib/schemas/penerimaan-qc";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type Row = typeof penerimaanQc.$inferSelect;
type Result = { data?: Row; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505"
  );
}

async function writeAudit(
  tx: Pick<typeof db, "insert">,
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await tx.insert(auditLog).values({
    userId,
    aksi,
    tabel: "penerimaan_qc",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

/**
 * Antrean kirim ke QC — DERIVED, bukan tabel.
 * Vendor ber-qcMode 'vendor' DILEWATI: QC sudah dilakukan di tempat vendor
 * (referensi §6), jadi tak boleh masuk antrean QC internal.
 */
export async function listAntreanKirimQc() {
  await requireRole([...READ_ROLES]);

  const rows = await db
    .select({
      penerimaanHasilDetailId: penerimaanHasilJahitDetail.id,
      penerimaanHasilId: penerimaanHasilJahit.id,
      nomorPenerimaan: penerimaanHasilJahit.nomorDokumen,
      tanggalTerima: penerimaanHasilJahit.tanggalJam,
      poId: poProduksi.id,
      nomorPo: poProduksi.nomorDokumen,
      vendorId: vendor.id,
      pihakNama,
      bundelNomor: bundling.nomorDokumen,
      varianId: varianProduk.id,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlahBaik: penerimaanHasilJahitDetail.jumlahBaik,
      sudahKeQc: sudahKeQcSql,
    })
    .from(penerimaanHasilJahitDetail)
    .innerJoin(
      penerimaanHasilJahit,
      eq(penerimaanHasilJahitDetail.penerimaanId, penerimaanHasilJahit.id),
    )
    .innerJoin(
      penugasanJahitDetail,
      eq(penerimaanHasilJahitDetail.penugasanDetailId, penugasanJahitDetail.id),
    )
    .innerJoin(penugasanJahit, eq(penugasanJahitDetail.penugasanId, penugasanJahit.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(
      and(
        isNull(penerimaanHasilJahit.deletedAt),
        // QC di vendor → tidak masuk antrean internal. Penjahit internal (vendorId null)
        // tetap masuk antrean.
        sql`COALESCE(${vendor.qcMode}, 'internal') = 'internal'`,
        sql`${penerimaanHasilJahitDetail.jumlahBaik} - ${sudahKeQcSql} > 0`,
      ),
    )
    .orderBy(penerimaanHasilJahit.tanggalJam);

  return rows.map((r) => ({
    ...r,
    sisa: Number(r.jumlahBaik) - Number(r.sudahKeQc),
  }));
}

export type AntreanQcRow = Awaited<ReturnType<typeof listAntreanKirimQc>>[number];

export async function listPenerimaanQc() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: penerimaanQc.id,
      nomorDokumen: penerimaanQc.nomorDokumen,
      tanggal: penerimaanQc.tanggal,
      penerimaId: penerimaanQc.penerimaId,
      penerima: penerimaanQc.penerima,
      prioritas: penerimaanQc.prioritas,
      targetSelesai: penerimaanQc.targetSelesai,
      nomorPo: poProduksi.nomorDokumen,
      vendorNama: vendor.nama,
      nomorPenerimaanHasil: penerimaanHasilJahit.nomorDokumen,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah_pcs), 0)::int
        FROM penerimaan_qc_detail d WHERE d.penerimaan_qc_id = ${penerimaanQc.id}
      )`,
    })
    .from(penerimaanQc)
    .innerJoin(
      penerimaanHasilJahit,
      eq(penerimaanQc.penerimaanHasilJahitId, penerimaanHasilJahit.id),
    )
    .leftJoin(poProduksi, eq(penerimaanQc.poId, poProduksi.id))
    .leftJoin(vendor, eq(penerimaanQc.vendorId, vendor.id))
    .where(isNull(penerimaanQc.deletedAt))
    .orderBy(desc(penerimaanQc.tanggal));
}

export async function getPenerimaanQcDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: penerimaanQc.id,
      nomorDokumen: penerimaanQc.nomorDokumen,
      tanggal: penerimaanQc.tanggal,
      penerima: penerimaanQc.penerima,
      prioritas: penerimaanQc.prioritas,
      targetSelesai: penerimaanQc.targetSelesai,
      catatan: penerimaanQc.catatan,
      nomorPo: poProduksi.nomorDokumen,
      vendorNama: vendor.nama,
      lokasiNama: lokasiProduksi.nama,
      nomorPenerimaanHasil: penerimaanHasilJahit.nomorDokumen,
    })
    .from(penerimaanQc)
    .innerJoin(
      penerimaanHasilJahit,
      eq(penerimaanQc.penerimaanHasilJahitId, penerimaanHasilJahit.id),
    )
    .leftJoin(poProduksi, eq(penerimaanQc.poId, poProduksi.id))
    .leftJoin(vendor, eq(penerimaanQc.vendorId, vendor.id))
    .leftJoin(lokasiProduksi, eq(penerimaanQc.lokasiId, lokasiProduksi.id))
    .where(and(eq(penerimaanQc.id, id), isNull(penerimaanQc.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: penerimaanQcDetail.id,
      jumlahPcs: penerimaanQcDetail.jumlahPcs,
      catatan: penerimaanQcDetail.catatan,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
    })
    .from(penerimaanQcDetail)
    .innerJoin(
      penerimaanHasilJahitDetail,
      eq(penerimaanQcDetail.penerimaanHasilDetailId, penerimaanHasilJahitDetail.id),
    )
    .innerJoin(
      penugasanJahitDetail,
      eq(penerimaanHasilJahitDetail.penugasanDetailId, penugasanJahitDetail.id),
    )
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(penerimaanQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(penerimaanQcDetail.penerimaanQcId, id))
    .orderBy(bundling.nomorDokumen);

  return { header, details };
}

export async function createPenerimaanQc(input: PenerimaanQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [sumber] = await tx
          .select({
            id: penerimaanHasilJahit.id,
            penugasanId: penerimaanHasilJahit.penugasanId,
            poId: penugasanJahit.poId,
            vendorId: penugasanJahit.vendorId,
            qcMode: vendor.qcMode,
          })
          .from(penerimaanHasilJahit)
          .innerJoin(penugasanJahit, eq(penerimaanHasilJahit.penugasanId, penugasanJahit.id))
          .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
          .where(
            and(
              eq(penerimaanHasilJahit.id, input.penerimaanHasilJahitId),
              isNull(penerimaanHasilJahit.deletedAt),
            ),
          )
          .limit(1);

        if (!sumber) return { error: "Penerimaan hasil jahit tidak ditemukan" };
        if (sumber.qcMode === "vendor") {
          return {
            error: "Vendor ini melakukan QC sendiri — hasilnya tidak masuk antrean QC internal",
          };
        }

        // GUARD: hitung ULANG sisa di dalam transaksi, jangan percaya angka client
        const capRows = await tx
          .select({
            id: penerimaanHasilJahitDetail.id,
            sisa: sql<number>`${penerimaanHasilJahitDetail.jumlahBaik} - ${sudahKeQcSql}`,
          })
          .from(penerimaanHasilJahitDetail)
          .where(eq(penerimaanHasilJahitDetail.penerimaanId, input.penerimaanHasilJahitId));

        const capMap = new Map(capRows.map((r) => [r.id, Number(r.sisa)]));

        for (const d of input.details) {
          const sisa = capMap.get(d.penerimaanHasilDetailId);
          if (sisa === undefined) {
            return { error: "Ada baris yang bukan milik penerimaan hasil jahit ini" };
          }
          if (d.jumlahPcs > sisa) {
            return {
              error: `Jumlah ke QC melebihi sisa siap QC (sisa ${sisa} pcs)`,
            };
          }
        }

        const nomorDokumen = await generateDocNumber("IN-QC", "penerimaan_qc");

        const [header] = await tx
          .insert(penerimaanQc)
          .values({
            nomorDokumen,
            penerimaanHasilJahitId: input.penerimaanHasilJahitId,
            poId: sumber.poId,
            vendorId: sumber.vendorId,
            tanggal: new Date(input.tanggal),
            lokasiId: input.lokasiId || null,
            penerimaId: input.penerimaId || null,
            penerima: input.penerima,
            prioritas: input.prioritas,
            targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // SEQUENTIAL — jangan Promise.all (race di satu connection)
        for (const d of input.details) {
          await tx.insert(penerimaanQcDetail).values({
            penerimaanQcId: header.id,
            penerimaanHasilDetailId: d.penerimaanHasilDetailId,
            varianId: d.varianId,
            jumlahPcs: d.jumlahPcs,
            catatan: d.catatan || null,
          });
        }

        await writeAudit(tx, "CREATE", header.id, null, { header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

export async function softDeletePenerimaanQc(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  // TODO(oims-ckp.5): tolak hapus kalau detailnya sudah masuk Work Order QC

  const [before] = await db
    .select()
    .from(penerimaanQc)
    .where(and(eq(penerimaanQc.id, id), isNull(penerimaanQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Penerimaan QC tidak ditemukan" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(penerimaanQc)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(penerimaanQc.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}
