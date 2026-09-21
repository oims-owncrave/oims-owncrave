import { redirect } from "next/navigation";

export default function LaporanStokPage() {
  redirect("/laporan?tab=stok");
}
