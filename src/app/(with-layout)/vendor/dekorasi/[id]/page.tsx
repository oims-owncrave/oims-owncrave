import { notFound } from "next/navigation";
import { getPekerjaanDekorasiDetail } from "@/services/dekorasi";
import { DekorasiDetailClient } from "./_components/DekorasiDetailClient";

export default async function DekorasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPekerjaanDekorasiDetail(id);
  if (!detail) notFound();
  return <DekorasiDetailClient id={id} initialData={detail} />;
}
