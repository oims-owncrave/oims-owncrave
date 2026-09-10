import { notFound } from "next/navigation";
import { getReturDetail } from "@/services/retur-jahit";
import { ReturDetailClient } from "./_components/ReturDetailClient";

export default async function ReturDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReturDetail(id);
  if (!detail) notFound();
  return <ReturDetailClient id={id} initialData={detail} />;
}
