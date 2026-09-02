import { notFound } from "next/navigation";
import { getBomDetail } from "@/services/bom";
import { BomDetailClient } from "./_components/BomDetailClient";

export default async function BomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getBomDetail(id);
  if (!detail) notFound();

  return <BomDetailClient bomId={id} initialData={detail} />;
}
