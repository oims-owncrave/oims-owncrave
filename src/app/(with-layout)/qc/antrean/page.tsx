import { listAntreanKirimQc } from "@/services/penerimaan-qc";
import { AntreanQcPageClient } from "./_components/AntreanQcPageClient";

export default async function AntreanQcPage() {
  const data = await listAntreanKirimQc();
  return <AntreanQcPageClient initialData={data} />;
}
