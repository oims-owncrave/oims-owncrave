import { requireRole } from "@/lib/auth";
import { listPoSiapJahit } from "@/services/penugasan-jahit";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenugasanForm } from "../_components/PenugasanForm";

export default async function PenugasanBaruPage() {
  await requireRole(["owner", "admin_produksi"]);
  const [poOptions, vendorList, penjahitList, lokasiList] = await Promise.all([
    listPoSiapJahit(),
    listVendor(),
    listPenjahit(),
    listLokasiProduksi(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Penugasan Jahit"
        breadcrumb={[
          { label: "Vendor & Gudang" },
          { label: "Penugasan Jahit", href: "/vendor/penugasan" },
          { label: "Baru" },
        ]}
      />
      <PenugasanForm
        poOptions={poOptions}
        vendorList={vendorList}
        penjahitList={penjahitList}
        lokasiList={lokasiList}
      />
    </div>
  );
}
