import { listSumberReQc, listReQc } from "@/services/re-qc";
import { listUsers } from "@/services/user";
import { ReQcPageClient } from "./_components/ReQcPageClient";

export default async function ReQcPage() {
  const [sumber, riwayat, userList] = await Promise.all([
    listSumberReQc(),
    listReQc(),
    listUsers(),
  ]);

  return <ReQcPageClient sumber={sumber} riwayat={riwayat} userOptions={userList} />;
}
