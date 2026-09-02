import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPermintaanDetail } from "@/services/permintaan-bahan";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { PbForm } from "../../_components/PbForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Edit Permintaan Bahan | OIMS Owncrave",
};

function toDateInput(d: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function PbEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  const { id } = await params;
  const detail = await getPermintaanDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/produksi/permintaan-bahan/${id}`);

  const bahanOptions = await listBahan();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[
          { label: "Produksi" },
          { label: "Permintaan Bahan", href: "/produksi/permintaan-bahan" },
          { label: detail.nomorDokumen, href: `/produksi/permintaan-bahan/${id}` },
          { label: "Edit" },
        ]}
      />
      <PbForm
        poLabel={`${detail.poNomor} — ${detail.produkNama}`}
        bahanOptions={bahanOptions}
        editId={id}
        defaultValues={{
          poId: detail.poId,
          tanggal: toDateInput(detail.tanggal),
          tanggalDibutuhkan: toDateInput(detail.tanggalDibutuhkan),
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            bahanId: d.bahanId,
            kebutuhan: Number(d.kebutuhan),
            jumlahDiminta: Number(d.jumlahDiminta),
          })),
        }}
      />
    </div>
  );
}
