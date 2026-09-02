import { listPekerjaanDekorasi } from "@/services/dekorasi";
import { PageHeader } from "@/components/ui/PageHeader";
import { DekorasiTable } from "./_components/DekorasiTable";

export default async function DekorasiPage() {
  const data = await listPekerjaanDekorasi();
  return (
    <div className="space-y-6">
      <PageHeader title="Pekerjaan Sablon & Bordir" breadcrumb={[{ label: "Sablon & Bordir" }, { label: "Pekerjaan Dekorasi" }]} />
      <DekorasiTable initialData={data} />
    </div>
  );
}
