import { PageHeader } from "@/components/ui/PageHeader";
import { DokumentasiClient } from "./_components/DokumentasiClient";
import { TUTORIAL } from "./_data";

export const metadata = { title: "Dokumentasi — OIMS" };

export default function DokumentasiPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dokumentasi" breadcrumb={[{ label: "Dokumentasi" }]} />
      <DokumentasiClient tutorial={TUTORIAL} />
    </div>
  );
}
