import { ArrowRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Peta alur produksi, versi ringkas dari docs/alur-menu-flowchart.md.
 * Dibuat sebagai kotak+panah biasa, bukan mermaid — tidak perlu dependensi
 * baru dan ikut dark mode sendiri.
 */

type Tahap = { nama: string; menu?: string };

const RANTAI: { grup: string; warna: string; tahap: Tahap[] }[] = [
  {
    grup: "Persediaan",
    warna: "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200",
    tahap: [{ nama: "Barang Masuk" }, { nama: "Stok Bahan" }, { nama: "Barang Keluar" }],
  },
  {
    grup: "Produksi",
    warna: "bg-violet-50 text-violet-900 dark:bg-violet-900/20 dark:text-violet-200",
    tahap: [
      { nama: "PO Produksi" },
      { nama: "Permintaan Bahan" },
      { nama: "Cutting" },
      { nama: "Bundle" },
    ],
  },
  {
    grup: "Vendor & Gudang",
    warna: "bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200",
    tahap: [
      { nama: "Penugasan Jahit" },
      { nama: "Pengiriman Vendor" },
      { nama: "Surat Jalan" },
      { nama: "Penerimaan Hasil" },
    ],
  },
  {
    grup: "Quality Control",
    warna: "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200",
    tahap: [
      { nama: "Penerimaan QC", menu: "+ tab Antrean" },
      { nama: "Work Order QC" },
      { nama: "Pemeriksaan QC" },
    ],
  },
  {
    grup: "Finishing & Gudang",
    warna: "bg-sky-50 text-sky-900 dark:bg-sky-900/20 dark:text-sky-200",
    tahap: [{ nama: "Finishing" }, { nama: "Stok Barang Jadi" }],
  },
];

const CABANG: { grade: string; ke: string; catatan: string }[] = [
  { grade: "A — sempurna", ke: "Finishing", catatan: "lanjut ke gudang barang jadi" },
  { grade: "B — cacat ringan", ke: "Rework", catatan: "diperbaiki, lalu Re-QC — bisa berulang" },
  { grade: "C / Reject", ke: "Karantina Reject", catatan: "tidak dijual" },
];

export function PetaAlur() {
  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="text-lg font-bold text-dark dark:text-white">Peta Alur Produksi</h3>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Urutan besar dari bahan datang sampai jadi stok siap jual. Tiap kotak adalah
          satu menu di aplikasi.
        </p>

        <div className="mt-5 space-y-5">
          {RANTAI.map((r) => (
            <div key={r.grup}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                {r.grup}
              </p>
              {/* digeser samping di layar kecil — alurnya tetap terbaca sebagai alur */}
              <div className="-mx-6 flex snap-x items-stretch overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {r.tahap.map((t, i) => (
                  <div key={t.nama} className="flex snap-start items-center">
                    <div
                      className={cn(
                        "w-36 shrink-0 rounded-lg px-3 py-2 text-sm font-medium sm:w-auto",
                        r.warna,
                      )}
                    >
                      {t.nama}
                      {t.menu && (
                        <span className="mt-0.5 block text-[11px] font-normal opacity-75">
                          {t.menu}
                        </span>
                      )}
                    </div>
                    {i < r.tahap.length - 1 && (
                      <ArrowRight
                        size={16}
                        className="mx-1.5 shrink-0 text-dark-5 dark:text-dark-6"
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 rounded-lg bg-gray-1 px-4 py-3 text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
          Barang <strong className="text-dark dark:text-white">keluar-masuk gudang
          berkali-kali</strong> — internal, vendor jahit, kadang vendor sablon, lalu QC
          internal. &quot;Selesai&quot; di satu tahap belum berarti final.
        </p>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h4 className="font-semibold text-dark dark:text-white">Setelah Pemeriksaan QC</h4>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Hasil pemeriksaan menentukan barang lanjut ke mana.
        </p>
        <ul className="mt-4 space-y-3">
          {CABANG.map((c) => (
            <li key={c.grade} className="flex gap-3">
              <CornerDownRight
                size={16}
                className="mt-0.5 shrink-0 text-dark-5 dark:text-dark-6"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-dark dark:text-white">
                  {c.grade} → {c.ke}
                </p>
                <p className="text-sm text-dark-5 dark:text-dark-6">{c.catatan}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
