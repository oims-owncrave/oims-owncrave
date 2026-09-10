"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  perbaikanInternal,
  perbaikanInternalDetail,
  returQcVendor,
  returQcVendorDetail,
  hasilQc,
  hasilQcDetail,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  users,
  auditLog,
} from "@/db/schema";
import type { PerbaikanInternal, ReturQcVendor } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { PerbaikanInternalInput, ReturQcVendorInput } from "@/lib/schemas/rework";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type RwkResult = { data?: PerbaikanInternal; error?: string };
type RtnResult = { data?: ReturQcVendor; error?: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

/**
 * GUARD BERSAMA dua jalur rework — dipanggil oleh createPerbaikanInternal DAN
 * createReturQcVendor. Kalau tiap jalur punya guard sendiri, keduanya bisa
 * saling melampaui sampai total > kolom perbaikan.
 */
async function cekKapasitasRework(
  tx: Tx,
  rows: { hasilQcDetailId: string; jumlah: number }[],
): Promise<string | null> {
  const ids = [...new Set(rows.map((r) => r.hasilQcDetailId))];

  const kapasitas = await tx
    .select({
      id: hasilQcDetail.id,
      perbaikan: hasilQcDetail.perbaikan,
      sudah: sql<number>`(
        (SELECT COALESCE(SUM(pd.jumlah), 0)::int
         FROM perbaikan_internal_detail pd
         JOIN perbaikan_internal p ON p.id = pd.perbaikan_internal_id
         WHERE pd.hasil_qc_detail_id = ${hasilQcDetail.id}
           AND p.deleted_at IS NULL AND p.status <> 'dibatalkan')
        +
        (SELECT COALESCE(SUM(rd.jumlah), 0)::int
         FROM retur_qc_vendor_detail rd
         JOIN retur_qc_vendor r ON r.id = rd.retur_qc_vendor_id
         WHERE rd.hasil_qc_detail_id = ${hasilQcDetail.id}
           AND r.deleted_at IS NULL AND r.status <> 'dibatalkan')
      )`,
    })
    .from(hasilQcDetail)
    .where(inArray(hasilQcDetail.id, ids));

  const kapMap = new Map(kapasitas.map((k) => [k.id, k]));

  // gabungkan permintaan untuk baris yang sama sebelum dibandingkan
  const diminta = new Map<string, number>();
  for (const r of rows) {
    diminta.set(r.hasilQcDetailId, (diminta.get(r.hasilQcDetailId) ?? 0) + r.jumlah);
  }

  for (const [id, jumlah] of diminta) {
    const k = kapMap.get(id);
    if (!k) return "Ada baris hasil QC yang tidak ditemukan";
    const sisa = k.perbaikan - Number(k.sudah);
    if (jumlah > sisa) {
      return `Total rework melebihi jumlah perbaikan di hasil QC (sisa ${sisa} pcs)`;
    }
  }

  return null;
}

/** Baris hasil QC yang masih punya sisa perbaikan — kandidat rework. */
export async function listBarisSiapRework() {
  await requireRole([...READ_ROLES]);

  const rows = await db
    .select({
      hasilQcDetailId: hasilQcDetail.id,
      hasilQcId: hasilQc.id,
      nomorHasilQc: hasilQc.nomorDokumen,
      tanggal: hasilQc.tanggal,
      poId: hasilQc.poId,
      nomorPo: poProduksi.nomorDokumen,
      vendorId: hasilQc.vendorId,
      vendorNama: vendor.nama,
      varianId: hasilQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      perbaikan: hasilQcDetail.perbaikan,
      sudah: sql<number>`(
        (SELECT COALESCE(SUM(pd.jumlah), 0)::int
         FROM perbaikan_internal_detail pd
         JOIN perbaikan_internal p ON p.id = pd.perbaikan_internal_id
         WHERE pd.hasil_qc_detail_id = ${hasilQcDetail.id}
           AND p.deleted_at IS NULL AND p.status <> 'dibatalkan')
        +
        (SELECT COALESCE(SUM(rd.jumlah), 0)::int
         FROM retur_qc_vendor_detail rd
         JOIN retur_qc_vendor r ON r.id = rd.retur_qc_vendor_id
         WHERE rd.hasil_qc_detail_id = ${hasilQcDetail.id}
           AND r.deleted_at IS NULL AND r.status <> 'dibatalkan')
      )`,
    })
    .from(hasilQcDetail)
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .innerJoin(varianProduk, eq(hasilQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(poProduksi, eq(hasilQc.poId, poProduksi.id))
    .leftJoin(vendor, eq(hasilQc.vendorId, vendor.id))
    .where(and(isNull(hasilQc.deletedAt), sql`${hasilQcDetail.perbaikan} > 0`))
    .orderBy(desc(hasilQc.tanggal));

  return rows
    .map((r) => ({ ...r, sisa: r.perbaikan - Number(r.sudah) }))
    .filter((r) => r.sisa > 0);
}

export type BarisReworkRow = Awaited<ReturnType<typeof listBarisSiapRework>>[number];

export async function listPerbaikanInternal() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: perbaikanInternal.id,
      nomorDokumen: perbaikanInternal.nomorDokumen,
      tanggal: perbaikanInternal.tanggal,
      targetSelesai: perbaikanInternal.targetSelesai,
      status: perbaikanInternal.status,
      estimasiBiaya: perbaikanInternal.estimasiBiaya,
      nomorHasilQc: hasilQc.nomorDokumen,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM perbaikan_internal_detail d WHERE d.perbaikan_internal_id = ${perbaikanInternal.id}
      )`,
    })
    .from(perbaikanInternal)
    .innerJoin(hasilQc, eq(perbaikanInternal.hasilQcId, hasilQc.id))
    .leftJoin(poProduksi, eq(perbaikanInternal.poId, poProduksi.id))
    .leftJoin(users, eq(perbaikanInternal.picId, users.id))
    .where(isNull(perbaikanInternal.deletedAt))
    .orderBy(desc(perbaikanInternal.tanggal));
}

export type PerbaikanInternalRow = Awaited<ReturnType<typeof listPerbaikanInternal>>[number];

export async function listReturQcVendor() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: returQcVendor.id,
      nomorDokumen: returQcVendor.nomorDokumen,
      tanggalKirim: returQcVendor.tanggalKirim,
      targetKembali: returQcVendor.targetKembali,
      status: returQcVendor.status,
      penanggungBiaya: returQcVendor.penanggungBiaya,
      nomorHasilQc: hasilQc.nomorDokumen,
      vendorNama: vendor.nama,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM retur_qc_vendor_detail d WHERE d.retur_qc_vendor_id = ${returQcVendor.id}
      )`,
      totalPotongan: sql<number>`(
        SELECT COALESCE(SUM(d.potongan * d.jumlah), 0)::numeric
        FROM retur_qc_vendor_detail d WHERE d.retur_qc_vendor_id = ${returQcVendor.id}
      )`,
    })
    .from(returQcVendor)
    .innerJoin(hasilQc, eq(returQcVendor.hasilQcId, hasilQc.id))
    .leftJoin(vendor, eq(returQcVendor.vendorId, vendor.id))
    .where(isNull(returQcVendor.deletedAt))
    .orderBy(desc(returQcVendor.tanggalKirim));
}

export type ReturQcVendorRow = Awaited<ReturnType<typeof listReturQcVendor>>[number];

export async function createPerbaikanInternal(
  input: PerbaikanInternalInput,
): Promise<RwkResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [sumber] = await tx
          .select({ id: hasilQc.id, poId: hasilQc.poId })
          .from(hasilQc)
          .where(and(eq(hasilQc.id, input.hasilQcId), isNull(hasilQc.deletedAt)))
          .limit(1);

        if (!sumber) return { error: "Hasil QC tidak ditemukan" };

        const err = await cekKapasitasRework(tx, input.details);
        if (err) return { error: err };

        const nomorDokumen = await generateDocNumber("RWK-INT", "perbaikan_internal");

        const [header] = await tx
          .insert(perbaikanInternal)
          .values({
            nomorDokumen,
            hasilQcId: input.hasilQcId,
            poId: sumber.poId,
            tanggal: new Date(input.tanggal),
            picId: input.picId || null,
            targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
            estimasiBiaya: String(input.estimasiBiaya),
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(perbaikanInternalDetail).values({
            perbaikanInternalId: header.id,
            hasilQcDetailId: d.hasilQcDetailId,
            varianId: d.varianId,
            jumlah: d.jumlah,
            jenisCacatId: d.jenisCacatId || null,
            instruksi: d.instruksi || null,
          });
        }

        await writeAudit(tx, "perbaikan_internal", "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

export async function createReturQcVendor(input: ReturQcVendorInput): Promise<RtnResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [sumber] = await tx
          .select({ id: hasilQc.id, vendorId: hasilQc.vendorId })
          .from(hasilQc)
          .where(and(eq(hasilQc.id, input.hasilQcId), isNull(hasilQc.deletedAt)))
          .limit(1);

        if (!sumber) return { error: "Hasil QC tidak ditemukan" };

        const err = await cekKapasitasRework(tx, input.details);
        if (err) return { error: err };

        const nomorDokumen = await generateDocNumber("RTN-QC", "retur_qc_vendor");

        const [header] = await tx
          .insert(returQcVendor)
          .values({
            nomorDokumen,
            hasilQcId: input.hasilQcId,
            penugasanJahitId: input.penugasanJahitId || null,
            vendorId: input.vendorId || sumber.vendorId,
            tanggalKirim: new Date(input.tanggalKirim),
            targetKembali: input.targetKembali ? new Date(input.targetKembali) : null,
            penanggungBiaya: input.penanggungBiaya,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(returQcVendorDetail).values({
            returQcVendorId: header.id,
            hasilQcDetailId: d.hasilQcDetailId,
            varianId: d.varianId,
            jumlah: d.jumlah,
            jenisCacatId: d.jenisCacatId || null,
            instruksi: d.instruksi || null,
            fotoUrl: d.fotoUrl || null,
            potongan: String(d.potongan),
          });
        }

        await writeAudit(tx, "retur_qc_vendor", "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

export async function updateStatusPerbaikanInternal(
  id: string,
  status: "dikerjakan" | "selesai" | "dibatalkan",
): Promise<RwkResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(perbaikanInternal)
    .where(and(eq(perbaikanInternal.id, id), isNull(perbaikanInternal.deletedAt)))
    .limit(1);

  if (!before) return { error: "Perbaikan internal tidak ditemukan" };

  const boleh: Record<string, string[]> = {
    draft: ["dikerjakan", "dibatalkan"],
    dikerjakan: ["selesai", "dibatalkan"],
    selesai: [],
    dibatalkan: [],
  };

  if (!(boleh[before.status] ?? []).includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  const [row] = await db
    .update(perbaikanInternal)
    .set({ status, updatedAt: new Date() })
    .where(eq(perbaikanInternal.id, id))
    .returning();

  await writeAudit(db, "perbaikan_internal", "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function updateStatusReturQcVendor(
  id: string,
  status: "dikirim" | "diterima_kembali" | "selesai" | "dibatalkan",
): Promise<RtnResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(returQcVendor)
    .where(and(eq(returQcVendor.id, id), isNull(returQcVendor.deletedAt)))
    .limit(1);

  if (!before) return { error: "Retur QC vendor tidak ditemukan" };

  const boleh: Record<string, string[]> = {
    draft: ["dikirim", "dibatalkan"],
    dikirim: ["diterima_kembali", "dibatalkan"],
    diterima_kembali: ["selesai"],
    selesai: [],
    dibatalkan: [],
  };

  if (!(boleh[before.status] ?? []).includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  const [row] = await db
    .update(returQcVendor)
    .set({ status, updatedAt: new Date() })
    .where(eq(returQcVendor.id, id))
    .returning();

  await writeAudit(db, "retur_qc_vendor", "UPDATE", id, before, row, user.id);
  return { data: row };
}
