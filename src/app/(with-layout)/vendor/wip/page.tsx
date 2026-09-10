import { getWipJahit, getRingkasanJahit } from "@/services/wip-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { WipJahitClient } from "./_components/WipJahitClient";

export default async function WipJahitPage() {
  const [rows, ringkasan] = await Promise.all([getWipJahit(), getRingkasanJahit()]);
  return (
    <div className="space-y-6">
      <PageHeader title="WIP Jahit" breadcrumb={[{ label: "Analitik" }, { label: "WIP Jahit" }]} />
      <WipJahitClient initialRows={rows} initialRingkasan={ringkasan} />
    </div>
  );
}
