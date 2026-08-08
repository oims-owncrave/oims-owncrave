"use server";

import { and, eq, isNull, inArray } from "drizzle-orm";
import { db } from "@/db";
import { kategori, satuan, supplier, bahan, stok, warna, auditLog } from "@/db/schema";
import { kategoriSchema } from "@/lib/schemas/kategori";
import { satuanSchema } from "@/lib/schemas/satuan";
import { supplierSchema } from "@/lib/schemas/supplier";
import { bahanSchema } from "@/lib/schemas/bahan";
import { requireRole } from "@/lib/auth";
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
