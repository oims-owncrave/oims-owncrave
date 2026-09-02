import { listRetur } from "@/services/retur-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReturTable } from "./_components/ReturTable";

export default async function ReturPage() {
  const data = await listRetur();
  return (
    <div className="space-y-6">
      <PageHeader title="Retur & Perbaikan Jahit" breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Retur & Perbaikan" }]} />
      <ReturTable initialData={data} />
    </div>
  );
}
