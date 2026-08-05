import { Metadata } from "next";
import { getDashboardStats, getBahanKritisList } from "@/services/dashboard";
import { DashboardPageClient } from "./_components/DashboardPageClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Dashboard Inventory
        </h2>
        <Breadcrumb items={[{ label: "Dashboard" }]} />
      </div>
      <DashboardPageClient
        initialStats={stats}
        initialKritisList={kritisList}
      />
    </div>
  );
}
