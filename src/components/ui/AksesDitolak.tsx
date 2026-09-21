import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Pesan untuk halaman yang memang tidak boleh dibuka role ini.
 *
 * Tanpa ini, `requireRole` melempar dan Next.js menampilkan overlay Runtime
 * Error — user melihat tumpukan kode, bukan penjelasan. Menolak itu benar;
 * yang harus rapi adalah cara menolaknya.
 */
export function AksesDitolak({
  pesan = "Halaman ini hanya untuk peran tertentu. Hubungi pemilik akun kalau kamu merasa seharusnya punya akses.",
  kembaliKe = "/dashboard",
  labelKembali = "Ke Dashboard",
}: {
  pesan?: string;
  kembaliKe?: string;
  labelKembali?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-2 dark:bg-dark-3">
        <Lock className="size-8 text-dark-5 dark:text-dark-6" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-dark dark:text-white">
        Tidak punya akses
      </h2>
      <p className="mb-6 max-w-sm text-sm text-dark-5 dark:text-dark-6">{pesan}</p>
      <Link href={kembaliKe}>
        <Button variant="outline">{labelKembali}</Button>
      </Link>
    </div>
  );
}
