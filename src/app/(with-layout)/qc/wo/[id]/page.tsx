import { notFound } from "next/navigation";
import { getWoQcDetail } from "@/services/wo-qc";
import { WoQcDetailView } from "../_components/WoQcDetailView";

export default async function WoQcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWoQcDetail(id);
  if (!data) notFound();

  return <WoQcDetailView header={data.header} details={data.details} />;
}
