import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  listAuditLog,
  listTablesForAuditFilter,
  listUsersForAuditFilter,
} from "@/services/audit";
import { AuditLogClient } from "./_components/AuditLogClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Log Aktivitas | OIMS Owncrave",
};

export default async function AuditLogPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "owner") {
    redirect("/dashboard");
  }

  const [{ rows, total, pageSize }, tableOptions, userOptions] = await Promise.all([
    listAuditLog(),
    listTablesForAuditFilter(),
    listUsersForAuditFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Aktivitas"
        breadcrumb={[
          { label: "Sistem" },
          { label: "Log Aktivitas" },
        ]}
      />
      <AuditLogClient
        initialRows={rows}
        initialTotal={total}
        pageSize={pageSize}
        initialTables={tableOptions}
        initialUsers={userOptions}
      />
    </div>
  );
}
