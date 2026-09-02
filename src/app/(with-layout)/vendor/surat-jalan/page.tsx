import { listSuratJalan } from "@/services/pengiriman-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { SuratJalanTable } from "./_components/SuratJalanTable";

export default async function SuratJalanListPage() {
  const data = await listSuratJalan();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Jalan"
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Surat Jalan" }]}
      />
      <SuratJalanTable initialData={data} />
    </div>
  );
}
