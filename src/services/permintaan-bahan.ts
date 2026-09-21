"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  permintaanBahan,
  permintaanBahanDetail,
  poProduksi,
  produk,
  bahan,
  satuan,
  barangKeluar,
  barangKeluarDetail,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { PbInput } from "@/lib/schemas/permintaan-bahan";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;
// gudang yang menyiapkan bahan → gudang ikut menyetujui
const APPROVE_ROLES = ["owner", "admin_gudang"] as const;

type PbResult = Promise<{ data?: typeof permintaanBahan.$inferSelect; error?: string }>;

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
    tabel: "permintaan_bahan",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

export async function listPermintaan() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: permintaanBahan.id,
      nomorDokumen: permintaanBahan.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      tanggal: permintaanBahan.tanggal,
      tanggalDibutuhkan: permintaanBahan.tanggalDibutuhkan,
      status: permintaanBahan.status,
      jumlahBahan: sql<number>`(SELECT COUNT(*)::int FROM permintaan_bahan_detail WHERE permintaan_bahan_detail.permintaan_id = ${permintaanBahan.id})`,
    })
    .from(permintaanBahan)
    .innerJoin(poProduksi, eq(permintaanBahan.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(isNull(permintaanBahan.deletedAt))
    .orderBy(desc(permintaanBahan.createdAt));
}

export type PbListRow = Awaited<ReturnType<typeof listPermintaan>>[number];

export async function getPermintaanDetail(id: string) {
  await requireRole([...READ_ROLES]);
  const [header] = await db
    .select({
      id: permintaanBahan.id,
      nomorDokumen: permintaanBahan.nomorDokumen,
      poId: permintaanBahan.poId,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      tanggal: permintaanBahan.tanggal,
      tanggalDibutuhkan: permintaanBahan.tanggalDibutuhkan,
      status: permintaanBahan.status,
      catatan: permintaanBahan.catatan,
      createdAt: permintaanBahan.createdAt,
    })
    .from(permintaanBahan)
    .innerJoin(poProduksi, eq(permintaanBahan.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: permintaanBahanDetail.id,
      bahanId: permintaanBahanDetail.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      kebutuhan: permintaanBahanDetail.kebutuhan,
      jumlahDiminta: permintaanBahanDetail.jumlahDiminta,
      jumlahDisetujui: permintaanBahanDetail.jumlahDisetujui,
    })
    .from(permintaanBahanDetail)
    .innerJoin(bahan, eq(permintaanBahanDetail.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(eq(permintaanBahanDetail.permintaanId, id))
    .orderBy(bahan.nama);

  // jumlah dikeluarkan = derived dari barang_keluar_detail via barang_keluar.permintaan_bahan_id
  // (pola status-derived — tidak ada kolom yang di-update manual)
  const keluarRows = await db
    .select({
      bahanId: barangKeluarDetail.bahanId,
      total: sql<string>`COALESCE(SUM(${barangKeluarDetail.kuantitas}), 0)`,
    })
    .from(barangKeluarDetail)
    .innerJoin(barangKeluar, eq(barangKeluarDetail.barangKeluarId, barangKeluar.id))
    .where(eq(barangKeluar.permintaanBahanId, id))
    .groupBy(barangKeluarDetail.bahanId);
  const keluarMap = new Map(keluarRows.map((r) => [r.bahanId, Number(r.total)]));

  const detailRows = details.map((d) => ({
    ...d,
    jumlahDikeluarkan: keluarMap.get(d.bahanId) ?? 0,
  }));

  const selesai =
    header.status === "disetujui" &&
    detailRows.length > 0 &&
    detailRows.every((d) => d.jumlahDikeluarkan >= Number(d.jumlahDisetujui ?? d.jumlahDiminta));

  return { ...header, details: detailRows, selesai };
}

export type PbDetailData = NonNullable<Awaited<ReturnType<typeof getPermintaanDetail>>>;

/** PB disetujui untuk dropdown form barang keluar. */
export async function listApprovedPermintaan() {
  await requireRole(["owner", "admin_gudang"]);
  return db
    .select({
      id: permintaanBahan.id,
      nomorDokumen: permintaanBahan.nomorDokumen,
      poId: permintaanBahan.poId,
      poNomor: poProduksi.nomorDokumen,
    })
    .from(permintaanBahan)
    .innerJoin(poProduksi, eq(permintaanBahan.poId, poProduksi.id))
    .where(and(eq(permintaanBahan.status, "disetujui"), isNull(permintaanBahan.deletedAt)))
    .orderBy(desc(permintaanBahan.createdAt));
}

export type PbOption = Awaited<ReturnType<typeof listApprovedPermintaan>>[number];

function detailValues(permintaanId: string, input: PbInput) {
  return input.details.map((d) => ({
    permintaanId,
    bahanId: d.bahanId,
    kebutuhan: String(d.kebutuhan),
    jumlahDiminta: String(d.jumlahDiminta),
  }));
}

export async function createPermintaan(input: PbInput): PbResult {
  const user = await requireRole([...WRITE_ROLES]);

  // PO harus sudah disetujui (atau lebih lanjut) — permintaan bahan mengacu PO sah
  const [po] = await db
    .select()
    .from(poProduksi)
    .where(and(eq(poProduksi.id, input.poId), isNull(poProduksi.deletedAt)))
    .limit(1);
  if (!po) return { error: "PO tidak ditemukan" };
  const allowed = ["disetujui", "menunggu_bahan", "bahan_disiapkan"];
  if (!allowed.includes(po.status)) {
    return { error: "Permintaan bahan hanya untuk PO yang sudah disetujui" };
  }

  // guard bahan duplikat dalam satu permintaan
  const ids = input.details.map((d) => d.bahanId);
  if (new Set(ids).size !== ids.length) {
    return { error: "Ada bahan duplikat dalam permintaan — gabungkan barisnya" };
  }

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const nomorDokumen = await generateDocNumber("PB", "permintaan_bahan");
        const [header] = await tx
          .insert(permintaanBahan)
          .values({
            nomorDokumen,
            poId: input.poId,
            tanggal: new Date(input.tanggal),
            tanggalDibutuhkan: input.tanggalDibutuhkan ? new Date(input.tanggalDibutuhkan) : null,
            catatan: input.catatan?.trim() || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(permintaanBahanDetail).values(detailValues(header.id, input));
        await writeAudit(tx, "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat permintaan — coba lagi" };
}

export async function updatePermintaan(id: string, input: PbInput): PbResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(permintaanBahan)
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Permintaan tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya permintaan draft yang bisa diedit" };
  if (input.poId !== before.poId) return { error: "PO tidak bisa diganti — buat permintaan baru" };

  const ids = input.details.map((d) => d.bahanId);
  if (new Set(ids).size !== ids.length) {
    return { error: "Ada bahan duplikat dalam permintaan — gabungkan barisnya" };
  }

  return db.transaction(async (tx) => {
    const [header] = await tx
      .update(permintaanBahan)
      .set({
        tanggal: new Date(input.tanggal),
        tanggalDibutuhkan: input.tanggalDibutuhkan ? new Date(input.tanggalDibutuhkan) : null,
        catatan: input.catatan?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(permintaanBahan.id, id))
      .returning();

    await tx.delete(permintaanBahanDetail).where(eq(permintaanBahanDetail.permintaanId, id));
    await tx.insert(permintaanBahanDetail).values(detailValues(id, input));

    await writeAudit(tx, "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

export async function submitPermintaan(id: string): PbResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(permintaanBahan)
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Permintaan tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya permintaan draft yang bisa diajukan" };

  const [row] = await db
    .update(permintaanBahan)
    .set({ status: "diajukan", updatedAt: new Date() })
    .where(eq(permintaanBahan.id, id))
    .returning();

  await writeAudit(db, "SUBMIT", id, before, row, user.id);
  return { data: row };
}

export async function approvePermintaan(id: string): PbResult {
  const user = await requireRole([...APPROVE_ROLES]);

  const [before] = await db
    .select()
    .from(permintaanBahan)
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Permintaan tidak ditemukan" };
  if (before.status !== "diajukan") return { error: "Hanya permintaan diajukan yang bisa disetujui" };

  return db.transaction(async (tx) => {
    // approve wholesale: jumlah_disetujui = jumlah_diminta
    // ponytail: approval per-baris (ubah jumlah) nanti kalau owner butuh
    await tx
      .update(permintaanBahanDetail)
      .set({ jumlahDisetujui: sql`jumlah_diminta` })
      .where(eq(permintaanBahanDetail.permintaanId, id));

    const [row] = await tx
      .update(permintaanBahan)
      .set({
        status: "disetujui",
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(permintaanBahan.id, id))
      .returning();

    await writeAudit(tx, "APPROVE", id, before, row, user.id);
    return { data: row };
  });
}

export async function rejectPermintaan(id: string): PbResult {
  const user = await requireRole([...APPROVE_ROLES]);

  const [before] = await db
    .select()
    .from(permintaanBahan)
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Permintaan tidak ditemukan" };
  if (before.status !== "diajukan") return { error: "Hanya permintaan diajukan yang bisa ditolak" };

  const [row] = await db
    .update(permintaanBahan)
    .set({ status: "ditolak", updatedAt: new Date() })
    .where(eq(permintaanBahan.id, id))
    .returning();

  await writeAudit(db, "REJECT", id, before, row, user.id);
  return { data: row };
}

export async function softDeletePermintaan(id: string): PbResult {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(permintaanBahan)
    .where(and(eq(permintaanBahan.id, id), isNull(permintaanBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Permintaan tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya permintaan draft yang bisa dihapus" };

  const [row] = await db
    .update(permintaanBahan)
    .set({ deletedAt: new Date() })
    .where(eq(permintaanBahan.id, id))
    .returning();

  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}
