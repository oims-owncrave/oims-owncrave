import { Metadata } from "next";
import { listBahanForPenyesuaian } from "@/services/penyesuaian";
import { requireRole } from "@/lib/auth";
import { PenyesuaianForm } from "../_components/PenyesuaianForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Penyesuaian Stok Baru | OIMS Owncrave",
};

export default async function PenyesuaianBaruPage() {
  await requireRole(["owner", "admin_gudang"]);
  const bahanOptions = await listBahanForPenyesuaian();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajukan Penyesuaian Stok"
        breadcrumb={[
          { label: "Inventory", href: "/inventory/penyesuaian" },
          { label: "Penyesuaian Stok", href: "/inventory/penyesuaian" },
          { label: "Baru" },
        ]}
      />
      <PenyesuaianForm bahanOptions={bahanOptions} />
    </div>
  );
}
