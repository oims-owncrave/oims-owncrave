import { redirect } from "next/navigation";

export default function LaporanBarangMasukPage() {
  redirect("/laporan?tab=barang-masuk");
}
