"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  selisihJahit,
  penerimaanHasilJahit,
  penugasanJahit,
  penugasanJahitDetail,
  bundling,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  penjahit,
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import { refreshPenugasanSelesai } from "@/lib/jahit/rekap";
import type { SelisihInput, KeputusanInput } from "@/lib/schemas/selisih-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_gudang", "admin_produksi"] as const;

type Row = typeof selisihJahit.$inferSelect;
type Result = { data?: Row; error?: string };

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
    tabel: "selisih_jahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

export async function listSelisih() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: selisihJahit.id,
      nomorKasus: selisihJahit.nomorKasus,
      penugasanId: penugasanJahit.id,
      penugasanNomor: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      penugasanDetailId: selisihJahit.penugasanDetailId,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      penerimaanId: selisihJahit.penerimaanId,
      penerimaanNomor: penerimaanHasilJahit.nomorDokumen,
      klasifikasi: selisihJahit.klasifikasi,
      jumlah: selisihJahit.jumlah,
      nilaiPerPcs: selisihJahit.nilaiPerPcs,
      kronologi: selisihJahit.kronologi,
      penanggungJawab: selisihJahit.penanggungJawab,
      buktiUrl: selisihJahit.buktiUrl,
      status: selisihJahit.status,
      keputusan: selisihJahit.keputusan,
      approvedByNama: users.displayName,
      approvedAt: selisihJahit.approvedAt,
      tingkatRusak: selisihJahit.tingkatRusak,
      penyebabRusak: selisihJahit.penyebabRusak,
      catatan: selisihJahit.catatan,
      createdAt: selisihJahit.createdAt,
    })
    .from(selisihJahit)
    .innerJoin(penugasanJahitDetail, eq(selisihJahit.penugasanDetailId, penugasanJahitDetail.id))
    .innerJoin(penugasanJahit, eq(penugasanJahitDetail.penugasanId, penugasanJahit.id))
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(penerimaanHasilJahit, eq(selisihJahit.penerimaanId, penerimaanHasilJahit.id))
    .leftJoin(users, eq(selisihJahit.approvedBy, users.id))
    .where(isNull(selisihJahit.deletedAt))
    .orderBy(desc(selisihJahit.createdAt));
}

export type SelisihListRow = Awaited<ReturnType<typeof listSelisih>>[number];

/** Bundel (detail penugasan) dari penugasan aktif/selesai — untuk form selisih manual. */
export async function listDetailUntukSelisih() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: penugasanJahitDetail.id,
      penugasanNomor: penugasanJahit.nomorDokumen,
      bundelNomor: bundling.nomorDokumen,
      sku: varianProduk.sku,
      pihakNama,
      jumlahPcs: penugasanJahitDetail.jumlahPcs,
    })
    .from(penugasanJahitDetail)
    .innerJoin(penugasanJahit, eq(penugasanJahitDetail.penugasanId, penugasanJahit.id))
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(and(sql`${penugasanJahit.status} IN ('aktif', 'selesai')`, isNull(penugasanJahit.deletedAt)))
    .orderBy(desc(penugasanJahit.createdAt), bundling.nomorDokumen);
}

export type DetailUntukSelisih = Awaited<ReturnType<typeof listDetailUntukSelisih>>[number];

function values(input: SelisihInput) {
  return {
    penugasanDetailId: input.penugasanDetailId,
    penerimaanId: input.penerimaanId || null,
    klasifikasi: input.klasifikasi,
    jumlah: input.jumlah,
    nilaiPerPcs: String(input.nilaiPerPcs),
    kronologi: input.kronologi?.trim() || null,
    penanggungJawab: input.penanggungJawab?.trim() || null,
    buktiUrl: input.buktiUrl?.trim() || null,
    tingkatRusak: input.klasifikasi === "rusak" ? input.tingkatRusak : null,
    penyebabRusak: input.klasifikasi === "rusak" ? input.penyebabRusak : null,
    catatan: input.catatan?.trim() || null,
  };
}

async function penugasanIdDari(tx: Pick<typeof db, "select">, penugasanDetailId: string) {
  const [r] = await tx
    .select({ penugasanId: penugasanJahitDetail.penugasanId })
    .from(penugasanJahitDetail)
    .where(eq(penugasanJahitDetail.id, penugasanDetailId))
    .limit(1);
  return r?.penugasanId ?? null;
}

export async function createSelisih(input: SelisihInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  return db.transaction(async (tx) => {
    const nomorKasus = await generateDocNumber("SLS-JHT", "selisih_jahit", "nomor_kasus");
    const [row] = await tx
      .insert(selisihJahit)
      .values({ nomorKasus, ...values(input), createdBy: user.id })
      .returning();
    await writeAudit(tx, "CREATE", row.id, null, row, user.id);
    return { data: row };
  });
}

/** Edit selama belum diputuskan (klasifikasi ulang, isi kronologi, dsb). */
export async function updateSelisih(id: string, input: SelisihInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(selisihJahit)
    .where(and(eq(selisihJahit.id, id), isNull(selisihJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Kasus tidak ditemukan" };
  if (before.keputusan) return { error: "Kasus sudah diputuskan — tidak bisa diubah" };

  const [row] = await db
    .update(selisihJahit)
    .set({ ...values(input), updatedAt: new Date() })
    .where(eq(selisihJahit.id, id))
    .returning();
  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function setSelisihDiselidiki(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(selisihJahit)
    .where(and(eq(selisihJahit.id, id), isNull(selisihJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Kasus tidak ditemukan" };
  if (before.status !== "dibuka") return { error: `Kasus berstatus ${before.status}` };

  const [row] = await db
    .update(selisihJahit)
    .set({ status: "diselidiki", updatedAt: new Date() })
    .where(eq(selisihJahit.id, id))
    .returning();
  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

/**
 * Keputusan = approval owner. Baru SETELAH ini hilang/rusak mengurangi sisa WIP
 * (pola penyesuaian_stok). Penugasan bisa jadi selesai karenanya.
 */
export async function putuskanSelisih(id: string, input: KeputusanInput): Promise<Result> {
  const user = await requireRole(["owner"]);
  const [before] = await db
    .select()
    .from(selisihJahit)
    .where(and(eq(selisihJahit.id, id), isNull(selisihJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Kasus tidak ditemukan" };
  if (before.keputusan) return { error: "Kasus sudah diputuskan" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(selisihJahit)
      .set({
        keputusan: input.keputusan,
        status: "selesai",
        approvedBy: user.id,
        approvedAt: new Date(),
        catatan: input.catatan?.trim() || before.catatan,
        updatedAt: new Date(),
      })
      .where(eq(selisihJahit.id, id))
      .returning();

    const penugasanId = await penugasanIdDari(tx, before.penugasanDetailId);
    if (penugasanId) await refreshPenugasanSelesai(tx, penugasanId);

    await writeAudit(tx, "APPROVE", id, before, row, user.id);
    return { data: row };
  });
}

export async function softDeleteSelisih(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const [before] = await db
    .select()
    .from(selisihJahit)
    .where(and(eq(selisihJahit.id, id), isNull(selisihJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Kasus tidak ditemukan" };
  if (before.keputusan) return { error: "Kasus sudah diputuskan — tidak bisa dihapus" };
  if (before.penerimaanId && before.klasifikasi === "rusak") {
    return { error: "Kasus rusak otomatis dari penerimaan — hapus lewat penerimaannya" };
  }

  const [row] = await db
    .update(selisihJahit)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(selisihJahit.id, id))
    .returning();
  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}
