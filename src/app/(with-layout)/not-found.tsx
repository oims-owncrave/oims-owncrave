import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Not-found DALAM app shell (sidebar + header tetap tampil).
 * Dipakai untuk route yang menunya sudah ada tapi halamannya belum dibangun.
 */
export default function WithLayoutNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-2 dark:bg-dark-3">
        <Construction className="size-8 text-dark-5 dark:text-dark-6" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-dark dark:text-white">
        Halaman belum tersedia
      </h2>
      <p className="mb-6 max-w-sm text-sm text-dark-5 dark:text-dark-6">
        Fitur ini masih dalam pengembangan. Silakan kembali ke dashboard atau
        pilih menu lain yang sudah aktif.
      </p>
      <Link href="/dashboard">
        <Button variant="outline">Ke Dashboard</Button>
      </Link>
    </div>
  );
}
