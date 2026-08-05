import { PageHeader } from "@/components/ui/PageHeader";
import { PengaturanClient } from "./_components/PengaturanClient";

export const metadata = { title: "Pengaturan — OIMS" };

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        breadcrumb={[{ label: "Sistem" }, { label: "Pengaturan" }]}
      />
      <PengaturanClient />
    </div>
  );
}
