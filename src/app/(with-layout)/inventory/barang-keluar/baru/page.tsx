import { Metadata } from "next";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { BarangKeluarForm } from "../\_components/BarangKeluarForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { db } from "@/db";
import { stok } from "@/db/schema";
import { inArray } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Barang Keluar Baru | OIMS Owncrave",
};

export default async function BarangKeluarBaruPage() {
  await requireRole(["owner", "admin_gudang"]);

  const bahanList = await listBahan();
  const bahanIds = bahanList.map((b) => b.id);

  const stokList = bahanIds.length
    ? await db.select().from(stok).where(inArray(stok.bahanId, bahanIds))
    : [];
  const stokMap = new Map(stokList.map((s) => [s.bahanId, s.kuantitas]));

  const bahanOptions = bahanList.map((bahan) => ({
    ...bahan,
    kuantitasStok: stokMap.get(bahan.id) ?? "0",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barang Keluar Baru"
        breadcrumb={[
          { label: "Inventory", href: "/inventory/barang-keluar" },
          { label: "Barang Keluar", href: "/inventory/barang-keluar" },
          { label: "Baru" },
        ]}
      />
      <BarangKeluarForm bahanOptions={bahanOptions} />
    </div>
  );
}
