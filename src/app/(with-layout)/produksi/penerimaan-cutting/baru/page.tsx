import { Metadata } from "next";
import { listBkSiapTerima } from "@/services/penerimaan-cutting";
import { requireRole } from "@/lib/auth";
import { PenerimaanForm } from "../_components/PenerimaanForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Catat Penerimaan Cutting | OIMS Owncrave",
};

export default async function PenerimaanBaruPage() {
  await requireRole(["owner", "admin_produksi"]);

  const bkOptions = await listBkSiapTerima();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catat Penerimaan Cutting"
        breadcrumb={[
          { label: "Produksi" },
          { label: "Cutting", href: "/produksi/cutting" },
          { label: "Baru" },
        ]}
      />
      <PenerimaanForm bkOptions={bkOptions} />
    </div>
  );
}
