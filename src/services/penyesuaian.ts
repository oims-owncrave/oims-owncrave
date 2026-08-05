"use server";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  penyesuaianStok,
  mutasiStok,
  stok,
  bahan,
  satuan,
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { PenyesuaianInput } from "@/lib/schemas/penyesuaian";

async function writeAudit(
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string,
) {
  await db.insert(auditLog).values({
    userId,
    aksi,
    tabel: "penyesuaian_stok",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/**
 * REQUEST penyesuaian stok — status pending, NO mutasi.
 * kuantitasSebelum + selisih dihitung dari stok saat request.
 */
export async function requestPenyesuaian(
  input: PenyesuaianInput,
): Promise<{ data?: typeof penyesuaianStok.$inferSelect; error?: string }> {
  const user = await requireRole(["owner", "admin_gudang"]);

  const [s] = await db
    .select()
    .from(stok)
    .where(eq(stok.bahanId, input.bahanId))
    .limit(1);

  const sebelum = Number(s?.kuantitas ?? 0);
  const selisih = input.kuantitasSetelah - sebelum;

  try {
    const nomorDokumen = await generateDocNumber("PS", "penyesuaian_stok");

    const [ps] = await db
      .insert(penyesuaianStok)
      .values({
        nomorDokumen,
        bahanId: input.bahanId,
        kuantitasSebelum: String(sebelum),
        kuantitasSetelah: String(input.kuantitasSetelah),
        selisih: String(selisih),
        alasan: input.alasan,
        status: "pending",
        requestedBy: user.id,
        tanggal: new Date(input.tanggal),
      })
      .returning();

    await writeAudit("CREATE", ps.id, null, ps, user.id);
    return { data: ps };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "23505") return { error: "Nomor dokumen duplikat, coba lagi" };
    throw e;
  }
}

/**
 * APPROVE penyesuaian — OWNER only.
 * Atomik: update status + append mutasi + update stok cache.
 */
export async function approvePenyesuaian(
  id: string,
): Promise<{ data?: typeof penyesuaianStok.$inferSelect; error?: string }> {
  const user = await requireRole(["owner"]);

  return db.transaction(async (tx) => {
    const [ps] = await tx
      .select()
      .from(penyesuaianStok)
      .where(eq(penyesuaianStok.id, id))
      .for("update")
      .limit(1);

    if (!ps) return { error: "Penyesuaian tidak ditemukan" };
    if (ps.status !== "pending") return { error: "Penyesuaian sudah diproses sebelumnya" };

    const [approved] = await tx
      .update(penyesuaianStok)
      .set({ status: "approved", approvedBy: user.id, approvedAt: new Date() })
      .where(eq(penyesuaianStok.id, id))
      .returning();

    // Append mutasi (tipe penyesuaian, kuantitas = selisih signed)
    await tx.insert(mutasiStok).values({
      bahanId: ps.bahanId,
      tipe: "penyesuaian",
      kuantitas: ps.selisih, // sudah signed
      penyesuaianId: ps.id,
      createdBy: user.id,
    });

    // Update stok cache ke kuantitasSetelah (turunan dari mutasi)
    await tx
      .update(stok)
      .set({ kuantitas: ps.kuantitasSetelah, updatedAt: new Date() })
      .where(eq(stok.bahanId, ps.bahanId));

    await tx.insert(auditLog).values({
      userId: user.id,
      aksi: "APPROVE",
      tabel: "penyesuaian_stok",
      recordId: id,
      dataBefore: JSON.stringify(ps),
      dataAfter: JSON.stringify(approved),
    });

    return { data: approved };
  });
}

/**
 * REJECT penyesuaian — OWNER only. NO mutasi.
 */
export async function rejectPenyesuaian(
  id: string,
): Promise<{ data?: typeof penyesuaianStok.$inferSelect; error?: string }> {
  const user = await requireRole(["owner"]);

  return db.transaction(async (tx) => {
    const [ps] = await tx
      .select()
      .from(penyesuaianStok)
      .where(eq(penyesuaianStok.id, id))
      .for("update")
      .limit(1);

    if (!ps) return { error: "Penyesuaian tidak ditemukan" };
    if (ps.status !== "pending") return { error: "Penyesuaian sudah diproses sebelumnya" };

    const [rejected] = await tx
      .update(penyesuaianStok)
      .set({ status: "rejected", approvedBy: user.id, approvedAt: new Date() })
      .where(eq(penyesuaianStok.id, id))
      .returning();

    await tx.insert(auditLog).values({
      userId: user.id,
      aksi: "REJECT",
      tabel: "penyesuaian_stok",
      recordId: id,
      dataBefore: JSON.stringify(ps),
      dataAfter: JSON.stringify(rejected),
    });

    return { data: rejected };
  });
}

export type PenyesuaianRow = {
  id: string;
  nomorDokumen: string;
  tanggal: Date;
  bahanNama: string;
  bahanKode: string;
  satuanSingkatan: string | null;
  kuantitasSebelum: string;
  kuantitasSetelah: string;
  selisih: string;
  alasan: string;
  status: "pending" | "approved" | "rejected";
  requestedByNama: string;
  approvedByNama: string | null;
  approvedAt: Date | null;
  createdAt: Date;
};

export async function listPenyesuaian(
  status?: "pending" | "approved" | "rejected",
): Promise<PenyesuaianRow[]> {
  await requireRole(["owner", "admin_gudang", "keuangan", "viewer"]);

  const rows = await db
    .select({
      id: penyesuaianStok.id,
      nomorDokumen: penyesuaianStok.nomorDokumen,
      tanggal: penyesuaianStok.tanggal,
      bahanNama: bahan.nama,
      bahanKode: bahan.kode,
      satuanSingkatan: satuan.singkatan,
      kuantitasSebelum: penyesuaianStok.kuantitasSebelum,
      kuantitasSetelah: penyesuaianStok.kuantitasSetelah,
      selisih: penyesuaianStok.selisih,
      alasan: penyesuaianStok.alasan,
      status: penyesuaianStok.status,
      requestedById: penyesuaianStok.requestedBy,
      approvedById: penyesuaianStok.approvedBy,
      approvedAt: penyesuaianStok.approvedAt,
      createdAt: penyesuaianStok.createdAt,
    })
    .from(penyesuaianStok)
    .innerJoin(bahan, eq(penyesuaianStok.bahanId, bahan.id))
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .where(status ? eq(penyesuaianStok.status, status) : undefined)
    .orderBy(desc(penyesuaianStok.tanggal), desc(penyesuaianStok.createdAt));

  // Fetch user names separately to avoid complex alias JOIN
  const userIds = [
    ...new Set(
      rows.flatMap((r) => [r.requestedById, r.approvedById].filter(Boolean) as string[]),
    ),
  ];

  const userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const userRows = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, userIds));
    userRows.forEach((u) => { userMap[u.id] = u.displayName; });
  }

  return rows.map((r) => ({
    id: r.id,
    nomorDokumen: r.nomorDokumen,
    tanggal: r.tanggal,
    bahanNama: r.bahanNama,
    bahanKode: r.bahanKode,
    satuanSingkatan: r.satuanSingkatan,
    kuantitasSebelum: r.kuantitasSebelum,
    kuantitasSetelah: r.kuantitasSetelah,
    selisih: r.selisih,
    alasan: r.alasan,
    status: r.status,
    requestedByNama: userMap[r.requestedById] ?? "-",
    approvedByNama: r.approvedById ? (userMap[r.approvedById] ?? "-") : null,
    approvedAt: r.approvedAt,
    createdAt: r.createdAt,
  }));
}

/** Bahan aktif untuk dropdown */
export async function listBahanForPenyesuaian() {
  await requireRole(["owner", "admin_gudang"]);
  return db
    .select({
      id: bahan.id,
      kode: bahan.kode,
      nama: bahan.nama,
      satuanSingkatan: satuan.singkatan,
      stokKuantitas: stok.kuantitas,
    })
    .from(bahan)
    .leftJoin(satuan, eq(bahan.satuanId, satuan.id))
    .leftJoin(stok, eq(stok.bahanId, bahan.id))
    .where(and(isNull(bahan.deletedAt), eq(bahan.isActive, true)))
    .orderBy(bahan.nama);
}
