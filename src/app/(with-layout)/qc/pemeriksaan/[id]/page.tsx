import { notFound } from "next/navigation";
import { getHasilQcDetail } from "@/services/hasil-qc";
import { listJenisCacat } from "@/services/jenis-cacat";
import { HasilQcDetailView } from "../_components/HasilQcDetailView";

export default async function HasilQcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, cacatList] = await Promise.all([getHasilQcDetail(id), listJenisCacat()]);
  if (!data) notFound();

  return (
    <HasilQcDetailView header={data.header} details={data.details} cacatOptions={cacatList} />
  );
}
