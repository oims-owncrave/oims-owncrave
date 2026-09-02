import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPoDetail, getEstimasiBahan } from "@/services/po-produksi";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { PbForm } from "../_components/PbForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buat Permintaan Bahan | OIMS Owncrave",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function PbBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ po?: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  const { po } = await searchParams;
  if (!po) redirect("/produksi/po"); // permintaan selalu dibuat dari PO

  const poDetail = await getPoDetail(po);
  if (!poDetail) redirect("/produksi/po");

  const [bahanOptions, estimasi] = await Promise.all([
    listBahan(),
    getEstimasiBahan(po),
  ]);

  // prefill: bahan yang kekurangan > 0 (jumlahDiminta = kekurangan)
  const prefill =
    "rows" in estimasi
      ? estimasi.rows
          .filter((r) => r.kekurangan > 0)
          .map((r) => ({
            bahanId: r.bahanId,
            kebutuhan: Math.round(r.totalKebutuhan * 1000) / 1000,
            jumlahDiminta: Math.round(r.kekurangan * 1000) / 1000,
          }))
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Permintaan Bahan"
        breadcrumb={[
          { label: "Produksi" },
          { label: "Permintaan Bahan", href: "/produksi/permintaan-bahan" },
          { label: "Baru" },
        ]}
      />
      <PbForm
        poLabel={`${poDetail.nomorDokumen} — ${poDetail.produkNama}`}
        bahanOptions={bahanOptions}
        defaultValues={{
          poId: po,
          tanggal: todayISO(),
          tanggalDibutuhkan: "",
          catatan: "",
          details: prefill.length > 0 ? prefill : [{ bahanId: "", kebutuhan: 0, jumlahDiminta: 0 }],
        }}
      />
    </div>
  );
}
