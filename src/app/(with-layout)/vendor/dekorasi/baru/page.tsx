import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listWoBisaDekorasi, listVendorDekorasi } from "@/services/dekorasi";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { PageHeader } from "@/components/ui/PageHeader";
import { DekorasiForm } from "../_components/DekorasiForm";

export default async function DekorasiBaruPage() {
  if (!(await bolehAkses(["owner", "admin_produksi"]))) return <AksesDitolak />;
  const [woOptions, vendorList, lokasiList] = await Promise.all([
    listWoBisaDekorasi(),
    listVendorDekorasi(),
    listLokasiProduksi(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Pekerjaan Dekorasi"
        breadcrumb={[{ label: "Sablon & Bordir" }, { label: "Pekerjaan Dekorasi", href: "/vendor/dekorasi" }, { label: "Baru" }]}
      />
      <DekorasiForm woOptions={woOptions} vendorList={vendorList} lokasiList={lokasiList} />
    </div>
  );
}
