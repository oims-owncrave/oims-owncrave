"use server";

import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bundling,
  workOrderCutting,
  hasilCutting,
  hasilCuttingDetail,
  poProduksi,
  produk,
  varianProduk,
  warna,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { BundelInput } from "@/lib/schemas/bundling";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type BundelResult = Promise<{ data?: typeof bundling.$inferSelect; error?: string }>;

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
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
    tabel: "bundling",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listBundel() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: bundling.id,
      nomorDokumen: bundling.nomorDokumen,
      woNomor: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: bundling.jumlahPcs,
      tujuanPenjahit: bundling.tujuanPenjahit,
      status: bundling.status,
      createdAt: bundling.createdAt,
    })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(isNull(bundling.deletedAt))
    .orderBy(desc(bundling.createdAt));
}

export type BundelListRow = Awaited<ReturnType<typeof listBundel>>[number];

/** WO yang punya hasil baik — kandidat sumber bundel. */
export async function listWoBisaDibundel() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: workOrderCutting.id,
      nomorDokumen: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
    })
    .from(workOrderCutting)
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(
      and(
        isNull(workOrderCutting.deletedAt),
        sql`EXISTS (SELECT 1 FROM hasil_cutting h JOIN hasil_cutting_detail d ON d.hasil_id = h.id WHERE h.wo_id = ${workOrderCutting.id} AND h.deleted_at IS NULL AND d.jumlah_baik > 0)`,
      ),
    )
    .orderBy(desc(workOrderCutting.createdAt));
}

export type WoBisaDibundel = Awaited<ReturnType<typeof listWoBisaDibundel>>[number];

/** Sisa bisa dibundel per varian: Σ hasil baik − Σ pcs bundel aktif. */
export async function getSisaBundel(woId: string) {
  await requireRole([...READ_ROLES]);

  const baik = await db
    .select({
      varianId: hasilCuttingDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      totalBaik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
    })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .innerJoin(varianProduk, eq(hasilCuttingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(and(eq(hasilCutting.woId, woId), isNull(hasilCutting.deletedAt)))
    .groupBy(hasilCuttingDetail.varianId, varianProduk.sku, warna.nama, varianProduk.ukuran);

  const dibundel = await db
    .select({
      varianId: bundling.varianId,
      total: sql<number>`COALESCE(SUM(${bundling.jumlahPcs}), 0)::int`,
    })
    .from(bundling)
    .where(
      and(
        eq(bundling.woId, woId),
        ne(bundling.status, "dibatalkan"),
        isNull(bundling.deletedAt),
      ),
    )
    .groupBy(bundling.varianId);
  const bundelMap = new Map(dibundel.map((b) => [b.varianId, b.total]));

  return baik
    .map((b) => ({
      ...b,
      dibundel: bundelMap.get(b.varianId) ?? 0,
      sisa: b.totalBaik - (bundelMap.get(b.varianId) ?? 0),
    }))
    .filter((b) => b.totalBaik > 0);
}

export type SisaBundelRow = Awaited<ReturnType<typeof getSisaBundel>>[number];

export async function createBundel(input: BundelInput): BundelResult {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // guard PRD: tidak boleh melebihi hasil baik tersedia (re-check dalam transaksi)
        const [{ totalBaik }] = await tx
          .select({
            totalBaik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int`,
          })
          .from(hasilCuttingDetail)
          .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
          .where(
            and(
              eq(hasilCutting.woId, input.woId),
              eq(hasilCuttingDetail.varianId, input.varianId),
              isNull(hasilCutting.deletedAt),
            ),
          );

        const [{ sudahDibundel }] = await tx
          .select({
            sudahDibundel: sql<number>`COALESCE(SUM(${bundling.jumlahPcs}), 0)::int`,
          })
          .from(bundling)
          .where(
            and(
              eq(bundling.woId, input.woId),
              eq(bundling.varianId, input.varianId),
              ne(bundling.status, "dibatalkan"),
              isNull(bundling.deletedAt),
            ),
          );

        const sisa = totalBaik - sudahDibundel;
        if (input.jumlahPcs > sisa) {
          return { error: `Melebihi hasil tersedia — sisa bisa dibundel: ${sisa} pcs` };
        }

        const nomorDokumen = await generateDocNumber("BND", "bundling");
        const [row] = await tx
          .insert(bundling)
          .values({
            nomorDokumen,
            woId: input.woId,
            varianId: input.varianId,
            jumlahPcs: input.jumlahPcs,
            tujuanPenjahit: input.tujuanPenjahit?.trim() || null,
            keterangan: input.keterangan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await writeAudit(tx, "CREATE", row.id, null, row, user.id);
        return { data: row };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat bundel — coba lagi" };
}

const BUNDEL_TRANSITIONS: Record<string, string[]> = {
  draft: ["siap_dikirim", "dibatalkan"],
  siap_dikirim: ["draft", "dibatalkan"],
  sudah_dikirim: [], // immutable — dikelola flow pengiriman Tahap 3
  dibatalkan: [],
};

export async function setBundelStatus(id: string, status: string): BundelResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(bundling)
    .where(and(eq(bundling.id, id), isNull(bundling.deletedAt)))
    .limit(1);
  if (!before) return { error: "Bundel tidak ditemukan" };
  if (before.status === "sudah_dikirim") {
    return { error: "Bundel yang sudah dikirim tidak bisa diubah" };
  }
  if (!BUNDEL_TRANSITIONS[before.status]?.includes(status)) {
    return { error: `Transisi dari "${before.status}" ke "${status}" tidak diizinkan` };
  }

  const [row] = await db
    .update(bundling)
    .set({ status: status as typeof before.status, updatedAt: new Date() })
    .where(eq(bundling.id, id))
    .returning();

  await writeAudit(db, status === "dibatalkan" ? "CANCEL" : "UPDATE", id, before, row, user.id);
  return { data: row };
}

/** Data lengkap untuk halaman label print. */
export async function getBundelLabel(id: string) {
  await requireRole([...READ_ROLES]);
  const [row] = await db
    .select({
      id: bundling.id,
      nomorDokumen: bundling.nomorDokumen,
      woNomor: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      produkKode: produk.kode,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: bundling.jumlahPcs,
      tujuanPenjahit: bundling.tujuanPenjahit,
      keterangan: bundling.keterangan,
      status: bundling.status,
      createdAt: bundling.createdAt,
    })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(and(eq(bundling.id, id), isNull(bundling.deletedAt)))
    .limit(1);
  return row ?? null;
}

export type BundelLabelData = NonNullable<Awaited<ReturnType<typeof getBundelLabel>>>;
