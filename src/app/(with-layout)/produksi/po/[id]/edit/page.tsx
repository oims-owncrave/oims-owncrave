import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPoDetail, listPicOptions } from "@/services/po-produksi";
import { listProduk } from "@/services/produk";
import { requireRole } from "@/lib/auth";
import { PoForm } from "../../_components/PoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Edit PO Produksi | OIMS Owncrave",
};

function toDateInput(d: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function PoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  const { id } = await params;
  const detail = await getPoDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/produksi/po/${id}`);

  const [produkOptions, picOptions] = await Promise.all([
    listProduk(),
    listPicOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[
          { label: "Produksi" },
          { label: "PO Produksi", href: "/produksi/po" },
          { label: detail.nomorDokumen, href: `/produksi/po/${id}` },
          { label: "Edit" },
        ]}
      />
      <PoForm
        produkOptions={produkOptions}
        picOptions={picOptions}
        editId={id}
        defaultValues={{
          produkId: detail.produkId,
          tanggal: toDateInput(detail.tanggal),
          tanggalMulai: toDateInput(detail.tanggalMulai),
          targetSelesai: toDateInput(detail.targetSelesai),
          prioritas: (["rendah", "normal", "tinggi", "urgent"].includes(detail.prioritas)
            ? detail.prioritas
            : "normal") as "rendah" | "normal" | "tinggi" | "urgent",
          jenis: detail.jenis,
          penanggungJawab: detail.penanggungJawab ?? "",
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            varianId: d.varianId,
            jumlahTarget: d.jumlahTarget,
            lebihanPcs: d.lebihanPcs,
          })),
        }}
      />
    </div>
  );
}
