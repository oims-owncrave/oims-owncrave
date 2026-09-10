import { listTarifJasaJahit } from "@/services/tarif-jasa-jahit";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { listProduk } from "@/services/produk";
import { TarifPageClient } from "./_components/TarifPageClient";

export default async function TarifJasaJahitPage() {
  const [data, vendorList, penjahitList, produkList] = await Promise.all([
    listTarifJasaJahit(),
    listVendor(),
    listPenjahit(),
    listProduk(),
  ]);
  return (
    <TarifPageClient
      initialData={data}
      vendorList={vendorList}
      penjahitList={penjahitList}
      produkList={produkList}
    />
  );
}
