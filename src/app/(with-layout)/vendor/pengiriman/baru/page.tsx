import { requireRole } from "@/lib/auth";
import { listPenugasanBisaDikirim } from "@/services/penugasan-jahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { PageHeader } from "@/components/ui/PageHeader";
import { PengirimanForm } from "../_components/PengirimanForm";

export default async function PengirimanBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ penugasan?: string }>;
}) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const { penugasan } = await searchParams;
  const [penugasanOptions, lokasiList] = await Promise.all([
    listPenugasanBisaDikirim(),
    listLokasiProduksi(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Pengiriman"
        breadcrumb={[
          { label: "Vendor & Gudang" },
          { label: "Pengiriman Vendor", href: "/vendor/pengiriman" },
          { label: "Baru" },
        ]}
      />
      <PengirimanForm
        penugasanOptions={penugasanOptions}
        lokasiList={lokasiList}
        initialPenugasanId={penugasan ?? ""}
      />
    </div>
  );
}
