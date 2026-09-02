import { listPenjahit } from "@/services/penjahit";
import { listVendor } from "@/services/vendor";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { listProduk } from "@/services/produk";
import { PenjahitPageClient } from "./_components/PenjahitPageClient";

export default async function PenjahitPage() {
  const [data, vendorList, lokasiList, produkList] = await Promise.all([
    listPenjahit(),
    listVendor(),
    listLokasiProduksi(),
    listProduk(),
  ]);
  return (
    <PenjahitPageClient
      initialData={data}
      vendorList={vendorList}
      lokasiList={lokasiList}
      produkList={produkList}
    />
  );
}
