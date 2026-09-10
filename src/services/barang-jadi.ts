"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  barangJadi,
  barangJadiDetail,
  packing,
  packingDetail,
  stokBarangJadi,
  mutasiBarangJadi,
  gudangBarangJadi,
  karantinaRejectDetail,
  tindakanReject,
  poProduksi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { BarangJadi } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { catatMutasiFg, stokSiapJualSql } from "@/lib/qc/stok-fg";
import type { BarangJadiInput } from "@/lib/schemas/packing";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type Result = { data?: BarangJadi; error?: string };

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

/** Packing selesai yang belum masuk gudang barang jadi. */
export async function listPackingSiapMasukGudang() {
  await requireRole([...READ_ROLES]);

  const rows = await db
    .select({
      packingId: packing.id,
      nomorPacking: packing.nomorDokumen,
      tanggal: packing.tanggal,
      nomorPo: poProduksi.nomorDokumen,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM packing_detail d WHERE d.packing_id = ${packing.id}
      )`,
      sudahMasuk: sql<number>`(
        SELECT COALESCE(SUM(bd.jumlah), 0)::int
        FROM barang_jadi_detail bd
        JOIN barang_jadi bj ON bj.id = bd.barang_jadi_id
        WHERE bj.packing_id = ${packing.id} AND bj.deleted_at IS NULL
      )`,
    })
    .from(packing)
    .leftJoin(poProduksi, eq(packing.poId, poProduksi.id))
    .where(and(isNull(packing.deletedAt), eq(packing.status, "selesai")))
    .orderBy(desc(packing.tanggal));

  return rows
    .map((r) => ({ ...r, sisa: Number(r.totalPcs) - Number(r.sudahMasuk) }))
    .filter((r) => r.sisa > 0);
}

export type PackingSiapGudangRow = Awaited<
  ReturnType<typeof listPackingSiapMasukGudang>
>[number];

export async function listBarangJadi() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: barangJadi.id,
      nomorDokumen: barangJadi.nomorDokumen,
      tanggalMasuk: barangJadi.tanggalMasuk,
      nomorPacking: packing.nomorDokumen,
      nomorPo: poProduksi.nomorDokumen,
      gudangNama: gudangBarangJadi.nama,
      penerimaNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM barang_jadi_detail d WHERE d.barang_jadi_id = ${barangJadi.id}
      )`,
    })
    .from(barangJadi)
    .leftJoin(packing, eq(barangJadi.packingId, packing.id))
    .leftJoin(poProduksi, eq(barangJadi.poId, poProduksi.id))
    .innerJoin(gudangBarangJadi, eq(barangJadi.gudangTujuanId, gudangBarangJadi.id))
    .leftJoin(users, eq(barangJadi.penerimaId, users.id))
    .where(isNull(barangJadi.deletedAt))
    .orderBy(desc(barangJadi.tanggalMasuk));
}

export type BarangJadiRow = Awaited<ReturnType<typeof listBarangJadi>>[number];

/** Stok barang jadi per kunci komposit (varian, grade, gudang, batch). */
export async function listStokBarangJadi() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: stokBarangJadi.id,
      varianId: stokBarangJadi.varianId,
      grade: stokBarangJadi.grade,
      batch: stokBarangJadi.batch,
      gudangNama: gudangBarangJadi.nama,
      gudangId: stokBarangJadi.gudangId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      kuantitas: stokBarangJadi.kuantitas,
      stokDitahan: stokBarangJadi.stokDitahan,
      stokRusak: stokBarangJadi.stokRusak,
      stokReservasi: stokBarangJadi.stokReservasi,
      siapJual: stokSiapJualSql,
      hppRataRata: stokBarangJadi.hppRataRata,
    })
    .from(stokBarangJadi)
    .innerJoin(gudangBarangJadi, eq(stokBarangJadi.gudangId, gudangBarangJadi.id))
    .innerJoin(varianProduk, eq(stokBarangJadi.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .orderBy(produk.nama, varianProduk.sku, stokBarangJadi.grade);
}

export type StokBarangJadiRow = Awaited<ReturnType<typeof listStokBarangJadi>>[number];

export async function listMutasiBarangJadi(limit = 100) {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: mutasiBarangJadi.id,
      tanggal: mutasiBarangJadi.tanggal,
      jenis: mutasiBarangJadi.jenis,
      jumlah: mutasiBarangJadi.jumlah,
      referensiTipe: mutasiBarangJadi.referensiTipe,
      catatan: mutasiBarangJadi.catatan,
      sku: varianProduk.sku,
      grade: stokBarangJadi.grade,
      batch: stokBarangJadi.batch,
      gudangNama: gudangBarangJadi.nama,
      produkNama: produk.nama,
      olehNama: users.displayName,
    })
    .from(mutasiBarangJadi)
    .innerJoin(stokBarangJadi, eq(mutasiBarangJadi.stokBarangJadiId, stokBarangJadi.id))
    .innerJoin(gudangBarangJadi, eq(stokBarangJadi.gudangId, gudangBarangJadi.id))
    .innerJoin(varianProduk, eq(stokBarangJadi.varianId, varianProduk.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(users, eq(mutasiBarangJadi.createdBy, users.id))
    .orderBy(desc(mutasiBarangJadi.createdAt))
    .limit(limit);
}

export type MutasiBarangJadiRow = Awaited<ReturnType<typeof listMutasiBarangJadi>>[number];

/**
 * Terima barang jadi ke gudang — stok bertambah lewat append mutasi.
 * TIDAK ADA UPDATE kuantitas sebagai edit arbitrary (aturan proyek).
 */
export async function terimaBarangJadi(input: BarangJadiInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [p] = await tx
          .select({ id: packing.id, status: packing.status, poId: packing.poId })
          .from(packing)
          .where(and(eq(packing.id, input.packingId), isNull(packing.deletedAt)))
          .limit(1);

        if (!p) return { error: "Dokumen packing tidak ditemukan" };
        if (p.status !== "selesai") {
          return { error: "Packing belum selesai — selesaikan dulu (checklist wajib lengkap)" };
        }

        const baris = await tx
          .select({
            id: packingDetail.id,
            varianId: packingDetail.varianId,
            grade: packingDetail.grade,
            jumlah: packingDetail.jumlah,
            batch: packingDetail.batch,
            gudangTujuanId: packingDetail.gudangTujuanId,
            barcode: packingDetail.barcode,
            sudah: sql<number>`(
              SELECT COALESCE(SUM(bd.jumlah), 0)::int
              FROM barang_jadi_detail bd
              JOIN barang_jadi bj ON bj.id = bd.barang_jadi_id
              WHERE bd.packing_detail_id = ${packingDetail.id} AND bj.deleted_at IS NULL
            )`,
          })
          .from(packingDetail)
          .where(eq(packingDetail.packingId, input.packingId));

        const sisaBaris = baris
          .map((b) => ({ ...b, sisa: b.jumlah - Number(b.sudah) }))
          .filter((b) => b.sisa > 0);

        if (sisaBaris.length === 0) {
          return { error: "Semua baris packing sudah masuk gudang" };
        }

        const nomorDokumen = await generateDocNumber("FG", "barang_jadi");

        const [header] = await tx
          .insert(barangJadi)
          .values({
            nomorDokumen,
            poId: p.poId,
            packingId: input.packingId,
            tanggalMasuk: new Date(input.tanggalMasuk),
            gudangTujuanId: input.gudangTujuanId,
            penyerah: input.penyerah || null,
            penerimaId: input.penerimaId || null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        // SEQUENTIAL — jangan Promise.all (race di satu connection)
        for (const b of sisaBaris) {
          await tx.insert(barangJadiDetail).values({
            barangJadiId: header.id,
            packingDetailId: b.id,
            varianId: b.varianId,
            grade: b.grade,
            jumlah: b.sisa,
            batch: b.batch,
            barcode: b.barcode,
          });

          const res = await catatMutasiFg(tx, {
            kunci: {
              varianId: b.varianId,
              grade: b.grade,
              gudangId: b.gudangTujuanId ?? input.gudangTujuanId,
              batch: b.batch,
            },
            jenis: "hasil_produksi",
            jumlah: b.sisa,
            referensiTipe: "barang_jadi",
            referensiId: header.id,
            userId: user.id,
          });

          if (res.error) return { error: res.error };
        }

        await writeAudit(tx, "barang_jadi", "CREATE", header.id, null, header, user.id);
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
 * Terapkan tindakan reject yang SUDAH disetujui ke stok barang jadi.
 * perbaiki_jadi_grade_b / jual_minor_defect → masuk stok grade B/C.
 * musnahkan / donasi → tidak menambah stok (kerugian, dicatat di COPQ).
 */
export async function terapkanTindakanRejectKeStok(
  tindakanId: string,
  gudangId: string,
): Promise<{ error?: string }> {
  const user = await requireRole(["owner", "admin_gudang"]);

  return db.transaction(async (tx) => {
    const [t] = await tx
      .select({
        id: tindakanReject.id,
        tindakan: tindakanReject.tindakan,
        jumlah: tindakanReject.jumlah,
        status: tindakanReject.status,
        varianId: karantinaRejectDetail.varianId,
      })
      .from(tindakanReject)
      .innerJoin(
        karantinaRejectDetail,
        eq(tindakanReject.karantinaRejectDetailId, karantinaRejectDetail.id),
      )
      .where(and(eq(tindakanReject.id, tindakanId), isNull(tindakanReject.deletedAt)))
      .limit(1);

    if (!t) return { error: "Tindakan tidak ditemukan" };
    if (t.status !== "approved") {
      return { error: "Tindakan belum disetujui owner — belum boleh berdampak ke stok" };
    }

    const gradeBaru =
      t.tindakan === "perbaiki_jadi_grade_b"
        ? ("b" as const)
        : t.tindakan === "jual_minor_defect"
          ? ("c" as const)
          : null;

    if (!gradeBaru) {
      return { error: "Tindakan ini tidak menambah stok barang jadi" };
    }

    const res = await catatMutasiFg(tx, {
      kunci: { varianId: t.varianId, grade: gradeBaru, gudangId, batch: "" },
      jenis: "perubahan_grade",
      jumlah: t.jumlah,
      referensiTipe: "tindakan_reject",
      referensiId: t.id,
      catatan: `Dari karantina reject: ${t.tindakan}`,
      userId: user.id,
    });

    if (res.error) return res;

    await writeAudit(
      tx,
      "stok_barang_jadi",
      "CREATE",
      t.id,
      null,
      { tindakan: t.tindakan, jumlah: t.jumlah, grade: gradeBaru },
      user.id,
    );

    return {};
  });
}
