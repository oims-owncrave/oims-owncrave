import { Metadata } from "next";
import { listBarangMasuk } from "@/services/barang-masuk";
import { BarangMasukTable } from "./_components/BarangMasukTable";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Barang Masuk | OIMS Owncrave",
};

export default async function BarangMasukPage() {
  const data = await listBarangMasuk();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Barang Masuk"
        breadcrumb={[{ label: "Inventory" }, { label: "Barang Masuk" }]}
      />
      <BarangMasukTable data={data} />
    </div>
  );
}
