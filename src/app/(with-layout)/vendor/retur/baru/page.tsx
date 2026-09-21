import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listPenerimaanPunyaRusak } from "@/services/retur-jahit";
import { listJenisCacat } from "@/services/jenis-cacat";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReturForm } from "../_components/ReturForm";

export default async function ReturBaruPage({ searchParams }: { searchParams: Promise<{ penerimaan?: string }> }) {
  if (!(await bolehAkses(["owner", "admin_gudang", "admin_produksi"]))) return <AksesDitolak />;
  const { penerimaan } = await searchParams;
  const [penerimaanOptions, jenisCacatOptions] = await Promise.all([
    listPenerimaanPunyaRusak(),
    listJenisCacat(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Retur Perbaikan"
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Retur & Perbaikan", href: "/vendor/retur" }, { label: "Baru" }]}
      />
      <ReturForm
        penerimaanOptions={penerimaanOptions}
        jenisCacatOptions={jenisCacatOptions}
        initialPenerimaanId={penerimaan ?? ""}
      />
    </div>
  );
}
