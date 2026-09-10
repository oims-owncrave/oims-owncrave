import { listJenisCacat } from "@/services/jenis-cacat";
import { JenisCacatPageClient } from "./_components/JenisCacatPageClient";

export default async function MasterJenisCacatPage() {
  const data = await listJenisCacat();
  return <JenisCacatPageClient initialData={data} />;
}
