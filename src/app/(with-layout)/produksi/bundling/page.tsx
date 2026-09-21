import { listBundel, listWoBisaDibundel } from "@/services/bundling";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { BundelPageClient } from "./_components/BundelPageClient";

export default async function BundlingPage() {
  const [data, woOptions, vendorOptions, penjahitOptions] = await Promise.all([
    listBundel(),
    listWoBisaDibundel(),
    listVendor(),
    listPenjahit(),
  ]);
  return (
    <BundelPageClient
      initialData={data}
      woOptions={woOptions}
      vendorOptions={vendorOptions}
      penjahitOptions={penjahitOptions}
    />
  );
}
