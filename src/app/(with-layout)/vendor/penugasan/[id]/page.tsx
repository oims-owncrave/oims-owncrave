import { notFound } from "next/navigation";
import { getPenugasanDetail } from "@/services/penugasan-jahit";
import { PenugasanDetailClient } from "./_components/PenugasanDetailClient";

export default async function PenugasanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPenugasanDetail(id);
  if (!detail) notFound();
  return <PenugasanDetailClient id={id} initialData={detail} />;
}
