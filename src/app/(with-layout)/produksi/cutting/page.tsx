import { listPenerimaan } from "@/services/penerimaan-cutting";
import { listWo } from "@/services/wo-cutting";
import { CuttingPageClient } from "./_components/CuttingPageClient";

export default async function CuttingPage() {
  const [penerimaan, wo] = await Promise.all([listPenerimaan(), listWo()]);
  return <CuttingPageClient initialPenerimaan={penerimaan} initialWo={wo} />;
}
