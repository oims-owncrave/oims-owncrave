import { Metadata } from "next";
import { listPoSiapCutting } from "@/services/wo-cutting";
import { listPicOptions } from "@/services/po-produksi";
import { requireRole } from "@/lib/auth";
import { WoForm } from "../_components/WoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buat WO Cutting | OIMS Owncrave",
};

export default async function WoBaruPage() {
  await requireRole(["owner", "admin_produksi"]);

  const [poOptions, picOptions] = await Promise.all([
    listPoSiapCutting(),
    listPicOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Work Order Cutting"
        breadcrumb={[
          { label: "Produksi" },
          { label: "Cutting", href: "/produksi/cutting" },
          { label: "Baru" },
        ]}
      />
      <WoForm poOptions={poOptions} picOptions={picOptions} />
    </div>
  );
}
