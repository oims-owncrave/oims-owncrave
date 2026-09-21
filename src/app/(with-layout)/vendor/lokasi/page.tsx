import { redirect } from "next/navigation";

export default function LokasiProduksiPage() {
  redirect("/master/data-mitra?tab=lokasi");
}
