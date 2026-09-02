import { listVendor } from "@/services/vendor";
import { VendorPageClient } from "./_components/VendorPageClient";

export default async function VendorDaftarPage() {
  const data = await listVendor();
  return <VendorPageClient initialData={data} />;
}
