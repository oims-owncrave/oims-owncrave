"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  hasilQc,
  hasilQcDetail,
  workOrderQc,
  workOrderQcDetail,
  temuanCacat,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  users,
  auditLog,
} from "@/db/schema";
import type { HasilQc } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { HasilQcInput } from "@/lib/schemas/hasil-qc";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: HasilQc; error?: string };

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
    tabel: "hasil_qc",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Bermasalah = semua yang bukan grade A. Dipakai defect rate (DERIVED). */
const bermasalahSql = sql<number>`(
  ${hasilQcDetail.gradeB} + ${hasilQcDetail.gradeC} +
  ${hasilQcDetail.perbaikan} + ${hasilQcDetail.reject}
)`;

export async function listHasilQc() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: hasilQc.id,
      nomorDokumen: hasilQc.nomorDokumen,
      tanggal: hasilQc.tanggal,
      status: hasilQc.status,
      nomorWo: workOrderQc.nomorDokumen,
      nomorPo: poProduksi.nomorDokumen,
      vendorNama: vendor.nama,
      petugasNama: users.displayName,
      diperiksa: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah_diperiksa), 0)::int
        FROM hasil_qc_detail d WHERE d.hasil_qc_id = ${hasilQc.id}
      )`,
      gradeA: sql<number>`(
        SELECT COALESCE(SUM(d.grade_a), 0)::int
        FROM hasil_qc_detail d WHERE d.hasil_qc_id = ${hasilQc.id}
      )`,
      perbaikan: sql<number>`(
        SELECT COALESCE(SUM(d.perbaikan), 0)::int
        FROM hasil_qc_detail d WHERE d.hasil_qc_id = ${hasilQc.id}
      )`,
      reject: sql<number>`(
        SELECT COALESCE(SUM(d.reject), 0)::int
        FROM hasil_qc_detail d WHERE d.hasil_qc_id = ${hasilQc.id}
      )`,
      bermasalah: sql<number>`(
        SELECT COALESCE(SUM(d.grade_b + d.grade_c + d.perbaikan + d.reject), 0)::int
        FROM hasil_qc_detail d WHERE d.hasil_qc_id = ${hasilQc.id}
      )`,
    })
    .from(hasilQc)
    .innerJoin(workOrderQc, eq(hasilQc.workOrderQcId, workOrderQc.id))
    .leftJoin(poProduksi, eq(hasilQc.poId, poProduksi.id))
    .leftJoin(vendor, eq(hasilQc.vendorId, vendor.id))
    .leftJoin(users, eq(hasilQc.petugasId, users.id))
    .where(isNull(hasilQc.deletedAt))
    .orderBy(desc(hasilQc.tanggal));
}

export type HasilQcRow = Awaited<ReturnType<typeof listHasilQc>>[number];

export async function getHasilQcDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: hasilQc.id,
      nomorDokumen: hasilQc.nomorDokumen,
      tanggal: hasilQc.tanggal,
      status: hasilQc.status,
      catatan: hasilQc.catatan,
      nomorWo: workOrderQc.nomorDokumen,
      workOrderQcId: hasilQc.workOrderQcId,
      nomorPo: poProduksi.nomorDokumen,
      vendorNama: vendor.nama,
      petugasNama: users.displayName,
      verifiedAt: hasilQc.verifiedAt,
    })
    .from(hasilQc)
    .innerJoin(workOrderQc, eq(hasilQc.workOrderQcId, workOrderQc.id))
    .leftJoin(poProduksi, eq(hasilQc.poId, poProduksi.id))
    .leftJoin(vendor, eq(hasilQc.vendorId, vendor.id))
    .leftJoin(users, eq(hasilQc.petugasId, users.id))
    .where(and(eq(hasilQc.id, id), isNull(hasilQc.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: hasilQcDetail.id,
      varianId: hasilQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlahDiperiksa: hasilQcDetail.jumlahDiperiksa,
      gradeA: hasilQcDetail.gradeA,
      gradeB: hasilQcDetail.gradeB,
      gradeC: hasilQcDetail.gradeC,
      perbaikan: hasilQcDetail.perbaikan,
      reject: hasilQcDetail.reject,
      catatan: hasilQcDetail.catatan,
      bermasalah: bermasalahSql,
      jumlahTemuan: sql<number>`(
        SELECT COALESCE(SUM(t.jumlah), 0)::int
        FROM temuan_cacat t WHERE t.hasil_qc_detail_id = ${hasilQcDetail.id}
      )`,
    })
    .from(hasilQcDetail)
    .innerJoin(varianProduk, eq(hasilQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(hasilQcDetail.hasilQcId, id))
    .orderBy(varianProduk.sku);

  return {
    header,
    details: details.map((d) => ({
      ...d,
      // DERIVED, bukan kolom tersimpan
      defectRate:
        d.jumlahDiperiksa > 0 ? (Number(d.bermasalah) / d.jumlahDiperiksa) * 100 : 0,
    })),
  };
}

export async function createHasilQc(input: HasilQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [wo] = await tx
          .select()
          .from(workOrderQc)
          .where(and(eq(workOrderQc.id, input.workOrderQcId), isNull(workOrderQc.deletedAt)))
          .limit(1);

        if (!wo) return { error: "Work Order QC tidak ditemukan" };
        if (wo.status === "draft") {
          return { error: "WO masih draft — mulai kerjakan dulu sebelum mencatat hasil" };
        }
        if (wo.status === "dibatalkan" || wo.status === "selesai") {
          return { error: `WO berstatus ${wo.status} — tidak bisa menambah hasil QC` };
        }

        const rows = input.details.filter((d) => d.jumlahDiperiksa > 0);
        const ids = rows.map((d) => d.workOrderQcDetailId);

        // Kapasitas per baris WO = pcs − yang sudah diperiksa (DERIVED, dihitung ulang di tx)
        const kapasitas = await tx
          .select({
            id: workOrderQcDetail.id,
            jumlahPcs: workOrderQcDetail.jumlahPcs,
            workOrderQcId: workOrderQcDetail.workOrderQcId,
            // nama tabel WAJIB eksplisit: ${workOrderQcDetail.id} ter-render jadi "id"
            // polos dan bentrok dengan hasil_qc_detail.id di subquery (42702 ambiguous)
            sudah: sql<number>`(
              SELECT COALESCE(SUM(hd.jumlah_diperiksa), 0)::int
              FROM hasil_qc_detail hd
              JOIN hasil_qc h ON h.id = hd.hasil_qc_id AND h.deleted_at IS NULL
              WHERE hd.work_order_qc_detail_id = work_order_qc_detail.id
            )`,
          })
          .from(workOrderQcDetail)
          .where(inArray(workOrderQcDetail.id, ids));

        const kapMap = new Map(kapasitas.map((r) => [r.id, r]));

        for (const d of rows) {
          const k = kapMap.get(d.workOrderQcDetailId);
          if (!k) return { error: "Ada baris yang bukan bagian dari WO ini" };
          if (k.workOrderQcId !== input.workOrderQcId) {
            return { error: "Ada baris milik Work Order lain" };
          }

          // GUARD keseimbangan — lapis kedua setelah Zod, sebelum DB CHECK
          const rincian = d.gradeA + d.gradeB + d.gradeC + d.perbaikan + d.reject;
          if (rincian !== d.jumlahDiperiksa) {
            return {
              error: `Rincian grade (${rincian}) tidak sama dengan jumlah diperiksa (${d.jumlahDiperiksa})`,
            };
          }

          const sisa = k.jumlahPcs - Number(k.sudah);
          if (d.jumlahDiperiksa > sisa) {
            return { error: `Jumlah diperiksa melebihi sisa belum diperiksa (sisa ${sisa} pcs)` };
          }
        }

        const nomorDokumen = await generateDocNumber("QC", "hasil_qc");

        const [header] = await tx
          .insert(hasilQc)
          .values({
            nomorDokumen,
            workOrderQcId: input.workOrderQcId,
            poId: wo.poId,
            tanggal: new Date(input.tanggal),
            petugasId: input.petugasId || wo.picId || null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // SEQUENTIAL — jangan Promise.all
        for (const d of rows) {
          await tx.insert(hasilQcDetail).values({
            hasilQcId: header.id,
            workOrderQcDetailId: d.workOrderQcDetailId,
            varianId: d.varianId,
            jumlahDiperiksa: d.jumlahDiperiksa,
            gradeA: d.gradeA,
            gradeB: d.gradeB,
            gradeC: d.gradeC,
            perbaikan: d.perbaikan,
            reject: d.reject,
            catatan: d.catatan || null,
          });
        }

        await writeAudit(tx, "CREATE", header.id, null, { header, details: rows }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/** Verifikasi owner/supervisor — mengunci baris dari perubahan. */
export async function verifikasiHasilQc(id: string): Promise<Result> {
  const user = await requireRole(["owner", "admin_produksi"]);

  const [before] = await db
    .select()
    .from(hasilQc)
    .where(and(eq(hasilQc.id, id), isNull(hasilQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Hasil QC tidak ditemukan" };
  if (before.status === "diverifikasi") return { error: "Hasil QC sudah diverifikasi" };

  const [row] = await db
    .update(hasilQc)
    .set({
      status: "diverifikasi",
      verifikatorId: user.id,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(hasilQc.id, id))
    .returning();

  await writeAudit(db, "APPROVE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteHasilQc(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(hasilQc)
    .where(and(eq(hasilQc.id, id), isNull(hasilQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Hasil QC tidak ditemukan" };
  if (before.status === "diverifikasi") {
    return { error: "Hasil QC sudah diverifikasi — tidak bisa dihapus" };
  }

  const [adaTemuan] = await db
    .select({ id: temuanCacat.id })
    .from(temuanCacat)
    .innerJoin(hasilQcDetail, eq(temuanCacat.hasilQcDetailId, hasilQcDetail.id))
    .where(eq(hasilQcDetail.hasilQcId, id))
    .limit(1);

  if (adaTemuan) {
    return { error: "Hasil QC sudah punya temuan cacat — hapus temuannya dulu" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(hasilQc)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(hasilQc.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}
