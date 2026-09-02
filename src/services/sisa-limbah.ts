"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  sisaBahan,
  limbahCutting,
  mutasiStok,
  stok,
  bahan,
  satuan,
  workOrderCutting,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import type { SisaInput, LimbahInput } from "@/lib/schemas/sisa-limbah";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;
const GUDANG_ROLES = ["owner", "admin_gudang"] as const;

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

// ─── Sisa Bahan ──────────────────────────────────────────────────────────────

export async function listSisa(woId: string) {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: sisaBahan.id,
      bahanId: sisaBahan.bahanId,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      jumlah: sisaBahan.jumlah,
      jenis: sisaBahan.jenis,
      status: sisaBahan.status,
      catatan: sisaBahan.catatan,
    })
    .from(sisaBahan)
    .innerJoin(bahan, eq(sisaBahan.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(and(eq(sisaBahan.woId, woId), isNull(sisaBahan.deletedAt)))
    .orderBy(desc(sisaBahan.createdAt));
}

export type SisaRow = Awaited<ReturnType<typeof listSisa>>[number];

export async function createSisa(
  woId: string,
  input: SisaInput,
): Promise<{ data?: typeof sisaBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [wo] = await db
    .select({ id: workOrderCutting.id })
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, woId), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!wo) return { error: "WO tidak ditemukan" };

  const [row] = await db
    .insert(sisaBahan)
    .values({
      woId,
      bahanId: input.bahanId,
      jumlah: String(input.jumlah),
      jenis: input.jenis,
      catatan: input.catatan?.trim() || null,
      createdBy: user.id,
    })
    .returning();
  await writeAudit(db, "sisa_bahan", "CREATE", row.id, null, row, user.id);
  return { data: row };
}

// Transisi status sisa. diterima_gudang lewat terimaSisaDiGudang (transaksi mutasi).
const SISA_TRANSITIONS: Record<string, string[]> = {
  disimpan_cutting: ["menunggu_gudang", "dialokasikan", "tidak_layak"],
  menunggu_gudang: ["disimpan_cutting"],
  dialokasikan: ["disimpan_cutting"],
  tidak_layak: [],
  diterima_gudang: [], // terminal — sudah masuk ledger
};

export async function setSisaStatus(
  id: string,
  status: string,
): Promise<{ data?: typeof sisaBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(sisaBahan)
    .where(and(eq(sisaBahan.id, id), isNull(sisaBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Sisa bahan tidak ditemukan" };
  if (!SISA_TRANSITIONS[before.status]?.includes(status)) {
    return { error: `Transisi dari "${before.status}" ke "${status}" tidak diizinkan` };
  }

  const [row] = await db
    .update(sisaBahan)
    .set({ status: status as typeof before.status, updatedAt: new Date() })
    .where(eq(sisaBahan.id, id))
    .returning();
  await writeAudit(db, "sisa_bahan", "UPDATE", id, before, row, user.id);
  return { data: row };
}

/**
 * Gudang menerima sisa: status diterima_gudang + append mutasi_stok retur_masuk
 * + update cache stok (lock row). Harga rata-rata TIDAK berubah — retur bukan pembelian.
 */
export async function terimaSisaDiGudang(
  id: string,
): Promise<{ data?: typeof sisaBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...GUDANG_ROLES]);

  const [before] = await db
    .select()
    .from(sisaBahan)
    .where(and(eq(sisaBahan.id, id), isNull(sisaBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Sisa bahan tidak ditemukan" };
  if (before.status !== "menunggu_gudang") {
    return { error: "Hanya sisa berstatus menunggu gudang yang bisa diterima" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(sisaBahan)
      .set({ status: "diterima_gudang", updatedAt: new Date() })
      .where(eq(sisaBahan.id, id))
      .returning();

    // append ledger — JANGAN pernah update/delete baris mutasi
    await tx.insert(mutasiStok).values({
      bahanId: before.bahanId,
      tipe: "retur_masuk",
      kuantitas: before.jumlah, // positif = masuk
      sisaBahanId: id,
      createdBy: user.id,
    });

    // update cache stok (lock row, pola barang masuk)
    const [s] = await tx
      .select()
      .from(stok)
      .where(eq(stok.bahanId, before.bahanId))
      .for("update")
      .limit(1);
    const stokBaru = Number(s?.kuantitas ?? 0) + Number(before.jumlah);
    if (s) {
      await tx
        .update(stok)
        .set({ kuantitas: String(stokBaru), updatedAt: new Date() })
        .where(eq(stok.bahanId, before.bahanId));
    } else {
      await tx.insert(stok).values({ bahanId: before.bahanId, kuantitas: String(stokBaru) });
    }

    await writeAudit(tx, "sisa_bahan", "APPROVE", id, before, row, user.id);
    return { data: row };
  });
}

export async function softDeleteSisa(
  id: string,
): Promise<{ data?: typeof sisaBahan.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(sisaBahan)
    .where(and(eq(sisaBahan.id, id), isNull(sisaBahan.deletedAt)))
    .limit(1);
  if (!before) return { error: "Sisa bahan tidak ditemukan" };
  if (before.status === "diterima_gudang") {
    return { error: "Sisa yang sudah diterima gudang tidak bisa dihapus — sudah tercatat di mutasi stok" };
  }

  const [row] = await db
    .update(sisaBahan)
    .set({ deletedAt: new Date() })
    .where(eq(sisaBahan.id, id))
    .returning();
  await writeAudit(db, "sisa_bahan", "DELETE", id, before, row, user.id);
  return { data: row };
}

// ─── Limbah Cutting ──────────────────────────────────────────────────────────

export async function listLimbah(woId: string) {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: limbahCutting.id,
      bahanKode: bahan.kode,
      bahanNama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      jumlah: limbahCutting.jumlah,
      jenis: limbahCutting.jenis,
      penyebab: limbahCutting.penyebab,
      penanganan: limbahCutting.penanganan,
      hargaRataRata: limbahCutting.hargaRataRata,
      catatan: limbahCutting.catatan,
    })
    .from(limbahCutting)
    .innerJoin(bahan, eq(limbahCutting.bahanId, bahan.id))
    .innerJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(and(eq(limbahCutting.woId, woId), isNull(limbahCutting.deletedAt)))
    .orderBy(desc(limbahCutting.createdAt));
}

export type LimbahRow = Awaited<ReturnType<typeof listLimbah>>[number];

export async function createLimbah(
  woId: string,
  input: LimbahInput,
): Promise<{ data?: typeof limbahCutting.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [wo] = await db
    .select({ id: workOrderCutting.id })
    .from(workOrderCutting)
    .where(and(eq(workOrderCutting.id, woId), isNull(workOrderCutting.deletedAt)))
    .limit(1);
  if (!wo) return { error: "WO tidak ditemukan" };

  const [b] = await db
    .select({ hargaRataRata: bahan.hargaRataRata })
    .from(bahan)
    .where(eq(bahan.id, input.bahanId))
    .limit(1);
  if (!b) return { error: "Bahan tidak ditemukan" };

  const [row] = await db
    .insert(limbahCutting)
    .values({
      woId,
      bahanId: input.bahanId,
      jumlah: String(input.jumlah),
      jenis: input.jenis,
      penanganan: input.penanganan,
      penyebab: input.penyebab?.trim() || null,
      hargaRataRata: b.hargaRataRata, // snapshot — nilai kerugian derived
      catatan: input.catatan?.trim() || null,
      createdBy: user.id,
    })
    .returning();
  await writeAudit(db, "limbah_cutting", "CREATE", row.id, null, row, user.id);
  return { data: row };
}

export async function softDeleteLimbah(
  id: string,
): Promise<{ data?: typeof limbahCutting.$inferSelect; error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(limbahCutting)
    .where(and(eq(limbahCutting.id, id), isNull(limbahCutting.deletedAt)))
    .limit(1);
  if (!before) return { error: "Limbah tidak ditemukan" };

  const [row] = await db
    .update(limbahCutting)
    .set({ deletedAt: new Date() })
    .where(eq(limbahCutting.id, id))
    .returning();
  await writeAudit(db, "limbah_cutting", "DELETE", id, before, row, user.id);
  return { data: row };
}
