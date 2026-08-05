import { PengaturanClient } from "./_components/PengaturanClient";

export const metadata = { title: "Pengaturan — OIMS" };

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark dark:text-white">Pengaturan</h2>
      <PengaturanClient />
    </div>
  );
}
