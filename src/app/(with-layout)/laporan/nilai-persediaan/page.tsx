import { Metadata } from "next";
import { getLaporanNilaiPersediaan } from "@/services/laporan";
import { LaporanNilaiPersediaanClient } from "./_components/LaporanNilaiPersediaanClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Laporan Nilai Persediaan | OIMS Owncrave",
};

export default async function LaporanNilaiPersediaanPage() {
  const initialData = await getLaporanNilaiPersediaan();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Laporan Nilai Persediaan
        </h2>
        <Breadcrumb
          items={[
            { label: "Analitik" },
            { label: "Laporan" },
            { label: "Nilai Persediaan" },
          ]}
        />
      </div>
      <LaporanNilaiPersediaanClient initialData={initialData} />
    </div>
  );
}
