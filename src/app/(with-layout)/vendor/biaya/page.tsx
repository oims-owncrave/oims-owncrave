import { listBiaya } from "@/services/biaya-jasa-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { BiayaPageClient } from "./_components/BiayaPageClient";

export default async function BiayaPage() {
  const data = await listBiaya();
  return (
    <div className="space-y-6">
      <PageHeader title="Biaya Jasa Jahit" breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Biaya Jasa" }]} />
      <BiayaPageClient initialData={data} />
    </div>
  );
}
