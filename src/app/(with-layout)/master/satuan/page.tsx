import { redirect } from "next/navigation";

export default function MasterSatuanPage() {
  redirect("/master/data-bahan?tab=satuan");
}
