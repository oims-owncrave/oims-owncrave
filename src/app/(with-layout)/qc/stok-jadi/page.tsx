import {
  listPackingSiapMasukGudang,
  listBarangJadi,
  listStokBarangJadi,
  listMutasiBarangJadi,
} from "@/services/barang-jadi";
import { listTransferFg, listPenyesuaianFg } from "@/services/transfer-fg";
import { listGudangBarangJadi } from "@/services/gudang-barang-jadi";
import { listUsers } from "@/services/user";
import { StokJadiPageClient } from "./_components/StokJadiPageClient";

export default async function StokJadiPage() {
  const [siap, fg, stok, mutasi, transfer, penyesuaian, gudangList, userList] =
    await Promise.all([
      listPackingSiapMasukGudang(),
      listBarangJadi(),
      listStokBarangJadi(),
      listMutasiBarangJadi(),
      listTransferFg(),
      listPenyesuaianFg(),
      listGudangBarangJadi(),
      listUsers(),
    ]);

  return (
    <StokJadiPageClient
      siapMasuk={siap}
      fgData={fg}
      stokData={stok}
      mutasiData={mutasi}
      transferData={transfer}
      penyesuaianData={penyesuaian}
      gudangOptions={gudangList}
      userOptions={userList}
    />
  );
}
