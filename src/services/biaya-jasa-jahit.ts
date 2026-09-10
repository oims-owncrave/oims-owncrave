"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  biayaJasaJahit,
  penugasanJahit,
  penugasanJahitDetail,
  poProduksi,
  produk,
  vendor,
  penjahit,
  users,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getRekapDetailPenugasan } from "@/lib/jahit/rekap";
import { BIAYA_TRANSITIONS, type BiayaInput, type BiayaStatus } from "@/lib/schemas/biaya-jasa-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi", "keuangan"] as const;

type Row = typeof biayaJasaJahit.$inferSelect;
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
    tabel: "biaya_jasa_jahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

// jumlah diakui = Σ baik (bukan dikirim) — vendor tak ditagih untuk yang belum kembali.
// biaya dasar = Σ baik × tarif snapshot per bundel (tarif bisa beda antar bundel).
const diakuiSql = sql<number>`(
  SELECT COALESCE(SUM(hd.jumlah_baik), 0)::int
  FROM penugasan_jahit_detail d
  JOIN penerimaan_hasil_jahit_detail hd ON hd.penugasan_detail_id = d.id
  JOIN penerimaan_hasil_jahit h ON h.id = hd.penerimaan_id AND h.deleted_at IS NULL
  WHERE d.penugasan_id = ${penugasanJahit.id}
)`;

const biayaDasarSql = sql<string>`(
  SELECT COALESCE(SUM(hd.jumlah_baik * d.tarif_snapshot), 0)
  FROM penugasan_jahit_detail d
  JOIN penerimaan_hasil_jahit_detail hd ON hd.penugasan_detail_id = d.id
  JOIN penerimaan_hasil_jahit h ON h.id = hd.penerimaan_id AND h.deleted_at IS NULL
  WHERE d.penugasan_id = ${penugasanJahit.id}
)`;

// usulan biaya tambahan: perbaikan retur yang ditanggung Owncrave
const usulTambahanSql = sql<string>`(
  SELECT COALESCE(SUM(rd.jumlah * rd.tarif_perbaikan), 0)
  FROM retur_jahit_detail rd JOIN retur_jahit r ON r.id = rd.retur_id
  WHERE r.penugasan_id = ${penugasanJahit.id} AND r.status <> 'dibatalkan'
    AND r.deleted_at IS NULL AND rd.penanggung_biaya = 'owncrave'
)`;

// usulan potongan: kasus hilang/rusak yang diputuskan ditanggung vendor
const usulPotonganSql = sql<string>`(
  SELECT COALESCE(SUM(s.jumlah * s.nilai_per_pcs), 0)
  FROM selisih_jahit s JOIN penugasan_jahit_detail d ON d.id = s.penugasan_detail_id
  WHERE d.penugasan_id = ${penugasanJahit.id} AND s.keputusan = 'ditanggung_vendor'
    AND s.deleted_at IS NULL
)`;

export async function listBiaya() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      penugasanId: penugasanJahit.id,
      penugasanNomor: penugasanJahit.nomorDokumen,
      penugasanStatus: penugasanJahit.status,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      targetSelesai: penugasanJahit.targetSelesai,
      biayaId: biayaJasaJahit.id,
      status: biayaJasaJahit.status,
      bonus: biayaJasaJahit.bonus,
      biayaTambahan: biayaJasaJahit.biayaTambahan,
      potongan: biayaJasaJahit.potongan,
      uangMuka: biayaJasaJahit.uangMuka,
      catatan: biayaJasaJahit.catatan,
      jumlahDiakui: diakuiSql,
      biayaDasar: biayaDasarSql,
      usulTambahan: usulTambahanSql,
      usulPotongan: usulPotonganSql,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(biayaJasaJahit, eq(biayaJasaJahit.penugasanId, penugasanJahit.id))
    .where(and(sql`${penugasanJahit.status} IN ('aktif', 'selesai')`, isNull(penugasanJahit.deletedAt)))
    .orderBy(desc(penugasanJahit.createdAt));
}

export type BiayaListRow = Awaited<ReturnType<typeof listBiaya>>[number];

export async function getBiayaDetail(penugasanId: string) {
  await requireRole([...READ_ROLES]);
  const rows = await listBiaya();
  const header = rows.find((r) => r.penugasanId === penugasanId);
  if (!header) return null;

  const rekap = await getRekapDetailPenugasan(db, penugasanId);
  const [verif] = await db
    .select({
      verifiedProduksiAt: biayaJasaJahit.verifiedProduksiAt,
      verifiedKeuanganAt: biayaJasaJahit.verifiedKeuanganAt,
    })
    .from(biayaJasaJahit)
    .where(eq(biayaJasaJahit.penugasanId, penugasanId))
    .limit(1);

  return { ...header, rekap, ...(verif ?? {}) };
}

export type BiayaDetailData = NonNullable<Awaited<ReturnType<typeof getBiayaDetail>>>;

/** Baris biaya dibuat malas (saat pertama diedit / diubah statusnya). */
async function ensureRow(
  tx: Pick<typeof db, "select" | "insert">,
  penugasanId: string,
  userId: string,
): Promise<Row> {
  const [existing] = await tx
    .select()
    .from(biayaJasaJahit)
    .where(eq(biayaJasaJahit.penugasanId, penugasanId))
    .limit(1);
  if (existing) return existing;

  const [row] = await tx
    .insert(biayaJasaJahit)
    .values({ penugasanId, createdBy: userId })
    .returning();
  return row;
}

export async function updateBiaya(penugasanId: string, input: BiayaInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  return db.transaction(async (tx) => {
    const before = await ensureRow(tx, penugasanId, user.id);
    if (before.status === "dibayar") return { error: "Tagihan sudah dibayar — tidak bisa diubah" };

    const [row] = await tx
      .update(biayaJasaJahit)
      .set({
        bonus: String(input.bonus),
        biayaTambahan: String(input.biayaTambahan),
        potongan: String(input.potongan),
        uangMuka: String(input.uangMuka),
        catatan: input.catatan?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(biayaJasaJahit.penugasanId, penugasanId))
      .returning();

    await writeAudit(tx, "UPDATE", row.id, before, row, user.id);
    return { data: row };
  });
}

export async function setBiayaStatus(penugasanId: string, status: BiayaStatus): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  // verifikasi keuangan & siap dibayar hanya owner/keuangan
  if (["diverifikasi_keuangan", "siap_dibayar"].includes(status) && !["owner", "keuangan"].includes(user.role)) {
    return { error: "Hanya owner/keuangan yang bisa verifikasi keuangan" };
  }
  if (status === "dibayar") {
    return { error: "Pembayaran dikelola modul keuangan (Tahap 5) — belum tersedia" };
  }

  return db.transaction(async (tx) => {
    const before = await ensureRow(tx, penugasanId, user.id);
    if (!BIAYA_TRANSITIONS[before.status].includes(status)) {
      return { error: `Transisi dari "${before.status}" ke "${status}" tidak diizinkan` };
    }

    // hanya boleh maju ke verifikasi kalau penugasan sudah selesai
    if (["diverifikasi_produksi", "diverifikasi_keuangan", "siap_dibayar"].includes(status)) {
      const [p] = await tx
        .select({ status: penugasanJahit.status })
        .from(penugasanJahit)
        .where(eq(penugasanJahit.id, penugasanId))
        .limit(1);
      if (p?.status !== "selesai") {
        return { error: "Penugasan belum selesai — masih ada sisa WIP atau retur terbuka" };
      }
    }

    const [row] = await tx
      .update(biayaJasaJahit)
      .set({
        status,
        ...(status === "diverifikasi_produksi" ? { verifiedProduksiBy: user.id, verifiedProduksiAt: new Date() } : {}),
        ...(status === "diverifikasi_keuangan" ? { verifiedKeuanganBy: user.id, verifiedKeuanganAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(biayaJasaJahit.penugasanId, penugasanId))
      .returning();

    await writeAudit(tx, status.startsWith("diverifikasi") ? "APPROVE" : "UPDATE", row.id, before, row, user.id);
    return { data: row };
  });
}

/** Isi biaya tambahan & potongan dari usulan terhitung (retur Owncrave, selisih vendor). */
export async function terapkanUsulan(penugasanId: string): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);
  const detail = await getBiayaDetail(penugasanId);
  if (!detail) return { error: "Penugasan tidak ditemukan" };

  return updateBiaya(penugasanId, {
    bonus: Number(detail.bonus ?? 0),
    biayaTambahan: Number(detail.usulTambahan),
    potongan: Number(detail.usulPotongan),
    uangMuka: Number(detail.uangMuka ?? 0),
    catatan: detail.catatan ?? undefined,
  });
}
