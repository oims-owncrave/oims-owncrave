import { listHasilQc } from "@/services/hasil-qc";
import { HasilQcPageClient } from "./_components/HasilQcPageClient";

export default async function PemeriksaanQcPage() {
  const data = await listHasilQc();
  return <HasilQcPageClient initialData={data} />;
}
