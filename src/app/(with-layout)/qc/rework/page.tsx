import type { Metadata } from "next";
import { bolehAkses } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import {
  listBarisSiapRework,
  listPerbaikanInternal,
  listReturQcVendor,
} from "@/services/rework";
import { listUsers } from "@/services/user";
import { listJenisCacat } from "@/services/jenis-cacat";
import { listSumberReQc, listReQc } from "@/services/re-qc";
import { ReworkCombinedPageClient } from "./_components/ReworkCombinedPageClient";

export const metadata: Metadata = {
  title: "Rework | OIMS Owncrave",
};

export default async function ReworkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await bolehAkses(["owner", "admin_produksi"]))) {
    return <AksesDitolak />;
  }

  const { tab } = await searchParams;
  const [baris, internal, retur, userList, cacatList, sumber, riwayat] =
    await Promise.all([
      listBarisSiapRework(),
      listPerbaikanInternal(),
      listReturQcVendor(),
      listUsers(),
      listJenisCacat(),
      listSumberReQc(),
      listReQc(),
    ]);

  return (
    <ReworkCombinedPageClient
      baris={baris}
      internalData={internal}
      returData={retur}
      userOptions={userList}
      cacatOptions={cacatList}
      sumber={sumber}
      riwayat={riwayat}
      initialTab={tab}
    />
  );
}
