"use client";

import { useEffect, useRef } from "react";

/**
 * Perilaku wajib sebuah modal: Escape menutup, halaman belakang tidak ikut
 * bergulir, dan fokus kembali ke elemen pemicu saat modal ditutup.
 *
 * Fokus dikembalikan supaya posisi keyboard user tidak hilang — tanpa ini fokus
 * tertinggal di tombol yang tertutup backdrop, dan Enter berikutnya menekan
 * tombol yang tidak terlihat.
 *
 * `open` = modal terlihat di layar. `closable` = boleh ditutup sekarang (false
 * saat proses hapus/import sedang jalan). Dipisah karena scroll lock dan fokus
 * harus ikut SELAMA modal terlihat — kalau keduanya digabung jadi satu flag,
 * modal yang sedang memproses kehilangan kuncinya dan fokus kabur ke belakang
 * backdrop padahal dialognya masih tampil.
 */
export function useModalBehavior(open: boolean, onClose: () => void, closable = true) {
  // onClose biasanya arrow function baru tiap render. Disimpan di ref supaya
  // effect tidak pasang-lepas listener tiap render — tiap lepas akan memanggil
  // pemicu?.focus() dan merebut fokus user saat modal masih terbuka.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const closableRef = useRef(closable);
  closableRef.current = closable;

  useEffect(() => {
    if (!open) return;

    const pemicu = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closableRef.current) onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);

    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = asal;
      pemicu?.focus();
    };
  }, [open]);
}
