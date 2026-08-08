"use server";

import { and, isNull, inArray } from "drizzle-orm";
import { db } from "@/db";
import { kategori, satuan, supplier, auditLog } from "@/db/schema";
import { kategoriSchema } from "@/lib/schemas/kategori";
import { satuanSchema } from "@/lib/schemas/satuan";
import { supplierSchema } from "@/lib/schemas/supplier";
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
