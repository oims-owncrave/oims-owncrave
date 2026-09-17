"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export type GambarLightbox = { src: string; judul: string };

type Props = {
  gambar: GambarLightbox[];
  /** indeks gambar yang dibuka; null = tertutup */
  aktif: number | null;
  onTutup: () => void;
  onPindah: (indeks: number) => void;
};

/**
 * Penampil gambar layar penuh dengan navigasi antar langkah.
 *
 * Gambar tutorial padat detail — teks kecil di dalamnya sulit dibaca pada lebar
 * kolom biasa, jadi perlu dibuka besar. Zoom memakai scale + translate, bukan
 * mengunduh ulang gambar beresolusi lain.
 */
export function Lightbox({ gambar, aktif, onTutup, onPindah }: Props) {
  const [zoom, setZoom] = useState(1);
  const [geser, setGeser] = useState({ x: 0, y: 0 });
  const [seret, setSeret] = useState<{ x: number; y: number } | null>(null);

  const terbuka = aktif !== null;
  const item = terbuka ? gambar[aktif] : null;

  // tiap ganti gambar, kembalikan ke tampilan utuh
  useEffect(() => {
    setZoom(1);
    setGeser({ x: 0, y: 0 });
  }, [aktif]);

  const pindah = useCallback(
    (arah: -1 | 1) => {
      if (aktif === null) return;
      const next = aktif + arah;
      if (next >= 0 && next < gambar.length) onPindah(next);
    },
    [aktif, gambar.length, onPindah],
  );

  useEffect(() => {
    if (!terbuka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
      if (e.key === "ArrowLeft") pindah(-1);
      if (e.key === "ArrowRight") pindah(1);
    };
    window.addEventListener("keydown", onKey);
    // cegah halaman di belakang ikut bergulir
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = asal;
    };
  }, [terbuka, onTutup, pindah]);

  if (!terbuka || !item) return null;

  const ubahZoom = (delta: number) => {
    setZoom((z) => {
      const baru = Math.min(4, Math.max(1, z + delta));
      if (baru === 1) setGeser({ x: 0, y: 0 });
      return baru;
    });
  };

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onTutup}
      role="dialog"
      aria-modal="true"
      aria-label={item.judul}
    >
      {/* Bar atas */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className="text-white/60">
            {aktif + 1}/{gambar.length}
          </span>{" "}
          {item.judul}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => ubahZoom(-0.5)}
            disabled={zoom <= 1}
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30"
            title="Perkecil"
          >
            <ZoomOut size={18} />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-white/70">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => ubahZoom(0.5)}
            disabled={zoom >= 4}
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30"
            title="Perbesar"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={onTutup}
            className="ml-2 rounded-lg p-2 hover:bg-white/10"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Gambar */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            pindah(-1);
          }}
          disabled={aktif === 0}
          className="absolute left-2 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 disabled:opacity-20"
          title="Sebelumnya (←)"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          className="flex h-full w-full items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => zoom > 1 && setSeret({ x: e.clientX - geser.x, y: e.clientY - geser.y })}
          onMouseMove={(e) =>
            seret && setGeser({ x: e.clientX - seret.x, y: e.clientY - seret.y })
          }
          onMouseUp={() => setSeret(null)}
          onMouseLeave={() => setSeret(null)}
          style={{ cursor: zoom > 1 ? (seret ? "grabbing" : "grab") : "default" }}
        >
          <Image
            src={item.src}
            alt={item.judul}
            width={1600}
            height={900}
            className="max-h-full max-w-full select-none rounded-lg object-contain transition-transform"
            style={{ transform: `scale(${zoom}) translate(${geser.x / zoom}px, ${geser.y / zoom}px)` }}
            draggable={false}
            priority
            unoptimized
            quality={100}
            sizes="100vw"
          />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            pindah(1);
          }}
          disabled={aktif === gambar.length - 1}
          className="absolute right-2 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 disabled:opacity-20"
          title="Berikutnya (→)"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
