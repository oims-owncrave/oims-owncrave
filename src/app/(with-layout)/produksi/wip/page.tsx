import { getWipCutting, getRingkasanProduksi, getGrafikProduksi } from "@/services/wip";
import { WipPageClient } from "./_components/WipPageClient";

export default async function WipPage() {
  const [rows, ringkasan, grafik] = await Promise.all([
    getWipCutting(),
    getRingkasanProduksi(),
    getGrafikProduksi(),
  ]);
  return (
    <WipPageClient initialRows={rows} initialRingkasan={ringkasan} grafik={grafik} />
  );
}
