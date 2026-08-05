import { Metadata } from "next";
import { listBahanForPenyesuaian } from "@/services/penyesuaian";
import { requireRole } from "@/lib/auth";
import { PenyesuaianForm } from "../_components/PenyesuaianForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Penyesuaian Stok Baru | OIMS Owncrave",
};

export default async function PenyesuaianBaruPage() {
  await requireRole(["owner", "admin_gudang"]);
  const bahanOptions = await listBahanForPenyesuaian();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Ajukan Penyesuaian Stok
        </h2>
        <Breadcrumb
          items={[
            { label: "Inventory", href: "/inventory/penyesuaian" },
            { label: "Penyesuaian Stok", href: "/inventory/penyesuaian" },
            { label: "Baru" },
          ]}
        />
      </div>
      <PenyesuaianForm bahanOptions={bahanOptions} />
    </div>
  );
}
