import { redirect } from "next/navigation";

export default function MasterKemasanPage() {
  redirect("/master/data-produk?tab=kemasan");
}
