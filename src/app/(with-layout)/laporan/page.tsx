import type { Metadata } from "next";
import {
  getLaporanBarangMasuk,
  getLaporanBarangKeluar,
  getLaporanStok,
  getLaporanNilaiPersediaan,
} from "@/services/laporan";
import { listKategoriForFilter } from "@/services/stok";
import { listMutasi, listBahanForMutasiFilter } from "@/services/mutasi";
import { LaporanPageClient } from "./_components/LaporanPageClient";

export const metadata: Metadata = {
  title: "Laporan | OIMS Owncrave",
};

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "barang-masuk";

  const [kategoriOptions, bahanOptions] = await Promise.all([
    listKategoriForFilter(),
    listBahanForMutasiFilter(),
  ]);

  let initialBarangMasuk;
  let initialBarangKeluar;
  let initialStok;
  let initialNilaiPersediaan;
  let initialMutasi;

  if (activeTab === "barang-masuk") {
    initialBarangMasuk = await getLaporanBarangMasuk();
  } else if (activeTab === "barang-keluar") {
    initialBarangKeluar = await getLaporanBarangKeluar();
  } else if (activeTab === "stok") {
    initialStok = await getLaporanStok();
  } else if (activeTab === "nilai-persediaan") {
    initialNilaiPersediaan = await getLaporanNilaiPersediaan();
  } else if (activeTab === "mutasi") {
    initialMutasi = await listMutasi();
  }

  return (
    <LaporanPageClient
      initialTab={tab}
      initialBarangMasuk={initialBarangMasuk}
      initialBarangKeluar={initialBarangKeluar}
      initialStok={initialStok}
      initialNilaiPersediaan={initialNilaiPersediaan}
      initialMutasi={initialMutasi}
      kategoriOptions={kategoriOptions}
      bahanOptions={bahanOptions}
    />
  );
}
