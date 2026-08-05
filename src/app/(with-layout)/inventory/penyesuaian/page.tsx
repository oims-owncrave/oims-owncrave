import { Metadata } from "next";
import { listPenyesuaian } from "@/services/penyesuaian";
import { PenyesuaianPageClient } from "./_components/PenyesuaianPageClient";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Penyesuaian Stok
        </h2>
        <Breadcrumb
          items={[{ label: "Inventory" }, { label: "Penyesuaian Stok" }]}
        />
      </div>
      <PenyesuaianPageClient initialData={data} isOwner={isOwner} />
    </div>
  );
}
