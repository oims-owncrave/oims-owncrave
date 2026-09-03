"use server";

import { and, eq, isNull, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  kategori,
  satuan,
  supplier,
  bahan,
  stok,
  warna,
  produk,
  varianProduk,
  bom,
  bomDetail,
  auditLog,
} from "@/db/schema";
import { kategoriSchema } from "@/lib/schemas/kategori";
import { satuanSchema } from "@/lib/schemas/satuan";
import { supplierSchema } from "@/lib/schemas/supplier";
import { bahanSchema } from "@/lib/schemas/bahan";
import { warnaSchema } from "@/lib/schemas/warna";
import { requireRole } from "@/lib/auth";
import { generateDocNumber } from "@/lib/document-number";
import type { ImportResult, RowError } from "@/lib/import/types";

export async function importKategoriBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole(["owner", "admin_gudang"]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const errors: RowError[] = [];
  const parsed: { kode: string; nama: string; isActive: boolean }[] = [];
  const kodeSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const input = {
      kode: raw.kode ?? "",
      nama: raw.nama ?? "",
      isActive: true,
    };
    const res = kategoriSchema.safeParse(input);
    if (!res.success) {
      errors.push({ row: rowNum, message: res.error.issues[0]?.message ?? "Data tidak valid" });
      return;
    }
    const k = res.data.kode.toLowerCase();
    if (kodeSeen.has(k)) {
      errors.push({ row: rowNum, message: `Kode "${res.data.kode}" duplikat di dalam file` });
      return;
    }
    kodeSeen.add(k);
    parsed.push(res.data);
  });

  if (parsed.length) {
    const kodes = parsed.map((p) => p.kode);
    const existing = await db
      .select({ kode: kategori.kode })
      .from(kategori)
      .where(and(inArray(kategori.kode, kodes), isNull(kategori.deletedAt)));
    const existSet = new Set(existing.map((e) => e.kode.toLowerCase()));
    parsed.forEach((p) => {
      if (existSet.has(p.kode.toLowerCase())) {
        const rowNum = rows.findIndex((r) => (r.kode ?? "").trim().toLowerCase() === p.kode.toLowerCase()) + 1;
        errors.push({ row: rowNum, message: `Kode "${p.kode}" sudah ada di database` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    for (const p of parsed) {
      const [row] = await tx.insert(kategori).values(p).returning();
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "kategori",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

export async function importSatuanBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole(["owner", "admin_gudang"]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const errors: RowError[] = [];
  const parsed: { nama: string; singkatan: string; isActive: boolean }[] = [];
  const namaSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const input = {
      nama: raw.nama ?? "",
      singkatan: raw.singkatan ?? "",
      isActive: true,
    };
    const res = satuanSchema.safeParse(input);
    if (!res.success) {
      errors.push({ row: rowNum, message: res.error.issues[0]?.message ?? "Data tidak valid" });
      return;
    }
    const n = res.data.nama.toLowerCase();
    if (namaSeen.has(n)) {
      errors.push({ row: rowNum, message: `Nama "${res.data.nama}" duplikat di dalam file` });
      return;
    }
    namaSeen.add(n);
    parsed.push(res.data);
  });

  if (parsed.length) {
    const namas = parsed.map((p) => p.nama);
    const existing = await db
      .select({ nama: satuan.nama })
      .from(satuan)
      .where(and(inArray(satuan.nama, namas), isNull(satuan.deletedAt)));
    const existSet = new Set(existing.map((e) => e.nama.toLowerCase()));
    parsed.forEach((p) => {
      if (existSet.has(p.nama.toLowerCase())) {
        const rowNum = rows.findIndex((r) => (r.nama ?? "").trim().toLowerCase() === p.nama.toLowerCase()) + 1;
        errors.push({ row: rowNum, message: `Nama "${p.nama}" sudah ada di database` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    for (const p of parsed) {
      const [row] = await tx.insert(satuan).values(p).returning();
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "satuan",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

export async function importSupplierBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole(["owner", "admin_gudang"]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const errors: RowError[] = [];
  const parsed: { kode: string; nama: string; kontak: string | null; alamat: string | null; isActive: boolean }[] = [];
  const kodeSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const input = {
      kode: raw.kode ?? "",
      nama: raw.nama ?? "",
      kontak: raw.kontak || undefined,
      alamat: raw.alamat || undefined,
      isActive: true,
    };
    const res = supplierSchema.safeParse(input);
    if (!res.success) {
      errors.push({ row: rowNum, message: res.error.issues[0]?.message ?? "Data tidak valid" });
      return;
    }
    const k = res.data.kode.toLowerCase();
    if (kodeSeen.has(k)) {
      errors.push({ row: rowNum, message: `Kode "${res.data.kode}" duplikat di dalam file` });
      return;
    }
    kodeSeen.add(k);
    parsed.push({
      kode: res.data.kode,
      nama: res.data.nama,
      kontak: res.data.kontak || null,
      alamat: res.data.alamat || null,
      isActive: res.data.isActive,
    });
  });

  if (parsed.length) {
    const kodes = parsed.map((p) => p.kode);
    const existing = await db
      .select({ kode: supplier.kode })
      .from(supplier)
      .where(and(inArray(supplier.kode, kodes), isNull(supplier.deletedAt)));
    const existSet = new Set(existing.map((e) => e.kode.toLowerCase()));
    parsed.forEach((p) => {
      if (existSet.has(p.kode.toLowerCase())) {
        const rowNum = rows.findIndex((r) => (r.kode ?? "").trim().toLowerCase() === p.kode.toLowerCase()) + 1;
        errors.push({ row: rowNum, message: `Kode "${p.kode}" sudah ada di database` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    for (const p of parsed) {
      const [row] = await tx.insert(supplier).values(p).returning();
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "supplier",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

export async function importBahanBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole(["owner", "admin_gudang"]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const [kats, sats, wrns] = await Promise.all([
    db.select().from(kategori).where(isNull(kategori.deletedAt)),
    db.select().from(satuan).where(isNull(satuan.deletedAt)),
    db.select().from(warna).where(isNull(warna.deletedAt)),
  ]);

  const katMap = new Map<string, { id: string; kode: string }>();
  kats.forEach((k) => {
    katMap.set(k.kode.toLowerCase(), { id: k.id, kode: k.kode });
    katMap.set(k.nama.toLowerCase(), { id: k.id, kode: k.kode });
  });

  const satMap = new Map<string, string>();
  sats.forEach((s) => {
    satMap.set(s.nama.toLowerCase(), s.id);
    satMap.set(s.singkatan.toLowerCase(), s.id);
  });

  const wrnMap = new Map<string, string>();
  wrns.forEach((w) => wrnMap.set(w.nama.toLowerCase(), w.id));

  const errors: RowError[] = [];
  type Resolved = {
    nama: string;
    kategoriId: string;
    kategoriKode: string;
    satuanId: string;
    warnaId: string | null;
    stokMinimum: number;
    hargaAwal: number;
  };
  const parsed: Resolved[] = [];

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const nama = (raw.nama ?? "").trim();
    const katKey = (raw.kategori ?? "").trim().toLowerCase();
    const satKey = (raw.satuan ?? "").trim().toLowerCase();
    const wrnKey = (raw.warna ?? "").trim().toLowerCase();

    if (!nama) {
      errors.push({ row: rowNum, message: "Nama bahan wajib diisi" });
      return;
    }

    const kat = katMap.get(katKey);
    if (!kat) {
      errors.push({ row: rowNum, message: `Kategori "${raw.kategori}" tidak ditemukan / tidak aktif` });
      return;
    }

    const satId = satMap.get(satKey);
    if (!satId) {
      errors.push({ row: rowNum, message: `Satuan "${raw.satuan}" tidak ditemukan / tidak aktif` });
      return;
    }

    let warnaId: string | null = null;
    if (wrnKey) {
      const w = wrnMap.get(wrnKey);
      if (!w) {
        errors.push({ row: rowNum, message: `Warna "${raw.warna}" tidak ditemukan / tidak aktif` });
        return;
      }
      warnaId = w;
    }

    const stokMinimum = raw.stokMinimum ? Number(raw.stokMinimum) : 0;
    const hargaAwal = raw.hargaAwal ? Number(raw.hargaAwal) : 0;

    if (Number.isNaN(stokMinimum) || stokMinimum < 0) {
      errors.push({ row: rowNum, message: `Stok Minimum "${raw.stokMinimum}" tidak valid` });
      return;
    }
    if (Number.isNaN(hargaAwal) || hargaAwal < 0) {
      errors.push({ row: rowNum, message: `Harga Awal "${raw.hargaAwal}" tidak valid` });
      return;
    }

    const res = bahanSchema.safeParse({
      nama,
      kategoriId: kat.id,
      satuanId: satId,
      warnaId,
      stokMinimum,
      isActive: true,
      hargaAwal,
    });
    if (!res.success) {
      errors.push({ row: rowNum, message: res.error.issues[0]?.message ?? "Data tidak valid" });
      return;
    }

    parsed.push({
      nama,
      kategoriId: kat.id,
      kategoriKode: kat.kode,
      satuanId: satId,
      warnaId,
      stokMinimum,
      hargaAwal,
    });
  });

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    const counter = new Map<string, number>();
    for (const p of parsed) {
      let start = counter.get(p.kategoriId);
      if (start === undefined) {
        const existing = await tx
          .select({ id: bahan.id })
          .from(bahan)
          .where(eq(bahan.kategoriId, p.kategoriId));
        start = existing.length;
      }
      const next = start + 1;
      counter.set(p.kategoriId, next);
      const kode = `BH-${p.kategoriKode}-${String(next).padStart(3, "0")}`;

      const [row] = await tx
        .insert(bahan)
        .values({
          kode,
          nama: p.nama,
          kategoriId: p.kategoriId,
          satuanId: p.satuanId,
          warnaId: p.warnaId,
          stokMinimum: String(p.stokMinimum),
          hargaRataRata: String(p.hargaAwal),
          isActive: true,
        })
        .returning();

      await tx.insert(stok).values({ bahanId: row.id, kuantitas: "0" });
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "bahan",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

// ─── Import master produksi (oims-oiq — bonus di luar PRD) ───────────────────

const PRODUKSI_IMPORT_ROLES = ["owner", "admin_produksi"] as const;

export async function importWarnaBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole(["owner", "admin_gudang"]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const errors: RowError[] = [];
  const parsed: { kode: string; nama: string; isActive: boolean }[] = [];
  const kodeSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const res = warnaSchema.safeParse({
      kode: (raw.kode ?? "").trim(),
      nama: (raw.nama ?? "").trim(),
      isActive: true,
    });
    if (!res.success) {
      errors.push({ row: rowNum, message: res.error.issues[0]?.message ?? "Data tidak valid" });
      return;
    }
    const k = res.data.kode.toLowerCase();
    if (kodeSeen.has(k)) {
      errors.push({ row: rowNum, message: `Kode "${res.data.kode}" duplikat di dalam file` });
      return;
    }
    kodeSeen.add(k);
    parsed.push(res.data);
  });

  if (parsed.length) {
    const existing = await db
      .select({ kode: warna.kode })
      .from(warna)
      .where(and(inArray(warna.kode, parsed.map((p) => p.kode)), isNull(warna.deletedAt)));
    const existSet = new Set(existing.map((e) => e.kode.toLowerCase()));
    parsed.forEach((p) => {
      if (existSet.has(p.kode.toLowerCase())) {
        const rowNum = rows.findIndex((r) => (r.kode ?? "").trim().toLowerCase() === p.kode.toLowerCase()) + 1;
        errors.push({ row: rowNum, message: `Kode "${p.kode}" sudah ada di database` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    for (const p of parsed) {
      const [row] = await tx.insert(warna).values(p).returning();
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "warna",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

export async function importProdukBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole([...PRODUKSI_IMPORT_ROLES]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const errors: RowError[] = [];
  const parsed: {
    kode: string;
    nama: string;
    kategori: string | null;
    brand: string | null;
    jenis: string | null;
    isActive: boolean;
  }[] = [];
  const kodeSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const kode = (raw.kode ?? "").trim();
    const nama = (raw.nama ?? "").trim();

    if (!kode) {
      errors.push({ row: rowNum, message: "Kode produk wajib diisi" });
      return;
    }
    if (!nama) {
      errors.push({ row: rowNum, message: "Nama produk wajib diisi" });
      return;
    }
    if (kodeSeen.has(kode.toLowerCase())) {
      errors.push({ row: rowNum, message: `Kode "${kode}" duplikat di dalam file` });
      return;
    }
    kodeSeen.add(kode.toLowerCase());

    parsed.push({
      kode,
      nama,
      kategori: (raw.kategori ?? "").trim() || null,
      brand: (raw.brand ?? "").trim() || null,
      jenis: (raw.jenis ?? "").trim() || null,
      isActive: true,
    });
  });

  if (parsed.length) {
    const existing = await db
      .select({ kode: produk.kode })
      .from(produk)
      .where(and(inArray(produk.kode, parsed.map((p) => p.kode)), isNull(produk.deletedAt)));
    const existSet = new Set(existing.map((e) => e.kode.toLowerCase()));
    parsed.forEach((p) => {
      if (existSet.has(p.kode.toLowerCase())) {
        const rowNum = rows.findIndex((r) => (r.kode ?? "").trim().toLowerCase() === p.kode.toLowerCase()) + 1;
        errors.push({ row: rowNum, message: `Kode "${p.kode}" sudah ada di database` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    for (const p of parsed) {
      const [row] = await tx.insert(produk).values(p).returning();
      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "produk",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      });
    }
  });

  return { inserted: parsed.length };
}

/**
 * Import varian produk. Satu baris = satu varian (produk × warna × ukuran).
 * SKU auto [KODE_PRODUK]-[KODE_WARNA]-[UKURAN] — sama dengan generator matrix.
 * Duplikat (kombinasi ATAU SKU) dilewati sebagai error baris, bukan diam-diam.
 */
export async function importVarianBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole([...PRODUKSI_IMPORT_ROLES]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const [prds, wrns] = await Promise.all([
    db.select().from(produk).where(isNull(produk.deletedAt)),
    db.select().from(warna).where(isNull(warna.deletedAt)),
  ]);

  const prdMap = new Map<string, { id: string; kode: string }>();
  prds.forEach((p) => {
    prdMap.set(p.kode.toLowerCase(), { id: p.id, kode: p.kode });
    prdMap.set(p.nama.toLowerCase(), { id: p.id, kode: p.kode });
  });

  const wrnMap = new Map<string, { id: string; kode: string }>();
  wrns.forEach((w) => {
    wrnMap.set(w.kode.toLowerCase(), { id: w.id, kode: w.kode });
    wrnMap.set(w.nama.toLowerCase(), { id: w.id, kode: w.kode });
  });

  const errors: RowError[] = [];
  const parsed: {
    produkId: string;
    warnaId: string;
    ukuran: string;
    jenisKelamin: string | null;
    sku: string;
  }[] = [];
  const comboSeen = new Set<string>();
  const skuSeen = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const prd = prdMap.get((raw.produk ?? "").trim().toLowerCase());
    if (!prd) {
      errors.push({ row: rowNum, message: `Produk "${raw.produk}" tidak ditemukan / tidak aktif` });
      return;
    }
    const wrn = wrnMap.get((raw.warna ?? "").trim().toLowerCase());
    if (!wrn) {
      errors.push({ row: rowNum, message: `Warna "${raw.warna}" tidak ditemukan / tidak aktif` });
      return;
    }
    const ukuran = (raw.ukuran ?? "").trim().toUpperCase();
    if (!ukuran) {
      errors.push({ row: rowNum, message: "Ukuran wajib diisi" });
      return;
    }

    const combo = `${prd.id}|${wrn.id}|${ukuran}`;
    if (comboSeen.has(combo)) {
      errors.push({ row: rowNum, message: `Kombinasi ${prd.kode}/${wrn.kode}/${ukuran} duplikat di dalam file` });
      return;
    }
    const sku = `${prd.kode}-${wrn.kode}-${ukuran}`.toUpperCase();
    if (skuSeen.has(sku)) {
      errors.push({ row: rowNum, message: `SKU "${sku}" duplikat di dalam file` });
      return;
    }
    comboSeen.add(combo);
    skuSeen.add(sku);

    parsed.push({
      produkId: prd.id,
      warnaId: wrn.id,
      ukuran,
      jenisKelamin: (raw.jenisKelamin ?? "").trim() || null,
      sku,
    });
  });

  // cek bentrok dengan data existing (SKU unik global, kombinasi unik per produk)
  if (parsed.length) {
    const existing = await db
      .select({
        produkId: varianProduk.produkId,
        warnaId: varianProduk.warnaId,
        ukuran: varianProduk.ukuran,
        sku: varianProduk.sku,
      })
      .from(varianProduk)
      .where(isNull(varianProduk.deletedAt));
    const existCombo = new Set(existing.map((e) => `${e.produkId}|${e.warnaId}|${e.ukuran}`));
    const existSku = new Set(existing.map((e) => e.sku.toLowerCase()));

    parsed.forEach((p, idx) => {
      const rowNum = idx + 1;
      if (existCombo.has(`${p.produkId}|${p.warnaId}|${p.ukuran}`)) {
        errors.push({ row: rowNum, message: `Varian ${p.sku} sudah ada di database` });
      } else if (existSku.has(p.sku.toLowerCase())) {
        errors.push({ row: rowNum, message: `SKU "${p.sku}" sudah dipakai varian lain` });
      }
    });
  }

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };

  await db.transaction(async (tx) => {
    const inserted = await tx.insert(varianProduk).values(parsed).returning();
    await tx.insert(auditLog).values(
      inserted.map((row) => ({
        userId: user.id,
        aksi: "CREATE",
        tabel: "varian_produk",
        recordId: row.id,
        dataBefore: null,
        dataAfter: JSON.stringify(row),
      })),
    );
  });

  return { inserted: parsed.length };
}

/**
 * Import BOM. Satu baris = satu bahan; baris dengan produk sama digabung jadi satu BOM.
 * BOM masuk sebagai DRAFT — aktivasi tetap lewat aksi owner (jaga aturan satu versi aktif).
 */
export async function importBomBatch(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const user = await requireRole([...PRODUKSI_IMPORT_ROLES]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };

  const [prds, bhns] = await Promise.all([
    db.select().from(produk).where(isNull(produk.deletedAt)),
    db.select().from(bahan).where(isNull(bahan.deletedAt)),
  ]);

  const prdMap = new Map<string, { id: string; kode: string }>();
  prds.forEach((p) => {
    prdMap.set(p.kode.toLowerCase(), { id: p.id, kode: p.kode });
    prdMap.set(p.nama.toLowerCase(), { id: p.id, kode: p.kode });
  });

  const bhnMap = new Map<string, string>();
  bhns.forEach((b) => {
    bhnMap.set(b.kode.toLowerCase(), b.id);
    bhnMap.set(b.nama.toLowerCase(), b.id);
  });

  const errors: RowError[] = [];
  type Baris = {
    bahanId: string;
    kuantitas: number;
    toleransiPersen: number;
    berlakuUkuran: string | null;
    keterangan: string | null;
  };
  // produkId → baris BOM
  const perProduk = new Map<string, { kode: string; baris: Baris[] }>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const prd = prdMap.get((raw.produk ?? "").trim().toLowerCase());
    if (!prd) {
      errors.push({ row: rowNum, message: `Produk "${raw.produk}" tidak ditemukan / tidak aktif` });
      return;
    }
    const bahanId = bhnMap.get((raw.bahan ?? "").trim().toLowerCase());
    if (!bahanId) {
      errors.push({ row: rowNum, message: `Bahan "${raw.bahan}" tidak ditemukan / tidak aktif` });
      return;
    }

    const kuantitas = Number(raw.kuantitas);
    if (Number.isNaN(kuantitas) || kuantitas <= 0) {
      errors.push({ row: rowNum, message: `Kuantitas "${raw.kuantitas}" tidak valid (harus > 0)` });
      return;
    }
    const toleransi = raw.toleransi ? Number(raw.toleransi) : 0;
    if (Number.isNaN(toleransi) || toleransi < 0 || toleransi > 100) {
      errors.push({ row: rowNum, message: `Toleransi "${raw.toleransi}" tidak valid (0-100)` });
      return;
    }

    const entry = perProduk.get(prd.id) ?? { kode: prd.kode, baris: [] };
    // bahan sama di produk sama = duplikat, gabungkan manual di file
    if (entry.baris.some((b) => b.bahanId === bahanId)) {
      errors.push({ row: rowNum, message: `Bahan "${raw.bahan}" muncul dua kali untuk produk ${prd.kode}` });
      return;
    }
    entry.baris.push({
      bahanId,
      kuantitas,
      toleransiPersen: toleransi,
      berlakuUkuran: (raw.ukuran ?? "").trim() || null,
      keterangan: (raw.keterangan ?? "").trim() || null,
    });
    perProduk.set(prd.id, entry);
  });

  if (errors.length) return { errors: errors.sort((a, b) => a.row - b.row) };
  if (perProduk.size === 0) return { error: "Tidak ada baris BOM yang valid." };

  await db.transaction(async (tx) => {
    for (const [produkId, { baris }] of perProduk) {
      // versi = MAX+1 per produk (pola createBom — count salah kalau ada versi terhapus)
      const [{ maxVersi }] = await tx
        .select({ maxVersi: sql<number>`COALESCE(MAX(${bom.versi}), 0)::int` })
        .from(bom)
        .where(eq(bom.produkId, produkId));

      const nomorDokumen = await generateDocNumber("BOM", "bom");
      const [header] = await tx
        .insert(bom)
        .values({
          nomorDokumen,
          produkId,
          versi: maxVersi + 1,
          catatan: "Dibuat lewat import Excel",
          createdBy: user.id,
        })
        .returning();

      await tx.insert(bomDetail).values(
        baris.map((b) => ({
          bomId: header.id,
          bahanId: b.bahanId,
          kuantitas: String(b.kuantitas),
          toleransiPersen: String(b.toleransiPersen),
          berlakuUkuran: b.berlakuUkuran,
          keterangan: b.keterangan,
        })),
      );

      await tx.insert(auditLog).values({
        userId: user.id,
        aksi: "CREATE",
        tabel: "bom",
        recordId: header.id,
        dataBefore: null,
        dataAfter: JSON.stringify({ ...header, details: baris }),
      });
    }
  });

  return { inserted: perProduk.size };
}
