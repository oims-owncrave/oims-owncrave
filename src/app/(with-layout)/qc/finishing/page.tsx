import { listBarisSiapFinishing, listFinishing } from "@/services/finishing";
import { listUsers } from "@/services/user";
import { listBahan } from "@/services/bahan";
import { FinishingPageClient } from "./_components/FinishingPageClient";

export default async function FinishingPage() {
  const [baris, list, userList, bahanList] = await Promise.all([
    listBarisSiapFinishing(),
    listFinishing(),
    listUsers(),
    listBahan(),
  ]);

  return (
    <FinishingPageClient
      baris={baris}
      listData={list}
      userOptions={userList}
      bahanOptions={bahanList}
    />
  );
}
