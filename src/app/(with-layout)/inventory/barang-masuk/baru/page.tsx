import { Metadata } from "next";
import { listBahan } from "@/services/bahan";
import { listSupplier } from "@/services/supplier";
import { requireRole } from "@/lib/auth";
import { BarangMasukForm } from "../_components/BarangMasukForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Barang Masuk Baru
        </h2>
        <Breadcrumb
          items={[
            { label: "Inventory", href: "/inventory/barang-masuk" },
            { label: "Barang Masuk", href: "/inventory/barang-masuk" },
            { label: "Baru" },
          ]}
        />
      </div>
      <BarangMasukForm
        bahanOptions={bahanOptions}
        supplierOptions={supplierOptions}
      />
    </div>
  );
}
