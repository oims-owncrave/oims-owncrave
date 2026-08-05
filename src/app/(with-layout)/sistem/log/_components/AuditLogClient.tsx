"use client";

import { useState } from "react";
import { AuditLogTable } from "./AuditLogTable";
import {
  useAuditLogList,
  useAuditLogTables,
  useAuditLogUsers,
} from "@/hooks/useAuditLog";
import type { AuditLogRow } from "@/services/audit";

interface Props {
  initialRows: AuditLogRow[];
  initialTotal: number;
  pageSize: number;
  initialTables: string[];
  initialUsers: { id: string; displayName: string }[];
}

export function AuditLogClient({
  initialRows,
  initialTotal,
  pageSize,
  initialTables,
  initialUsers,
}: Props) {
  const [page, setPage] = useState(1);
  const [filterTabel, setFilterTabel] = useState("");
  const [filterAksi, setFilterAksi] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filter = {
    tabel: filterTabel || undefined,
    aksi: filterAksi || undefined,
    userId: filterUserId || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  };

  const { data } = useAuditLogList(filter, page);
  const { data: tablesData } = useAuditLogTables();
  const { data: usersData } = useAuditLogUsers();

  const rows = data?.rows ?? initialRows;
  const total = data?.total ?? initialTotal;
  const tableOptions = tablesData ?? initialTables;
  const userOptions = usersData ?? initialUsers;

  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-6">
      <AuditLogTable
        data={rows}
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        filterTabel={filterTabel}
        filterAksi={filterAksi}
        filterUserId={filterUserId}
        filterFrom={filterFrom}
        filterTo={filterTo}
        onFilterTabelChange={handleFilterChange(setFilterTabel)}
        onFilterAksiChange={handleFilterChange(setFilterAksi)}
        onFilterUserChange={handleFilterChange(setFilterUserId)}
        onFilterFromChange={handleFilterChange(setFilterFrom)}
        onFilterToChange={handleFilterChange(setFilterTo)}
        tableOptions={tableOptions}
        userOptions={userOptions}
      />
    </div>
  );
}
