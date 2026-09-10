import { listPenerimaanQc } from "@/services/penerimaan-qc";
import { PenerimaanQcPageClient } from "./_components/PenerimaanQcPageClient";

export default async function PenerimaanQcPage() {
  const data = await listPenerimaanQc();
  return <PenerimaanQcPageClient initialData={data} />;
}
