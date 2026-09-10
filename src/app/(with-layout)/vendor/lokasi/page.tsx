import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { listVendor } from "@/services/vendor";
import { LokasiPageClient } from "./_components/LokasiPageClient";

export default async function LokasiProduksiPage() {
  const [data, vendorList] = await Promise.all([listLokasiProduksi(), listVendor()]);
  return <LokasiPageClient initialData={data} vendorList={vendorList} />;
}
