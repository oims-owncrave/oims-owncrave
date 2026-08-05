import { Metadata } from "next";
import { getLaporanBarangMasuk } from "@/services/laporan";
import { LaporanBarangMasukClient } from "./_components/LaporanBarangMasukClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Laporan Barang Masuk | OIMS Owncrave",
};

export default async function LaporanBarangMasukPage() {
  const initialData = await getLaporanBarangMasuk();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Laporan Barang Masuk
        </h2>
        <Breadcrumb
          items={[
            { label: "Analitik" },
            { label: "Laporan" },
            { label: "Barang Masuk" },
          ]}
        />
      </div>
      <LaporanBarangMasukClient initialData={initialData} />
    </div>
  );
}
