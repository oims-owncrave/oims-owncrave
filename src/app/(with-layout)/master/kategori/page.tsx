import { redirect } from "next/navigation";

export default function MasterKategoriPage() {
  redirect("/master/data-bahan?tab=kategori");
}
