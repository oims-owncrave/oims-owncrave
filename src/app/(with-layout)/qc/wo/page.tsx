import { listWoQc } from "@/services/wo-qc";
import { WoQcPageClient } from "./_components/WoQcPageClient";

export default async function WoQcPage() {
  const data = await listWoQc();
  return <WoQcPageClient initialData={data} />;
}
