import { listBahan } from "@/services/bahan";
import { listWarna } from "@/services/warna";
import { listKategori } from "@/services/kategori";
import { listSatuan } from "@/services/satuan";
import { BahanPageClient } from "./_components/BahanPageClient";
import { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Master Bahan | OIMS Owncrave",
};

export default async function MasterBahanPage() {
  await requireRole([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]);

  const [data, kategoriOptions, satuanOptions, warnaOptions] = await Promise.all([
    listBahan(),
    listKategori(),
    listSatuan(),
    listWarna(),
  ]);

  return (
    <BahanPageClient
      initialData={data}
      kategoriOptions={kategoriOptions}
      satuanOptions={satuanOptions}
      warnaOptions={warnaOptions}
    />
  );
}
