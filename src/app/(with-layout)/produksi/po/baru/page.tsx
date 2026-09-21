import { Metadata } from "next";
import { listProduk } from "@/services/produk";
import { listPicOptions } from "@/services/po-produksi";
import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { PoForm } from "../_components/PoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buat PO Produksi | OIMS Owncrave",
};

export default async function PoBaruPage() {
  if (!(await bolehAkses(["owner", "admin_produksi"]))) return <AksesDitolak />;

  const [produkOptions, picOptions] = await Promise.all([
    listProduk(),
    listPicOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat PO Produksi"
        breadcrumb={[
          { label: "Produksi" },
          { label: "PO Produksi", href: "/produksi/po" },
          { label: "Baru" },
        ]}
      />
      <PoForm produkOptions={produkOptions} picOptions={picOptions} />
    </div>
  );
}
