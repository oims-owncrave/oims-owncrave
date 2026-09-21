import type { Metadata } from "next";
import { listKategori } from "@/services/kategori";
import { listSatuan } from "@/services/satuan";
import { listWarna } from "@/services/warna";
import { listBahan } from "@/services/bahan";
import { DataBahanPageClient } from "./_components/DataBahanPageClient";

export const metadata: Metadata = {
  title: "Data Bahan | OIMS Owncrave",
};

export default async function DataBahanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [kategoriList, satuanList, warnaList, bahanList] = await Promise.all([
    listKategori(),
    listSatuan(),
    listWarna(),
    listBahan(),
  ]);

  return (
    <DataBahanPageClient
      initialKategori={kategoriList}
      initialSatuan={satuanList}
      initialWarna={warnaList}
      initialBahan={bahanList}
      initialTab={tab}
    />
  );
}
