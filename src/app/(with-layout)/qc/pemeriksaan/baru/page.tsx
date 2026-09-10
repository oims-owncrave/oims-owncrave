import { notFound } from "next/navigation";
import { getWoQcDetail, listWoQc } from "@/services/wo-qc";
import { listUsers } from "@/services/user";
import { HasilQcForm } from "../_components/HasilQcForm";
import { PilihWoQc } from "../_components/PilihWoQc";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function HasilQcBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ wo?: string }>;
}) {
  const { wo } = await searchParams;

  // tanpa ?wo= tampilkan daftar WO berjalan untuk dipilih
  if (!wo) {
    const list = await listWoQc();
    return (
      <div className="space-y-6">
        <PageHeader
          title="Catat Hasil QC"
          breadcrumb={[
            { label: "Quality Control" },
            { label: "Pemeriksaan QC", href: "/qc/pemeriksaan" },
            { label: "Pilih WO" },
          ]}
        />
        <PilihWoQc data={list.filter((w) => w.status === "berjalan")} />
      </div>
    );
  }

  const [data, userList] = await Promise.all([getWoQcDetail(wo), listUsers()]);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Catat Hasil QC — ${data.header.nomorDokumen}`}
        breadcrumb={[
          { label: "Quality Control" },
          { label: "Pemeriksaan QC", href: "/qc/pemeriksaan" },
          { label: "Catat Hasil" },
        ]}
      />
      <HasilQcForm wo={data.header} baris={data.details} userOptions={userList} />
    </div>
  );
}
