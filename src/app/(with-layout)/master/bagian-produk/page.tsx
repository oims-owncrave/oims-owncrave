import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listBagianProduk } from "@/services/bagian-produk";
import { BagianProdukPageClient } from "./_components/BagianProdukPageClient";

export default async function MasterBagianProdukPage() {
  if (!(await bolehAkses(["owner", "admin_produksi"]))) return <AksesDitolak />;

  const data = await listBagianProduk();
  return <BagianProdukPageClient initialData={data} />;
}
