import { Metadata } from "next";
import { listPenyesuaian } from "@/services/penyesuaian";
import { PenyesuaianPageClient } from "./_components/PenyesuaianPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Penyesuaian Stok | OIMS Owncrave",
};

export default async function PenyesuaianPage() {
  const [data, user] = await Promise.all([
    listPenyesuaian(),
    getCurrentUser(),
  ]);

  const isOwner = user?.role === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penyesuaian Stok"
        breadcrumb={[{ label: "Inventory" }, { label: "Penyesuaian Stok" }]}
      />
      <PenyesuaianPageClient initialData={data} isOwner={isOwner} />
    </div>
  );
}
