import { listPengiriman } from "@/services/pengiriman-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { PengirimanTable } from "./_components/PengirimanTable";

export default async function PengirimanPage() {
  const data = await listPengiriman();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengiriman ke Vendor"
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Pengiriman Vendor" }]}
      />
      <PengirimanTable initialData={data} />
    </div>
  );
}
