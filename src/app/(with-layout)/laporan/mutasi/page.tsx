import { redirect } from "next/navigation";

export default function LaporanMutasiPage() {
  redirect("/laporan?tab=mutasi");
}
