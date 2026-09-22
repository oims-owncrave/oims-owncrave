"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Lightbox, type GambarLightbox } from "@/components/ui/Lightbox";
import { TAHAP_LABEL, type Tutorial } from "../_data";
import { PetaAlur } from "./PetaAlur";

/** "A. Mencatat bahan masuk" -> "a-mencatat-bahan-masuk" (id anchor bagian) */
function idBagian(slug: string, judul: string) {
  return `${slug}--${judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

/** Entri pertama sidebar: peta alur, bukan tutorial — dibaca sebelum langkah rinci. */
const SLUG_PETA = "peta-alur";

export function DokumentasiClient({ tutorial }: { tutorial: Tutorial[] }) {
  const [aktif, setAktif] = useState<string | null>(SLUG_PETA);
  const [lompatKe, setLompatKe] = useState<string | null>(null);
  const dipilih = tutorial.find((t) => t.slug === aktif);

  // Pindah tutorial lewat sub-item: kartunya baru ada setelah render ini.
  useEffect(() => {
    if (!lompatKe) return;
    document.getElementById(lompatKe)?.scrollIntoView({ behavior: "smooth" });
    setLompatKe(null);
  }, [lompatKe]);

  // Tandai bagian yang sedang dibaca — penanda ikut bergerak saat menggulir.
  // Posisinya dihitung ulang dari getBoundingClientRect tiap scroll, bukan dari
  // IntersectionObserver: observer hanya melapor bagian yang status lintasnya
  // BERUBAH, jadi bagian yang sudah lama memenuhi layar tidak pernah terlapor
  // lagi dan penandanya tertinggal di bagian sebelumnya.
  const [bagianAktif, setBagianAktif] = useState<string | null>(null);
  useEffect(() => {
    if (!dipilih) return;
    const ids = dipilih.bagian.map((b) => idBagian(dipilih.slug, b.judul));
    const hitung = () => {
      // bagian yang sedang dibaca = yang atasnya terakhir melewati garis header
      let terpilih = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) terpilih = id;
      }
      setBagianAktif(terpilih);
    };
    hitung();
    window.addEventListener("scroll", hitung, { passive: true });
    return () => window.removeEventListener("scroll", hitung);
  }, [dipilih]);

  const perTahap = ([1, 2, 3, 4] as const).map((n) => ({
    tahap: n,
    isi: tutorial.filter((t) => t.tahap === n),
  }));

  if (!tutorial.length) {
    return (
      <div className="rounded-[10px] border border-stroke bg-white p-6 text-sm text-dark-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:text-dark-6">
        Tutorial sedang disusun.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Daftar tutorial per tahap */}
      {/* top-24 (bukan top-4): header aplikasi sticky setinggi ~73px, jadi
          sidebar yang menempel lebih tinggi dari itu tertutup bagian atasnya.
          Tinggi maksimum dan scroll sendiri untuk daftar yang lebih panjang
          dari layar; overscroll-contain menahan scrollnya supaya tidak
          merembet ke halaman saat sudah mentok. */}
      <nav className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
        <button
          type="button"
          onClick={() => setAktif(SLUG_PETA)}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
            aktif === SLUG_PETA
              ? "bg-primary/10 font-medium text-primary"
              : "text-dark-5 hover:bg-gray-1 dark:text-dark-6 dark:hover:bg-dark-2",
          )}
        >
          Peta Alur Produksi
        </button>

        {perTahap.map(({ tahap, isi }) =>
          isi.length ? (
            <div key={tahap}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                {TAHAP_LABEL[tahap]}
              </p>
              <ul className="space-y-1">
                {isi.map((t) => (
                  <li key={t.slug}>
                    <button
                      type="button"
                      onClick={() => setAktif(t.slug)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        t.slug === aktif
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-dark-5 hover:bg-gray-1 dark:text-dark-6 dark:hover:bg-dark-2",
                      )}
                    >
                      {t.judul}
                    </button>

                    {/* Bagian A–E semua tutorial ditampilkan sekaligus — membuka satu
                        tahap tidak menutup tahap lain, jadi seluruh isi panduan
                        terlihat tanpa mengklik dulu. */}
                    {t.bagian.length > 1 && (
                      <ul className="mt-1 space-y-0.5 border-l border-stroke pl-3 dark:border-dark-3">
                        {t.bagian.map((b) => (
                          <li key={b.judul}>
                            <a
                              href={`#${idBagian(t.slug, b.judul)}`}
                              onClick={(e) => {
                                // Selalu ambil alih: anchor bawaan ikut menggulir
                                // sidebar (anchornya di dalam container yang
                                // bisa di-scroll), jadi daftarnya kepotong.
                                e.preventDefault();
                                if (t.slug === aktif) {
                                  document
                                    .getElementById(idBagian(t.slug, b.judul))
                                    ?.scrollIntoView({ behavior: "smooth" });
                                  return;
                                }
                                // Bagian tutorial lain belum ada di DOM — pindah
                                // dulu, lompat setelah kartunya dirender.
                                setAktif(t.slug);
                                setLompatKe(idBagian(t.slug, b.judul));
                              }}
                              className={cn(
                                "block rounded px-2 py-1.5 text-xs transition-colors hover:bg-gray-1 hover:text-dark dark:hover:bg-dark-2 dark:hover:text-white",
                                t.slug === aktif &&
                                  idBagian(t.slug, b.judul) === bagianAktif
                                  ? "font-medium text-primary"
                                  : t.slug === aktif
                                    ? "text-dark-5 dark:text-dark-6"
                                    : "text-dark-5/70 dark:text-dark-6/70",
                              )}
                            >
                              {b.judul}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </nav>

      {aktif === SLUG_PETA ? <PetaAlur /> : dipilih && <IsiTutorial t={dipilih} />}
    </div>
  );
}

function Kartu({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

function IsiTutorial({ t }: { t: Tutorial }) {
  // Semua gambar tutorial ini dikumpulkan berurutan supaya lightbox bisa
  // berpindah antar langkah, bukan hanya membuka satu gambar.
  const galeri: GambarLightbox[] = t.gambarMenyusul
    ? []
    : t.bagian.flatMap((b) =>
        b.langkah
          .filter((l) => l.gambar)
          .map((l) => ({ src: `/img-panduan/${t.slug}/${l.gambar}`, judul: l.judul })),
      );
  const [dibuka, setDibuka] = useState<number | null>(null);

  return (
    <article className="space-y-6">
      <Kartu>
        <h3 className="text-lg font-bold text-dark dark:text-white">{t.judul}</h3>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{t.ringkas}</p>

        {t.gambaranUmum?.length ? (
          <div className="mt-4 rounded-lg bg-gray-1 p-4 dark:bg-dark-2">
            <p className="mb-2 text-sm font-semibold text-dark dark:text-white">
              Apa yang sebenarnya terjadi
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-dark-5 dark:text-dark-6">
              {t.gambaranUmum.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {t.salahKaprah?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-125 text-left text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="pb-2 font-medium text-dark-5 dark:text-dark-6">Sering dikira</th>
                  <th className="pb-2 font-medium text-dark-5 dark:text-dark-6">Sebenarnya</th>
                </tr>
              </thead>
              <tbody>
                {t.salahKaprah.map(([a, b]) => (
                  <tr key={a} className="border-b border-stroke/50 last:border-none dark:border-dark-3/50">
                    <td className="py-2 pr-4 align-top text-dark-5 dark:text-dark-6">{a}</td>
                    <td className="py-2 align-top text-dark dark:text-white">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Kartu>

      {t.bagian.map((b) => (
        // scroll-mt supaya judul tidak tertutup header saat dilompati dari sidebar
        <Kartu key={b.judul} id={idBagian(t.slug, b.judul)} className="scroll-mt-20">
          <h4 className="font-semibold text-dark dark:text-white">{b.judul}</h4>
          {b.pengantar && (
            <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{b.pengantar}</p>
          )}
          <ol className="mt-4 space-y-6">
            {b.langkah.map((l, i) => (
              <li key={l.judul}>
                <p className="text-sm font-medium text-dark dark:text-white">
                  {i + 1}. {l.judul}
                </p>
                <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{l.teks}</p>
                {l.gambar && !t.gambarMenyusul && (
                  <button
                    type="button"
                    onClick={() =>
                      setDibuka(galeri.findIndex((g) => g.src.endsWith(l.gambar!)))
                    }
                    className="mt-3 block w-full cursor-zoom-in overflow-hidden rounded-lg border border-stroke transition hover:border-primary dark:border-dark-3"
                    title="Klik untuk memperbesar"
                  >
                    <Image
                      src={`/img-panduan/${t.slug}/${l.gambar}`}
                      alt={l.judul}
                      width={1400}
                      height={800}
                      className="w-full"
                    />
                  </button>
                )}
              </li>
            ))}
          </ol>
        </Kartu>
      ))}

      {t.penting?.length ? (
        <Kartu>
          <h4 className="font-semibold text-dark dark:text-white">Jangan dilanggar</h4>
          <ul className="mt-3 space-y-2">
            {t.penting.map((p) => (
              <li
                key={p}
                className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm text-dark dark:text-white"
              >
                {p}
              </li>
            ))}
          </ul>
        </Kartu>
      ) : null}

      {t.kalauBermasalah?.length ? (
        <Kartu>
          <h4 className="font-semibold text-dark dark:text-white">Kalau ada yang tidak beres</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-125 text-left text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="pb-2 font-medium text-dark-5 dark:text-dark-6">Gejala</th>
                  <th className="pb-2 font-medium text-dark-5 dark:text-dark-6">Kemungkinan sebabnya</th>
                </tr>
              </thead>
              <tbody>
                {t.kalauBermasalah.map(([g, s]) => (
                  <tr key={g} className="border-b border-stroke/50 last:border-none dark:border-dark-3/50">
                    <td className="py-2 pr-4 align-top text-dark-5 dark:text-dark-6">{g}</td>
                    <td className="py-2 align-top text-dark dark:text-white">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kartu>
      ) : null}

      <Lightbox
        gambar={galeri}
        aktif={dibuka}
        onTutup={() => setDibuka(null)}
        onPindah={setDibuka}
      />

      {t.belumTersedia?.length ? (
        <Kartu>
          <h4 className="font-semibold text-dark dark:text-white">Belum tersedia</h4>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            Hal berikut memang belum dibangun — bukan kerusakan.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-dark-5 dark:text-dark-6">
            {t.belumTersedia.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Kartu>
      ) : null}
    </article>
  );
}
