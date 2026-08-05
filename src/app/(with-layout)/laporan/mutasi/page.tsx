import { Metadata } from "next";
import { listMutasi, listBahanForMutasiFilter } from "@/services/mutasi";
import { LaporanMutasiClient } from "./_components/LaporanMutasiClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Laporan Mutasi Stok | OIMS Owncrave",
};

export default async function LaporanMutasiPage() {
  const [initialData, bahanOptions] = await Promise.all([
    listMutasi(),
    listBahanForMutasiFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Mutasi Stok"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Laporan" },
          { label: "Mutasi Stok" },
        ]}
      />
      <LaporanMutasiClient
        initialData={initialData}
        bahanOptions={bahanOptions}
      />
    </div>
  );
}
