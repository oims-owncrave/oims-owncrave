import { listPenerimaan } from "@/services/penerimaan-cutting";
import { PenerimaanPageClient } from "./_components/PenerimaanPageClient";

export default async function PenerimaanCuttingPage() {
  const data = await listPenerimaan();
  return <PenerimaanPageClient initialData={data} />;
}
