import type { Metadata } from "next";
import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listPenerimaanQc, listAntreanKirimQc } from "@/services/penerimaan-qc";
import { PenerimaanQcPageClient } from "./_components/PenerimaanQcPageClient";

export const metadata: Metadata = {
  title: "Penerimaan QC | OIMS Owncrave",
};

export default async function PenerimaanQcPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await bolehAkses(["owner", "admin_gudang", "admin_produksi"]))) {
    return <AksesDitolak />;
  }

  const { tab } = await searchParams;
  const [penerimaanData, antreanData] = await Promise.all([
    listPenerimaanQc(),
    listAntreanKirimQc(),
  ]);

  return (
    <PenerimaanQcPageClient
      initialPenerimaan={penerimaanData}
      initialAntrean={antreanData}
      initialTab={tab}
    />
  );
}
