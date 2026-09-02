import { listProduk } from "@/services/produk";
import { ProdukPageClient } from "./_components/ProdukPageClient";

export default async function MasterProdukPage() {
  const data = await listProduk();
  return <ProdukPageClient initialData={data} />;
}
