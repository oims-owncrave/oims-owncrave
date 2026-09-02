import { requireRole } from "@/lib/auth";
import { listPenerimaanPunyaRusak } from "@/services/retur-jahit";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReturForm } from "../_components/ReturForm";

export default async function ReturBaruPage({ searchParams }: { searchParams: Promise<{ penerimaan?: string }> }) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const { penerimaan } = await searchParams;
  const penerimaanOptions = await listPenerimaanPunyaRusak();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Retur Perbaikan"
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Retur & Perbaikan", href: "/vendor/retur" }, { label: "Baru" }]}
      />
      <ReturForm penerimaanOptions={penerimaanOptions} initialPenerimaanId={penerimaan ?? ""} />
    </div>
  );
}
