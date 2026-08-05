"use server";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  userId: string | null;
  userNama: string;
  userEmail: string | null;
  aksi: string;
  tabel: string;
  recordId: string;
  dataBefore: string | null;
  dataAfter: string | null;
  ipAddress: string | null;
};

export type AuditLogFilter = {
  tabel?: string;
  aksi?: string;
  userId?: string;
  from?: string;
  to?: string;
};

const PAGE_SIZE = 50;

export async function listAuditLog(
  filter?: AuditLogFilter,
  page = 1,
): Promise<{ rows: AuditLogRow[]; total: number; page: number; pageSize: number }> {
  await requireRole(["owner"]);

  const conditions = [];
  if (filter?.tabel) conditions.push(eq(auditLog.tabel, filter.tabel));
  if (filter?.aksi) conditions.push(eq(auditLog.aksi, filter.aksi));
  if (filter?.userId) conditions.push(eq(auditLog.userId, filter.userId));
  if (filter?.from) conditions.push(gte(auditLog.createdAt, new Date(filter.from)));
  if (filter?.to) {
    const toDate = new Date(filter.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLog.createdAt, toDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(auditLog)
    .where(where);

  const offset = (page - 1) * PAGE_SIZE;

  const rawRows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      userId: auditLog.userId,
      userNama: users.displayName,
      userEmail: users.email,
      aksi: auditLog.aksi,
      tabel: auditLog.tabel,
      recordId: auditLog.recordId,
      dataBefore: auditLog.dataBefore,
      dataAfter: auditLog.dataAfter,
      ipAddress: auditLog.ipAddress,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows: AuditLogRow[] = rawRows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    userId: r.userId,
    userNama: r.userNama ?? "Sistem / Anonim",
    userEmail: r.userEmail,
    aksi: r.aksi,
    tabel: r.tabel,
    recordId: r.recordId,
    dataBefore: r.dataBefore,
    dataAfter: r.dataAfter,
    ipAddress: r.ipAddress,
  }));

  return { rows, total, page, pageSize: PAGE_SIZE };
}

export async function listTablesForAuditFilter(): Promise<string[]> {
  await requireRole(["owner"]);
  const rows = await db
    .selectDistinct({ tabel: auditLog.tabel })
    .from(auditLog)
    .orderBy(auditLog.tabel);
  return rows.map((r) => r.tabel);
}

export async function listUsersForAuditFilter() {
  await requireRole(["owner"]);
  return db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .orderBy(users.displayName);
}
