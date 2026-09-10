import { listProduk } from "@/services/produk";
import { listKategori } from "@/services/kategori";
import { listJenisCacat } from "@/services/jenis-cacat";
import { StandarQcForm } from "../_components/StandarQcForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function StandarQcBaruPage() {
  const [produkList, kategoriList, cacatList] = await Promise.all([
    listProduk(),
    listKategori(),
    listJenisCacat(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Standar QC"
        breadcrumb={[
          { label: "Master" },
          { label: "Standar QC", href: "/qc/standar" },
          { label: "Tambah" },
        ]}
      />
      <StandarQcForm
        produkOptions={produkList}
        kategoriOptions={kategoriList}
        cacatOptions={cacatList}
      />
    </div>
  );
}
