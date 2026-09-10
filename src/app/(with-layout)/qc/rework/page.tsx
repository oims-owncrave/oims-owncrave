import {
  listBarisSiapRework,
  listPerbaikanInternal,
  listReturQcVendor,
} from "@/services/rework";
import { listUsers } from "@/services/user";
import { listJenisCacat } from "@/services/jenis-cacat";
import { ReworkPageClient } from "./_components/ReworkPageClient";

export default async function ReworkPage() {
  const [baris, internal, retur, userList, cacatList] = await Promise.all([
    listBarisSiapRework(),
    listPerbaikanInternal(),
    listReturQcVendor(),
    listUsers(),
    listJenisCacat(),
  ]);

  return (
    <ReworkPageClient
      baris={baris}
      internalData={internal}
      returData={retur}
      userOptions={userList}
      cacatOptions={cacatList}
    />
  );
}
