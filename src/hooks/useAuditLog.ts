"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditLog, listTablesForAuditFilter, listUsersForAuditFilter } from "@/services/audit";
import type { AuditLogFilter } from "@/services/audit";

export const KEY_AUDIT_LOG = ["audit-log"];

export function useAuditLogList(filter?: AuditLogFilter, page = 1) {
  return useQuery({
    queryKey: [...KEY_AUDIT_LOG, filter, page],
    queryFn: () => listAuditLog(filter, page),
  });
}

export function useAuditLogTables() {
  return useQuery({
    queryKey: [...KEY_AUDIT_LOG, "tables"],
    queryFn: listTablesForAuditFilter,
  });
}

export function useAuditLogUsers() {
  return useQuery({
    queryKey: [...KEY_AUDIT_LOG, "users"],
    queryFn: listUsersForAuditFilter,
  });
}
