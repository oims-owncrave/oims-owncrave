"use server";

import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  tarifJasaJahit,
  produk,
  varianProduk,
  vendor,
  penjahit,
  auditLog,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import type { TarifJasaJahitInput } from "@/lib/schemas/tarif-jasa-jahit";

const READ_ROLES = [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type TarifRow = typeof tarifJasaJahit.$inferSelect;
type TarifResult = { data?: TarifRow; error?: string };

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
    tabel: "tarif_jasa_jahit",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** Kombinasi yang menentukan satu "jalur tarif" — versi dihitung per kombinasi ini. */
function kombinasiFilter(row: {
  produkId: string;
  varianId?: string | null;
  jenisPekerjaan: TarifJasaJahitInput["jenisPekerjaan"];
  vendorId?: string | null;
  penjahitId?: string | null;
}): SQL | undefined {
  return and(
    eq(tarifJasaJahit.produkId, row.produkId),
    row.varianId
      ? eq(tarifJasaJahit.varianId, row.varianId)
      : isNull(tarifJasaJahit.varianId),
    eq(tarifJasaJahit.jenisPekerjaan, row.jenisPekerjaan),
    row.vendorId
      ? eq(tarifJasaJahit.vendorId, row.vendorId)
      : isNull(tarifJasaJahit.vendorId),
    row.penjahitId
      ? eq(tarifJasaJahit.penjahitId, row.penjahitId)
      : isNull(tarifJasaJahit.penjahitId),
    isNull(tarifJasaJahit.deletedAt),
  );
}

function normalize(input: TarifJasaJahitInput) {
  return {
    produkId: input.produkId,
    varianId: input.varianId || null,
    jenisPekerjaan: input.jenisPekerjaan,
    vendorId: input.pihak === "vendor" ? input.vendorId || null : null,
    penjahitId: input.pihak === "penjahit" ? input.penjahitId || null : null,
    dasarTarif: input.dasarTarif,
    nominal: String(input.nominal),
    tanggalBerlaku: new Date(input.tanggalBerlaku),
    catatan: input.catatan || null,
  };
}

export async function listTarifJasaJahit() {
  await requireRole([...READ_ROLES]);
  return db
    .select({
      id: tarifJasaJahit.id,
      produkId: tarifJasaJahit.produkId,
      produkNama: produk.nama,
      varianId: tarifJasaJahit.varianId,
      varianSku: varianProduk.sku,
      jenisPekerjaan: tarifJasaJahit.jenisPekerjaan,
      vendorId: tarifJasaJahit.vendorId,
      vendorNama: vendor.nama,
      penjahitId: tarifJasaJahit.penjahitId,
      penjahitNama: penjahit.nama,
      dasarTarif: tarifJasaJahit.dasarTarif,
      nominal: tarifJasaJahit.nominal,
      tanggalBerlaku: tarifJasaJahit.tanggalBerlaku,
      versi: tarifJasaJahit.versi,
      status: tarifJasaJahit.status,
      catatan: tarifJasaJahit.catatan,
    })
    .from(tarifJasaJahit)
    .innerJoin(produk, eq(tarifJasaJahit.produkId, produk.id))
    .leftJoin(varianProduk, eq(tarifJasaJahit.varianId, varianProduk.id))
    .leftJoin(vendor, eq(tarifJasaJahit.vendorId, vendor.id))
    .leftJoin(penjahit, eq(tarifJasaJahit.penjahitId, penjahit.id))
    .where(isNull(tarifJasaJahit.deletedAt))
    .orderBy(produk.nama, desc(tarifJasaJahit.versi));
}

/**
 * Tarif AKTIF untuk satu kombinasi — dipakai penugasan jahit (oims-eba.5) untuk
 * prefill nominal. Yang disimpan di transaksi adalah SNAPSHOT nominal ini,
 * bukan FK ke baris tarif (supaya perubahan tarif tak mengubah transaksi lama).
 */
export async function getTarifAktif(args: {
  produkId: string;
  varianId?: string | null;
  jenisPekerjaan: TarifJasaJahitInput["jenisPekerjaan"];
  vendorId?: string | null;
  penjahitId?: string | null;
}) {
  await requireRole([...READ_ROLES]);

  // varian spesifik dulu; kalau tak ada, jatuh ke tarif umum (varianId NULL)
  const cari = async (varianId: string | null) => {
    const [row] = await db
      .select()
      .from(tarifJasaJahit)
      .where(
        and(
          kombinasiFilter({ ...args, varianId }),
          eq(tarifJasaJahit.status, "aktif"),
        ),
      )
      .limit(1);
    return row ?? null;
  };

  return (args.varianId ? await cari(args.varianId) : null) ?? (await cari(null));
}

export async function createTarifJasaJahit(input: TarifJasaJahitInput): Promise<TarifResult> {
  const user = await requireRole([...WRITE_ROLES]);
  const values = normalize(input);

  return db.transaction(async (tx) => {
    // versi = MAX+1 per kombinasi (bukan count — count salah kalau ada versi terhapus)
    const [{ maxVersi }] = await tx
      .select({ maxVersi: sql<number>`COALESCE(MAX(${tarifJasaJahit.versi}), 0)::int` })
      .from(tarifJasaJahit)
      .where(kombinasiFilter(values));

    const [row] = await tx
      .insert(tarifJasaJahit)
      .values({ ...values, versi: maxVersi + 1, createdBy: user.id })
      .returning();

    await writeAudit(tx, "CREATE", row.id, null, row, user.id);
    return { data: row };
  });
}

/** Edit hanya untuk draft — tarif aktif/nonaktif diubah lewat versi baru. */
export async function updateTarifJasaJahit(id: string, input: TarifJasaJahitInput): Promise<TarifResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.id, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (!before) return { error: "Tarif tidak ditemukan" };
  if (before.status !== "draft") {
    return { error: "Tarif non-draft tidak bisa diedit — buat versi baru" };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(tarifJasaJahit)
      .set({ ...normalize(input), updatedAt: new Date() })
      .where(eq(tarifJasaJahit.id, id))
      .returning();

    await writeAudit(tx, "UPDATE", id, before, row, user.id);
    return { data: row };
  });
}

/**
 * Buat versi baru dari tarif existing dengan nominal berbeda.
 * Tarif lama TIDAK ditimpa (PRD T3 §7) — ini jalur resmi ubah harga.
 */
export async function createVersiBaruTarif(id: string, nominal: number, catatan?: string): Promise<TarifResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [source] = await db
    .select()
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.id, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (!source) return { error: "Tarif tidak ditemukan" };

  return db.transaction(async (tx) => {
    const [{ maxVersi }] = await tx
      .select({ maxVersi: sql<number>`COALESCE(MAX(${tarifJasaJahit.versi}), 0)::int` })
      .from(tarifJasaJahit)
      .where(kombinasiFilter(source));

    const [row] = await tx
      .insert(tarifJasaJahit)
      .values({
        produkId: source.produkId,
        varianId: source.varianId,
        jenisPekerjaan: source.jenisPekerjaan,
        vendorId: source.vendorId,
        penjahitId: source.penjahitId,
        dasarTarif: source.dasarTarif,
        nominal: String(nominal),
        tanggalBerlaku: new Date(),
        versi: maxVersi + 1,
        status: "draft",
        catatan: catatan || source.catatan,
        createdBy: user.id,
      })
      .returning();

    await writeAudit(tx, "CREATE", row.id, source, row, user.id);
    return { data: row };
  });
}

export async function activateTarifJasaJahit(id: string): Promise<TarifResult> {
  const user = await requireRole(["owner"]);

  const [target] = await db
    .select()
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.id, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (!target) return { error: "Tarif tidak ditemukan" };
  if (target.status !== "draft") {
    return { error: "Hanya tarif draft yang bisa diaktifkan" };
  }

  return db.transaction(async (tx) => {
    // nonaktifkan versi aktif lama DULU — partial unique menolak 2 aktif per kombinasi
    await tx
      .update(tarifJasaJahit)
      .set({ status: "nonaktif", updatedAt: new Date() })
      .where(and(kombinasiFilter(target), eq(tarifJasaJahit.status, "aktif")));

    const [row] = await tx
      .update(tarifJasaJahit)
      .set({
        status: "aktif",
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tarifJasaJahit.id, id))
      .returning();

    await writeAudit(tx, "APPROVE", id, target, row, user.id);
    return { data: row };
  });
}

export async function deactivateTarifJasaJahit(id: string): Promise<TarifResult> {
  const user = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.id, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (!before) return { error: "Tarif tidak ditemukan" };
  if (before.status !== "aktif") return { error: "Hanya tarif aktif yang bisa dinonaktifkan" };

  const [row] = await db
    .update(tarifJasaJahit)
    .set({ status: "nonaktif", updatedAt: new Date() })
    .where(eq(tarifJasaJahit.id, id))
    .returning();

  await writeAudit(db, "UPDATE", id, before, row, user.id);
  return { data: row };
}

export async function softDeleteTarifJasaJahit(id: string): Promise<TarifResult> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(tarifJasaJahit)
    .where(and(eq(tarifJasaJahit.id, id), isNull(tarifJasaJahit.deletedAt)))
    .limit(1);

  if (!before) return { error: "Tarif tidak ditemukan" };
  if (before.status === "aktif") {
    return { error: "Tarif aktif tidak bisa dihapus — nonaktifkan dulu" };
  }

  const [row] = await db
    .update(tarifJasaJahit)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(tarifJasaJahit.id, id))
    .returning();

  await writeAudit(db, "DELETE", id, before, row, user.id);
  return { data: row };
}
