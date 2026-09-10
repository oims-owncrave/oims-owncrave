"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  finishing,
  finishingDetail,
  finishingPemakaian,
  hasilQc,
  hasilQcDetail,
  reQc,
  reQcDetail,
  bahan,
  stok,
  mutasiStok,
  poProduksi,
  produk,
  varianProduk,
  warna,
  users,
  auditLog,
} from "@/db/schema";
import type { Finishing } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { FinishingInput, FinishingPemakaianInput } from "@/lib/schemas/finishing";

const READ_ROLES = ["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"] as const;
const WRITE_ROLES = ["owner", "admin_produksi"] as const;

type Result = { data?: Finishing; error?: string };

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505"
  );
}

function money2(v: number): string {
  return (Math.round(v * 100) / 100).toFixed(2);
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
 * Barang lolos QC yang belum masuk finishing.
 * Dua sumber: hasil QC (grade A/B/C) dan Re-QC (lolos / grade turun).
 */
export async function listBarisSiapFinishing() {
  await requireRole([...READ_ROLES]);

  const dariQc = await db
    .select({
      sumber: sql<string>`'hasil_qc'`,
      sumberId: hasilQcDetail.id,
      nomorSumber: hasilQc.nomorDokumen,
      poId: hasilQc.poId,
      nomorPo: poProduksi.nomorDokumen,
      varianId: hasilQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      gradeA: hasilQcDetail.gradeA,
      gradeB: hasilQcDetail.gradeB,
      gradeC: hasilQcDetail.gradeC,
      sudah: sql<number>`(
        SELECT COALESCE(SUM(fd.jumlah), 0)::int
        FROM finishing_detail fd
        JOIN finishing f ON f.id = fd.finishing_id
        WHERE fd.hasil_qc_detail_id = ${hasilQcDetail.id}
          AND f.deleted_at IS NULL AND f.status <> 'dibatalkan'
      )`,
    })
    .from(hasilQcDetail)
    .innerJoin(hasilQc, eq(hasilQcDetail.hasilQcId, hasilQc.id))
    .innerJoin(varianProduk, eq(hasilQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .leftJoin(poProduksi, eq(hasilQc.poId, poProduksi.id))
    .where(
      and(
        isNull(hasilQc.deletedAt),
        sql`(${hasilQcDetail.gradeA} + ${hasilQcDetail.gradeB} + ${hasilQcDetail.gradeC}) > 0`,
      ),
    )
    .orderBy(desc(hasilQc.tanggal));

  const dariReQc = await db
    .select({
      sumber: sql<string>`'re_qc'`,
      sumberId: reQcDetail.id,
      nomorSumber: reQc.nomorDokumen,
      poId: sql<string | null>`NULL`,
      nomorPo: sql<string | null>`NULL`,
      varianId: reQcDetail.varianId,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
      jumlah: reQcDetail.jumlah,
      gradeAkhir: reQcDetail.gradeAkhir,
      sudah: sql<number>`(
        SELECT COALESCE(SUM(fd.jumlah), 0)::int
        FROM finishing_detail fd
        JOIN finishing f ON f.id = fd.finishing_id
        WHERE fd.re_qc_detail_id = ${reQcDetail.id}
          AND f.deleted_at IS NULL AND f.status <> 'dibatalkan'
      )`,
    })
    .from(reQcDetail)
    .innerJoin(reQc, eq(reQcDetail.reQcId, reQc.id))
    .innerJoin(varianProduk, eq(reQcDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(
      and(isNull(reQc.deletedAt), sql`${reQcDetail.hasilReQc} IN ('lolos', 'grade_turun')`),
    )
    .orderBy(desc(reQc.tanggal));

  const baris = [
    ...dariQc.map((r) => {
      const total = r.gradeA + r.gradeB + r.gradeC;
      // grade dominan dipakai sebagai default; operator tetap bisa mengubah
      const grade: "a" | "b" | "c" = r.gradeA > 0 ? "a" : r.gradeB > 0 ? "b" : "c";
      return {
        sumber: r.sumber,
        sumberId: r.sumberId,
        nomorSumber: r.nomorSumber,
        nomorPo: r.nomorPo,
        varianId: r.varianId,
        sku: r.sku,
        warnaNama: r.warnaNama,
        ukuran: r.ukuran,
        produkNama: r.produkNama,
        grade,
        total,
        sisa: total - Number(r.sudah),
      };
    }),
    ...dariReQc.map((r) => ({
      sumber: r.sumber,
      sumberId: r.sumberId,
      nomorSumber: r.nomorSumber,
      nomorPo: r.nomorPo,
      varianId: r.varianId,
      sku: r.sku,
      warnaNama: r.warnaNama,
      ukuran: r.ukuran,
      produkNama: r.produkNama,
      grade: (r.gradeAkhir ?? "a") as "a" | "b" | "c",
      total: r.jumlah,
      sisa: r.jumlah - Number(r.sudah),
    })),
  ];

  return baris.filter((b) => b.sisa > 0);
}

export type BarisFinishingRow = Awaited<ReturnType<typeof listBarisSiapFinishing>>[number];

export async function listFinishing() {
  await requireRole([...READ_ROLES]);

  return db
    .select({
      id: finishing.id,
      nomorDokumen: finishing.nomorDokumen,
      tanggalMasuk: finishing.tanggalMasuk,
      targetSelesai: finishing.targetSelesai,
      status: finishing.status,
      nomorPo: poProduksi.nomorDokumen,
      picNama: users.displayName,
      totalPcs: sql<number>`(
        SELECT COALESCE(SUM(d.jumlah), 0)::int
        FROM finishing_detail d WHERE d.finishing_id = ${finishing.id}
      )`,
      sudahDipacking: sql<number>`(
        SELECT COALESCE(SUM(pd.jumlah), 0)::int
        FROM packing_detail pd
        JOIN finishing_detail fd ON fd.id = pd.finishing_detail_id
        JOIN packing p ON p.id = pd.packing_id
        WHERE fd.finishing_id = ${finishing.id}
          AND p.deleted_at IS NULL AND p.status <> 'dibatalkan'
      )`,
    })
    .from(finishing)
    .leftJoin(poProduksi, eq(finishing.poId, poProduksi.id))
    .leftJoin(users, eq(finishing.picId, users.id))
    .where(isNull(finishing.deletedAt))
    .orderBy(desc(finishing.tanggalMasuk));
}

export type FinishingRow = Awaited<ReturnType<typeof listFinishing>>[number];

export async function getFinishingDetail(id: string) {
  await requireRole([...READ_ROLES]);

  const details = await db
    .select({
      id: finishingDetail.id,
      varianId: finishingDetail.varianId,
      grade: finishingDetail.grade,
      jumlah: finishingDetail.jumlah,
      proses: finishingDetail.proses,
      sku: varianProduk.sku,
      warnaNama: warna.nama,
      ukuran: varianProduk.ukuran,
      produkNama: produk.nama,
    })
    .from(finishingDetail)
    .innerJoin(varianProduk, eq(finishingDetail.varianId, varianProduk.id))
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .innerJoin(produk, eq(varianProduk.produkId, produk.id))
    .where(eq(finishingDetail.finishingId, id))
    .orderBy(varianProduk.sku);

  const pemakaian = await db
    .select({
      id: finishingPemakaian.id,
      bahanId: finishingPemakaian.bahanId,
      bahanNama: bahan.nama,
      bahanKode: bahan.kode,
      jumlah: finishingPemakaian.jumlah,
      hargaSatuan: finishingPemakaian.hargaSatuan,
      catatan: finishingPemakaian.catatan,
    })
    .from(finishingPemakaian)
    .innerJoin(bahan, eq(finishingPemakaian.bahanId, bahan.id))
    .where(eq(finishingPemakaian.finishingId, id));

  return { details, pemakaian };
}

export async function createFinishing(input: FinishingInput): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // GUARD: tak boleh melebihi yang lolos QC dan belum di-finishing
        for (const d of input.details) {
          if (d.hasilQcDetailId) {
            const [k] = await tx
              .select({
                total: sql<number>`(
                  ${hasilQcDetail.gradeA} + ${hasilQcDetail.gradeB} + ${hasilQcDetail.gradeC}
                )`,
                sudah: sql<number>`(
                  SELECT COALESCE(SUM(fd.jumlah), 0)::int
                  FROM finishing_detail fd
                  JOIN finishing f ON f.id = fd.finishing_id
                  WHERE fd.hasil_qc_detail_id = ${hasilQcDetail.id}
                    AND f.deleted_at IS NULL AND f.status <> 'dibatalkan'
                )`,
              })
              .from(hasilQcDetail)
              .where(eq(hasilQcDetail.id, d.hasilQcDetailId))
              .limit(1);

            if (!k) return { error: "Baris hasil QC tidak ditemukan" };
            const sisa = Number(k.total) - Number(k.sudah);
            if (d.jumlah > sisa) {
              return { error: `Jumlah finishing melebihi yang lolos QC (sisa ${sisa} pcs)` };
            }
          } else if (d.reQcDetailId) {
            const [k] = await tx
              .select({
                total: reQcDetail.jumlah,
                sudah: sql<number>`(
                  SELECT COALESCE(SUM(fd.jumlah), 0)::int
                  FROM finishing_detail fd
                  JOIN finishing f ON f.id = fd.finishing_id
                  WHERE fd.re_qc_detail_id = ${reQcDetail.id}
                    AND f.deleted_at IS NULL AND f.status <> 'dibatalkan'
                )`,
              })
              .from(reQcDetail)
              .where(eq(reQcDetail.id, d.reQcDetailId))
              .limit(1);

            if (!k) return { error: "Baris Re-QC tidak ditemukan" };
            const sisa = k.total - Number(k.sudah);
            if (d.jumlah > sisa) {
              return { error: `Jumlah finishing melebihi hasil Re-QC (sisa ${sisa} pcs)` };
            }
          }
        }

        const nomorDokumen = await generateDocNumber("FIN", "finishing");

        const [header] = await tx
          .insert(finishing)
          .values({
            nomorDokumen,
            tanggalMasuk: new Date(input.tanggalMasuk),
            targetSelesai: input.targetSelesai ? new Date(input.targetSelesai) : null,
            picId: input.picId || null,
            lokasiId: input.lokasiId || null,
            catatan: input.catatan || null,
            createdBy: user.id,
          })
          .returning();

        for (const d of input.details) {
          await tx.insert(finishingDetail).values({
            finishingId: header.id,
            hasilQcDetailId: d.hasilQcDetailId || null,
            reQcDetailId: d.reQcDetailId || null,
            varianId: d.varianId,
            grade: d.grade,
            jumlah: d.jumlah,
            proses: {},
          });
        }

        await writeAudit(tx, "finishing", "CREATE", header.id, null, header, user.id);
        return { data: header };
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      throw e;
    }
  }

  return { error: "Gagal membuat nomor dokumen — coba lagi" };
}

/** Centang proses finishing per baris (jsonb checklist). */
export async function updateProsesFinishing(
  detailId: string,
  proses: Record<string, boolean>,
): Promise<{ error?: string }> {
  await requireRole([...WRITE_ROLES]);

  await db
    .update(finishingDetail)
    .set({ proses })
    .where(eq(finishingDetail.id, detailId));

  return {};
}

/**
 * Pemakaian label/hangtag — MENGURANGI STOK BAHAN lewat append mutasi_stok.
 * Aturan proyek: JANGAN UPDATE stok.kuantitas sebagai edit arbitrary.
 * Pola identik src/services/barang-keluar.ts.
 */
export async function catatPemakaianFinishing(
  input: FinishingPemakaianInput,
): Promise<{ error?: string }> {
  const user = await requireRole([...WRITE_ROLES]);

  return db.transaction(async (tx) => {
    const [f] = await tx
      .select({ id: finishing.id, status: finishing.status })
      .from(finishing)
      .where(and(eq(finishing.id, input.finishingId), isNull(finishing.deletedAt)))
      .limit(1);

    if (!f) return { error: "Dokumen finishing tidak ditemukan" };
    if (f.status === "selesai" || f.status === "dibatalkan") {
      return { error: `Finishing berstatus ${f.status} — tidak bisa menambah pemakaian` };
    }

    // lock baris stok + bahan (pola FIX 1 barang-masuk: cegah lost-update)
    const [s] = await tx
      .select()
      .from(stok)
      .where(eq(stok.bahanId, input.bahanId))
      .for("update")
      .limit(1);

    const [b] = await tx
      .select()
      .from(bahan)
      .where(eq(bahan.id, input.bahanId))
      .for("update")
      .limit(1);

    if (!b) return { error: "Bahan tidak ditemukan" };

    const tersedia = Number(s?.kuantitas ?? 0);
    if (input.jumlah > tersedia) {
      return { error: `Stok ${b.nama} tidak cukup (tersedia ${tersedia})` };
    }

    const hargaSatuan = Number(b.hargaRataRata);

    await tx.insert(finishingPemakaian).values({
      finishingId: input.finishingId,
      bahanId: input.bahanId,
      jumlah: String(input.jumlah),
      hargaSatuan: money2(hargaSatuan),
      catatan: input.catatan || null,
    });

    // append ledger — INI yang mengurangi stok, bukan UPDATE langsung
    await tx.insert(mutasiStok).values({
      bahanId: input.bahanId,
      tipe: "keluar",
      kuantitas: String(-input.jumlah),
      createdBy: user.id,
    });

    // cache
    await tx
      .update(stok)
      .set({ kuantitas: String(tersedia - input.jumlah), updatedAt: new Date() })
      .where(eq(stok.bahanId, input.bahanId));

    await writeAudit(
      tx,
      "finishing_pemakaian",
      "CREATE",
      input.finishingId,
      null,
      { bahanId: input.bahanId, jumlah: input.jumlah },
      user.id,
    );

    return {};
  });
}

export async function updateStatusFinishing(
  id: string,
  status: "berjalan" | "selesai" | "dibatalkan",
): Promise<Result> {
  const user = await requireRole([...WRITE_ROLES]);

  const [before] = await db
    .select()
    .from(finishing)
    .where(and(eq(finishing.id, id), isNull(finishing.deletedAt)))
    .limit(1);

  if (!before) return { error: "Finishing tidak ditemukan" };

  const boleh: Record<string, string[]> = {
    draft: ["berjalan", "dibatalkan"],
    berjalan: ["selesai", "dibatalkan"],
    selesai: [],
    dibatalkan: [],
  };

  if (!(boleh[before.status] ?? []).includes(status)) {
    return { error: `Status ${before.status} tidak bisa diubah ke ${status}` };
  }

  const [row] = await db
    .update(finishing)
    .set({ status, updatedAt: new Date() })
    .where(eq(finishing.id, id))
    .returning();

  await writeAudit(db, "finishing", "UPDATE", id, before, row, user.id);
  return { data: row };
}

