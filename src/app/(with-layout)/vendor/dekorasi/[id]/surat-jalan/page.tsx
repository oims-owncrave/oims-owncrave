import { notFound } from "next/navigation";
import { getPekerjaanDekorasiDetail } from "@/services/dekorasi";
import { SuratJalanDekorasiClient } from "./_components/SuratJalanDekorasiClient";

export default async function SuratJalanDekorasiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPekerjaanDekorasiDetail(id);
  if (!detail || !detail.sjNomor) notFound();
  return <SuratJalanDekorasiClient data={detail} />;
}
