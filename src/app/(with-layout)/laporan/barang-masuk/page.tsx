import { Metadata } from "next";
import { getLaporanBarangMasuk } from "@/services/laporan";
import { LaporanBarangMasukClient } from "./_components/LaporanBarangMasukClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Laporan Barang Masuk | OIMS Owncrave",
};

export default async function LaporanBarangMasukPage() {
  const initialData = await getLaporanBarangMasuk();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Barang Masuk"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Laporan" },
          { label: "Barang Masuk" },
        ]}
      />
      <LaporanBarangMasukClient initialData={initialData} />
    </div>
  );
}
