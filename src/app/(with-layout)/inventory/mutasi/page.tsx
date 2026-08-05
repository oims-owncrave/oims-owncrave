import { Metadata } from "next";
import { listMutasi, listBahanForMutasiFilter } from "@/services/mutasi";
import { MutasiPageClient } from "./_components/MutasiPageClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Mutasi Stok | OIMS Owncrave",
};

export default async function MutasiStokPage() {
  const [{ rows, total, pageSize }, bahanOptions] = await Promise.all([
    listMutasi(),
    listBahanForMutasiFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mutasi Stok"
        breadcrumb={[{ label: "Inventory" }, { label: "Mutasi Stok" }]}
      />
      <MutasiPageClient
        initialRows={rows}
        initialTotal={total}
        pageSize={pageSize}
        bahanOptions={bahanOptions}
      />
    </div>
  );
}
