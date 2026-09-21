import { redirect } from "next/navigation";

export default function MasterGudangJadiPage() {
  redirect("/master/data-produk?tab=gudang");
}
