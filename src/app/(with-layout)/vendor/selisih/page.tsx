import { listSelisih } from "@/services/selisih-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { SelisihPageClient } from "./_components/SelisihPageClient";

export default async function SelisihPage() {
  const data = await listSelisih();
  return (
    <div className="space-y-6">
      <PageHeader title="Selisih, Hilang & Rusak" breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Selisih & Kasus" }]} />
      <SelisihPageClient initialData={data} />
    </div>
  );
}
