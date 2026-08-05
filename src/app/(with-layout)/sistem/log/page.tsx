import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  listAuditLog,
  listTablesForAuditFilter,
  listUsersForAuditFilter,
} from "@/services/audit";
import { AuditLogClient } from "./_components/AuditLogClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Log Aktivitas
        </h2>
        <Breadcrumb
          items={[
            { label: "Sistem" },
            { label: "Log Aktivitas" },
          ]}
        />
      </div>
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
