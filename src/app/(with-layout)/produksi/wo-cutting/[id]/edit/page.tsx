import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getWoDetail, listPoSiapCutting } from "@/services/wo-cutting";
import { listPicOptions } from "@/services/po-produksi";
import { requireRole } from "@/lib/auth";
import { WoForm } from "../../_components/WoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Edit WO Cutting | OIMS Owncrave",
};

export default async function WoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  const { id } = await params;
  const detail = await getWoDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/produksi/wo-cutting/${id}`);

  const [poOptions, picOptions] = await Promise.all([
    listPoSiapCutting(),
    listPicOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[
          { label: "Produksi" },
          { label: "Cutting", href: "/produksi/cutting" },
          { label: detail.nomorDokumen, href: `/produksi/wo-cutting/${id}` },
          { label: "Edit" },
        ]}
      />
      <WoForm
        poOptions={poOptions}
        picOptions={picOptions}
        editId={id}
        defaultValues={{
          poId: detail.poId,
          tanggal: new Date(detail.tanggal).toISOString().slice(0, 10),
          pic: detail.pic ?? "",
          mejaCutting: detail.mejaCutting ?? "",
          prioritas: (["rendah", "normal", "tinggi", "urgent"].includes(detail.prioritas)
            ? detail.prioritas
            : "normal") as "rendah" | "normal" | "tinggi" | "urgent",
          jumlahLayer: detail.jumlahLayer ?? NaN,
          panjangMarker: detail.panjangMarker !== null ? Number(detail.panjangMarker) : NaN,
          lebarKain: detail.lebarKain !== null ? Number(detail.lebarKain) : NaN,
          nomorPola: detail.nomorPola ?? "",
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            varianId: d.varianId,
            targetCutting: d.targetCutting,
          })),
        }}
      />
    </div>
  );
}
