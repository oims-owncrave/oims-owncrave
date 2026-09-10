import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getReturDetail, listPenerimaanPunyaRusak } from "@/services/retur-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReturForm } from "../../_components/ReturForm";

export default async function ReturEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const { id } = await params;
  const detail = await getReturDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/vendor/retur/${id}`);

  const opts = await listPenerimaanPunyaRusak();
  const penerimaanOptions = opts.some((o) => o.id === detail.penerimaanAsalId)
    ? opts
    : [{ id: detail.penerimaanAsalId!, nomorDokumen: detail.penerimaanAsalNomor ?? "", penugasanId: detail.penugasanId, penugasanNomor: detail.penugasanNomor, pihakNama: detail.pihakNama, tanggalJam: detail.tanggalRetur }, ...opts];
  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Retur & Perbaikan", href: "/vendor/retur" }, { label: detail.nomorDokumen, href: `/vendor/retur/${id}` }, { label: "Edit" }]}
      />
      <ReturForm
        penerimaanOptions={penerimaanOptions}
        initialPenerimaanId={detail.penerimaanAsalId ?? ""}
        editId={id}
        defaultValues={{
          penugasanId: detail.penugasanId,
          penerimaanAsalId: detail.penerimaanAsalId ?? "",
          tanggalRetur: iso(detail.tanggalRetur),
          targetKembali: iso(detail.targetKembali),
          alasan: detail.alasan,
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            penugasanDetailId: d.penugasanDetailId,
            jumlah: d.jumlah,
            jenisKerusakan: d.jenisKerusakan ?? "",
            instruksi: d.instruksi ?? "",
            tarifPerbaikan: Number(d.tarifPerbaikan),
            penanggungBiaya: d.penanggungBiaya,
            fotoUrl: d.fotoUrl ?? "",
          })),
        }}
      />
    </div>
  );
}
