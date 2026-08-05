import { Metadata } from "next";
import { listMutasi, listBahanForMutasiFilter } from "@/services/mutasi";
import { MutasiPageClient } from "./_components/MutasiPageClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Mutasi Stok
        </h2>
        <Breadcrumb
          items={[{ label: "Inventory" }, { label: "Mutasi Stok" }]}
        />
      </div>
      <MutasiPageClient
        initialRows={rows}
        initialTotal={total}
        pageSize={pageSize}
        bahanOptions={bahanOptions}
      />
    </div>
  );
}
