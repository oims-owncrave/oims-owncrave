"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penerimaanHasilJahit,
  penerimaanHasilJahitDetail,
  selisihJahit,
  returJahit,
  returJahitDetail,
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
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber, pisahNomor } from "@/lib/document-number";
import { getRekapDetailPenugasan, refreshPenugasanSelesai } from "@/lib/jahit/rekap";
import type { PenerimaanHasilInput } from "@/lib/schemas/penerimaan-hasil-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type Row = typeof penerimaanHasilJahit.$inferSelect;
type Result = { data?: Row; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505";
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

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

export async function listPenerimaanHasil() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: penerimaanHasilJahit.id,
      nomorDokumen: penerimaanHasilJahit.nomorDokumen,
      penugasanId: penerimaanHasilJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      returNomor: returJahit.nomorDokumen,
      tanggalJam: penerimaanHasilJahit.tanggalJam,
      penerimaId: penerimaanHasilJahit.penerimaId,
      penerimaNama: users.displayName,
      totalBaik: sql<number>`(SELECT COALESCE(SUM(h.jumlah_baik), 0)::int FROM penerimaan_hasil_jahit_detail h WHERE h.penerimaan_id = ${penerimaanHasilJahit.id})`,
      totalRusak: sql<number>`(SELECT COALESCE(SUM(h.jumlah_rusak), 0)::int FROM penerimaan_hasil_jahit_detail h WHERE h.penerimaan_id = ${penerimaanHasilJahit.id})`,
    })
    .from(penerimaanHasilJahit)
    .innerJoin(penugasanJahit, eq(penerimaanHasilJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(users, eq(penerimaanHasilJahit.penerimaId, users.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(returJahit, eq(penerimaanHasilJahit.returId, returJahit.id))
    .where(isNull(penerimaanHasilJahit.deletedAt))
    .orderBy(desc(penerimaanHasilJahit.tanggalJam));
}

export type PenerimaanHasilListRow = Awaited<ReturnType<typeof listPenerimaanHasil>>[number];

export async function getPenerimaanHasilDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: penerimaanHasilJahit.id,
      nomorDokumen: penerimaanHasilJahit.nomorDokumen,
      penugasanId: penerimaanHasilJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      penugasanStatus: penugasanJahit.status,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      returId: penerimaanHasilJahit.returId,
      returNomor: returJahit.nomorDokumen,
      tanggalJam: penerimaanHasilJahit.tanggalJam,
      penerimaId: penerimaanHasilJahit.penerimaId,
      penerimaNama: users.displayName,
      lokasiNama: lokasiProduksi.nama,
      tanggalKirimVendor: penerimaanHasilJahit.tanggalKirimVendor,
      pengirimVendor: penerimaanHasilJahit.pengirimVendor,
      kurirResi: penerimaanHasilJahit.kurirResi,
      buktiUrl: penerimaanHasilJahit.buktiUrl,
      catatan: penerimaanHasilJahit.catatan,
      createdAt: penerimaanHasilJahit.createdAt,
    })
    .from(penerimaanHasilJahit)
    .innerJoin(penugasanJahit, eq(penerimaanHasilJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(users, eq(penerimaanHasilJahit.penerimaId, users.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(returJahit, eq(penerimaanHasilJahit.returId, returJahit.id))
    .leftJoin(lokasiProduksi, eq(penerimaanHasilJahit.lokasiId, lokasiProduksi.id))
    .where(and(eq(penerimaanHasilJahit.id, id), isNull(penerimaanHasilJahit.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: penerimaanHasilJahitDetail.id,
      penugasanDetailId: penerimaanHasilJahitDetail.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: penugasanJahitDetail.jumlahPcs,
      jumlahBaik: penerimaanHasilJahitDetail.jumlahBaik,
      jumlahRusak: penerimaanHasilJahitDetail.jumlahRusak,
      catatan: penerimaanHasilJahitDetail.catatan,
      // rusak dari penerimaan ini yang sudah masuk retur aktif
      sudahDiretur: sql<number>`(
        SELECT COALESCE(SUM(rd.jumlah), 0)::int FROM retur_jahit_detail rd
        JOIN retur_jahit r ON r.id = rd.retur_id
        WHERE rd.penugasan_detail_id = ${penerimaanHasilJahitDetail.penugasanDetailId}
          AND r.penerimaan_asal_id = ${id} AND r.status <> 'dibatalkan' AND r.deleted_at IS NULL
      )`,
    })
    .from(penerimaanHasilJahitDetail)
    .innerJoin(penugasanJahitDetail, eq(penerimaanHasilJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(penerimaanHasilJahitDetail.penerimaanId, id))
    .orderBy(bundling.nomorDokumen);

  const selisih = await db
    .select({
      id: selisihJahit.id,
      nomorKasus: selisihJahit.nomorKasus,
      klasifikasi: selisihJahit.klasifikasi,
      jumlah: selisihJahit.jumlah,
      status: selisihJahit.status,
      keputusan: selisihJahit.keputusan,
      bundelNomor: bundling.nomorDokumen,
    })
    .from(selisihJahit)
    .innerJoin(penugasanJahitDetail, eq(selisihJahit.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .where(and(eq(selisihJahit.penerimaanId, id), isNull(selisihJahit.deletedAt)));

  const rekap = await getRekapDetailPenugasan(db, header.penugasanId);

  return { ...header, details, selisih, rekap };
}

export type PenerimaanHasilDetailData = NonNullable<Awaited<ReturnType<typeof getPenerimaanHasilDetail>>>;

/** Penugasan aktif yang masih punya sisa di vendor. */
export async function listPenugasanBisaTerima() {
  await requireRole([...WRITE_ROLES]);
  const rows = await db
    .select({
      id: penugasanJahit.id,
      nomorDokumen: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      lokasiTujuanId: penugasanJahit.lokasiTujuanId,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(and(eq(penugasanJahit.status, "aktif"), isNull(penugasanJahit.deletedAt)))
    .orderBy(desc(penugasanJahit.createdAt));
  return rows;
}

export type PenugasanBisaTerima = Awaited<ReturnType<typeof listPenugasanBisaTerima>>[number];

/** Rekap sisa per bundel — dipakai form penerimaan (cap input) + detail penugasan. */
export async function getRekapPenugasan(penugasanId: string) {
  await requireRole([...READ_ROLES]);
  return getRekapDetailPenugasan(db, penugasanId);
}

/** Cap penerimaan hasil retur: jumlah retur − yang sudah kembali untuk retur itu. */
export async function getSisaRetur(returId: string) {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      penugasanDetailId: returJahitDetail.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahRetur: returJahitDetail.jumlah,
      sudahKembali: sql<number>`(
        SELECT COALESCE(SUM(h.jumlah_baik + h.jumlah_rusak), 0)::int
        FROM penerimaan_hasil_jahit_detail h
        JOIN penerimaan_hasil_jahit p ON p.id = h.penerimaan_id
        WHERE h.penugasan_detail_id = ${returJahitDetail.penugasanDetailId}
          AND p.retur_id = ${returId} AND p.deleted_at IS NULL
      )`,
    })
    .from(returJahitDetail)
    .innerJoin(penugasanJahitDetail, eq(returJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(returJahitDetail.returId, returId));
}

export type SisaReturRow = Awaited<ReturnType<typeof getSisaRetur>>[number];

/**
 * Penerimaan bertahap. Guard: jumlah kembali (baik+rusak) ≤ sisa di vendor —
 * untuk penerimaan retur, cap = jumlah retur − yang sudah kembali.
 * Rusak > 0 otomatis buka kasus selisih 'rusak' (belum diputuskan).
 */
export async function createPenerimaanHasil(input: PenerimaanHasilInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [penugasan] = await tx
          .select()
          .from(penugasanJahit)
          .where(and(eq(penugasanJahit.id, input.penugasanId), isNull(penugasanJahit.deletedAt)))
          .limit(1);
        if (!penugasan) return { error: "Penugasan tidak ditemukan" };
        if (penugasan.status !== "aktif" && penugasan.status !== "selesai") {
          return { error: `Penugasan berstatus ${penugasan.status} — belum ada bundel terkirim` };
        }

        // cap per detail
        let capMap: Map<string, number>;
        if (input.returId) {
          const [retur] = await tx
            .select()
            .from(returJahit)
            .where(and(eq(returJahit.id, input.returId), eq(returJahit.penugasanId, input.penugasanId), isNull(returJahit.deletedAt)))
            .limit(1);
          if (!retur) return { error: "Retur tidak ditemukan / bukan milik penugasan ini" };
          if (retur.status !== "dikirim" && retur.status !== "diterima_kembali") {
            return { error: `Retur berstatus ${retur.status} — hasil perbaikan belum bisa diterima` };
          }
          const sisaRetur = await tx
            .select({
              penugasanDetailId: returJahitDetail.penugasanDetailId,
              cap: sql<number>`${returJahitDetail.jumlah} - (
                SELECT COALESCE(SUM(h.jumlah_baik + h.jumlah_rusak), 0)::int
                FROM penerimaan_hasil_jahit_detail h JOIN penerimaan_hasil_jahit p ON p.id = h.penerimaan_id
                WHERE h.penugasan_detail_id = ${returJahitDetail.penugasanDetailId} AND p.retur_id = ${input.returId} AND p.deleted_at IS NULL
              )`,
            })
            .from(returJahitDetail)
            .where(eq(returJahitDetail.returId, input.returId));
          capMap = new Map(sisaRetur.map((r) => [r.penugasanDetailId, Number(r.cap)]));
        } else {
          const rekap = await getRekapDetailPenugasan(tx, input.penugasanId);
          // sisa fisik di vendor = pcs − (baik + rusak) yang sudah kembali (bukan rumus WIP)
          capMap = new Map(rekap.map((r) => [r.penugasanDetailId, r.dikirim ? r.jumlahPcs - r.baik - r.rusak : 0]));
        }

        for (const d of input.details) {
          const cap = capMap.get(d.penugasanDetailId);
          if (cap === undefined) return { error: "Ada bundel yang bukan milik penugasan/retur ini" };
          if (d.jumlahBaik + d.jumlahRusak > cap) {
            return { error: `Jumlah kembali melebihi sisa di vendor (sisa ${cap} pcs)` };
          }
        }

        const nomorDokumen = await generateDocNumber("RCV-JHT", "penerimaan_hasil_jahit", "nomor_dokumen", tx);
        const [header] = await tx
          .insert(penerimaanHasilJahit)
          .values({
            nomorDokumen,
            penugasanId: input.penugasanId,
            returId: input.returId || null,
            tanggalJam: new Date(input.tanggalJam),
            penerimaId: input.penerimaId || null,
            lokasiId: input.lokasiId || null,
            tanggalKirimVendor: input.tanggalKirimVendor ? new Date(input.tanggalKirimVendor) : null,
            pengirimVendor: input.pengirimVendor?.trim() || null,
            kurirResi: input.kurirResi?.trim() || null,
            buktiUrl: input.buktiUrl?.trim() || null,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        const aktif = input.details.filter((d) => d.jumlahBaik + d.jumlahRusak > 0);
        await tx.insert(penerimaanHasilJahitDetail).values(
          aktif.map((d) => ({
            penerimaanId: header.id,
            penugasanDetailId: d.penugasanDetailId,
            jumlahBaik: d.jumlahBaik,
            jumlahRusak: d.jumlahRusak,
            catatan: d.catatan?.trim() || null,
          })),
        );

        // rusak → kasus selisih otomatis (menunggu keputusan; retur mengacu ke sini)
        // Nomor diambil SEKALI lalu dinaikkan sendiri: COUNT(*) tidak melihat baris yang
        // baru di-insert dalam transaksi ini, jadi memanggilnya per baris memberi nomor
        // kembar dan melanggar unique (app-qh4u).
        const rusak = aktif.filter((x) => x.jumlahRusak > 0);
        if (rusak.length) {
          const nomorAwal = await generateDocNumber("SLS-JHT", "selisih_jahit", "nomor_kasus", tx);
          const [prefixBulan, urutAwal] = pisahNomor(nomorAwal);
          await tx.insert(selisihJahit).values(
            rusak.map((d, i) => ({
              nomorKasus: `${prefixBulan}-${String(urutAwal + i).padStart(4, "0")}`,
              penugasanDetailId: d.penugasanDetailId,
              penerimaanId: header.id,
              klasifikasi: "rusak" as const,
              jumlah: d.jumlahRusak,
              catatan: d.catatan?.trim() || null,
              createdBy: user.id,
            })),
          );
        }

        if (input.returId) {
          await tx
            .update(returJahit)
            .set({ status: "diterima_kembali", updatedAt: new Date() })
            .where(eq(returJahit.id, input.returId));
        }

        await refreshPenugasanSelesai(tx, input.penugasanId);
        await writeAudit(tx, "penerimaan_hasil_jahit", "CREATE", header.id, null, { ...header, details: aktif }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal mencatat penerimaan — coba lagi" };
}

/** Hapus hanya kalau belum jadi dasar retur / selisih yang sudah diputuskan. */
export async function softDeletePenerimaanHasil(id: string): Promise<Result> {
  const user = await requireRole(["owner", "admin_produksi"]);

  const [before] = await db
    .select()
    .from(penerimaanHasilJahit)
    .where(and(eq(penerimaanHasilJahit.id, id), isNull(penerimaanHasilJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Penerimaan tidak ditemukan" };

  const [returRef] = await db
    .select({ id: returJahit.id })
    .from(returJahit)
    .where(and(eq(returJahit.penerimaanAsalId, id), isNull(returJahit.deletedAt)))
    .limit(1);
  if (returRef) return { error: "Penerimaan sudah jadi dasar retur — tidak bisa dihapus" };

  const [diputuskan] = await db
    .select({ id: selisihJahit.id })
    .from(selisihJahit)
    .where(and(eq(selisihJahit.penerimaanId, id), sql`${selisihJahit.keputusan} IS NOT NULL`, isNull(selisihJahit.deletedAt)))
    .limit(1);
  if (diputuskan) return { error: "Ada kasus selisih yang sudah diputuskan dari penerimaan ini" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(penerimaanHasilJahit)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(penerimaanHasilJahit.id, id))
      .returning();
    // selisih otomatis ikut terhapus (soft)
    await tx
      .update(selisihJahit)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(selisihJahit.penerimaanId, id), isNull(selisihJahit.deletedAt)));
    if (before.returId) {
      // retur kembali ke 'dikirim' kalau tak ada penerimaan lain untuk retur itu
      const [lain] = await tx
        .select({ id: penerimaanHasilJahit.id })
        .from(penerimaanHasilJahit)
        .where(and(eq(penerimaanHasilJahit.returId, before.returId), isNull(penerimaanHasilJahit.deletedAt)))
        .limit(1);
      if (!lain) {
        await tx.update(returJahit).set({ status: "dikirim", updatedAt: new Date() }).where(eq(returJahit.id, before.returId));
      }
    }
    await refreshPenugasanSelesai(tx, before.penugasanId);
    await writeAudit(tx, "penerimaan_hasil_jahit", "DELETE", id, before, row, user.id);
    return { data: row };
  });
}

/** Retur yang menunggu hasil perbaikan kembali — untuk form penerimaan mode retur. */
export async function listReturMenungguKembali() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: returJahit.id,
      nomorDokumen: returJahit.nomorDokumen,
      penugasanId: returJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      pihakNama,
      status: returJahit.status,
    })
    .from(returJahit)
    .innerJoin(penugasanJahit, eq(returJahit.penugasanId, penugasanJahit.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(and(inArray(returJahit.status, ["dikirim", "diterima_kembali"]), isNull(returJahit.deletedAt)))
    .orderBy(desc(returJahit.tanggalRetur));
}

export type ReturMenungguKembali = Awaited<ReturnType<typeof listReturMenungguKembali>>[number];
