"use server";

import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  penugasanJahit,
  penugasanJahitDetail,
  pengirimanJahit,
  pengirimanJahitDetail,
  bundling,
  workOrderCutting,
  poProduksi,
  produk,
  varianProduk,
  warna,
  vendor,
  penjahit,
  lokasiProduksi,
  tarifJasaJahit,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { PenugasanInput } from "@/lib/schemas/penugasan-jahit";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type PenugasanRow = typeof penugasanJahit.$inferSelect;
type PenugasanResult = { data?: PenugasanRow; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505";
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
    tabel: "penugasan_jahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

const pihakNama = sql<string>`COALESCE(${vendor.nama}, ${penjahit.nama})`;

export async function listPenugasan() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: penugasanJahit.id,
      nomorDokumen: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      jenisPekerjaan: penugasanJahit.jenisPekerjaan,
      tanggal: penugasanJahit.tanggal,
      targetSelesai: penugasanJahit.targetSelesai,
      prioritas: penugasanJahit.prioritas,
      status: penugasanJahit.status,
      totalBundel: sql<number>`(SELECT COUNT(*)::int FROM penugasan_jahit_detail d WHERE d.penugasan_id = ${penugasanJahit.id})`,
      totalPcs: sql<number>`(SELECT COALESCE(SUM(d.jumlah_pcs), 0)::int FROM penugasan_jahit_detail d WHERE d.penugasan_id = ${penugasanJahit.id})`,
      // estimasi biaya DERIVED = Σ pcs × tarif snapshot
      estimasiBiaya: sql<string>`(SELECT COALESCE(SUM(d.jumlah_pcs * d.tarif_snapshot), 0) FROM penugasan_jahit_detail d WHERE d.penugasan_id = ${penugasanJahit.id})`,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(isNull(penugasanJahit.deletedAt))
    .orderBy(desc(penugasanJahit.createdAt));
}

export type PenugasanListRow = Awaited<ReturnType<typeof listPenugasan>>[number];

export async function getPenugasanDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const [header] = await db
    .select({
      id: penugasanJahit.id,
      nomorDokumen: penugasanJahit.nomorDokumen,
      poId: penugasanJahit.poId,
      poNomor: poProduksi.nomorDokumen,
      produkId: produk.id,
      produkNama: produk.nama,
      tanggal: penugasanJahit.tanggal,
      vendorId: penugasanJahit.vendorId,
      penjahitId: penugasanJahit.penjahitId,
      pihakNama,
      pihakTelepon: sql<string | null>`COALESCE(${vendor.telepon}, ${penjahit.telepon})`,
      pihakAlamat: sql<string | null>`COALESCE(${vendor.alamat}, ${penjahit.alamat})`,
      lokasiTujuanId: penugasanJahit.lokasiTujuanId,
      lokasiTujuanNama: lokasiProduksi.nama,
      jenisPekerjaan: penugasanJahit.jenisPekerjaan,
      rencanaKirim: penugasanJahit.rencanaKirim,
      targetSelesai: penugasanJahit.targetSelesai,
      prioritas: penugasanJahit.prioritas,
      status: penugasanJahit.status,
      catatan: penugasanJahit.catatan,
      createdAt: penugasanJahit.createdAt,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .leftJoin(lokasiProduksi, eq(penugasanJahit.lokasiTujuanId, lokasiProduksi.id))
    .where(and(eq(penugasanJahit.id, id), isNull(penugasanJahit.deletedAt)))
    .limit(1);

  if (!header) return null;

  const details = await db
    .select({
      id: penugasanJahitDetail.id,
      bundlingId: penugasanJahitDetail.bundlingId,
      bundelNomor: bundling.nomorDokumen,
      bundelStatus: bundling.status,
      varianId: bundling.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: penugasanJahitDetail.jumlahPcs,
      tarifSnapshot: penugasanJahitDetail.tarifSnapshot,
      dasarTarif: penugasanJahitDetail.dasarTarif,
      // sudah masuk pengiriman aktif (non-batal)?
      sudahDikirim: sql<boolean>`EXISTS (
        SELECT 1 FROM pengiriman_jahit_detail pd
        JOIN pengiriman_jahit p ON p.id = pd.pengiriman_id
        WHERE pd.penugasan_detail_id = ${penugasanJahitDetail.id}
          AND p.status <> 'dibatalkan' AND p.deleted_at IS NULL
      )`,
    })
    .from(penugasanJahitDetail)
    .innerJoin(bundling, eq(penugasanJahitDetail.bundlingId, bundling.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(eq(penugasanJahitDetail.penugasanId, id))
    .orderBy(bundling.nomorDokumen);

  const pengiriman = await db
    .select({
      id: pengirimanJahit.id,
      nomorDokumen: pengirimanJahit.nomorDokumen,
      tanggalJam: pengirimanJahit.tanggalJam,
      status: pengirimanJahit.status,
      totalBundel: sql<number>`(SELECT COUNT(*)::int FROM pengiriman_jahit_detail d WHERE d.pengiriman_id = ${pengirimanJahit.id})`,
    })
    .from(pengirimanJahit)
    .where(and(eq(pengirimanJahit.penugasanId, id), isNull(pengirimanJahit.deletedAt)))
    .orderBy(desc(pengirimanJahit.tanggalJam));

  return { ...header, details, pengiriman };
}

export type PenugasanDetailData = NonNullable<Awaited<ReturnType<typeof getPenugasanDetail>>>;

/** Filter bundel yang boleh ditugaskan: siap_dikirim + belum ada penugasan aktif. */
function bundelBebasFilter(excludePenugasanId?: string) {
  return and(
    eq(bundling.status, "siap_dikirim"),
    isNull(bundling.deletedAt),
    sql`NOT EXISTS (
      SELECT 1 FROM penugasan_jahit_detail d
      JOIN penugasan_jahit p ON p.id = d.penugasan_id
      WHERE d.bundling_id = ${bundling.id}
        AND p.status <> 'dibatalkan' AND p.deleted_at IS NULL
        ${excludePenugasanId ? sql`AND p.id <> ${excludePenugasanId}` : sql``}
    )`,
  );
}

/** PO yang punya bundel siap ditugaskan. */
export async function listPoSiapJahit() {
  await requireRole([...WRITE_ROLES]);
  return db
    .selectDistinct({
      id: poProduksi.id,
      nomorDokumen: poProduksi.nomorDokumen,
      produkId: poProduksi.produkId,
      produkNama: produk.nama,
    })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
    .innerJoin(poProduksi, eq(workOrderCutting.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .where(bundelBebasFilter())
    .orderBy(poProduksi.nomorDokumen);
}

export type PoSiapJahit = Awaited<ReturnType<typeof listPoSiapJahit>>[number];

/** Bundel siap ditugaskan untuk satu PO (+ bundel milik penugasan yang sedang diedit). */
export async function listBundelSiapTugas(poId: string, excludePenugasanId?: string) {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: bundling.id,
      nomorDokumen: bundling.nomorDokumen,
      varianId: bundling.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      jumlahPcs: bundling.jumlahPcs,
      vendorId: bundling.vendorId,
      penjahitId: bundling.penjahitId,
      tujuanNama: sql<string | null>`COALESCE(${vendor.nama}, ${penjahit.nama})`,
    })
    .from(bundling)
    .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
    .innerJoin(varianProduk, eq(bundling.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .leftJoin(vendor, eq(bundling.vendorId, vendor.id))
    .leftJoin(penjahit, eq(bundling.penjahitId, penjahit.id))
    .where(and(eq(workOrderCutting.poId, poId), bundelBebasFilter(excludePenugasanId)))
    .orderBy(bundling.nomorDokumen);
}

export type BundelSiapTugas = Awaited<ReturnType<typeof listBundelSiapTugas>>[number];

/**
 * Tarif aktif per bundel — prefill form. Varian spesifik dulu, fallback tarif umum.
 * Hasilnya jadi SNAPSHOT di penugasan_jahit_detail, bukan FK.
 */
export async function getTarifUntukBundel(args: {
  produkId: string;
  jenisPekerjaan: PenugasanInput["jenisPekerjaan"];
  vendorId: string | null;
  penjahitId: string | null;
  bundlingIds: string[];
}) {
  await requireRole([...WRITE_ROLES]);
  if (args.bundlingIds.length === 0) return {};

  const bundels = await db
    .select({ id: bundling.id, varianId: bundling.varianId })
    .from(bundling)
    .where(inArray(bundling.id, args.bundlingIds));

  const tarifs = await db
    .select({
      varianId: tarifJasaJahit.varianId,
      nominal: tarifJasaJahit.nominal,
      dasarTarif: tarifJasaJahit.dasarTarif,
    })
    .from(tarifJasaJahit)
    .where(
      and(
        eq(tarifJasaJahit.produkId, args.produkId),
        eq(tarifJasaJahit.jenisPekerjaan, args.jenisPekerjaan),
        args.vendorId ? eq(tarifJasaJahit.vendorId, args.vendorId) : isNull(tarifJasaJahit.vendorId),
        args.penjahitId
          ? eq(tarifJasaJahit.penjahitId, args.penjahitId)
          : isNull(tarifJasaJahit.penjahitId),
        eq(tarifJasaJahit.status, "aktif"),
        isNull(tarifJasaJahit.deletedAt),
      ),
    );

  const umum = tarifs.find((t) => t.varianId === null) ?? null;
  const out: Record<string, { nominal: number; dasarTarif: (typeof tarifs)[number]["dasarTarif"] } | null> = {};
  for (const b of bundels) {
    const t = tarifs.find((x) => x.varianId === b.varianId) ?? umum;
    out[b.id] = t ? { nominal: Number(t.nominal), dasarTarif: t.dasarTarif } : null;
  }
  return out;
}

async function assertPihakAktif(input: PenugasanInput): Promise<string | null> {
  if (input.pihak === "vendor" && input.vendorId) {
    const [v] = await db
      .select({ isActive: vendor.isActive })
      .from(vendor)
      .where(and(eq(vendor.id, input.vendorId), isNull(vendor.deletedAt)))
      .limit(1);
    if (!v) return "Vendor tidak ditemukan";
    if (!v.isActive) return "Vendor nonaktif — tidak bisa diberi penugasan";
  }
  if (input.pihak === "penjahit" && input.penjahitId) {
    const [p] = await db
      .select({ isActive: penjahit.isActive })
      .from(penjahit)
      .where(and(eq(penjahit.id, input.penjahitId), isNull(penjahit.deletedAt)))
      .limit(1);
    if (!p) return "Penjahit tidak ditemukan";
    if (!p.isActive) return "Penjahit nonaktif — tidak bisa diberi penugasan";
  }
  return null;
}

function headerValues(input: PenugasanInput) {
  return {
    poId: input.poId,
    tanggal: new Date(input.tanggal),
    vendorId: input.pihak === "vendor" ? input.vendorId : null,
    penjahitId: input.pihak === "penjahit" ? input.penjahitId : null,
    lokasiTujuanId: input.lokasiTujuanId || null,
    jenisPekerjaan: input.jenisPekerjaan,
    rencanaKirim: input.rencanaKirim ? new Date(input.rencanaKirim) : null,
    targetSelesai: new Date(input.targetSelesai),
    prioritas: input.prioritas,
    catatan: input.catatan?.trim() || null,
  };
}

export async function createPenugasan(input: PenugasanInput): Promise<PenugasanResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const pihakErr = await assertPihakAktif(input);
  if (pihakErr) return { error: pihakErr };

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // guard PRD §9: bundel siap kirim + tidak punya penugasan aktif lain (re-check dalam tx)
        const ids = input.details.map((d) => d.bundlingId);
        const bebas = await tx
          .select({ id: bundling.id, jumlahPcs: bundling.jumlahPcs })
          .from(bundling)
          .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
          .where(and(inArray(bundling.id, ids), eq(workOrderCutting.poId, input.poId), bundelBebasFilter()));
        if (bebas.length !== ids.length) {
          return { error: "Ada bundel yang tidak siap kirim, bukan milik PO ini, atau sudah ditugaskan" };
        }
        const pcsMap = new Map(bebas.map((b) => [b.id, b.jumlahPcs]));

        const nomorDokumen = await generateDocNumber("ASG-JHT", "penugasan_jahit");
        const [header] = await tx
          .insert(penugasanJahit)
          .values({ nomorDokumen, ...headerValues(input), createdBy: user.id })
          .returning();

        await tx.insert(penugasanJahitDetail).values(
          input.details.map((d) => ({
            penugasanId: header.id,
            bundlingId: d.bundlingId,
            jumlahPcs: pcsMap.get(d.bundlingId) ?? 0,
            tarifSnapshot: String(d.tarif),
            dasarTarif: d.dasarTarif,
          })),
        );

        await writeAudit(tx, "CREATE", header.id, null, { ...header, details: input.details }, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }
  return { error: "Gagal membuat penugasan — coba lagi" };
}

/** Edit hanya draft. Detail di-replace (bukan ledger). */
export async function updatePenugasan(id: string, input: PenugasanInput): Promise<PenugasanResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(penugasanJahit)
    .where(and(eq(penugasanJahit.id, id), isNull(penugasanJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Penugasan tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya penugasan draft yang bisa diedit" };
  if (input.poId !== before.poId) return { error: "PO tidak bisa diganti — buat penugasan baru" };

  const pihakErr = await assertPihakAktif(input);
  if (pihakErr) return { error: pihakErr };

  return db.transaction(async (tx) => {
    const ids = input.details.map((d) => d.bundlingId);
    const bebas = await tx
      .select({ id: bundling.id, jumlahPcs: bundling.jumlahPcs })
      .from(bundling)
      .innerJoin(workOrderCutting, eq(bundling.woId, workOrderCutting.id))
      .where(and(inArray(bundling.id, ids), eq(workOrderCutting.poId, input.poId), bundelBebasFilter(id)));
    if (bebas.length !== ids.length) {
      return { error: "Ada bundel yang tidak siap kirim, bukan milik PO ini, atau sudah ditugaskan" };
    }
    const pcsMap = new Map(bebas.map((b) => [b.id, b.jumlahPcs]));

    const [header] = await tx
      .update(penugasanJahit)
      .set({ ...headerValues(input), updatedAt: new Date() })
      .where(eq(penugasanJahit.id, id))
      .returning();

    await tx.delete(penugasanJahitDetail).where(eq(penugasanJahitDetail.penugasanId, id));
    await tx.insert(penugasanJahitDetail).values(
      input.details.map((d) => ({
        penugasanId: id,
        bundlingId: d.bundlingId,
        jumlahPcs: pcsMap.get(d.bundlingId) ?? 0,
        tarifSnapshot: String(d.tarif),
        dasarTarif: d.dasarTarif,
      })),
    );

    await writeAudit(tx, "UPDATE", id, before, { ...header, details: input.details }, user.id);
    return { data: header };
  });
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ["aktif", "dibatalkan"],
  aktif: ["dibatalkan"],
  selesai: [], // diset flow penerimaan hasil (3C)
  dibatalkan: [],
};

export async function setPenugasanStatus(id: string, status: string): Promise<PenugasanResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(penugasanJahit)
    .where(and(eq(penugasanJahit.id, id), isNull(penugasanJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Penugasan tidak ditemukan" };
  if (!TRANSITIONS[before.status]?.includes(status)) {
    return { error: `Transisi dari "${before.status}" ke "${status}" tidak diizinkan` };
  }

  if (status === "dibatalkan") {
    // tidak boleh batal kalau sudah ada pengiriman yang jalan
    const [aktif] = await db
      .select({ id: pengirimanJahit.id })
      .from(pengirimanJahit)
      .where(
        and(
          eq(pengirimanJahit.penugasanId, id),
          ne(pengirimanJahit.status, "dibatalkan"),
          isNull(pengirimanJahit.deletedAt),
        ),
      )
      .limit(1);
    if (aktif) return { error: "Penugasan sudah punya pengiriman — batalkan pengirimannya dulu" };
  }

  const [row] = await db
    .update(penugasanJahit)
    .set({ status: status as PenugasanRow["status"], updatedAt: new Date() })
    .where(eq(penugasanJahit.id, id))
    .returning();

  await writeAudit(
    db,
    status === "dibatalkan" ? "CANCEL" : status === "aktif" ? "APPROVE" : "UPDATE",
    id,
    before,
    row,
    user.id,
  );
  return { data: row };
}

export async function softDeletePenugasan(id: string): Promise<PenugasanResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(penugasanJahit)
    .where(and(eq(penugasanJahit.id, id), isNull(penugasanJahit.deletedAt)))
    .limit(1);
  if (!before) return { error: "Penugasan tidak ditemukan" };
  if (before.status !== "draft") return { error: "Hanya penugasan draft yang bisa dihapus" };

  const [row] = await db
    .update(penugasanJahit)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(penugasanJahit.id, id))
    .returning();

  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}

/** Penugasan yang masih bisa dikirimi bundel (draft/aktif + ada detail belum dikirim). */
export async function listPenugasanBisaDikirim() {
  await requireRole([...WRITE_ROLES]);
  return db
    .select({
      id: penugasanJahit.id,
      nomorDokumen: penugasanJahit.nomorDokumen,
      poNomor: poProduksi.nomorDokumen,
      produkNama: produk.nama,
      pihakNama,
      vendorId: penugasanJahit.vendorId,
      lokasiTujuanId: penugasanJahit.lokasiTujuanId,
    })
    .from(penugasanJahit)
    .innerJoin(poProduksi, eq(penugasanJahit.poId, poProduksi.id))
    .innerJoin(produk, eq(poProduksi.produkId, produk.id))
    .leftJoin(vendor, eq(penugasanJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(penugasanJahit.penjahitId, penjahit.id))
    .where(
      and(
        inArray(penugasanJahit.status, ["draft", "aktif"]),
        isNull(penugasanJahit.deletedAt),
        sql`EXISTS (
          SELECT 1 FROM penugasan_jahit_detail d
          JOIN bundling b ON b.id = d.bundling_id
          WHERE d.penugasan_id = ${penugasanJahit.id} AND b.status = 'siap_dikirim'
        )`,
      ),
    )
    .orderBy(desc(penugasanJahit.createdAt));
}

export type PenugasanBisaDikirim = Awaited<ReturnType<typeof listPenugasanBisaDikirim>>[number];
