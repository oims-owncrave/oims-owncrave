import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getPenugasanDetail, listPoSiapJahit } from "@/services/penugasan-jahit";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenugasanForm } from "../../_components/PenugasanForm";

export default async function PenugasanEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["owner", "admin_produksi"]);
  const { id } = await params;
  const detail = await getPenugasanDetail(id);
  if (!detail) notFound();
  if (detail.status !== "draft") redirect(`/vendor/penugasan/${id}`);

  const [poOptions, vendorList, penjahitList, lokasiList] = await Promise.all([
    listPoSiapJahit(),
    listVendor(),
    listPenjahit(),
    listLokasiProduksi(),
  ]);
  // PO penugasan ini mungkin sudah tak punya bundel bebas lain — tetap tampilkan
  const poAll = poOptions.some((p) => p.id === detail.poId)
    ? poOptions
    : [{ id: detail.poId, nomorDokumen: detail.poNomor, produkId: detail.produkId, produkNama: detail.produkNama }, ...poOptions];

  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.nomorDokumen}`}
        breadcrumb={[
          { label: "Vendor & Gudang" },
          { label: "Penugasan Jahit", href: "/vendor/penugasan" },
          { label: detail.nomorDokumen, href: `/vendor/penugasan/${id}` },
          { label: "Edit" },
        ]}
      />
      <PenugasanForm
        poOptions={poAll}
        vendorList={vendorList}
        penjahitList={penjahitList}
        lokasiList={lokasiList}
        editId={id}
        defaultValues={{
          poId: detail.poId,
          tanggal: iso(detail.tanggal),
          pihak: detail.vendorId ? "vendor" : "penjahit",
          vendorId: detail.vendorId,
          penjahitId: detail.penjahitId,
          lokasiTujuanId: detail.lokasiTujuanId,
          jenisPekerjaan: detail.jenisPekerjaan,
          rencanaKirim: iso(detail.rencanaKirim),
          targetSelesai: iso(detail.targetSelesai),
          prioritas: detail.prioritas as "rendah" | "normal" | "tinggi" | "urgent",
          catatan: detail.catatan ?? "",
          details: detail.details.map((d) => ({
            bundlingId: d.bundlingId,
            tarif: Number(d.tarifSnapshot),
            dasarTarif: d.dasarTarif,
          })),
        }}
      />
    </div>
  );
}
