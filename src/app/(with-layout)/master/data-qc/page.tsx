import type { Metadata } from "next";
import { getCurrentUser, opsional } from "@/lib/auth";
import { listStandarQc } from "@/services/standar-qc";
import { listJenisCacat } from "@/services/jenis-cacat";
import { listBagianProduk } from "@/services/bagian-produk";
import { DataQcPageClient } from "./_components/DataQcPageClient";

export const metadata: Metadata = {
  title: "Data QC | OIMS Owncrave",
};

export default async function DataQcPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const role = user?.role ?? "viewer";
  const { tab } = await searchParams;

  const [standarList, jenisCacatList, bagianProdukList] = await Promise.all([
    opsional(listStandarQc(), []),
    listJenisCacat(),
    opsional(listBagianProduk(), []),
  ]);

  return (
    <DataQcPageClient
      initialStandar={standarList}
      initialJenisCacat={jenisCacatList}
      initialBagianProduk={bagianProdukList}
      initialTab={tab}
      role={role}
    />
  );
}
