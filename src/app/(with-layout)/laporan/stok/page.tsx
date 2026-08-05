import { Metadata } from "next";
import { getLaporanStok } from "@/services/laporan";
import { listKategoriForFilter } from "@/services/stok";
import { LaporanStokClient } from "./_components/LaporanStokClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Laporan Stok Bahan | OIMS Owncrave",
};

export default async function LaporanStokPage() {
  const [initialData, kategoriOptions] = await Promise.all([
    getLaporanStok(),
    listKategoriForFilter(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Laporan Stok Bahan
        </h2>
        <Breadcrumb
          items={[
            { label: "Analitik" },
            { label: "Laporan" },
            { label: "Stok" },
          ]}
        />
      </div>
      <LaporanStokClient
        initialData={initialData}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
