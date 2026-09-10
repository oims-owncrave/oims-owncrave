import { listRejectBelumDikarantina, listKarantinaReject } from "@/services/karantina-reject";
import { listUsers } from "@/services/user";
import { listJenisCacat } from "@/services/jenis-cacat";
import { KarantinaPageClient } from "./_components/KarantinaPageClient";

export default async function KarantinaRejectPage() {
  const [belum, karantina, userList, cacatList] = await Promise.all([
    listRejectBelumDikarantina(),
    listKarantinaReject(),
    listUsers(),
    listJenisCacat(),
  ]);

  return (
    <KarantinaPageClient
      belum={belum}
      karantinaData={karantina}
      userOptions={userList}
      cacatOptions={cacatList}
    />
  );
}
