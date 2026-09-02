"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  pengirimanJahit,
  pengirimanJahitDetail,
  suratJalanJahit,
  penerimaanBundelVendor,
  penerimaanBundelVendorDetail,
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
import { generateDocNumber } from "@/lib/document-number";
import type { PengirimanInput, SerahTerimaInput } from "@/lib/schemas/pengiriman-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type PengirimanRow = typeof pengirimanJahit.$inferSelect;
type PengirimanResult = { data?: PengirimanRow; error?: string };

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

export async function listPengiriman() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: pengirimanJahit.id,
      nomorDokumen: pengirimanJahit.nomorDokumen,
      penugasanId: pengirimanJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      tanggalJam: pengirimanJahit.tanggalJam,
      status: pengirimanJahit.status,
      sjNomor: suratJalanJahit.nomorDokumen,
      totalBundel: sql<number>`(SELECT COUNT(*)::int FROM pengiriman_jahit_detail d WHERE d.pengiriman_id = ${pengirimanJahit.id})`,
      totalPcs: sql<number>`(SELECT COALESCE(SUM(pd.jumlah_pcs), 0)::int FROM pengiriman_jahit_detail d JOIN penugasan_jahit_detail pd ON pd.id = d.penugasan_detail_id WHERE d.pengiriman_id = ${pengirimanJahit.id})`,
    })
    .from(pengirimanJahit)
    .innerJoin(penugasanJahit, eq(pengirimanJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(suratJalanJahit, eq(suratJalanJahit.pengirimanId, pengirimanJahit.id))
    .where(isNull(pengirimanJahit.deletedAt))
    .orderBy(desc(pengirimanJahit.tanggalJam));
}

export type PengirimanListRow = Awaited<ReturnType<typeof listPengiriman>>[number];

export async function getPengirimanDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const asal = db.$with("asal").as(
    db.select({ id: lokasiProduksi.id, nama: lokasiProduksi.nama }).from(lokasiProduksi),
  );

  const [header] = await db
    .with(asal)
    .select({
      id: pengirimanJahit.id,
      nomorDokumen: pengirimanJahit.nomorDokumen,
      penugasanId: pengirimanJahit.penugasanId,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      jenisPekerjaan: penugasanJahit.jenisPekerjaan,
      targetSelesai: penugasanJahit.targetSelesai,
      pihakNama,
      pihakAlamat: sql<string | null>`COALESCE(${vendor.alamat}, ${penjahit.alamat})`,
      pihakTelepon: sql<string | null>`COALESCE(${vendor.telepon}, ${penjahit.telepon})`,
      tanggalJam: pengirimanJahit.tanggalJam,
      lokasiAsalId: pengirimanJahit.lokasiAsalId,
      lokasiAsalNama: asal.nama,
      lokasiTujuanId: pengirimanJahit.lokasiTujuanId,
      lokasiTujuanNama: lokasiProduksi.nama,
      lokasiTujuanAlamat: lokasiProduksi.alamat,
      pengirim: pengirimanJahit.pengirim,
      penerima: pengirimanJahit.penerima,
      kendaraan: pengirimanJahit.kendaraan,
      kurir: pengirimanJahit.kurir,
      buktiFotoUrl: pengirimanJahit.buktiFotoUrl,
      status: pengirimanJahit.status,
      catatan: pengirimanJahit.catatan,
      alasanBatal: pengirimanJahit.alasanBatal,
      createdAt: pengirimanJahit.createdAt,
      createdByNama: users.displayName,
      sjId: suratJalanJahit.id,
      sjNomor: suratJalanJahit.nomorDokumen,
      sjJumlahCetak: suratJalanJahit.jumlahCetak,
    })
    .from(pengirimanJahit)
    .innerJoin(penugasanJahit, eq(pengirimanJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(users, eq(pengirimanJahit.createdBy, users.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(asal, eq(pengirimanJahit.lokasiAsalId, asal.id))
    .leftJoin(lokasiProduksi, eq(pengirimanJahit.lokasiTujuanId, lokasiProduksi.id))
    .leftJoin(suratJalanJahit, eq(suratJalanJahit.pengirimanId, pengirimanJahit.id))
    .where(and(eq(pengirimanJahit.id, id), isNull(pengirimanJahit.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: pengirimanJahitDetail.id,
      penugasanDetailId: pengirimanJahitDetail.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: penugasanJahitDetail.jumlahPcs,
      tarifSnapshot: penugasanJahitDetail.tarifSnapshot,
      kelengkapanPanel: pengirimanJahitDetail.kelengkapanPanel,
      aksesoris: pengirimanJahitDetail.aksesoris,
      catatan: pengirimanJahitDetail.catatan,
    })
    .from(pengirimanJahitDetail)
    .innerJoin(penugasanJahitDetail, eq(pengirimanJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(pengirimanJahitDetail.pengirimanId, id))
    .orderBy(bundling.nomorDokumen);

  const [serahTerima] = await db
    .select({
      id: penerimaanBundelVendor.id,
      nomorDokumen: penerimaanBundelVendor.nomorDokumen,
      tanggalJam: penerimaanBundelVendor.tanggalJam,
      penerima: penerimaanBundelVendor.penerima,
      lokasiNama: lokasiProduksi.nama,
      fotoUrl: penerimaanBundelVendor.fotoUrl,
      catatan: penerimaanBundelVendor.catatan,
    })
    .from(penerimaanBundelVendor)
    .leftJoin(lokasiProduksi, eq(penerimaanBundelVendor.lokasiId, lokasiProduksi.id))
    .where(and(eq(penerimaanBundelVendor.pengirimanId, id), isNull(penerimaanBundelVendor.deletedAt)))
    .limit(1);

  const serahTerimaDetails = serahTerima
    ? await db
        .select({
          pengirimanDetailId: penerimaanBundelVendorDetail.pengirimanDetailId,
          jumlahDiterima: penerimaanBundelVendorDetail.jumlahDiterima,
          kondisi: penerimaanBundelVendorDetail.kondisi,
          catatan: penerimaanBundelVendorDetail.catatan,
        })
        .from(penerimaanBundelVendorDetail)
        .where(eq(penerimaanBundelVendorDetail.penerimaanId, serahTerima.id))
    : [];

  return {
    ...header,
    details,
    serahTerima: serahTerima ? { ...serahTerima, details: serahTerimaDetails } : null,
  };
}

export type PengirimanDetailData = NonNullable<Awaited<ReturnType<typeof getPengirimanDetail>>>;

/** Detail penugasan yang bundelnya masih siap_dikirim (belum masuk pengiriman aktif). */
export async function listDetailBelumDikirim(penugasanId: string) {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: penugasanJahitDetail.id,
      bundlingId: penugasanJahitDetail.bundlingId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: penugasanJahitDetail.jumlahPcs,
    })
    .from(penugasanJahitDetail)
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(
      and(
        eq(penugasanJahitDetail.penugasanId, penugasanId),
        eq(bundling.status, "siap_dikirim"),
        isNull(bundling.deletedAt),
      ),
    )
    .orderBy(bundling.nomorDokumen);
}

export type DetailBelumDikirim = Awaited<ReturnType<typeof listDetailBelumDikirim>>[number];

/**
 * Pengiriman = perpindahan fisik. Dalam satu transaksi: header + detail + surat jalan,
 * bundel → sudah_dikirim (kunci), penugasan draft → aktif.
 */
export async function createPengiriman(input: PengirimanInput): Promise<PengirimanResult> {
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
        if (penugasan.status === "dibatalkan" || penugasan.status === "selesai") {
          return { error: `Penugasan sudah ${penugasan.status} — tidak bisa dikirim` };
        }

        // guard: detail milik penugasan ini + bundelnya masih siap_dikirim (re-check dalam tx)
        const ids = input.details.map((d) => d.penugasanDetailId);
        const valid = await tx
          .select({ id: penugasanJahitDetail.id, bundlingId: penugasanJahitDetail.bundlingId })
          .from(penugasanJahitDetail)
          .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
          .where(
            and(
              inArray(penugasanJahitDetail.id, ids),
              eq(penugasanJahitDetail.penugasanId, input.penugasanId),
              eq(bundling.status, "siap_dikirim"),
              isNull(bundling.deletedAt),
            ),
          );
        if (valid.length !== ids.length) {
          return { error: "Ada bundel yang sudah dikirim atau bukan milik penugasan ini" };
        }

        const nomorDokumen = await generateDocNumber("SHP-JHT", "pengiriman_jahit");
        const [header] = await tx
          .insert(pengirimanJahit)
          .values({
            nomorDokumen,
            penugasanId: input.penugasanId,
            tanggalJam: new Date(input.tanggalJam),
            lokasiAsalId: input.lokasiAsalId || null,
            lokasiTujuanId: input.lokasiTujuanId || penugasan.lokasiTujuanId,
            pengirim: input.pengirim?.trim() || null,
            penerima: input.penerima?.trim() || null,
            kendaraan: input.kendaraan?.trim() || null,
            kurir: input.kurir?.trim() || null,
            buktiFotoUrl: input.buktiFotoUrl?.trim() || null,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(pengirimanJahitDetail).values(
          input.details.map((d) => ({
            pengirimanId: header.id,
            penugasanDetailId: d.penugasanDetailId,
            kelengkapanPanel: d.kelengkapanPanel,
            aksesoris: d.aksesoris?.trim() || null,
            catatan: d.catatan?.trim() || null,
          })),
        );

        // surat jalan 1:1, nomor sendiri (PRD §11)
        const sjNomor = await generateDocNumber("SJ-JHT", "surat_jalan_jahit");
        await tx.insert(suratJalanJahit).values({ nomorDokumen: sjNomor, pengirimanId: header.id });

        // kunci bundel — status sudah_dikirim = immutable di flow bundling
        await tx
          .update(bundling)
          .set({ status: "sudah_dikirim", updatedAt: new Date() })
          .where(inArray(bundling.id, valid.map((v) => v.bundlingId)));

        if (penugasan.status === "draft") {
          await tx
            .update(penugasanJahit)
            .set({ status: "aktif", updatedAt: new Date() })
            .where(eq(penugasanJahit.id, penugasan.id));
        }

        await writeAudit(tx, "pengiriman_jahit", "CREATE", header.id, null, { ...header, sjNomor, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat pengiriman — coba lagi" };
}

/** Batal hanya kalau belum diterima vendor. Bundel dilepas kembali ke siap_dikirim. */
export async function cancelPengiriman(id: string, alasan: string): Promise<PengirimanResult> {
  const user = await requireRole([...WRITE_ROLES]);
  if (!alasan.trim()) return { error: "Alasan pembatalan wajib diisi" };

  const [before] = await db
    .select()
    .from(pengirimanJahit)
    .where(and(eq(pengirimanJahit.id, id), isNull(pengirimanJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Pengiriman tidak ditemukan" };
  if (before.status !== "dikirim") {
    return { error: `Pengiriman berstatus ${before.status} — tidak bisa dibatalkan` };
  }

  return db.transaction(async (tx) => {
    const bundelIds = await tx
      .select({ bundlingId: penugasanJahitDetail.bundlingId })
      .from(pengirimanJahitDetail)
      .innerJoin(penugasanJahitDetail, eq(pengirimanJahitDetail.penugasanDetailId, penugasanJahitDetail.id))
      .where(eq(pengirimanJahitDetail.pengirimanId, id));

    const [row] = await tx
      .update(pengirimanJahit)
      .set({
        status: "dibatalkan",
        cancelledBy: user.id,
        cancelledAt: new Date(),
        alasanBatal: alasan.trim(),
        updatedAt: new Date(),
      })
      .where(eq(pengirimanJahit.id, id))
      .returning();

    if (bundelIds.length > 0) {
      await tx
        .update(bundling)
        .set({ status: "siap_dikirim", updatedAt: new Date() })
        .where(inArray(bundling.id, bundelIds.map((b) => b.bundlingId)));
    }

    await writeAudit(tx, "pengiriman_jahit", "CANCEL", id, before, row, user.id);
    return { data: row };
  });
}

/** Serah terima di vendor (PRD §12): catat kondisi per bundel, pengiriman → diterima. */
export async function createSerahTerima(
  pengirimanId: string,
  input: SerahTerimaInput,
): Promise<{ data?: typeof penerimaanBundelVendor.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [pengiriman] = await db
    .select()
    .from(pengirimanJahit)
    .where(and(eq(pengirimanJahit.id, pengirimanId), isNull(pengirimanJahit.deletedAt)))
    .limit(1);
  if (!pengiriman) return { error: "Pengiriman tidak ditemukan" };
  if (pengiriman.status !== "dikirim") {
    return { error: `Pengiriman berstatus ${pengiriman.status} — serah terima tidak bisa dicatat` };
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const ids = input.details.map((d) => d.pengirimanDetailId);
        const valid = await tx
          .select({ id: pengirimanJahitDetail.id })
          .from(pengirimanJahitDetail)
          .where(and(inArray(pengirimanJahitDetail.id, ids), eq(pengirimanJahitDetail.pengirimanId, pengirimanId)));
        if (valid.length !== ids.length) return { error: "Ada baris yang bukan milik pengiriman ini" };

        const nomorDokumen = await generateDocNumber("STB-JHT", "penerimaan_bundel_vendor");
        const [header] = await tx
          .insert(penerimaanBundelVendor)
          .values({
            nomorDokumen,
            pengirimanId,
            tanggalJam: new Date(input.tanggalJam),
            penerima: input.penerima.trim(),
            lokasiId: input.lokasiId || null,
            fotoUrl: input.fotoUrl?.trim() || null,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(penerimaanBundelVendorDetail).values(
          input.details.map((d) => ({
            penerimaanId: header.id,
            pengirimanDetailId: d.pengirimanDetailId,
            jumlahDiterima: d.jumlahDiterima,
            kondisi: d.kondisi,
            catatan: d.catatan?.trim() || null,
          })),
        );

        await tx
          .update(pengirimanJahit)
          .set({ status: "diterima", updatedAt: new Date() })
          .where(eq(pengirimanJahit.id, pengirimanId));

        await writeAudit(tx, "penerimaan_bundel_vendor", "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal mencatat serah terima — coba lagi" };
}

// ─── Surat Jalan (oims-eba.7) ─────────────────────────────────────────────────

export async function listSuratJalan() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: suratJalanJahit.id,
      nomorDokumen: suratJalanJahit.nomorDokumen,
      pengirimanId: suratJalanJahit.pengirimanId,
      pengirimanNomor: pengirimanJahit.nomorDokumen,
      pengirimanStatus: pengirimanJahit.status,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      pihakNama,
      tanggalJam: pengirimanJahit.tanggalJam,
      jumlahCetak: suratJalanJahit.jumlahCetak,
      dicetakTerakhirAt: suratJalanJahit.dicetakTerakhirAt,
    })
    .from(suratJalanJahit)
    .innerJoin(pengirimanJahit, eq(suratJalanJahit.pengirimanId, pengirimanJahit.id))
    .innerJoin(penugasanJahit, eq(pengirimanJahit.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(isNull(pengirimanJahit.deletedAt))
    .orderBy(desc(pengirimanJahit.tanggalJam));
}

export type SuratJalanListRow = Awaited<ReturnType<typeof listSuratJalan>>[number];

/** Catat cetak: jumlahCetak naik. Return count SEBELUM naik → 0 = cetak pertama, >0 = cetak ulang. */
export async function markSuratJalanDicetak(pengirimanId: string): Promise<{ sebelumnya: number }> {
  await requireRole([...READ_ROLES]);
  const [row] = await db
    .update(suratJalanJahit)
    .set({ jumlahCetak: sql`${suratJalanJahit.jumlahCetak} + 1`, dicetakTerakhirAt: new Date() })
    .where(eq(suratJalanJahit.pengirimanId, pengirimanId))
    .returning({ jumlahCetak: suratJalanJahit.jumlahCetak });
  return { sebelumnya: (row?.jumlahCetak ?? 1) - 1 };
}

/** Dipakai (a) dashboard/monitoring: pengiriman yang belum ada serah terima. */
export async function countPengirimanMenungguTerima() {
  await requireRole([...READ_ROLES]);
  const [r] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(pengirimanJahit)
    .where(and(eq(pengirimanJahit.status, "dikirim"), isNull(pengirimanJahit.deletedAt)));
  return r?.n ?? 0;
}
