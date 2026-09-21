import { redirect } from "next/navigation";

export default function LaporanBarangKeluarPage() {
  redirect("/laporan?tab=barang-keluar");
}
