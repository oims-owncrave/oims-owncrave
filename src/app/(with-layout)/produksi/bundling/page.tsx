import { listBundel, listWoBisaDibundel } from "@/services/bundling";
import { BundelPageClient } from "./_components/BundelPageClient";

export default async function BundlingPage() {
  const [data, woOptions] = await Promise.all([listBundel(), listWoBisaDibundel()]);
  return <BundelPageClient initialData={data} woOptions={woOptions} />;
}
