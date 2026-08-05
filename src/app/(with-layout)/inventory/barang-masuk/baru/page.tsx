import { Metadata } from "next";
import { listBahan } from "@/services/bahan";
import { listSupplier } from "@/services/supplier";
import { requireRole } from "@/lib/auth";
import { BarangMasukForm } from "../_components/BarangMasukForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Barang Masuk Baru | OIMS Owncrave",
};

export default async function BarangMasukBaruPage() {
  await requireRole(["owner", "admin_gudang"]);

  const [bahanOptions, supplierOptions] = await Promise.all([
    listBahan(),
    listSupplier(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barang Masuk Baru"
        breadcrumb={[
          { label: "Inventory", href: "/inventory/barang-masuk" },
          { label: "Barang Masuk", href: "/inventory/barang-masuk" },
          { label: "Baru" },
        ]}
      />
      <BarangMasukForm
        bahanOptions={bahanOptions}
        supplierOptions={supplierOptions}
      />
    </div>
  );
}
