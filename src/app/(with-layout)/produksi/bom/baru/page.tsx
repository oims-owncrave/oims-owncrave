import { Metadata } from "next";
import { listProduk } from "@/services/produk";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { BomForm } from "../_components/BomForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buat BOM | OIMS Owncrave",
};

export default async function BomBaruPage() {
  await requireRole(["owner", "admin_produksi"]);

  const [produkOptions, bahanOptions] = await Promise.all([
    listProduk(),
    listBahan(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat BOM"
        breadcrumb={[
          { label: "Produksi" },
          { label: "BOM", href: "/produksi/bom" },
          { label: "Baru" },
        ]}
      />
      <BomForm produkOptions={produkOptions} bahanOptions={bahanOptions} />
    </div>
  );
}
