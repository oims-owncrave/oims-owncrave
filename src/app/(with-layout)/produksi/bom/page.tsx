import { redirect } from "next/navigation";

export default function BomPage() {
  redirect("/master/data-produk?tab=bom");
}
