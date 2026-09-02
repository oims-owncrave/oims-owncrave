import { listPermintaan } from "@/services/permintaan-bahan";
import { PbPageClient } from "./_components/PbPageClient";

export default async function PermintaanBahanPage() {
  const data = await listPermintaan();
  return <PbPageClient initialData={data} />;
}
