import { listGudangBarangJadi } from "@/services/gudang-barang-jadi";
import { GudangJadiPageClient } from "./_components/GudangJadiPageClient";

export default async function MasterGudangJadiPage() {
  const data = await listGudangBarangJadi();
  return <GudangJadiPageClient initialData={data} />;
}
