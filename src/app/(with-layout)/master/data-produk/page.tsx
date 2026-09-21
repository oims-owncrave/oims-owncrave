import type { Metadata } from "next";
import { getCurrentUser, opsional } from "@/lib/auth";
import { listProduk } from "@/services/produk";
import { listBom } from "@/services/bom";
import { listKemasan } from "@/services/kemasan";
import { listGudangBarangJadi } from "@/services/gudang-barang-jadi";
import { DataProdukPageClient } from "./_components/DataProdukPageClient";

export const metadata: Metadata = {
  title: "Data Produk | OIMS Owncrave",
};

export default async function DataProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const role = user?.role ?? "viewer";
  const { tab } = await searchParams;

  const [produkList, bomList, kemasanList, gudangList] = await Promise.all([
    listProduk(),
    opsional(listBom(), []),
    listKemasan(),
    listGudangBarangJadi(),
  ]);

  return (
    <DataProdukPageClient
      initialProduk={produkList}
      initialBom={bomList}
      initialKemasan={kemasanList}
      initialGudang={gudangList}
      initialTab={tab}
      role={role}
    />
  );
}
