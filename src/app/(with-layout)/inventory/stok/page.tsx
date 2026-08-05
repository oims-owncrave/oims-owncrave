import { Metadata } from "next";
import { listStok, listKategoriForFilter } from "@/services/stok";
import { StokPageClient } from "./_components/StokPageClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Stok Bahan | OIMS Owncrave",
};

export default async function StokBahanPage() {
  const [{ rows, summary }, kategoriOptions] = await Promise.all([
    listStok(),
    listKategoriForFilter(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Stok Bahan
        </h2>
        <Breadcrumb items={[{ label: "Inventory" }, { label: "Stok Bahan" }]} />
      </div>
      <StokPageClient
        initialRows={rows}
        initialSummary={summary}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
