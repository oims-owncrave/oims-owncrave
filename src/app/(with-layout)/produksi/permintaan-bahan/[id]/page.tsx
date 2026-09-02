import { notFound } from "next/navigation";
import { getPermintaanDetail } from "@/services/permintaan-bahan";
import { PbDetailClient } from "./_components/PbDetailClient";

export default async function PbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPermintaanDetail(id);
  if (!detail) notFound();

  return <PbDetailClient pbId={id} initialData={detail} />;
}
