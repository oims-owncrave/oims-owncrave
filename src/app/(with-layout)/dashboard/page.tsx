import { Metadata } from "next";
import { getDashboardStats, getBahanKritisList } from "@/services/dashboard";
import { DashboardPageClient } from "./_components/DashboardPageClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard Inventory | OIMS Owncrave",
};

export default async function DashboardPage() {
  const [stats, kritisList] = await Promise.all([
    getDashboardStats(),
    getBahanKritisList(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Inventory"
        breadcrumb={[{ label: "Dashboard" }]}
      />
      <DashboardPageClient
        initialStats={stats}
        initialKritisList={kritisList}
      />
    </div>
  );
}
