import { listSatuan } from "@/services/satuan";
import { SatuanPageClient } from "./_components/SatuanPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Satuan | OIMS Owncrave",
};

export default async function MasterSatuanPage() {
  const data = await listSatuan();
  return <SatuanPageClient initialData={data} />;
}
