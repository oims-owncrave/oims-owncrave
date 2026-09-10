"use server";

import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  temuanCacat,
  hasilQcDetail,
  hasilQc,
  jenisCacat,
  standarQcDetail,
  workOrderQc,
  varianProduk,
  produk,
  auditLog,
} from "@/db/schema";
import type { TemuanCacat } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import type { TemuanCacatInput } from "@/lib/schemas/temuan-cacat";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: TemuanCacat; error?: string };

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
    tabel: "temuan_cacat",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listTemuanByHasilQc(hasilQcId: string) {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: temuanCacat.id,
      hasilQcDetailId: temuanCacat.hasilQcDetailId,
      jenisCacatNama: jenisCacat.nama,
      jenisCacatKode: jenisCacat.kode,
      bagianProduk: temuanCacat.bagianProduk,
      keparahan: temuanCacat.keparahan,
      sumber: temuanCacat.sumber,
      jumlah: temuanCacat.jumlah,
      penyebabAwal: temuanCacat.penyebabAwal,
      penanggungJawab: temuanCacat.penanggungJawab,
      fotoUrl: temuanCacat.fotoUrl,
      tindakan: temuanCacat.tindakan,
      sku: varianProduk.sku,
      produkNama: produk.nama,
    })
    .from(temuanCacat)
    .innerJoin(hasilQcDetail, eq(temuanCacat.hasilQcDetailId, hasilQcDetail.id))
    .innerJoin(jenisCacat, eq(temuanCacat.jenisCacatId, jenisCacat.id))
    .innerJoin(varianProduk, eq(hasilQcDetail.varianId, varianProduk.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(hasilQcDetail.hasilQcId, hasilQcId))
    .orderBy(desc(temuanCacat.createdAt));
}

export type TemuanCacatRow = Awaited<ReturnType<typeof listTemuanByHasilQc>>[number];

/** Rekap cacat per jenis + per sumber — dasar dashboard T4 (.15) & kinerja vendor (.17). */
export async function rekapTemuanCacat() {
  await requireRole([...READ_ROLES]);

  const perJenis = await db
    .select({
      jenisCacatId: temuanCacat.jenisCacatId,
      kode: jenisCacat.kode,
      nama: jenisCacat.nama,
      kategori: jenisCacat.kategori,
      total: sql<number>`COALESCE(SUM(${temuanCacat.jumlah}), 0)::int`,
    })
    .from(temuanCacat)
    .innerJoin(jenisCacat, eq(temuanCacat.jenisCacatId, jenisCacat.id))
    .innerJoin(hasilQcDetail, eq(temuanCacat.hasilQcDetailId, hasilQcDetail.id))
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .where(isNull(hasilQc.deletedAt))
    .groupBy(temuanCacat.jenisCacatId, jenisCacat.kode, jenisCacat.nama, jenisCacat.kategori)
    .orderBy(desc(sql`COALESCE(SUM(${temuanCacat.jumlah}), 0)`));

  const perSumber = await db
    .select({
      sumber: temuanCacat.sumber,
      total: sql<number>`COALESCE(SUM(${temuanCacat.jumlah}), 0)::int`,
    })
    .from(temuanCacat)
    .innerJoin(hasilQcDetail, eq(temuanCacat.hasilQcDetailId, hasilQcDetail.id))
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .where(isNull(hasilQc.deletedAt))
    .groupBy(temuanCacat.sumber)
    .orderBy(desc(sql`COALESCE(SUM(${temuanCacat.jumlah}), 0)`));

  return { perJenis, perSumber };
}

export async function createTemuanCacat(input: TemuanCacatInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  return db.transaction(async (tx) => {
    const [baris] = await tx
      .select({
        id: hasilQcDetail.id,
        hasilQcId: hasilQcDetail.hasilQcId,
        status: hasilQc.status,
        bermasalah: sql<number>`(
          ${hasilQcDetail.gradeB} + ${hasilQcDetail.gradeC} +
          ${hasilQcDetail.perbaikan} + ${hasilQcDetail.reject}
        )`,
        sudahDicatat: sql<number>`(
          SELECT COALESCE(SUM(t.jumlah), 0)::int
          FROM temuan_cacat t WHERE t.hasil_qc_detail_id = ${hasilQcDetail.id}
        )`,
        standarQcId: workOrderQc.standarQcId,
      })
      .from(hasilQcDetail)
      .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
      .innerJoin(workOrderQc, eq(hasilQc.workOrderQcId, workOrderQc.id))
      .where(and(eq(hasilQcDetail.id, input.hasilQcDetailId), isNull(hasilQc.deletedAt)))
      .limit(1);

    if (!baris) return { error: "Baris hasil QC tidak ditemukan" };
    if (baris.status === "diverifikasi") {
      return { error: "Hasil QC sudah diverifikasi — tidak bisa menambah temuan" };
    }

    // GUARD: cacat tak boleh lebih banyak dari produk bermasalah
    const sisa = Number(baris.bermasalah) - Number(baris.sudahDicatat);
    if (input.jumlah > sisa) {
      return {
        error: `Total temuan melebihi produk bermasalah di baris ini (sisa ${sisa} pcs)`,
      };
    }

    // Wajib foto kalau standar QC menandai kriteria jenis cacat ini wajibFoto
    if (!input.fotoUrl && baris.standarQcId) {
      const [wajib] = await tx
        .select({ id: standarQcDetail.id })
        .from(standarQcDetail)
        .where(
          and(
            eq(standarQcDetail.standarQcId, baris.standarQcId),
            eq(standarQcDetail.jenisCacatId, input.jenisCacatId),
            eq(standarQcDetail.wajibFoto, true),
          ),
        )
        .limit(1);

      if (wajib) {
        return { error: "Standar QC menandai cacat ini wajib berfoto — lampirkan bukti foto" };
      }
    }

    const [row] = await tx
      .insert(temuanCacat)
      .values({
        hasilQcDetailId: input.hasilQcDetailId,
        jenisCacatId: input.jenisCacatId,
        bagianProduk: input.bagianProduk || null,
        keparahan: input.keparahan,
        sumber: input.sumber,
        jumlah: input.jumlah,
        penyebabAwal: input.penyebabAwal || null,
        penanggungJawab: input.penanggungJawab || null,
        fotoUrl: input.fotoUrl || null,
        tindakan: input.tindakan || null,
        createdBy: user.id,
      })
      .returning();

    await writeAudit(tx, "CREATE", row.id, null, row, user.id);
    return { data: row };
  });
}

export async function deleteTemuanCacat(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select({
      temuan: temuanCacat,
      status: hasilQc.status,
    })
    .from(temuanCacat)
    .innerJoin(hasilQcDetail, eq(temuanCacat.hasilQcDetailId, hasilQcDetail.id))
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .where(eq(temuanCacat.id, id))
    .limit(1);

  if (!before) return { error: "Temuan cacat tidak ditemukan" };
  if (before.status === "diverifikasi") {
    return { error: "Hasil QC sudah diverifikasi — temuan tidak bisa dihapus" };
  }

  return db.transaction(async (tx) => {
    // hard delete: temuan bukan ledger, dan tabelnya tak punya deleted_at
    await tx.delete(temuanCacat).where(eq(temuanCacat.id, id));
    await writeAudit(tx, "DELETE", id, before.temuan, null, user.id);
    return { data: before.temuan };
  });
}
