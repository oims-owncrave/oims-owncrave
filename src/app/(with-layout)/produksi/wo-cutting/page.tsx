import { listWo } from "@/services/wo-cutting";
import { WoPageClient } from "./_components/WoPageClient";

export default async function WoCuttingPage() {
  const data = await listWo();
  return <WoPageClient initialData={data} />;
}
