import { notFound } from "next/navigation";
import { getPengirimanDetail } from "@/services/pengiriman-jahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { PengirimanDetailClient } from "./_components/PengirimanDetailClient";

export default async function PengirimanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, lokasiList] = await Promise.all([getPengirimanDetail(id), listLokasiProduksi()]);
  if (!detail) notFound();
  return <PengirimanDetailClient id={id} initialData={detail} lokasiList={lokasiList} />;
}
