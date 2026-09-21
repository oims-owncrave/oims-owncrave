import { redirect } from "next/navigation";

export default function MasterBahanPage() {
  redirect("/master/data-bahan?tab=bahan");
}
