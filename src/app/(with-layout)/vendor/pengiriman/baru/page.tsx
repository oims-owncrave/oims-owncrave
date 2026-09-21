import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listPenugasanBisaDikirim } from "@/services/penugasan-jahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { listUserOptions } from "@/services/user";
import { PageHeader } from "@/components/ui/PageHeader";
import { PengirimanForm } from "../_components/PengirimanForm";

export default async function PengirimanBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ penugasan?: string }>;
}) {
  if (!(await bolehAkses(["owner", "admin_gudang", "admin_produksi"]))) return <AksesDitolak />;
  const { penugasan } = await searchParams;
  const [penugasanOptions, lokasiList, userOptions] = await Promise.all([
    listPenugasanBisaDikirim(),
    listLokasiProduksi(),
    listUserOptions(),
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
        userOptions={userOptions}
        initialPenugasanId={penugasan ?? ""}
      />
    </div>
  );
}
