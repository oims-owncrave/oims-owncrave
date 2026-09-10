"use server";

import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  standarQc,
  standarQcDetail,
  produk,
  kategori,
  jenisCacat,
  workOrderQc,
  auditLog,
} from "@/db/schema";
import type { StandarQc } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { StandarQcInput } from "@/lib/schemas/standar-qc";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: StandarQc; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505"
  );
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
    tabel: "standar_qc",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Filter kombinasi (produk, kategori) — pola kombinasiFilter tarif oims-eba.4. */
function kombinasiFilter(row: { produkId: string | null; kategoriId: string | null }) {
  return and(
    row.produkId ? eq(standarQc.produkId, row.produkId) : isNull(standarQc.produkId),
    row.kategoriId ? eq(standarQc.kategoriId, row.kategoriId) : isNull(standarQc.kategoriId),
    isNull(standarQc.deletedAt),
  );
}

export async function listStandarQc() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: standarQc.id,
      nomorDokumen: standarQc.nomorDokumen,
      nama: standarQc.nama,
      versi: standarQc.versi,
      status: standarQc.status,
      tanggalBerlaku: standarQc.tanggalBerlaku,
      produkNama: produk.nama,
      kategoriNama: kategori.nama,
      jumlahKriteria: sql<number>`(
        SELECT COUNT(*)::int FROM standar_qc_detail d WHERE d.standar_qc_id = ${standarQc.id}
      )`,
    })
    .from(standarQc)
    .leftJoin(produk, eq(standarQc.produkId, produk.id))
    .leftJoin(kategori, eq(standarQc.kategoriId, kategori.id))
    .where(isNull(standarQc.deletedAt))
    .orderBy(desc(standarQc.createdAt));
}

export type StandarQcRow = Awaited<ReturnType<typeof listStandarQc>>[number];

export async function getStandarQcDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: standarQc.id,
      nomorDokumen: standarQc.nomorDokumen,
      nama: standarQc.nama,
      produkId: standarQc.produkId,
      kategoriId: standarQc.kategoriId,
      produkNama: produk.nama,
      kategoriNama: kategori.nama,
      versi: standarQc.versi,
      status: standarQc.status,
      tanggalBerlaku: standarQc.tanggalBerlaku,
      catatan: standarQc.catatan,
    })
    .from(standarQc)
    .leftJoin(produk, eq(standarQc.produkId, produk.id))
    .leftJoin(kategori, eq(standarQc.kategoriId, kategori.id))
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: standarQcDetail.id,
      tahap: standarQcDetail.tahap,
      bagianProduk: standarQcDetail.bagianProduk,
      kriteria: standarQcDetail.kriteria,
      metode: standarQcDetail.metode,
      tingkatKepentingan: standarQcDetail.tingkatKepentingan,
      toleransi: standarQcDetail.toleransi,
      jenisCacatId: standarQcDetail.jenisCacatId,
      jenisCacatNama: jenisCacat.nama,
      tindakanJikaGagal: standarQcDetail.tindakanJikaGagal,
      wajibFoto: standarQcDetail.wajibFoto,
      urutan: standarQcDetail.urutan,
    })
    .from(standarQcDetail)
    .leftJoin(jenisCacat, eq(standarQcDetail.jenisCacatId, jenisCacat.id))
    .where(eq(standarQcDetail.standarQcId, id))
    .orderBy(standarQcDetail.urutan);

  return { header, details };
}

/** Standar AKTIF untuk kombinasi produk/kategori — dipakai prefill WO QC (.5). */
export async function getStandarQcAktif(args: {
  produkId?: string | null;
  kategoriId?: string | null;
}) {
  await requireRole([...READ_ROLES]);

  const [row] = await db
    .select({ id: standarQc.id, nama: standarQc.nama, versi: standarQc.versi })
    .from(standarQc)
    .where(
      and(
        eq(standarQc.status, "aktif"),
        isNull(standarQc.deletedAt),
        args.produkId ? eq(standarQc.produkId, args.produkId) : sql`true`,
      ),
    )
    .orderBy(desc(standarQc.versi))
    .limit(1);

  return row ?? null;
}

async function insertDetails(tx: Tx, standarQcId: string, details: StandarQcInput["details"]) {
  // SEQUENTIAL — jangan Promise.all (race di satu connection)
  for (const [i, d] of details.entries()) {
    await tx.insert(standarQcDetail).values({
      standarQcId,
      tahap: d.tahap,
      bagianProduk: d.bagianProduk || null,
      kriteria: d.kriteria,
      metode: d.metode || null,
      tingkatKepentingan: d.tingkatKepentingan,
      toleransi: d.toleransi || null,
      jenisCacatId: d.jenisCacatId || null,
      tindakanJikaGagal: d.tindakanJikaGagal || null,
      wajibFoto: d.wajibFoto,
      urutan: d.urutan || i,
    });
  }
}

export async function createStandarQc(input: StandarQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // versi = MAX+1 per kombinasi (bukan COUNT — salah kalau ada yang terhapus)
        const [maxRow] = await tx
          .select({ maxVersi: sql<number>`COALESCE(MAX(${standarQc.versi}), 0)::int` })
          .from(standarQc)
          .where(
            kombinasiFilter({
              produkId: input.produkId ?? null,
              kategoriId: input.kategoriId ?? null,
            }),
          );

        const nomorDokumen = await generateDocNumber("STD-QC", "standar_qc");

        const [header] = await tx
          .insert(standarQc)
          .values({
            nomorDokumen,
            nama: input.nama,
            produkId: input.produkId || null,
            kategoriId: input.kategoriId || null,
            versi: Number(maxRow?.maxVersi ?? 0) + 1,
            tanggalBerlaku: new Date(input.tanggalBerlaku),
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        await insertDetails(tx, header.id, input.details);
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

/** Edit HANYA draft — standar aktif/nonaktif diubah lewat versi baru (pola BOM/tarif). */
export async function updateStandarQc(id: string, input: StandarQcInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(standarQc)
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Standar QC tidak ditemukan" };
  if (before.status !== "draft") {
    return { error: "Hanya standar draft yang bisa diedit — buat versi baru untuk mengubah" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(standarQc)
      .set({
        nama: input.nama,
        produkId: input.produkId || null,
        kategoriId: input.kategoriId || null,
        tanggalBerlaku: new Date(input.tanggalBerlaku),
        catatan: input.catatan || null,
        updatedAt: new Date(),
      })
      .where(eq(standarQc.id, id))
      .returning();

    // detail bukan ledger — boleh replace dalam satu transaksi
    await tx.delete(standarQcDetail).where(eq(standarQcDetail.standarQcId, id));
    await insertDetails(tx, id, input.details);

    await writeAudit(tx, "UPDATE", id, before, row, user.id);
    return { data: row };
  });
}

/** Salin standar jadi versi baru berstatus draft (versi = MAX+1). */
export async function createVersiBaruStandarQc(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [src] = await db
    .select()
    .from(standarQc)
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!src) return { error: "Standar QC tidak ditemukan" };

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [maxRow] = await tx
          .select({ maxVersi: sql<number>`COALESCE(MAX(${standarQc.versi}), 0)::int` })
          .from(standarQc)
          .where(kombinasiFilter(src));

        const nomorDokumen = await generateDocNumber("STD-QC", "standar_qc");

        const [header] = await tx
          .insert(standarQc)
          .values({
            nomorDokumen,
            nama: src.nama,
            produkId: src.produkId,
            kategoriId: src.kategoriId,
            versi: Number(maxRow?.maxVersi ?? 0) + 1,
            tanggalBerlaku: new Date(),
            catatan: src.catatan,
            createdBy: user.id,
          })
          .returning();

        const srcDetails = await tx
          .select()
          .from(standarQcDetail)
          .where(eq(standarQcDetail.standarQcId, id))
          .orderBy(standarQcDetail.urutan);

        for (const d of srcDetails) {
          await tx.insert(standarQcDetail).values({
            standarQcId: header.id,
            tahap: d.tahap,
            bagianProduk: d.bagianProduk,
            kriteria: d.kriteria,
            metode: d.metode,
            tingkatKepentingan: d.tingkatKepentingan,
            toleransi: d.toleransi,
            jenisCacatId: d.jenisCacatId,
            tindakanJikaGagal: d.tindakanJikaGagal,
            wajibFoto: d.wajibFoto,
            urutan: d.urutan,
          });
        }

        await writeAudit(tx, "CREATE", header.id, src, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

export async function activateStandarQc(id: string): Promise<Result> {
  const user = await requireRole(["owner", "admin_produksi"]);

  const [target] = await db
    .select()
    .from(standarQc)
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!target) return { error: "Standar QC tidak ditemukan" };
  if (target.status !== "draft") return { error: "Hanya standar draft yang bisa diaktifkan" };

  return db.transaction(async (tx) => {
    // nonaktifkan aktif lama DULU — partial unique index menolak 2 aktif per kombinasi
    await tx
      .update(standarQc)
      .set({ status: "nonaktif", updatedAt: new Date() })
      .where(and(kombinasiFilter(target), eq(standarQc.status, "aktif")));

    const [row] = await tx
      .update(standarQc)
      .set({
        status: "aktif",
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(standarQc.id, id))
      .returning();

    await writeAudit(tx, "APPROVE", id, target, row, user.id);
    return { data: row };
  });
}

export async function deactivateStandarQc(id: string): Promise<Result> {
  const user = await requireRole(["owner", "admin_produksi"]);

  const [before] = await db
    .select()
    .from(standarQc)
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Standar QC tidak ditemukan" };
  if (before.status !== "aktif") return { error: "Hanya standar aktif yang bisa dinonaktifkan" };

  const [row] = await db
    .update(standarQc)
    .set({ status: "nonaktif", updatedAt: new Date() })
    .where(eq(standarQc.id, id))
    .returning();

  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteStandarQc(id: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(standarQc)
    .where(and(eq(standarQc.id, id), isNull(standarQc.deletedAt)))
    .limit(1);

  if (!before) return { error: "Standar QC tidak ditemukan" };

  // Standar yang sudah dipakai transaksi TIDAK boleh dihapus (snapshot harus tetap terbaca)
  const [dipakai] = await db
    .select({ id: workOrderQc.id })
    .from(workOrderQc)
    .where(and(eq(workOrderQc.standarQcId, id), isNull(workOrderQc.deletedAt)))
    .limit(1);

  if (dipakai) {
    return {
      error: "Standar sudah dipakai Work Order QC — nonaktifkan saja, jangan dihapus",
    };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(standarQc)
      .set({ deletedAt: new Date(), status: "nonaktif" })
      .where(eq(standarQc.id, id))
      .returning();

    await writeAudit(tx, "DELETE", id, before, row, user.id);
    return { data: row };
  });
}
