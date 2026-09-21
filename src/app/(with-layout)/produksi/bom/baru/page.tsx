import { Metadata } from "next";
import { listProduk, listUkuranPerProduk } from "@/services/produk";
import { listBahan } from "@/services/bahan";
import { requireRole } from "@/lib/auth";
import { BomForm } from "../_components/BomForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buat BOM | OIMS Owncrave",
};

export default async function BomBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ produk?: string }>;
}) {
  await requireRole(["owner", "admin_produksi"]);

  // ?produk=<id> — jalan pintas dari halaman Produk, produk langsung terpilih
  const { produk } = await searchParams;

  const [produkOptions, bahanOptions, ukuranPerProduk] = await Promise.all([
    listProduk(),
    listBahan(),
    listUkuranPerProduk(),
  ]);

  const awal = produk && produkOptions.some((p) => p.id === produk)
    ? { produkId: produk, catatan: "", details: [{ bahanId: "", kuantitas: 0, toleransiPersen: 0 }] }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat BOM"
        breadcrumb={[
          { label: "Produksi" },
          { label: "BOM", href: "/master/data-produk?tab=bom" },
          { label: "Baru" },
        ]}
      />
      <BomForm
        produkOptions={produkOptions}
        bahanOptions={bahanOptions}
        ukuranPerProduk={ukuranPerProduk}
        defaultValues={awal}
      />
    </div>
  );
}
