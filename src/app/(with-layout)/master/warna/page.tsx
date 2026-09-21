import { redirect } from "next/navigation";

export default function MasterWarnaPage() {
  redirect("/master/data-bahan?tab=warna");
}
