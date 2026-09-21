# app-egkt — Modal wajib Escape, focus trap, focus return, scroll lock

**Prioritas:** P2 · **Tipe:** bug · **Dampak:** ConfirmDialog 42 file, ImportExcelModal 8 file
**Aturan konvensi:** `ui_conventions.md` §12d (vault)

## Masalah

Dua modal tidak punya perilaku keyboard sama sekali:

| Hal | ConfirmDialog | ImportExcelModal | Lightbox (pola benar) |
|---|---|---|---|
| Escape menutup | ✗ | ✗ | ✓ |
| Fokus masuk ke modal | ✗ | ✗ | — |
| Fokus kembali ke pemicu | ✗ | ✗ | — |
| `body` scroll lock | ✗ | ✗ | ✓ |
| `role="dialog"` + `aria-modal` | ✗ | ✗ | ✓ |
| Backdrop klik-tutup | ✓ (`ConfirmDialog.tsx:32`) | ✗ | ✓ |

Mouse aman di ConfirmDialog, jadi tidak ada yang mengeluh. Yang rusak jalur keyboard.

### Bahayanya konkret

`ConfirmDialog` dipakai di 42 file dan **selalu di jalur destruktif** (hapus/void).
Alurnya: user menekan "Hapus" di baris tabel → dialog muncul → fokus **masih tertinggal
di tombol Hapus** di belakang backdrop. User berubah pikiran, menekan Escape (refleks)
→ tidak terjadi apa-apa. Menekan Enter → yang tertekan tombol Hapus di belakang.

Di mobile, halaman di belakang tetap bisa di-scroll karena tidak ada `overflow: hidden`.

`ImportExcelModal` lebih terkurung lagi: backdrop-nya hanya class di container
(`ImportExcelModal.tsx:94`), **tanpa `onClick`**. Satu-satunya jalan keluar dua tombol.

## Pola benar sudah ada di repo ini

`src/components/ui/Lightbox.tsx:47-62` sudah benar — Escape + scroll lock dengan
restore nilai asal:

```tsx
useEffect(() => {
  if (!terbuka) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onTutup();
    // ...
  };
  window.addEventListener("keydown", onKey);
  const asal = document.body.style.overflow;   // simpan, jangan asal ""
  document.body.style.overflow = "hidden";
  return () => {
    window.removeEventListener("keydown", onKey);
    document.body.style.overflow = asal;
    // (Lightbox belum mengembalikan fokus — itu ditambahkan di hook baru)
  };
}, [terbuka, onTutup, pindah]);
```

Fix = ekstrak jadi hook bersama, pakai di tiga tempat. Jangan salin-tempel ke tiap modal.

## Task 1 — Buat hook `useModalBehavior`

File baru: `src/hooks/useModalBehavior.ts`

```tsx
"use client";

import { useEffect } from "react";

/**
 * Perilaku wajib sebuah modal: Escape menutup, halaman belakang tidak ikut
 * bergulir, dan fokus kembali ke elemen pemicu saat modal ditutup.
 *
 * Fokus dikembalikan supaya posisi keyboard user tidak hilang — tanpa ini fokus
 * tertinggal di tombol yang tertutup backdrop, dan Enter berikutnya menekan
 * tombol yang tidak terlihat.
 */
export function useModalBehavior(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const pemicu = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = asal;
      pemicu?.focus();
    };
  }, [open, onClose]);
}
```

**Catatan:** `onClose` masuk dependency array. Kalau pemanggil mengoper arrow function
inline, effect akan pasang-lepas listener tiap render — tidak merusak perilaku, tapi
kalau mau rapi bungkus dengan `useCallback` di pemanggil. Jangan hilangkan dari deps.

## Task 2 — Pasang di ConfirmDialog

File: `src/components/ui/ConfirmDialog.tsx`

**PENTING — urutan hook.** Baris 28 sekarang `if (!open) return null;` yang berada
**sebelum** hook mana pun. Hook WAJIB dipanggil sebelum early return itu, kalau tidak
melanggar rules of hooks (jumlah hook berubah antar render → React error).

```tsx
export function ConfirmDialog({ open, ..., onCancel }: Props) {
  useModalBehavior(open, onCancel);     // ← SEBELUM early return
  if (!open) return null;
  // ...
```

Tambahkan atribut ARIA pada panel (baris 33) dan autofocus tombol batal:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="confirm-title"
  className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
>
  <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">{title}</h3>
```

Autofocus: tambahkan `autoFocus` pada tombol **Batal** (baris 37), bukan tombol Hapus.
Fokus awal harus jatuh di aksi yang aman — Enter refleks tidak boleh menghapus data.

Jangan ubah perilaku `loading`: backdrop sudah tidak bisa diklik saat loading
(baris 32). Escape juga sebaiknya tidak menutup saat loading — oper `onCancel` apa
adanya, tapi kalau `loading` true, pemanggil sudah menonaktifkan tombolnya; cukup
tambahkan penjaga di ConfirmDialog:

```tsx
useModalBehavior(open && !loading, onCancel);
```

Supaya user tidak bisa Escape di tengah proses hapus yang sedang jalan.

## Task 3 — Pasang di ImportExcelModal

File: `src/components/ui/import/ImportExcelModal.tsx`

Sama: hook sebelum `if (!open) return null` (baris 37). Pakai `handleClose` (baris 47),
bukan `onClose` mentah — `handleClose` mereset state form dulu.

`handleClose` didefinisikan setelah early return, jadi pindahkan definisinya ke atas,
atau panggil hook dengan fungsi yang setara. Paling bersih: pindahkan `handleReset` +
`handleClose` ke atas early return (keduanya tidak bergantung pada apa pun yang
didefinisikan setelahnya).

Tambahkan juga:
1. `role="dialog"` + `aria-modal="true"` pada panel (baris 95)
2. **Backdrop klik-tutup** — sekarang backdrop hanya class di container (baris 94).
   Pecah jadi backdrop terpisah seperti ConfirmDialog:
   ```tsx
   <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
     <div
       className="absolute inset-0 bg-black/50 backdrop-blur-xs"
       onClick={isPending ? undefined : handleClose}
     />
     <div role="dialog" aria-modal="true" className="relative w-full max-w-lg ...">
   ```
   Perhatikan panel sudah punya `relative` (baris 95) jadi tetap di atas backdrop.
   Saat `isPending` backdrop tidak menutup — proses import sedang jalan.

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. **ConfirmDialog:** buka halaman mana pun dengan tabel yang punya tombol Hapus
   (mis. `/master/bahan`). Klik Hapus → tekan **Escape** → dialog tertutup. Tekan Tab
   berulang → fokus tidak boleh keluar ke halaman belakang. Tutup dialog → fokus harus
   kembali ke tombol Hapus baris tadi (tekan Enter setelah tutup: dialog terbuka lagi,
   bukan aksi lain).
3. **Scroll lock:** buka dialog di layar sempit / mobile → coba scroll halaman di
   belakang → tidak boleh bergerak. Setelah ditutup, scroll normal lagi.
4. **ImportExcelModal:** buka import di halaman yang punya (mis. `/master/bahan`) →
   Escape menutup → backdrop klik menutup → saat proses import berjalan, Escape dan
   backdrop TIDAK menutup.
5. **Regresi Lightbox:** buka galeri gambar mana pun, pastikan Escape + panah masih
   jalan (Lightbox tidak diubah di issue ini, tapi pastikan tidak ada efek samping dari
   scroll lock yang bertabrakan kalau modal dan lightbox pernah terbuka bersamaan).

## Yang TIDAK dikerjakan di issue ini

- **Tidak mengubah `Lightbox.tsx`.** Sudah benar. Mengganti implementasinya dengan hook
  baru = refactor tanpa manfaat, dan berisiko merusak yang sudah jalan (dia punya
  arrow-key handler sendiri). Biarkan.
- Tidak membuat focus trap penuh (menahan Tab supaya melingkar di dalam modal).
  Autofocus + scroll lock + focus return sudah menutup jalur bahayanya. Trap penuh
  butuh query semua elemen fokusabel dan menangani Shift+Tab — tambahkan kalau ternyata
  masih terasa kurang.
- Tidak menyentuh 50 file pemakai — kontrak prop kedua modal tidak berubah.
