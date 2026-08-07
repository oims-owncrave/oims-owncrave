import { Metadata } from "next";
import { listWarna } from "@/services/warna";
import { WarnaPageClient } from "./_components/WarnaPageClient";

export const metadata: Metadata = {
  title: "Master Warna | OIMS Owncrave",
};

export default async function MasterWarnaPage() {
  const data = await listWarna();
  return <WarnaPageClient initialData={data} />;
}
