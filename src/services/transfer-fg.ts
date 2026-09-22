"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  transferBarangJadi,
  transferBarangJadiDetail,
  penyesuaianStokFg,
  stokBarangJadi,
  gudangBarangJadi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { TransferBarangJadi, PenyesuaianStokFg } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { catatMutasiFg, stokSiapJualSql } from "@/lib/qc/stok-fg";
import type { TransferFgInput, PenyesuaianFgInput } from "@/lib/schemas/transfer-fg";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang"] as const;

type TransferResult = { data?: TransferBarangJadi; error?: string };
type PenyesuaianResult = { data?: PenyesuaianStokFg; error?: string };

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

export async function listTransferFg() {
  await requireRole([...READ_ROLES]);

  const asal = gudangBarangJadi;
  return db
    .select({
      id: transferBarangJadi.id,
      nomorDokumen: transferBarangJadi.nomorDokumen,
      tanggal: transferBarangJadi.tanggal,
      status: transferBarangJadi.status,
      gudangAsalNama: asal.nama,
      gudangTujuanId: transferBarangJadi.gudangTujuanId,
      pengirimId: transferBarangJadi.pengirimId,
      pengirim: transferBarangJadi.pengirim,
      penerimaId: transferBarangJadi.penerimaId,
      penerima: transferBarangJadi.penerima,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM transfer_barang_jadi_detail d WHERE d.transfer_id = ${transferBarangJadi.id}
      )`,
    })
    .from(transferBarangJadi)
    .innerJoin(asal, eq(transferBarangJadi.gudangAsalId, asal.id))
    .where(isNull(transferBarangJadi.deletedAt))
    .orderBy(desc(transferBarangJadi.tanggal));
}

export type TransferFgRow = Awaited<ReturnType<typeof listTransferFg>>[number];

export async function listPenyesuaianFg() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: penyesuaianStokFg.id,
      nomorDokumen: penyesuaianStokFg.nomorDokumen,
      tanggal: penyesuaianStokFg.tanggal,
      status: penyesuaianStokFg.status,
      stokSistem: penyesuaianStokFg.stokSistem,
      stokFisik: penyesuaianStokFg.stokFisik,
      alasan: penyesuaianStokFg.alasan,
      grade: penyesuaianStokFg.grade,
      batch: penyesuaianStokFg.batch,
      gudangNama: gudangBarangJadi.nama,
      sku: varianProduk.sku,
      produkNama: produk.nama,
      approvedAt: penyesuaianStokFg.approvedAt,
      pengajuNama: users.displayName,
    })
    .from(penyesuaianStokFg)
    .innerJoin(gudangBarangJadi, eq(penyesuaianStokFg.gudangId, gudangBarangJadi.id))
    .innerJoin(varianProduk, eq(penyesuaianStokFg.varianId, varianProduk.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(users, eq(penyesuaianStokFg.createdBy, users.id))
    .where(isNull(penyesuaianStokFg.deletedAt))
    .orderBy(desc(penyesuaianStokFg.tanggal));
}

export type PenyesuaianFgRow = Awaited<ReturnType<typeof listPenyesuaianFg>>[number];

/** Stok siap jual per gudang — sumber pilihan baris transfer. */
export async function listStokUntukTransfer(gudangId: string) {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      varianId: stokBarangJadi.varianId,
      grade: stokBarangJadi.grade,
      batch: stokBarangJadi.batch,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      siapJual: stokSiapJualSql,
    })
    .from(stokBarangJadi)
    .innerJoin(varianProduk, eq(stokBarangJadi.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(and(eq(stokBarangJadi.gudangId, gudangId), sql`${stokSiapJualSql} > 0`))
    .orderBy(produk.nama, varianProduk.sku);
}

export async function createTransferFg(input: TransferFgInput): Promise<TransferResult> {
  const user = await requireRole([...WRITE_ROLES]);

  if (input.gudangAsalId === input.gudangTujuanId) {
    return { error: "Gudang asal dan tujuan tidak boleh sama" };
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("TRF-FG", "transfer_barang_jadi");

        const [header] = await tx
          .insert(transferBarangJadi)
          .values({
            nomorDokumen,
            gudangAsalId: input.gudangAsalId,
            gudangTujuanId: input.gudangTujuanId,
            tanggal: new Date(input.tanggal),
            pengirimId: input.pengirimId || null,
            pengirim: input.pengirim || null,
            penerimaId: input.penerimaId || null,
            penerima: input.penerima || null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(transferBarangJadiDetail).values({
            transferId: header.id,
            varianId: d.varianId,
            grade: d.grade,
            batch: d.batch ?? "",
            jumlah: d.jumlah,
          });
        }

        await writeAudit(tx, "transfer_barang_jadi", "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/**
 * Transfer 2-fase: 'dikirim' mengurangi stok asal, 'diterima' menambah stok tujuan.
 * Barang dalam perjalanan tidak terhitung di kedua gudang.
 */
export async function updateStatusTransferFg(
  id: string,
  status: "dikirim" | "diterima" | "dibatalkan",
): Promise<TransferResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(transferBarangJadi)
    .where(and(eq(transferBarangJadi.id, id), isNull(transferBarangJadi.deletedAt)))
    .limit(1);

  if (!before) return { error: "Transfer tidak ditemukan" };

  const boleh: Record<string, string[]> = {
    draft: ["dikirim", "dibatalkan"],
    dikirim: ["diterima", "dibatalkan"],
    diterima: [],
    dibatalkan: [],
  };

  if (!(boleh[before.status] ?? []).includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  return db.transaction(async (tx) => {
    const details = await tx
      .select()
      .from(transferBarangJadiDetail)
      .where(eq(transferBarangJadiDetail.transferId, id));

    if (status === "dikirim") {
      for (const d of details) {
        const res = await catatMutasiFg(tx, {
          kunci: {
            varianId: d.varianId,
            grade: d.grade,
            gudangId: before.gudangAsalId,
            batch: d.batch,
          },
          jenis: "transfer",
          jumlah: -d.jumlah,
          referensiTipe: "transfer_barang_jadi",
          referensiId: id,
          catatan: "Keluar gudang asal",
          userId: user.id,
        });
        if (res.error) return { error: res.error };
      }
    }

    if (status === "diterima") {
      for (const d of details) {
        const res = await catatMutasiFg(tx, {
          kunci: {
            varianId: d.varianId,
            grade: d.grade,
            gudangId: before.gudangTujuanId,
            batch: d.batch,
          },
          jenis: "transfer",
          jumlah: d.jumlah,
          referensiTipe: "transfer_barang_jadi",
          referensiId: id,
          catatan: "Masuk gudang tujuan",
          userId: user.id,
        });
        if (res.error) return { error: res.error };
      }
    }

    // dibatalkan setelah dikirim → kembalikan ke gudang asal
    if (status === "dibatalkan" && before.status === "dikirim") {
      for (const d of details) {
        const res = await catatMutasiFg(tx, {
          kunci: {
            varianId: d.varianId,
            grade: d.grade,
            gudangId: before.gudangAsalId,
            batch: d.batch,
          },
          jenis: "transfer",
          jumlah: d.jumlah,
          referensiTipe: "transfer_barang_jadi",
          referensiId: id,
          catatan: "Transfer dibatalkan — dikembalikan ke asal",
          userId: user.id,
        });
        if (res.error) return { error: res.error };
      }
    }

    const [row] = await tx
      .update(transferBarangJadi)
      .set({ status, updatedAt: new Date() })
      .where(eq(transferBarangJadi.id, id))
      .returning();

    await writeAudit(tx, "transfer_barang_jadi", "UPDATE", id, before, row, user.id);
    return { data: row };
  });
}

export async function createPenyesuaianFg(
  input: PenyesuaianFgInput,
): Promise<PenyesuaianResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [s] = await tx
          .select({ kuantitas: stokBarangJadi.kuantitas })
          .from(stokBarangJadi)
          .where(
            and(
              eq(stokBarangJadi.varianId, input.varianId),
              eq(stokBarangJadi.grade, input.grade),
              eq(stokBarangJadi.gudangId, input.gudangId),
              eq(stokBarangJadi.batch, input.batch ?? ""),
            ),
          )
          .limit(1);

        const stokSistem = s?.kuantitas ?? 0;
        const nomorDokumen = await generateDocNumber("PS-FG", "penyesuaian_stok_fg");

        const [row] = await tx
          .insert(penyesuaianStokFg)
          .values({
            nomorDokumen,
            varianId: input.varianId,
            grade: input.grade,
            gudangId: input.gudangId,
            batch: input.batch ?? "",
            tanggal: new Date(input.tanggal),
            stokSistem,
            stokFisik: input.stokFisik,
            alasan: input.alasan,
            buktiUrl: input.buktiUrl || null,
            createdBy: user.id,
          })
          .returning();

        await writeAudit(tx, "penyesuaian_stok_fg", "CREATE", row.id, null, row, user.id);
        return { data: row };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/** Approval owner — mutasi penyesuaian baru terbuat DI SINI (pola penyesuaian_stok T1). */
export async function approvePenyesuaianFg(
  id: string,
  setuju: boolean,
): Promise<PenyesuaianResult> {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(penyesuaianStokFg)
    .where(and(eq(penyesuaianStokFg.id, id), isNull(penyesuaianStokFg.deletedAt)))
    .limit(1);

  if (!before) return { error: "Penyesuaian tidak ditemukan" };
  if (before.status !== "pending") {
    return { error: `Penyesuaian sudah ${before.status}` };
  }

  return db.transaction(async (tx) => {
    if (setuju) {
      const selisih = before.stokFisik - before.stokSistem;
      if (selisih !== 0) {
        const res = await catatMutasiFg(tx, {
          kunci: {
            varianId: before.varianId,
            grade: before.grade,
            gudangId: before.gudangId,
            batch: before.batch,
          },
          jenis: "penyesuaian",
          jumlah: selisih,
          referensiTipe: "penyesuaian_stok_fg",
          referensiId: id,
          catatan: before.alasan,
          userId: user.id,
          // opname bisa menemukan stok fisik lebih sedikit dari sistem
          cegahNegatif: false,
        });
        if (res.error) return { error: res.error };
      }
    }

    const [row] = await tx
      .update(penyesuaianStokFg)
      .set({
        status: setuju ? "approved" : "rejected",
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(penyesuaianStokFg.id, id))
      .returning();

    await writeAudit(tx, "penyesuaian_stok_fg", "APPROVE", id, before, row, user.id);
    return { data: row };
  });
}
