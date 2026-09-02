import { listPenugasan } from "@/services/penugasan-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenugasanTable } from "./_components/PenugasanTable";

export default async function PenugasanPage() {
  const data = await listPenugasan();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan Jahit"
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Penugasan Jahit" }]}
      />
      <PenugasanTable initialData={data} />
    </div>
  );
}
