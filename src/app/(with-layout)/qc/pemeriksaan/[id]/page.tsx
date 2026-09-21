import { notFound } from "next/navigation";
import { getHasilQcDetail } from "@/services/hasil-qc";
import { listJenisCacat } from "@/services/jenis-cacat";
import { listBagianProduk } from "@/services/bagian-produk";
import { HasilQcDetailView } from "../_components/HasilQcDetailView";

export default async function HasilQcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, cacatList, bagianList] = await Promise.all([
    getHasilQcDetail(id),
    listJenisCacat(),
    listBagianProduk(),
  ]);
  if (!data) notFound();

  return (
    <HasilQcDetailView
      header={data.header}
      details={data.details}
      cacatOptions={cacatList}
      bagianProdukOptions={bagianList}
    />
  );
}
