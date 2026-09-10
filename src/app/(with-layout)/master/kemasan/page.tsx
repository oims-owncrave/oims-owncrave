import { listKemasan } from "@/services/kemasan";
import { KemasanPageClient } from "./_components/KemasanPageClient";

export default async function MasterKemasanPage() {
  const data = await listKemasan();
  return <KemasanPageClient initialData={data} />;
}
