import { notFound } from "next/navigation";
import { getPengirimanDetail } from "@/services/pengiriman-jahit";
import { SuratJalanClient } from "./_components/SuratJalanClient";

export default async function SuratJalanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPengirimanDetail(id);
  if (!detail || !detail.sjNomor) notFound();
  return <SuratJalanClient data={detail} />;
}
