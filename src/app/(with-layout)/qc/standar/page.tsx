import { listStandarQc } from "@/services/standar-qc";
import { StandarQcPageClient } from "./_components/StandarQcPageClient";

export default async function StandarQcPage() {
  const data = await listStandarQc();
  return <StandarQcPageClient initialData={data} />;
}
