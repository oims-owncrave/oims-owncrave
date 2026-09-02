import { listPo } from "@/services/po-produksi";
import { PoPageClient } from "./_components/PoPageClient";

export default async function PoProduksiPage() {
  const data = await listPo();
  return <PoPageClient initialData={data} />;
}
