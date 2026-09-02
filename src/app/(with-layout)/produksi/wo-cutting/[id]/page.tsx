import { notFound } from "next/navigation";
import { getWoDetail } from "@/services/wo-cutting";
import { WoDetailClient } from "./_components/WoDetailClient";

export default async function WoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getWoDetail(id);
  if (!detail) notFound();

  return <WoDetailClient woId={id} initialData={detail} />;
}
