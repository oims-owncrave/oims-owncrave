"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  workOrderQc,
  workOrderQcDetail,
  penerimaanQc,
  penerimaanQcDetail,
  penerimaanHasilJahitDetail,
  penugasanJahitDetail,
  bundling,
  standarQc,
  hasilQc,
  poProduksi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { WorkOrderQc } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { sudahMasukWoSql } from "@/lib/qc/rekap";
import type { WoQcInput } from "@/lib/schemas/wo-qc";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: WorkOrderQc; error?: string };

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
    tabel: "work_order_qc",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Baris IN-QC yang belum masuk WO manapun — kandidat WO baru. */
export async function listBarisSiapWo() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      penerimaanQcDetailId: penerimaanQcDetail.id,
      penerimaanQcId: penerimaanQc.id,
      nomorInQc: penerimaanQc.nomorDokumen,
      tanggalMasuk: penerimaanQc.tanggal,
      prioritas: penerimaanQc.prioritas,
      poId: penerimaanQc.poId,
      nomorPo: poProduksi.nomorDokumen,
      varianId: penerimaanQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      produkId: produk.id,
      bundelNomor: bundling.nomorDokumen,
      jumlahPcs: penerimaanQcDetail.jumlahPcs,
    })
    .from(penerimaanQcDetail)
    .innerJoin(penerimaanQc, eq(penerimaanQcDetail.penerimaanQcId, penerimaanQc.id))
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
    .leftJoin(poProduksi, eq(penerimaanQc.poId, poProduksi.id))
    .where(and(isNull(penerimaanQc.deletedAt), sql`${sudahMasukWoSql} = 0`))
    .orderBy(penerimaanQc.tanggal);
}

export type BarisSiapWoRow = Awaited<ReturnType<typeof listBarisSiapWo>>[number];

export async function listWoQc() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: workOrderQc.id,
      nomorDokumen: workOrderQc.nomorDokumen,
      tanggal: workOrderQc.tanggal,
      targetSelesai: workOrderQc.targetSelesai,
      metode: workOrderQc.metode,
      status: workOrderQc.status,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      standarNama: standarQc.nama,
      standarVersi: workOrderQc.standarVersi,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah_pcs), 0)::int
        FROM work_order_qc_detail d WHERE d.work_order_qc_id = ${workOrderQc.id}
      )`,
      sudahDiperiksa: sql<number>`(
        SELECT COALESCE(SUM(hd.jumlah_diperiksa), 0)::int
        FROM hasil_qc_detail hd
        JOIN hasil_qc h ON h.id = hd.hasil_qc_id AND h.deleted_at IS NULL
        JOIN work_order_qc_detail wd ON wd.id = hd.work_order_qc_detail_id
        WHERE wd.work_order_qc_id = ${workOrderQc.id}
      )`,
    })
    .from(workOrderQc)
    .leftJoin(poProduksi, eq(workOrderQc.poId, poProduksi.id))
    .leftJoin(users, eq(workOrderQc.picId, users.id))
    .leftJoin(standarQc, eq(workOrderQc.standarQcId, standarQc.id))
    .where(isNull(workOrderQc.deletedAt))
    .orderBy(desc(workOrderQc.tanggal));
}

export type WoQcRow = Awaited<ReturnType<typeof listWoQc>>[number];

export async function getWoQcDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: workOrderQc.id,
      nomorDokumen: workOrderQc.nomorDokumen,
      tanggal: workOrderQc.tanggal,
      targetSelesai: workOrderQc.targetSelesai,
      metode: workOrderQc.metode,
      status: workOrderQc.status,
      populasi: workOrderQc.populasi,
      jumlahSampel: workOrderQc.jumlahSampel,
      batasDiterima: workOrderQc.batasDiterima,
      batasDitolak: workOrderQc.batasDitolak,
      alasanSampling: workOrderQc.alasanSampling,
      catatan: workOrderQc.catatan,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      standarQcId: workOrderQc.standarQcId,
      standarNama: standarQc.nama,
      standarNomor: standarQc.nomorDokumen,
      standarVersi: workOrderQc.standarVersi,
    })
    .from(workOrderQc)
    .leftJoin(poProduksi, eq(workOrderQc.poId, poProduksi.id))
    .leftJoin(users, eq(workOrderQc.picId, users.id))
    .leftJoin(standarQc, eq(workOrderQc.standarQcId, standarQc.id))
    .where(and(eq(workOrderQc.id, id), isNull(workOrderQc.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: workOrderQcDetail.id,
      varianId: workOrderQcDetail.varianId,
      jumlahPcs: workOrderQcDetail.jumlahPcs,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      nomorInQc: penerimaanQc.nomorDokumen,
      // nama tabel eksplisit — hindari 42702 ambiguous seperti hasil-qc.ts
      sudahDiperiksa: sql<number>`(
        SELECT COALESCE(SUM(hd.jumlah_diperiksa), 0)::int
        FROM hasil_qc_detail hd
        JOIN hasil_qc h ON h.id = hd.hasil_qc_id AND h.deleted_at IS NULL
        WHERE hd.work_order_qc_detail_id = work_order_qc_detail.id
      )`,
    })
    .from(workOrderQcDetail)
    .innerJoin(
      penerimaanQcDetail,
      eq(workOrderQcDetail.penerimaanQcDetailId, penerimaanQcDetail.id),
    )
    .innerJoin(penerimaanQc, eq(penerimaanQcDetail.penerimaanQcId, penerimaanQc.id))
    .innerJoin(varianProduk, eq(workOrderQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(workOrderQcDetail.workOrderQcId, id))
    .orderBy(varianProduk.sku);

  return {
    header,
    details: details.map((d) => ({
      ...d,
      belumDiperiksa: d.jumlahPcs - Number(d.sudahDiperiksa),
    })),
  };
}

export async function createWoQc(input: WoQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const ids = input.details.map((d) => d.penerimaanQcDetailId);

        // GUARD: hitung ulang di dalam transaksi — baris tak boleh sudah punya WO hidup
        const cek = await tx
          .select({
            id: penerimaanQcDetail.id,
            jumlahPcs: penerimaanQcDetail.jumlahPcs,
            poId: penerimaanQc.poId,
            sudahWo: sudahMasukWoSql,
          })
          .from(penerimaanQcDetail)
          .innerJoin(penerimaanQc, eq(penerimaanQcDetail.penerimaanQcId, penerimaanQc.id))
          .where(
            and(isNull(penerimaanQc.deletedAt), inArray(penerimaanQcDetail.id, ids)),
          );

        const cekMap = new Map(cek.map((r) => [r.id, r]));

        for (const d of input.details) {
          const row = cekMap.get(d.penerimaanQcDetailId);
          if (!row) return { error: "Ada baris penerimaan QC yang tidak ditemukan" };
          if (Number(row.sudahWo) > 0) {
            return { error: "Ada baris yang sudah masuk Work Order QC lain" };
          }
          if (d.jumlahPcs > row.jumlahPcs) {
            return {
              error: `Jumlah pemeriksaan melebihi pcs yang diterima QC (maks ${row.jumlahPcs})`,
            };
          }
        }

        const totalPcs = input.details.reduce((n, d) => n + d.jumlahPcs, 0);

        // SNAPSHOT versi standar saat WO dibuat — bukan join live
        let standarVersi: number | null = null;
        if (input.standarQcId) {
          const [std] = await tx
            .select({ versi: standarQc.versi })
            .from(standarQc)
            .where(eq(standarQc.id, input.standarQcId))
            .limit(1);
          standarVersi = std?.versi ?? null;
        }

        const nomorDokumen = await generateDocNumber("WO-QC", "work_order_qc");

        const [header] = await tx
          .insert(workOrderQc)
          .values({
            nomorDokumen,
            poId: cek[0]?.poId ?? null,
            tanggal: new Date(input.tanggal),
            targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
            picId: input.picId || null,
            supervisorId: input.supervisorId || null,
            metode: input.metode,
            standarQcId: input.standarQcId || null,
            standarVersi,
            // metode 100% → sampel = total otomatis
            populasi: input.metode === "sampling" ? (input.populasi ?? totalPcs) : totalPcs,
            jumlahSampel: input.metode === "sampling" ? (input.jumlahSampel ?? 0) : totalPcs,
            batasDiterima: input.metode === "sampling" ? (input.batasDiterima ?? null) : null,
            batasDitolak: input.metode === "sampling" ? (input.batasDitolak ?? null) : null,
            alasanSampling: input.metode === "sampling" ? input.alasanSampling || null : null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // SEQUENTIAL — jangan Promise.all
        for (const d of input.details) {
          await tx.insert(workOrderQcDetail).values({
            workOrderQcId: header.id,
            penerimaanQcDetailId: d.penerimaanQcDetailId,
            varianId: d.varianId,
            jumlahPcs: d.jumlahPcs,
          });
        }

        await writeAudit(tx, "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/** Transisi tervalidasi (pola WO cutting oims-5yr.8) — tak boleh loncat mundur. */
const TRANSISI: Record<string, string[]> = {
  draft: ["berjalan", "dibatalkan"],
  berjalan: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

export async function updateStatusWoQc(
  id: string,
  status: "berjalan" | "selesai" | "dibatalkan",
): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(workOrderQc)
    .where(and(eq(workOrderQc.id, id), isNull(workOrderQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Work Order QC tidak ditemukan" };

  const boleh = TRANSISI[before.status] ?? [];
  if (!boleh.includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  // WO tak boleh diselesaikan kalau masih ada pcs yang belum diperiksa
  if (status === "selesai") {
    const [sisa] = await db
      .select({
        belum: sql<number>`COALESCE(SUM(${workOrderQcDetail.jumlahPcs}), 0)::int - (
          SELECT COALESCE(SUM(hd.jumlah_diperiksa), 0)::int
          FROM hasil_qc_detail hd
          JOIN hasil_qc h ON h.id = hd.hasil_qc_id AND h.deleted_at IS NULL
          JOIN work_order_qc_detail wd2 ON wd2.id = hd.work_order_qc_detail_id
          WHERE wd2.work_order_qc_id = ${id}
        )`,
      })
      .from(workOrderQcDetail)
      .where(eq(workOrderQcDetail.workOrderQcId, id));

    if (Number(sisa?.belum ?? 0) > 0) {
      return { error: `Masih ada ${sisa?.belum} pcs belum diperiksa — catat hasil QC dulu` };
    }
  }

  const [row] = await db
    .update(workOrderQc)
    .set({ status, updatedAt: new Date() })
    .where(eq(workOrderQc.id, id))
    .returning();

  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteWoQc(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(workOrderQc)
    .where(and(eq(workOrderQc.id, id), isNull(workOrderQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Work Order QC tidak ditemukan" };

  const [adaHasil] = await db
    .select({ id: hasilQc.id })
    .from(hasilQc)
    .where(and(eq(hasilQc.workOrderQcId, id), isNull(hasilQc.deletedAt)))
    .limit(1);

  if (adaHasil) {
    return { error: "WO sudah punya hasil QC — batalkan saja, jangan dihapus" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(workOrderQc)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(workOrderQc.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}
