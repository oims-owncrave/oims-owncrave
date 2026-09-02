import { notFound } from "next/navigation";
import { getPoDetail } from "@/services/po-produksi";
import { PoDetailClient } from "./_components/PoDetailClient";

export default async function PoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPoDetail(id);
  if (!detail) notFound();

  return <PoDetailClient poId={id} initialData={detail} />;
}
