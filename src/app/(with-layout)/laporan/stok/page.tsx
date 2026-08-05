import { Metadata } from "next";
import { getLaporanStok } from "@/services/laporan";
import { listKategoriForFilter } from "@/services/stok";
import { LaporanStokClient } from "./_components/LaporanStokClient";
import { PageHeader } from "@/components/ui/PageHeader";

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
      <PageHeader
        title="Laporan Stok Bahan"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Laporan" },
          { label: "Stok" },
        ]}
      />
      <LaporanStokClient
        initialData={initialData}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
