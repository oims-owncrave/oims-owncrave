import { Metadata } from "next";
import {
  getDashboardStats,
  getBahanKritisList,
  getAktivitasTransaksi,
  getTop10BahanKeluar,
} from "@/services/dashboard";
import { DashboardPageClient } from "./_components/DashboardPageClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard Inventory | OIMS Owncrave",
};

/** SSR seed: bulan ini */
function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const [stats, kritisList, aktivitasInit, topBahan] = await Promise.all([
    getDashboardStats(),
    getBahanKritisList(),
    getAktivitasTransaksi(monthStart(), todayStr()),
    getTop10BahanKeluar(),
  ]);

  return (
    <div className="space-y-6">
      {/* <PageHeader
        title="Dashboard Inventory"
        breadcrumb={[{ label: "Dashboard" }]}
      /> */}
      <DashboardPageClient
        initialStats={stats}
        initialKritisList={kritisList}
        initialAktivitas={aktivitasInit}
        initialTopBahan={topBahan}
      />
    </div>
  );
}
