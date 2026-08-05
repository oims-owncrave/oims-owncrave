import { Metadata } from "next";
import { listMutasi, listBahanForMutasiFilter } from "@/services/mutasi";
import { LaporanMutasiClient } from "./_components/LaporanMutasiClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Laporan Mutasi Stok
        </h2>
        <Breadcrumb
          items={[
            { label: "Analitik" },
            { label: "Laporan" },
            { label: "Mutasi Stok" },
          ]}
        />
      </div>
      <LaporanMutasiClient
        initialData={initialData}
        bahanOptions={bahanOptions}
      />
    </div>
  );
}
