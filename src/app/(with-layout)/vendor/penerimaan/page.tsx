import { listPenerimaanHasil } from "@/services/penerimaan-hasil-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenerimaanTable } from "./_components/PenerimaanTable";

export default async function PenerimaanHasilPage() {
  const data = await listPenerimaanHasil();
  return (
    <div className="space-y-6">
      <PageHeader title="Penerimaan Hasil Jahit" breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Penerimaan Hasil" }]} />
      <PenerimaanTable initialData={data} />
    </div>
  );
}
