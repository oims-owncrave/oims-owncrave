import { notFound } from "next/navigation";
import { getProdukDetail } from "@/services/varian-produk";
import { ProdukDetailClient } from "./_components/ProdukDetailClient";

export default async function ProdukDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProdukDetail(id);
  if (!detail) notFound();

  return <ProdukDetailClient produkId={id} initialData={detail} />;
}
