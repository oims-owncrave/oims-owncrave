import { redirect } from "next/navigation";

export default function LaporanNilaiPersediaanPage() {
  redirect("/laporan?tab=nilai-persediaan");
}
