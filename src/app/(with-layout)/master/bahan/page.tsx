import { listBahan } from "@/services/bahan";
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

  const [data, kategoriOptions, satuanOptions] = await Promise.all([
    listBahan(),
    listKategori(),
    listSatuan(),
  ]);

  return (
    <BahanPageClient
      initialData={data}
      kategoriOptions={kategoriOptions}
      satuanOptions={satuanOptions}
    />
  );
}
