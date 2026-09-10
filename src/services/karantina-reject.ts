"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  karantinaReject,
  karantinaRejectDetail,
  tindakanReject,
  hasilQc,
  hasilQcDetail,
  reQc,
  poProduksi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { KarantinaReject, TindakanReject } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { KarantinaRejectInput, TindakanRejectInput } from "@/lib/schemas/karantina-reject";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: KarantinaReject; error?: string };
type TindakanResult = { data?: TindakanReject; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505"
  );
}

async function writeAudit(
  tx: Pick<typeof db, "insert">,
  tabel: string,
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await tx.insert(auditLog).values({
    userId,
    aksi,
    tabel,
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Reject dari hasil QC yang belum dikarantina — barang reject tak boleh menguap. */
export async function listRejectBelumDikarantina() {
  await requireRole([...READ_ROLES]);

  const dariQc = await db
    .select({
      sumber: sql<string>`'hasil_qc'`,
      hasilQcId: hasilQc.id,
      nomorSumber: hasilQc.nomorDokumen,
      hasilQcDetailId: hasilQcDetail.id,
      poId: hasilQc.poId,
      nomorPo: poProduksi.nomorDokumen,
      varianId: hasilQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      reject: hasilQcDetail.reject,
      sudah: sql<number>`(
        SELECT COALESCE(SUM(kd.jumlah), 0)::int
        FROM karantina_reject_detail kd
        JOIN karantina_reject k ON k.id = kd.karantina_reject_id
        WHERE kd.hasil_qc_detail_id = ${hasilQcDetail.id} AND k.deleted_at IS NULL
      )`,
    })
    .from(hasilQcDetail)
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .innerJoin(varianProduk, eq(hasilQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(poProduksi, eq(hasilQc.poId, poProduksi.id))
    .where(and(isNull(hasilQc.deletedAt), sql`${hasilQcDetail.reject} > 0`))
    .orderBy(desc(hasilQc.tanggal));

  return dariQc
    .map((r) => ({ ...r, sisa: r.reject - Number(r.sudah) }))
    .filter((r) => r.sisa > 0);
}

export type RejectBelumKarantinaRow = Awaited<
  ReturnType<typeof listRejectBelumDikarantina>
>[number];

export async function listKarantinaReject() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: karantinaReject.id,
      nomorDokumen: karantinaReject.nomorDokumen,
      tanggal: karantinaReject.tanggal,
      status: karantinaReject.status,
      lokasiSimpan: karantinaReject.lokasiSimpan,
      nomorHasilQc: hasilQc.nomorDokumen,
      nomorReQc: reQc.nomorDokumen,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM karantina_reject_detail d WHERE d.karantina_reject_id = ${karantinaReject.id}
      )`,
      nilaiTotal: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah * d.nilai_per_pcs), 0)::numeric
        FROM karantina_reject_detail d WHERE d.karantina_reject_id = ${karantinaReject.id}
      )`,
      sudahDitindak: sql<number>`(
        SELECT COALESCE(SUM(t.jumlah), 0)::int
        FROM tindakan_reject t
        JOIN karantina_reject_detail d ON d.id = t.karantina_reject_detail_id
        WHERE d.karantina_reject_id = ${karantinaReject.id}
          AND t.status = 'approved' AND t.deleted_at IS NULL
      )`,
    })
    .from(karantinaReject)
    .leftJoin(hasilQc, eq(karantinaReject.hasilQcId, hasilQc.id))
    .leftJoin(reQc, eq(karantinaReject.reQcId, reQc.id))
    .leftJoin(poProduksi, eq(karantinaReject.poId, poProduksi.id))
    .leftJoin(users, eq(karantinaReject.picId, users.id))
    .where(isNull(karantinaReject.deletedAt))
    .orderBy(desc(karantinaReject.tanggal));
}

export type KarantinaRejectRow = Awaited<ReturnType<typeof listKarantinaReject>>[number];

export async function getKarantinaRejectDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const details = await db
    .select({
      id: karantinaRejectDetail.id,
      varianId: karantinaRejectDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlah: karantinaRejectDetail.jumlah,
      penyebab: karantinaRejectDetail.penyebab,
      nilaiPerPcs: karantinaRejectDetail.nilaiPerPcs,
      fotoUrl: karantinaRejectDetail.fotoUrl,
      // hanya yang belum ditolak yang memakai kuota
      terpakai: sql<number>`(
        SELECT COALESCE(SUM(t.jumlah), 0)::int FROM tindakan_reject t
        WHERE t.karantina_reject_detail_id = ${karantinaRejectDetail.id}
          AND t.status <> 'rejected' AND t.deleted_at IS NULL
      )`,
      disetujui: sql<number>`(
        SELECT COALESCE(SUM(t.jumlah), 0)::int FROM tindakan_reject t
        WHERE t.karantina_reject_detail_id = ${karantinaRejectDetail.id}
          AND t.status = 'approved' AND t.deleted_at IS NULL
      )`,
    })
    .from(karantinaRejectDetail)
    .innerJoin(varianProduk, eq(karantinaRejectDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(karantinaRejectDetail.karantinaRejectId, id))
    .orderBy(varianProduk.sku);

  const tindakan = await db
    .select({
      id: tindakanReject.id,
      karantinaRejectDetailId: tindakanReject.karantinaRejectDetailId,
      tindakan: tindakanReject.tindakan,
      jumlah: tindakanReject.jumlah,
      tanggal: tindakanReject.tanggal,
      status: tindakanReject.status,
      approvedAt: tindakanReject.approvedAt,
      catatan: tindakanReject.catatan,
      sku: varianProduk.sku,
    })
    .from(tindakanReject)
    .innerJoin(
      karantinaRejectDetail,
      eq(tindakanReject.karantinaRejectDetailId, karantinaRejectDetail.id),
    )
    .innerJoin(varianProduk, eq(karantinaRejectDetail.varianId, varianProduk.id))
    .where(
      and(
        eq(karantinaRejectDetail.karantinaRejectId, id),
        isNull(tindakanReject.deletedAt),
      ),
    )
    .orderBy(desc(tindakanReject.createdAt));

  return {
    details: details.map((d) => ({ ...d, sisa: d.jumlah - Number(d.terpakai) })),
    tindakan,
  };
}

export async function createKarantinaReject(input: KarantinaRejectInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // GUARD: tak boleh mengarantina lebih banyak dari reject yang tersisa
        const ids = input.details
          .map((d) => d.hasilQcDetailId)
          .filter((v): v is string => !!v);

        if (ids.length > 0) {
          const kapasitas = await tx
            .select({
              id: hasilQcDetail.id,
              reject: hasilQcDetail.reject,
              sudah: sql<number>`(
                SELECT COALESCE(SUM(kd.jumlah), 0)::int
                FROM karantina_reject_detail kd
                JOIN karantina_reject k ON k.id = kd.karantina_reject_id
                WHERE kd.hasil_qc_detail_id = ${hasilQcDetail.id} AND k.deleted_at IS NULL
              )`,
            })
            .from(hasilQcDetail)
            .where(inArray(hasilQcDetail.id, ids));

          const kapMap = new Map(kapasitas.map((k) => [k.id, k]));
          const diminta = new Map<string, number>();
          for (const d of input.details) {
            if (!d.hasilQcDetailId) continue;
            diminta.set(
              d.hasilQcDetailId,
              (diminta.get(d.hasilQcDetailId) ?? 0) + d.jumlah,
            );
          }

          for (const [hid, jumlah] of diminta) {
            const k = kapMap.get(hid);
            if (!k) return { error: "Ada baris hasil QC yang tidak ditemukan" };
            const sisa = k.reject - Number(k.sudah);
            if (jumlah > sisa) {
              return { error: `Jumlah karantina melebihi reject tersisa (sisa ${sisa} pcs)` };
            }
          }
        }

        let poId: string | null = null;
        if (input.hasilQcId) {
          const [h] = await tx
            .select({ poId: hasilQc.poId })
            .from(hasilQc)
            .where(eq(hasilQc.id, input.hasilQcId))
            .limit(1);
          poId = h?.poId ?? null;
        }

        const nomorDokumen = await generateDocNumber("RJT", "karantina_reject");

        const [header] = await tx
          .insert(karantinaReject)
          .values({
            nomorDokumen,
            hasilQcId: input.hasilQcId || null,
            reQcId: input.reQcId || null,
            poId,
            tanggal: new Date(input.tanggal),
            lokasiSimpan: input.lokasiSimpan || null,
            picId: input.picId || null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(karantinaRejectDetail).values({
            karantinaRejectId: header.id,
            hasilQcDetailId: d.hasilQcDetailId || null,
            varianId: d.varianId,
            jumlah: d.jumlah,
            penyebab: d.penyebab,
            jenisCacatId: d.jenisCacatId || null,
            nilaiPerPcs: String(d.nilaiPerPcs),
            fotoUrl: d.fotoUrl || null,
          });
        }

        await writeAudit(tx, "karantina_reject", "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/** Tindakan dibuat berstatus pending — BELUM berdampak sampai owner approve. */
export async function createTindakanReject(
  input: TindakanRejectInput,
): Promise<TindakanResult> {
  const user = await requireRole([...WRITE_ROLES]);

  return db.transaction(async (tx) => {
    const [baris] = await tx
      .select({
        id: karantinaRejectDetail.id,
        jumlah: karantinaRejectDetail.jumlah,
        terpakai: sql<number>`(
          SELECT COALESCE(SUM(t.jumlah), 0)::int FROM tindakan_reject t
          WHERE t.karantina_reject_detail_id = ${karantinaRejectDetail.id}
            AND t.status <> 'rejected' AND t.deleted_at IS NULL
        )`,
      })
      .from(karantinaRejectDetail)
      .where(eq(karantinaRejectDetail.id, input.karantinaRejectDetailId))
      .limit(1);

    if (!baris) return { error: "Baris karantina tidak ditemukan" };

    const sisa = baris.jumlah - Number(baris.terpakai);
    if (input.jumlah > sisa) {
      return { error: `Jumlah tindakan melebihi sisa dikarantina (sisa ${sisa} pcs)` };
    }

    const [row] = await tx
      .insert(tindakanReject)
      .values({
        karantinaRejectDetailId: input.karantinaRejectDetailId,
        tindakan: input.tindakan,
        jumlah: input.jumlah,
        tanggal: new Date(input.tanggal),
        catatan: input.catatan || null,
        buktiUrl: input.buktiUrl || null,
        createdBy: user.id,
      })
      .returning();

    await writeAudit(tx, "tindakan_reject", "CREATE", row.id, null, row, user.id);
    return { data: row };
  });
}

/**
 * Approval owner — INI yang membuat tindakan berdampak (pola penyesuaian_stok T1).
 * Tindakan perbaiki_jadi_grade_b / jual_minor_defect yang approved nanti menambah
 * stok barang jadi lewat mutasi (oims-ckp.13).
 */
export async function approveTindakanReject(
  id: string,
  setuju: boolean,
): Promise<TindakanResult> {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(tindakanReject)
    .where(and(eq(tindakanReject.id, id), isNull(tindakanReject.deletedAt)))
    .limit(1);

  if (!before) return { error: "Tindakan tidak ditemukan" };
  if (before.status !== "pending") {
    return { error: `Tindakan sudah ${before.status} — tidak bisa diputuskan ulang` };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(tindakanReject)
      .set({
        status: setuju ? "approved" : "rejected",
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tindakanReject.id, id))
      .returning();

    // status karantina ikut naik begitu ada tindakan disetujui
    if (setuju) {
      const [induk] = await tx
        .select({ karantinaId: karantinaRejectDetail.karantinaRejectId })
        .from(karantinaRejectDetail)
        .where(eq(karantinaRejectDetail.id, before.karantinaRejectDetailId))
        .limit(1);

      if (induk) {
        await tx
          .update(karantinaReject)
          .set({ status: "ditindaklanjuti", updatedAt: new Date() })
          .where(eq(karantinaReject.id, induk.karantinaId));
      }
    }

    await writeAudit(tx, "tindakan_reject", "APPROVE", id, before, row, user.id);
    return { data: row };
  });
}
