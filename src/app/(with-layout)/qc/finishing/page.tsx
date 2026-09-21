import type { Metadata } from "next";
import { bolehAkses, getCurrentUser, opsional } from "@/lib/auth";
import { AksesDitolak } from "@/components/ui/AksesDitolak";
import { listBarisSiapFinishing, listFinishing } from "@/services/finishing";
import { listBarisSiapPacking, listPacking } from "@/services/packing";
import { listUserOptions } from "@/services/user";
import { listBahan } from "@/services/bahan";
import { listKemasan } from "@/services/kemasan";
import { listGudangBarangJadi } from "@/services/gudang-barang-jadi";
import { FinishingCombinedPageClient } from "./_components/FinishingCombinedPageClient";

export const metadata: Metadata = {
  title: "Finishing | OIMS Owncrave",
};

export default async function FinishingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await bolehAkses(["owner", "admin_produksi", "admin_gudang"]))) {
    return <AksesDitolak />;
  }

  const user = await getCurrentUser();
  const role = user?.role ?? "viewer";
  const { tab } = await searchParams;

  const [
    barisFinishing,
    listFinishingData,
    userList,
    bahanList,
    barisPacking,
    listPackingData,
    kemasanList,
    gudangList,
  ] = await Promise.all([
    opsional(listBarisSiapFinishing(), []),
    opsional(listFinishing(), []),
    opsional(listUserOptions(), []),
    opsional(listBahan(), []),
    opsional(listBarisSiapPacking(), []),
    opsional(listPacking(), []),
    opsional(listKemasan(), []),
    opsional(listGudangBarangJadi(), []),
  ]);

  return (
    <FinishingCombinedPageClient
      barisFinishing={barisFinishing}
      listFinishingData={listFinishingData}
      userOptions={userList}
      bahanOptions={bahanList}
      barisPacking={barisPacking}
      listPackingData={listPackingData}
      kemasanOptions={kemasanList}
      gudangOptions={gudangList}
      initialTab={tab}
      role={role}
    />
  );
}
