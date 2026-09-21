import { redirect } from "next/navigation";

export default function MasterProdukPage() {
  redirect("/master/data-produk?tab=produk");
}
