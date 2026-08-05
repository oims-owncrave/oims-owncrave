import { Metadata } from "next";
import { listBarangKeluar } from "@/services/barang-keluar";
import { BarangKeluarTable } from "./_components/BarangKeluarTable";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Barang Keluar | OIMS Owncrave",
};

export default async function BarangKeluarPage() {
  const data = await listBarangKeluar();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Barang Keluar"
        breadcrumb={[{ label: "Inventory" }, { label: "Barang Keluar" }]}
      />
      <BarangKeluarTable data={data} />
    </div>
  );
}
