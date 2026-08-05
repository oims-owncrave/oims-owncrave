import { Metadata } from "next";
import { getLaporanBarangKeluar } from "@/services/laporan";
import { LaporanBarangKeluarClient } from "./_components/LaporanBarangKeluarClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Laporan Barang Keluar | OIMS Owncrave",
};

export default async function LaporanBarangKeluarPage() {
  const initialData = await getLaporanBarangKeluar();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Laporan Barang Keluar
        </h2>
        <Breadcrumb
          items={[
            { label: "Analitik" },
            { label: "Laporan" },
            { label: "Barang Keluar" },
          ]}
        />
      </div>
      <LaporanBarangKeluarClient initialData={initialData} />
    </div>
  );
}
