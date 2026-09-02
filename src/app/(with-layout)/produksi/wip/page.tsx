import { getWipCutting, getRingkasanProduksi } from "@/services/wip";
import { WipPageClient } from "./_components/WipPageClient";

export default async function WipPage() {
  const [rows, ringkasan] = await Promise.all([getWipCutting(), getRingkasanProduksi()]);
  return <WipPageClient initialRows={rows} initialRingkasan={ringkasan} />;
}
