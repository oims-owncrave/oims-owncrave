import { requireRole } from "@/lib/auth";
import { listPenugasanBisaTerima, listReturMenungguKembali } from "@/services/penerimaan-hasil-jahit";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import { listUserOptions } from "@/services/user";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenerimaanForm } from "../_components/PenerimaanForm";

export default async function PenerimaanBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ penugasan?: string; retur?: string }>;
}) {
  await requireRole(["owner", "admin_gudang", "admin_produksi"]);
  const { penugasan, retur } = await searchParams;
  const [penugasanOptions, returOptions, lokasiList, userOptions] = await Promise.all([
    listPenugasanBisaTerima(),
    listReturMenungguKembali(),
    listLokasiProduksi(),
    listUserOptions(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title={retur ? "Terima Hasil Perbaikan" : "Catat Penerimaan Hasil"}
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Penerimaan Hasil", href: "/vendor/penerimaan" }, { label: "Baru" }]}
      />
      <PenerimaanForm
        penugasanOptions={penugasanOptions}
        returOptions={returOptions}
        lokasiList={lokasiList}
        userOptions={userOptions}
        initialPenugasanId={penugasan ?? ""}
        initialReturId={retur ?? ""}
      />
    </div>
  );
}
