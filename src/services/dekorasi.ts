"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dekorasiTemplate,
  pekerjaanDekorasi,
  penerimaanDekorasi,
  suratJalanJahit,
  produk,
  vendor,
  lokasiProduksi,
  workOrderCutting,
  poProduksi,
  hasilCutting,
  hasilCuttingDetail,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type {
  TemplateInput,
  PekerjaanDekorasiInput,
  PenerimaanDekorasiInput,
} from "@/lib/schemas/dekorasi";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type TemplateRow = typeof dekorasiTemplate.$inferSelect;
type PekerjaanRow = typeof pekerjaanDekorasi.$inferSelect;

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

// ─── Master template dekorasi ─────────────────────────────────────────────────

export async function listTemplate() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: dekorasiTemplate.id,
      produkId: dekorasiTemplate.produkId,
      produkKode: produk.kode,
      produkNama: produk.nama,
      dekorasiProses: produk.dekorasiProses,
      jenis: dekorasiTemplate.jenis,
      posisi: dekorasiTemplate.posisi,
      deskripsi: dekorasiTemplate.deskripsi,
      tarifDefault: dekorasiTemplate.tarifDefault,
      isActive: dekorasiTemplate.isActive,
    })
    .from(dekorasiTemplate)
    .innerJoin(produk, eq(dekorasiTemplate.produkId, produk.id))
    .where(isNull(dekorasiTemplate.deletedAt))
    .orderBy(produk.nama, dekorasiTemplate.jenis);
}

export type TemplateListRow = Awaited<ReturnType<typeof listTemplate>>[number];

export async function createTemplate(input: TemplateInput): Promise<{ data?: TemplateRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);
  const [row] = await db
    .insert(dekorasiTemplate)
    .values({
      produkId: input.produkId,
      jenis: input.jenis,
      posisi: input.posisi,
      deskripsi: input.deskripsi?.trim() || null,
      tarifDefault: String(input.tarifDefault),
      isActive: input.isActive,
    })
    .returning();
  await writeAudit(db, "dekorasi_template", "CREATE", row.id, null, row, user.id);
  return { data: row };
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<{ data?: TemplateRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db.select().from(dekorasiTemplate).where(eq(dekorasiTemplate.id, id)).limit(1);
  if (!before) return { error: "Template tidak ditemukan" };

  const [row] = await db
    .update(dekorasiTemplate)
    .set({
      produkId: input.produkId,
      jenis: input.jenis,
      posisi: input.posisi,
      deskripsi: input.deskripsi?.trim() || null,
      tarifDefault: String(input.tarifDefault),
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(dekorasiTemplate.id, id))
    .returning();
  await writeAudit(db, "dekorasi_template", "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteTemplate(id: string): Promise<{ data?: TemplateRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [dipakai] = await db
    .select({ id: pekerjaanDekorasi.id })
    .from(pekerjaanDekorasi)
    .where(and(eq(pekerjaanDekorasi.templateId, id), isNull(pekerjaanDekorasi.deletedAt)))
    .limit(1);
  if (dipakai) return { error: "Template sudah dipakai pekerjaan dekorasi — nonaktifkan saja" };

  const [before] = await db.select().from(dekorasiTemplate).where(eq(dekorasiTemplate.id, id)).limit(1);
  if (!before) return { error: "Template tidak ditemukan" };

  const [row] = await db
    .update(dekorasiTemplate)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(dekorasiTemplate.id, id))
    .returning();
  await writeAudit(db, "dekorasi_template", "DELETE", id, before, row, user.id);
  return { data: row };
}

// ─── Pekerjaan dekorasi ───────────────────────────────────────────────────────

const selesaiSql = sql<number>`(
  SELECT COALESCE(SUM(r.jumlah_selesai), 0)::int FROM penerimaan_dekorasi r
  WHERE r.pekerjaan_id = ${pekerjaanDekorasi.id} AND r.deleted_at IS NULL
)`;
const rusakSql = sql<number>`(
  SELECT COALESCE(SUM(r.jumlah_rusak), 0)::int FROM penerimaan_dekorasi r
  WHERE r.pekerjaan_id = ${pekerjaanDekorasi.id} AND r.deleted_at IS NULL
)`;

export async function listPekerjaanDekorasi() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: pekerjaanDekorasi.id,
      nomorDokumen: pekerjaanDekorasi.nomorDokumen,
      woId: pekerjaanDekorasi.woId,
      woNomor: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      jenis: dekorasiTemplate.jenis,
      posisi: dekorasiTemplate.posisi,
      vendorNama: vendor.nama,
      jumlah: pekerjaanDekorasi.jumlah,
      tarifSnapshot: pekerjaanDekorasi.tarifSnapshot,
      tanggal: pekerjaanDekorasi.tanggal,
      targetSelesai: pekerjaanDekorasi.targetSelesai,
      status: pekerjaanDekorasi.status,
      sjNomor: suratJalanJahit.nomorDokumen,
      selesai: selesaiSql,
      rusak: rusakSql,
    })
    .from(pekerjaanDekorasi)
    .innerJoin(workOrderCutting, eq(pekerjaanDekorasi.woId, workOrderCutting.id))
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(dekorasiTemplate, eq(pekerjaanDekorasi.templateId, dekorasiTemplate.id))
    .innerJoin(vendor, eq(pekerjaanDekorasi.vendorId, vendor.id))
    .leftJoin(suratJalanJahit, eq(suratJalanJahit.pekerjaanDekorasiId, pekerjaanDekorasi.id))
    .where(isNull(pekerjaanDekorasi.deletedAt))
    .orderBy(desc(pekerjaanDekorasi.tanggal));
}

export type PekerjaanDekorasiListRow = Awaited<ReturnType<typeof listPekerjaanDekorasi>>[number];

export async function getPekerjaanDekorasiDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: pekerjaanDekorasi.id,
      nomorDokumen: pekerjaanDekorasi.nomorDokumen,
      woNomor: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      produkKode: produk.kode,
      templateId: pekerjaanDekorasi.templateId,
      jenis: dekorasiTemplate.jenis,
      posisi: dekorasiTemplate.posisi,
      deskripsi: dekorasiTemplate.deskripsi,
      vendorNama: vendor.nama,
      vendorAlamat: vendor.alamat,
      vendorTelepon: vendor.telepon,
      lokasiTujuanNama: lokasiProduksi.nama,
      lokasiTujuanAlamat: lokasiProduksi.alamat,
      jumlah: pekerjaanDekorasi.jumlah,
      tarifSnapshot: pekerjaanDekorasi.tarifSnapshot,
      tanggal: pekerjaanDekorasi.tanggal,
      tanggalKirim: pekerjaanDekorasi.tanggalKirim,
      targetSelesai: pekerjaanDekorasi.targetSelesai,
      pengirim: pekerjaanDekorasi.pengirim,
      kurir: pekerjaanDekorasi.kurir,
      status: pekerjaanDekorasi.status,
      catatan: pekerjaanDekorasi.catatan,
      sjId: suratJalanJahit.id,
      sjNomor: suratJalanJahit.nomorDokumen,
      sjJumlahCetak: suratJalanJahit.jumlahCetak,
      selesai: selesaiSql,
      rusak: rusakSql,
    })
    .from(pekerjaanDekorasi)
    .innerJoin(workOrderCutting, eq(pekerjaanDekorasi.woId, workOrderCutting.id))
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(dekorasiTemplate, eq(pekerjaanDekorasi.templateId, dekorasiTemplate.id))
    .innerJoin(vendor, eq(pekerjaanDekorasi.vendorId, vendor.id))
    .leftJoin(lokasiProduksi, eq(pekerjaanDekorasi.lokasiTujuanId, lokasiProduksi.id))
    .leftJoin(suratJalanJahit, eq(suratJalanJahit.pekerjaanDekorasiId, pekerjaanDekorasi.id))
    .where(and(eq(pekerjaanDekorasi.id, id), isNull(pekerjaanDekorasi.deletedAt)))
    .limit(1);

  if (!header) return null;

  const penerimaan = await db
    .select({
      id: penerimaanDekorasi.id,
      nomorDokumen: penerimaanDekorasi.nomorDokumen,
      tanggalJam: penerimaanDekorasi.tanggalJam,
      penerima: penerimaanDekorasi.penerima,
      jumlahSelesai: penerimaanDekorasi.jumlahSelesai,
      jumlahRusak: penerimaanDekorasi.jumlahRusak,
      catatan: penerimaanDekorasi.catatan,
    })
    .from(penerimaanDekorasi)
    .where(and(eq(penerimaanDekorasi.pekerjaanId, id), isNull(penerimaanDekorasi.deletedAt)))
    .orderBy(desc(penerimaanDekorasi.tanggalJam));

  return { ...header, penerimaan };
}

export type PekerjaanDekorasiDetailData = NonNullable<Awaited<ReturnType<typeof getPekerjaanDekorasiDetail>>>;

/** WO cutting yang produknya butuh dekorasi + sudah ada hasil cutting baik. */
export async function listWoBisaDekorasi() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: workOrderCutting.id,
      nomorDokumen: workOrderCutting.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkId: produk.id,
      produkNama: produk.nama,
      dekorasiProses: produk.dekorasiProses,
      totalBaik: sql<number>`(
        SELECT COALESCE(SUM(hd.jumlah_baik), 0)::int FROM hasil_cutting h
        JOIN hasil_cutting_detail hd ON hd.hasil_id = h.id
        WHERE h.wo_id = ${workOrderCutting.id} AND h.deleted_at IS NULL
      )`,
    })
    .from(workOrderCutting)
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(
      and(
        isNull(workOrderCutting.deletedAt),
        sql`${produk.dekorasiProses} <> 'none'`,
        sql`EXISTS (
          SELECT 1 FROM hasil_cutting h JOIN hasil_cutting_detail hd ON hd.hasil_id = h.id
          WHERE h.wo_id = ${workOrderCutting.id} AND h.deleted_at IS NULL AND hd.jumlah_baik > 0
        )`,
      ),
    )
    .orderBy(desc(workOrderCutting.createdAt));
}

export type WoBisaDekorasi = Awaited<ReturnType<typeof listWoBisaDekorasi>>[number];

/** Template aktif milik satu produk — pilihan saat buat pekerjaan. */
export async function listTemplateProduk(produkId: string) {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: dekorasiTemplate.id,
      jenis: dekorasiTemplate.jenis,
      posisi: dekorasiTemplate.posisi,
      deskripsi: dekorasiTemplate.deskripsi,
      tarifDefault: dekorasiTemplate.tarifDefault,
    })
    .from(dekorasiTemplate)
    .where(
      and(
        eq(dekorasiTemplate.produkId, produkId),
        eq(dekorasiTemplate.isActive, true),
        isNull(dekorasiTemplate.deletedAt),
      ),
    )
    .orderBy(dekorasiTemplate.jenis);
}

/** Vendor berkapabilitas sablon/bordir saja — vendor jahit murni tidak muncul. */
export async function listVendorDekorasi() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: vendor.id,
      kode: vendor.kode,
      nama: vendor.nama,
      kapabilitas: vendor.kapabilitas,
      isActive: vendor.isActive,
    })
    .from(vendor)
    .where(
      and(
        isNull(vendor.deletedAt),
        eq(vendor.isActive, true),
        sql`(${vendor.kapabilitas} && ARRAY['sablon','bordir']::vendor_kapabilitas[])`,
      ),
    )
    .orderBy(vendor.nama);
}

export type VendorDekorasi = Awaited<ReturnType<typeof listVendorDekorasi>>[number];

export async function createPekerjaanDekorasi(
  input: PekerjaanDekorasiInput,
): Promise<{ data?: PekerjaanRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  // vendor harus punya kapabilitas dekorasi
  const [v] = await db
    .select({ kapabilitas: vendor.kapabilitas, isActive: vendor.isActive })
    .from(vendor)
    .where(and(eq(vendor.id, input.vendorId), isNull(vendor.deletedAt)))
    .limit(1);
  if (!v) return { error: "Vendor tidak ditemukan" };
  if (!v.isActive) return { error: "Vendor nonaktif" };
  if (!v.kapabilitas.some((k) => k === "sablon" || k === "bordir")) {
    return { error: "Vendor tidak punya kapabilitas sablon/bordir" };
  }

  // jumlah tidak boleh melebihi hasil cutting baik di WO
  const [{ totalBaik }] = await db
    .select({ totalBaik: sql<number>`COALESCE(SUM(${hasilCuttingDetail.jumlahBaik}), 0)::int` })
    .from(hasilCuttingDetail)
    .innerJoin(hasilCutting, eq(hasilCuttingDetail.hasilId, hasilCutting.id))
    .where(and(eq(hasilCutting.woId, input.woId), isNull(hasilCutting.deletedAt)));
  if (input.jumlah > totalBaik) {
    return { error: `Melebihi hasil cutting baik di WO (tersedia ${totalBaik} pcs)` };
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("DEK", "pekerjaan_dekorasi");
        const [row] = await tx
          .insert(pekerjaanDekorasi)
          .values({
            nomorDokumen,
            woId: input.woId,
            templateId: input.templateId,
            vendorId: input.vendorId,
            lokasiTujuanId: input.lokasiTujuanId || null,
            jumlah: input.jumlah,
            tarifSnapshot: String(input.tarif),
            tanggal: new Date(input.tanggal),
            targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
            pengirim: input.pengirim?.trim() || null,
            kurir: input.kurir?.trim() || null,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();
        await writeAudit(tx, "pekerjaan_dekorasi", "CREATE", row.id, null, row, user.id);
        return { data: row };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat pekerjaan dekorasi — coba lagi" };
}

/** Kirim ke vendor dekorasi: status → dikirim + surat jalan (reuse SJ-JHT). */
export async function kirimPekerjaanDekorasi(id: string): Promise<{ data?: PekerjaanRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(pekerjaanDekorasi)
    .where(and(eq(pekerjaanDekorasi.id, id), isNull(pekerjaanDekorasi.deletedAt)))
    .limit(1);
  if (!before) return { error: "Pekerjaan tidak ditemukan" };
  if (before.status !== "draft") return { error: `Pekerjaan berstatus ${before.status}` };

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .update(pekerjaanDekorasi)
          .set({ status: "dikirim", tanggalKirim: new Date(), updatedAt: new Date() })
          .where(eq(pekerjaanDekorasi.id, id))
          .returning();

        const sjNomor = await generateDocNumber("SJ-JHT", "surat_jalan_jahit");
        await tx.insert(suratJalanJahit).values({ nomorDokumen: sjNomor, pekerjaanDekorasiId: id });

        await writeAudit(tx, "pekerjaan_dekorasi", "UPDATE", id, before, { ...row, sjNomor }, user.id);
        return { data: row };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal mengirim — coba lagi" };
}

export async function batalPekerjaanDekorasi(id: string): Promise<{ data?: PekerjaanRow; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(pekerjaanDekorasi)
    .where(and(eq(pekerjaanDekorasi.id, id), isNull(pekerjaanDekorasi.deletedAt)))
    .limit(1);
  if (!before) return { error: "Pekerjaan tidak ditemukan" };
  if (before.status === "selesai") return { error: "Pekerjaan sudah selesai" };

  const [adaTerima] = await db
    .select({ id: penerimaanDekorasi.id })
    .from(penerimaanDekorasi)
    .where(and(eq(penerimaanDekorasi.pekerjaanId, id), isNull(penerimaanDekorasi.deletedAt)))
    .limit(1);
  if (adaTerima) return { error: "Sudah ada hasil diterima — tidak bisa dibatalkan" };

  const [row] = await db
    .update(pekerjaanDekorasi)
    .set({ status: "dibatalkan", updatedAt: new Date() })
    .where(eq(pekerjaanDekorasi.id, id))
    .returning();
  await writeAudit(db, "pekerjaan_dekorasi", "CANCEL", id, before, row, user.id);
  return { data: row };
}

/** Terima hasil dekorasi bertahap; status → selesai kalau Σ selesai+rusak sudah penuh. */
export async function terimaDekorasi(
  pekerjaanId: string,
  input: PenerimaanDekorasiInput,
): Promise<{ data?: typeof penerimaanDekorasi.$inferSelect; error?: string }> {
  const user = await requireRole(["owner", "admin_gudang", "admin_produksi"]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [pekerjaan] = await tx
          .select()
          .from(pekerjaanDekorasi)
          .where(and(eq(pekerjaanDekorasi.id, pekerjaanId), isNull(pekerjaanDekorasi.deletedAt)))
          .limit(1);
        if (!pekerjaan) return { error: "Pekerjaan tidak ditemukan" };
        if (pekerjaan.status !== "dikirim" && pekerjaan.status !== "selesai") {
          return { error: `Pekerjaan berstatus ${pekerjaan.status} — belum dikirim ke vendor` };
        }

        const [{ sudah }] = await tx
          .select({
            sudah: sql<number>`COALESCE(SUM(${penerimaanDekorasi.jumlahSelesai} + ${penerimaanDekorasi.jumlahRusak}), 0)::int`,
          })
          .from(penerimaanDekorasi)
          .where(and(eq(penerimaanDekorasi.pekerjaanId, pekerjaanId), isNull(penerimaanDekorasi.deletedAt)));

        const masuk = input.jumlahSelesai + input.jumlahRusak;
        if (sudah + masuk > pekerjaan.jumlah) {
          return { error: `Melebihi jumlah dikirim (sisa ${pekerjaan.jumlah - sudah} pcs)` };
        }

        const nomorDokumen = await generateDocNumber("RCD-DEK", "penerimaan_dekorasi");
        const [row] = await tx
          .insert(penerimaanDekorasi)
          .values({
            nomorDokumen,
            pekerjaanId,
            tanggalJam: new Date(input.tanggalJam),
            penerima: input.penerima.trim(),
            jumlahSelesai: input.jumlahSelesai,
            jumlahRusak: input.jumlahRusak,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        if (sudah + masuk >= pekerjaan.jumlah) {
          await tx
            .update(pekerjaanDekorasi)
            .set({ status: "selesai", updatedAt: new Date() })
            .where(eq(pekerjaanDekorasi.id, pekerjaanId));
        }

        await writeAudit(tx, "penerimaan_dekorasi", "CREATE", row.id, null, row, user.id);
        return { data: row };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal mencatat penerimaan — coba lagi" };
}
