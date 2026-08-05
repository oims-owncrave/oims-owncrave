import { Metadata } from "next";
import { listStok, listKategoriForFilter } from "@/services/stok";
import { StokPageClient } from "./_components/StokPageClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Stok Bahan | OIMS Owncrave",
};

export default async function StokPage() {
  const [{ rows, summary }, kategoriOptions] = await Promise.all([
    listStok(),
    listKategoriForFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Bahan"
        breadcrumb={[{ label: "Inventory" }, { label: "Stok Bahan" }]}
      />
      <StokPageClient
        initialRows={rows}
        initialSummary={summary}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
