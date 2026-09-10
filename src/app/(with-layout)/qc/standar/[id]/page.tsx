import { notFound } from "next/navigation";
import { getStandarQcDetail } from "@/services/standar-qc";
import { StandarQcDetailView } from "../_components/StandarQcDetailView";

export default async function StandarQcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStandarQcDetail(id);
  if (!data) notFound();

  return <StandarQcDetailView header={data.header} details={data.details} />;
}
