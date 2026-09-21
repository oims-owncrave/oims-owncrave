import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBomDetail } from "@/services/bom";
import { listProduk, listUkuranPerProduk } from "@/services/produk";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { BomForm } from "../../_components/BomForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Edit BOM | OIMS Owncrave",
};

export default async function BomEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  const { id } = await params;
  const detail = await getBomDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/produksi/bom/${id}`);

  const [produkOptions, bahanOptions, ukuranPerProduk] = await Promise.all([
    listProduk(),
    listBahan(),
    listUkuranPerProduk(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[
          { label: "Produksi" },
          { label: "BOM", href: "/master/data-produk?tab=bom" },
          { label: detail.nomorDokumen, href: `/produksi/bom/${id}` },
          { label: "Edit" },
        ]}
      />
      <BomForm
        produkOptions={produkOptions}
        bahanOptions={bahanOptions}
        ukuranPerProduk={ukuranPerProduk}
        editId={id}
        defaultValues={{
          produkId: detail.produkId,
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            bahanId: d.bahanId,
            kuantitas: Number(d.kuantitas),
            toleransiPersen: Number(d.toleransiPersen),
            berlakuUkuran: d.berlakuUkuran ?? "",
            keterangan: d.keterangan ?? "",
          })),
        }}
      />
    </div>
  );
}
