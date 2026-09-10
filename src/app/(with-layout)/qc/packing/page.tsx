import { listBarisSiapPacking, listPacking } from "@/services/packing";
import { listKemasan } from "@/services/kemasan";
import { listGudangBarangJadi } from "@/services/gudang-barang-jadi";
import { listUsers } from "@/services/user";
import { PackingPageClient } from "./_components/PackingPageClient";

export default async function PackingPage() {
  const [baris, list, kemasanList, gudangList, userList] = await Promise.all([
    listBarisSiapPacking(),
    listPacking(),
    listKemasan(),
    listGudangBarangJadi(),
    listUsers(),
  ]);

  return (
    <PackingPageClient
      baris={baris}
      listData={list}
      kemasanOptions={kemasanList}
      gudangOptions={gudangList}
      userOptions={userList}
    />
  );
}
