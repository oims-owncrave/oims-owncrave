import { listBom } from "@/services/bom";
import { BomPageClient } from "./_components/BomPageClient";

export default async function BomPage() {
  const data = await listBom();
  return <BomPageClient initialData={data} />;
}
