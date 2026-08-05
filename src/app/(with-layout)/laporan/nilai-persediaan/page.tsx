import { Metadata } from "next";
import { getLaporanNilaiPersediaan } from "@/services/laporan";
import { LaporanNilaiPersediaanClient } from "./_components/LaporanNilaiPersediaanClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Laporan Nilai Persediaan | OIMS Owncrave",
};

export default async function LaporanNilaiPersediaanPage() {
  const initialData = await getLaporanNilaiPersediaan();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Nilai Persediaan"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Laporan" },
          { label: "Nilai Persediaan" },
        ]}
      />
      <LaporanNilaiPersediaanClient initialData={initialData} />
    </div>
  );
}
