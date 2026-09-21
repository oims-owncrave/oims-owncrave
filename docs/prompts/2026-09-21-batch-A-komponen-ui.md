# Batch A — Perbaikan komponen UI bersama (4 issue)

Kerjakan 4 issue berikut **berurutan**, satu per satu. Semuanya menyentuh
`src/components/ui/`, jadi berdampak ke banyak halaman sekaligus.

Plan lengkap tiap issue ada di `docs/plans/` — **baca plan-nya dulu sebelum menulis
kode**, isinya nomor baris persis dan jebakan yang harus dihindari.

| Urutan | Issue | Plan | File utama |
|---|---|---|---|
| 1 | `app-823x` | `docs/plans/2026-09-21-app-823x-numberinput-draft-sinkron.md` | `src/components/ui/NumberInput.tsx` |
| 2 | `app-egkt` | `docs/plans/2026-09-21-app-egkt-modal-escape-focus-scroll.md` | `src/hooks/useModalBehavior.ts` (baru), `ConfirmDialog.tsx`, `import/ImportExcelModal.tsx` |
| 3 | `app-n5fy` | `docs/plans/2026-09-21-app-n5fy-import-file-sama-tak-terdeteksi.md` | `src/components/ui/import/ImportExcelModal.tsx` |
| 4 | `app-46vb` | `docs/plans/2026-09-21-app-46vb-combo-clear-keyboard.md` | `ComboSelect.tsx`, `MultiSelect.tsx` |

**Urutan 2 lalu 3 tidak boleh dibalik** — keduanya menyentuh `ImportExcelModal.tsx`,
dan `app-egkt` memindahkan `handleClose` ke atas early return. Kerjakan `app-egkt`
sampai selesai baru `app-n5fy`.

## Tiga jebakan yang akan merusak kalau tidak dibaca

Ini bukan catatan tambahan — ini yang paling mungkin bikin hasilnya salah:

**1. `app-823x` — jangan pakai `useEffect(() => setDraft(null), [value])`.**
Terlihat benar, tapi merusak pengetikan desimal. Saat user mengetik `"1,"`, komponen
memanggil `onChange(1)`, jadi `value` berubah **setiap ketukan** — effect itu akan
membuang draft dan koma hilang. Harus ada penjaga yang membedakan perubahan dari
ketikan user vs dari luar. Plan menjelaskan caranya.

**2. `app-egkt` — hook WAJIB sebelum `if (!open) return null`.**
Kedua modal punya early return di awal (ConfirmDialog baris 28, ImportExcelModal baris
37). Memanggil hook setelahnya melanggar rules of hooks dan React akan error saat modal
dibuka-tutup.

**3. `app-46vb` — `handleSelect` ComboSelect TIDAK SALAH, jangan diubah.**
Deskripsi issue lamanya keliru (sudah dikoreksi lewat komentar di beads). Cabang
single-select sudah benar melakukan replace. Yang hilang: tombol clear. Task-nya
**menambah**, bukan memperbaiki.

## Aturan proyek yang berlaku

- TypeScript strict, tidak ada `any`
- Tailwind v4: canonical class bukan arbitrary (`z-70` bukan `z-[70]`)
- Dark mode aktif: pakai token (`dark:bg-gray-dark`, `dark:border-dark-3`), bukan
  `dark:bg-[#xxx]`
- Komentar secukupnya, 1 kalimat inti. Jangan blok 5 baris.
- **Jangan menyentuh file pemakai** kecuali disebut eksplisit di plan. Kontrak prop
  semua komponen ini tidak berubah — kecuali `clearable` (prop baru, opsional) dan
  pemasangannya di field opsional yang disebut di plan `app-46vb` Task 2.

## Setelah selesai tiap issue

```bash
npx tsc --noEmit
```
Harus 0 error sebelum lanjut ke issue berikutnya. Jangan menumpuk 4 issue lalu baru
cek — kalau error muncul, sulit tahu dari mana.

## Jangan dikerjakan

- `bd close` — Abu yang menutup setelah review
- `git commit` / `git push` — tunggu Abu minta
- Refactor menyatukan ComboSelect & MultiSelect (walau ~80% duplikat) — sudah dicatat
  di plan sebagai di luar scope
- `SingleSelect` (`MultiSelect.tsx:296-325`) — issue terpisah `app-2ttp`
- `Lightbox.tsx` — sudah benar, biarkan

## Verifikasi akhir batch

Selain verifikasi per-issue di masing-masing plan, cek tidak ada regresi di jalur
yang paling ramai dipakai:

1. `/master/bahan` — tabel, tombol Hapus (ConfirmDialog), Import Excel
2. `/inventory/barang-keluar/baru` — ComboSelect (PB + PO + Bahan), NumberInput
   (Kuantitas, desimal 3 angka)
3. `/vendor/dekorasi/baru` — ini jalur bug `app-823x`, wajib dites manual
