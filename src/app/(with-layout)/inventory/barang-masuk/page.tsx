import { Metadata } from "next";
import { listBarangMasuk } from "@/services/barang-masuk";
import { BarangMasukTable } from "./_components/BarangMasukTable";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Barang Masuk | OIMS Owncrave",
};

export default async function BarangMasukPage() {
  const data = await listBarangMasuk();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Barang Masuk
        </h2>
        <Breadcrumb items={[{ label: "Inventory" }, { label: "Barang Masuk" }]} />
      </div>
      <BarangMasukTable data={data} />
    </div>
  );
}
