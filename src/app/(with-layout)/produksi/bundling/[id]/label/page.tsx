import { notFound } from "next/navigation";
import { getBundelLabel } from "@/services/bundling";
import { LabelClient } from "./_components/LabelClient";

export default async function BundelLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const label = await getBundelLabel(id);
  if (!label) notFound();

  return <LabelClient data={label} />;
}
