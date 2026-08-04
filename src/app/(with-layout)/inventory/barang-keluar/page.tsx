import { Metadata } from "next";
import { listBarangKeluar } from "@/services/barang-keluar";
import { BarangKeluarTable } from "./_components/BarangKeluarTable";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Barang Keluar | OIMS Owncrave",
};

export default async function BarangKeluarPage() {
  const data = await listBarangKeluar();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Barang Keluar
        </h2>
        <Breadcrumb items={[{ label: "Inventory" }, { label: "Barang Keluar" }]} />
      </div>
      <BarangKeluarTable data={data} />
    </div>
  );
}
