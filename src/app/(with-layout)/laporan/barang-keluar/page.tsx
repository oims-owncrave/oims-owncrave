import { Metadata } from "next";
import { getLaporanBarangKeluar } from "@/services/laporan";
import { LaporanBarangKeluarClient } from "./_components/LaporanBarangKeluarClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Laporan Barang Keluar | OIMS Owncrave",
};

export default async function LaporanBarangKeluarPage() {
  const initialData = await getLaporanBarangKeluar();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Barang Keluar"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Laporan" },
          { label: "Barang Keluar" },
        ]}
      />
      <LaporanBarangKeluarClient initialData={initialData} />
    </div>
  );
}
