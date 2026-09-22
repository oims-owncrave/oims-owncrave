import type { Metadata } from "next";
import { getCurrentUser, opsional } from "@/lib/auth";
import { listSupplier } from "@/services/supplier";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { listTarifJasaJahit } from "@/services/tarif-jasa-jahit";
import { listProduk } from "@/services/produk";
import { listKontakVendor } from "@/services/kontak-vendor";
import { DataMitraPageClient } from "./_components/DataMitraPageClient";

export const metadata: Metadata = {
  title: "Data Mitra | OIMS Owncrave",
};

export default async function DataMitraPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const role = user?.role ?? "viewer";
  const { tab } = await searchParams;

  const [supplierList, vendorList, penjahitList, lokasiList, tarifList, produkList, kontakList] =
    await Promise.all([
      listSupplier(),
      listVendor(),
      listPenjahit(),
      listLokasiProduksi(),
      opsional(listTarifJasaJahit(), []),
      listProduk(),
      listKontakVendor(),
    ]);

  return (
    <DataMitraPageClient
      initialSupplier={supplierList}
      initialVendor={vendorList}
      initialPenjahit={penjahitList}
      initialLokasi={lokasiList}
      initialTarif={tarifList}
      initialKontak={kontakList}
      produkList={produkList}
      initialTab={tab}
      role={role}
    />
  );
}
