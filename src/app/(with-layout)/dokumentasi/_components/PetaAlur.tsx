"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Spinner } from "@/components/ui/Spinner";
import { DIAGRAM_ALUR } from "../_diagram";

/**
 * Flowchart alur produksi. Sumbernya teks mermaid yang sama dengan
 * docs/alur-menu-flowchart.md, jadi alur di dokumen dan di aplikasi tidak
 * bisa berbeda diam-diam.
 *
 * mermaid diimpor dinamis: ~500KB, dan halaman lain tidak memakainya.
 */
export function PetaAlur() {
  const { resolvedTheme } = useTheme();
  const wadah = useRef<HTMLDivElement>(null);
  const [gagal, setGagal] = useState(false);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    // Tema baru terbaca setelah next-themes hidrasi; render sebelum itu memakai
    // warna yang salah lalu harus diulang.
    if (!resolvedTheme) return;
    let batal = false;

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          flowchart: { htmlLabels: true, curve: "basis" },
          securityLevel: "strict",
        });
        const { svg } = await mermaid.render(`alur-${resolvedTheme}`, DIAGRAM_ALUR);
        if (batal || !wadah.current) return;
        wadah.current.innerHTML = svg;
        setSelesai(true);
      } catch {
        if (!batal) setGagal(true);
      }
    })();

    return () => {
      batal = true;
    };
  }, [resolvedTheme]);

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="text-lg font-bold text-dark dark:text-white">Peta Alur Produksi</h3>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Urutan dari bahan datang sampai jadi stok siap jual. Garis putus-putus =
          hubungan antar bagian: Permintaan Bahan memicu Barang Keluar, dan barang yang
          keluar itulah yang dipotong di Cutting.
        </p>

        {gagal ? (
          <p className="mt-4 rounded-lg bg-gray-1 px-4 py-3 text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            Diagram gagal dimuat. Alurnya tetap bisa dibaca pada panduan tiap tahap di
            daftar sebelah kiri.
          </p>
        ) : (
          <>
            {!selesai && (
              <div className="mt-6 flex items-center gap-2 text-sm text-dark-5 dark:text-dark-6">
                <Spinner size={16} /> Menyiapkan diagram…
              </div>
            )}
            {/* digeser samping di layar kecil — diagram lebih lebar dari layar ponsel */}
            <div className="-mx-6 mt-4 overflow-x-auto px-6 sm:mx-0 sm:px-0">
              <div ref={wadah} className="min-w-150 [&_svg]:h-auto [&_svg]:max-w-full" />
            </div>
          </>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h4 className="font-semibold text-dark dark:text-white">Yang paling sering keliru</h4>
        <ul className="mt-3 space-y-2 text-sm text-dark-5 dark:text-dark-6">
          <li>
            <strong className="text-dark dark:text-white">
              Permintaan Bahan ditulis lebih dulu, bukan Barang Keluar.
            </strong>{" "}
            Produksi yang meminta, gudang yang mengeluarkan — bukan sebaliknya.
          </li>
          <li>
            <strong className="text-dark dark:text-white">
              Permintaan Bahan bukan permintaan membeli.
            </strong>{" "}
            Itu meminta bahan yang sudah ada di gudang. Pembelian lewat Barang Masuk.
          </li>
          <li>
            <strong className="text-dark dark:text-white">
              Barang keluar-masuk gudang berkali-kali.
            </strong>{" "}
            Internal, vendor jahit, kadang vendor sablon, lalu QC internal.
            &quot;Selesai&quot; di satu tahap belum berarti final.
          </li>
          <li>
            <strong className="text-dark dark:text-white">Sablon &amp; Bordir opsional.</strong>{" "}
            Produk tanpa dekorasi langsung dari Penerimaan Hasil ke QC.
          </li>
        </ul>
      </div>
    </div>
  );
}
