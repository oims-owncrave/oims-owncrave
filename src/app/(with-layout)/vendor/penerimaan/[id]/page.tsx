import { notFound } from "next/navigation";
import { getPenerimaanHasilDetail } from "@/services/penerimaan-hasil-jahit";
import { PenerimaanDetailClient } from "./_components/PenerimaanDetailClient";

export default async function PenerimaanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPenerimaanHasilDetail(id);
  if (!detail) notFound();
  return <PenerimaanDetailClient id={id} initialData={detail} />;
}
