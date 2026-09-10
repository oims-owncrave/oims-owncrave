import { listTemplate } from "@/services/dekorasi";
import { listProduk } from "@/services/produk";
import { PageHeader } from "@/components/ui/PageHeader";
import { TemplatePageClient } from "./_components/TemplatePageClient";

export default async function TemplateDekorasiPage() {
  const [data, produkList] = await Promise.all([listTemplate(), listProduk()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Template Dekorasi" breadcrumb={[{ label: "Sablon & Bordir" }, { label: "Template Dekorasi" }]} />
      <TemplatePageClient initialData={data} produkList={produkList} />
    </div>
  );
}
