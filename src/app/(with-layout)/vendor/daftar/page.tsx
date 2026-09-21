import { redirect } from "next/navigation";

export default function VendorDaftarPage() {
  redirect("/master/data-mitra?tab=vendor");
}
