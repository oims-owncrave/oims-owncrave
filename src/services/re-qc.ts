"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  reQc,
  reQcDetail,
  perbaikanInternal,
  perbaikanInternalDetail,
  returQcVendor,
  returQcVendorDetail,
  hasilQc,
  hasilQcDetail,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { ReQc } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { ReQcInput } from "@/lib/schemas/re-qc";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: ReQc; error?: string };

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
    tabel: "re_qc",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/**
 * Sumber Re-QC: perbaikan internal SELESAI atau retur vendor DITERIMA KEMBALI.
 * Sisa = jumlah dikirim rework − yang sudah di-Re-QC (DERIVED).
 */
export async function listSumberReQc() {
  await requireRole([...READ_ROLES]);

  const internal = await db
    .select({
      jalur: sql<string>`'internal'`,
      sumberId: perbaikanInternal.id,
      nomorSumber: perbaikanInternal.nomorDokumen,
      hasilQcAwalId: perbaikanInternal.hasilQcId,
      nomorHasilQc: hasilQc.nomorDokumen,
      hasilQcDetailId: perbaikanInternalDetail.hasilQcDetailId,
      varianId: perbaikanInternalDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlahRework: perbaikanInternalDetail.jumlah,
      jenisCacatId: perbaikanInternalDetail.jenisCacatId,
      sudahReQc: sql<number>`(
        SELECT COALESCE(SUM(rd.jumlah), 0)::int
        FROM re_qc_detail rd
        JOIN re_qc r ON r.id = rd.re_qc_id
        WHERE r.perbaikan_internal_id = ${perbaikanInternal.id}
          AND rd.hasil_qc_detail_id = ${perbaikanInternalDetail.hasilQcDetailId}
          AND r.deleted_at IS NULL
      )`,
    })
    .from(perbaikanInternalDetail)
    .innerJoin(
      perbaikanInternal,
      eq(perbaikanInternalDetail.perbaikanInternalId, perbaikanInternal.id),
    )
    .innerJoin(hasilQc, eq(perbaikanInternal.hasilQcId, hasilQc.id))
    .innerJoin(varianProduk, eq(perbaikanInternalDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(
      and(isNull(perbaikanInternal.deletedAt), eq(perbaikanInternal.status, "selesai")),
    );

  const vendor = await db
    .select({
      jalur: sql<string>`'vendor'`,
      sumberId: returQcVendor.id,
      nomorSumber: returQcVendor.nomorDokumen,
      hasilQcAwalId: returQcVendor.hasilQcId,
      nomorHasilQc: hasilQc.nomorDokumen,
      hasilQcDetailId: returQcVendorDetail.hasilQcDetailId,
      varianId: returQcVendorDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlahRework: returQcVendorDetail.jumlah,
      jenisCacatId: returQcVendorDetail.jenisCacatId,
      sudahReQc: sql<number>`(
        SELECT COALESCE(SUM(rd.jumlah), 0)::int
        FROM re_qc_detail rd
        JOIN re_qc r ON r.id = rd.re_qc_id
        WHERE r.retur_qc_vendor_id = ${returQcVendor.id}
          AND rd.hasil_qc_detail_id = ${returQcVendorDetail.hasilQcDetailId}
          AND r.deleted_at IS NULL
      )`,
    })
    .from(returQcVendorDetail)
    .innerJoin(returQcVendor, eq(returQcVendorDetail.returQcVendorId, returQcVendor.id))
    .innerJoin(hasilQc, eq(returQcVendor.hasilQcId, hasilQc.id))
    .innerJoin(varianProduk, eq(returQcVendorDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(
      and(
        isNull(returQcVendor.deletedAt),
        sql`${returQcVendor.status} IN ('diterima_kembali', 'selesai')`,
      ),
    );

  return [...internal, ...vendor]
    .map((r) => ({ ...r, sisa: r.jumlahRework - Number(r.sudahReQc) }))
    .filter((r) => r.sisa > 0);
}

export type SumberReQcRow = Awaited<ReturnType<typeof listSumberReQc>>[number];

export async function listReQc() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: reQc.id,
      nomorDokumen: reQc.nomorDokumen,
      tanggal: reQc.tanggal,
      putaran: reQc.putaran,
      nomorHasilQcAwal: hasilQc.nomorDokumen,
      nomorPerbaikan: perbaikanInternal.nomorDokumen,
      nomorRetur: returQcVendor.nomorDokumen,
      petugasNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int FROM re_qc_detail d WHERE d.re_qc_id = ${reQc.id}
      )`,
      lolos: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int FROM re_qc_detail d
        WHERE d.re_qc_id = ${reQc.id} AND d.hasil_re_qc = 'lolos'
      )`,
      ulang: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int FROM re_qc_detail d
        WHERE d.re_qc_id = ${reQc.id} AND d.hasil_re_qc = 'perbaikan_ulang'
      )`,
      turun: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int FROM re_qc_detail d
        WHERE d.re_qc_id = ${reQc.id} AND d.hasil_re_qc = 'grade_turun'
      )`,
      reject: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int FROM re_qc_detail d
        WHERE d.re_qc_id = ${reQc.id} AND d.hasil_re_qc = 'reject'
      )`,
    })
    .from(reQc)
    .innerJoin(hasilQc, eq(reQc.hasilQcAwalId, hasilQc.id))
    .leftJoin(perbaikanInternal, eq(reQc.perbaikanInternalId, perbaikanInternal.id))
    .leftJoin(returQcVendor, eq(reQc.returQcVendorId, returQcVendor.id))
    .leftJoin(users, eq(reQc.petugasId, users.id))
    .where(isNull(reQc.deletedAt))
    .orderBy(desc(reQc.tanggal));
}

export type ReQcRow = Awaited<ReturnType<typeof listReQc>>[number];

export async function createReQc(input: ReQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // putaran = berapa kali baris hasil QC ini sudah di-Re-QC + 1
        const [putaranRow] = await tx
          .select({
            n: sql<number>`COALESCE(MAX(${reQc.putaran}), 0)::int`,
          })
          .from(reQc)
          .where(and(eq(reQc.hasilQcAwalId, input.hasilQcAwalId), isNull(reQc.deletedAt)));

        const nomorDokumen = await generateDocNumber("RE-QC", "re_qc");

        const [header] = await tx
          .insert(reQc)
          .values({
            nomorDokumen,
            hasilQcAwalId: input.hasilQcAwalId,
            perbaikanInternalId: input.perbaikanInternalId || null,
            returQcVendorId: input.returQcVendorId || null,
            tanggal: new Date(input.tanggal),
            petugasId: input.petugasId || null,
            putaran: Number(putaranRow?.n ?? 0) + 1,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(reQcDetail).values({
            reQcId: header.id,
            hasilQcDetailId: d.hasilQcDetailId,
            varianId: d.varianId,
            jumlah: d.jumlah,
            cacatSebelumnyaId: d.cacatSebelumnyaId || null,
            hasilPerbaikan: d.hasilPerbaikan || null,
            hasilReQc: d.hasilReQc,
            gradeAkhir: d.gradeAkhir || null,
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

/** Baris Re-QC berhasil lolos / grade turun — siap masuk finishing (.11). */
export async function listReQcLolos() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      reQcDetailId: reQcDetail.id,
      reQcId: reQc.id,
      nomorReQc: reQc.nomorDokumen,
      hasilQcDetailId: reQcDetail.hasilQcDetailId,
      varianId: reQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlah: reQcDetail.jumlah,
      gradeAkhir: reQcDetail.gradeAkhir,
      hasilReQc: reQcDetail.hasilReQc,
    })
    .from(reQcDetail)
    .innerJoin(reQc, eq(reQcDetail.reQcId, reQc.id))
    .innerJoin(varianProduk, eq(reQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(
      and(isNull(reQc.deletedAt), sql`${reQcDetail.hasilReQc} IN ('lolos', 'grade_turun')`),
    )
    .orderBy(desc(reQc.tanggal));
}
