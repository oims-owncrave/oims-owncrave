# Batch B — Perbaikan halaman (2 issue)

Dua issue independen, boleh dikerjakan dengan urutan apa pun. Tidak menyentuh file
yang sama, dan tidak bertabrakan dengan Batch A.

| Issue | Plan | Inti |
|---|---|---|
| `app-qr6o` | `docs/plans/2026-09-21-app-qr6o-sidebar-filter-role.md` | Sidebar difilter per role sampai level item & subitem |
| `app-fbra` | `docs/plans/2026-09-21-app-fbra-template-dekorasi-peringatan.md` | Peringatan saat bikin Template Dekorasi untuk produk yang belum disetel dekorasi |

Baca plan-nya dulu — isinya nomor baris persis dan batas scope yang penting.

## Yang paling mudah salah

**`app-qr6o` — ada TIGA tempat yang memfilter menu, bukan satu.**

| File | Baris |
|---|---|
| `src/components/layouts/sidebar/index.tsx` | 20-23 |
| `src/components/layouts/bottom-nav/menu-sheet.tsx` | 55-57 |
| `src/components/layouts/bottom-nav/index.tsx` | 124-130 (`findNavItem`), 179 |

Kalau hanya sidebar yang diperbaiki, **mobile tetap bocor**. `findNavItem` mengambil
NavItem penuh beserta subitem-nya untuk sheet "Menu" di bottom nav.

Plan meminta satu helper bersama (`navUntukRole`) yang dipakai ketiganya — jangan salin
logika filter ke tiap file, itu persis kesalahan yang membuat `ownerOnly` sekarang
tersebar di 3 tempat.

**`app-qr6o` — scope MENU SAJA.** Jangan menambah guard route atau `middleware.ts`.
Proyek ini memang belum punya proteksi route yang merata, itu sudah diketahui dan
dicatat di `CLAUDE.md` bagian "Utang Teknis yang Diketahui". Keputusan Abu: kerjakan
menu dulu.

**`app-fbra` — peringatan, BUKAN larangan.** Template tetap boleh disimpan walau
produknya belum disetel dekorasi. Kalau penyimpanan diblokir, implementasinya salah.
Warna amber, bukan merah.

**`app-fbra` — jangan ubah `listWoBisaDekorasi`** (`src/services/dekorasi.ts:278`).
Filter `dekorasiProses <> 'none'` di situ sudah benar.

## Aturan proyek yang berlaku

- TypeScript strict, tidak ada `any`. Tipe role ambil dari `src/db/schema.ts`
  (`users.$inferSelect["role"]`), **jangan tulis ulang daftar 5 role** — sudah
  diduplikasi di 4 tempat, jangan tambah kelima.
- Tailwind v4 canonical class, dark mode pakai token
- Komentar 1 kalimat inti

## Setelah selesai

```bash
npx tsc --noEmit
```

Verifikasi manual per issue ada di masing-masing plan. Untuk `app-qr6o` wajib dicek
**dua tampilan** (desktop sidebar + mobile bottom nav/sheet di lebar < 850px) — itu
inti bug-nya.

## Jangan dikerjakan

- `bd close`, `git commit`, `git push` — tunggu Abu
- Guard route / middleware (lihat batas scope `app-qr6o`)
- Menyatukan 4 duplikasi daftar role jadi satu konstanta — dicatat, di luar scope
- Mengubah `ownerOnly` jadi `roles` — helper baru sudah menghormati keduanya
- `getPageTitle` (`sidebar/data/index.ts:196-223`) — harus tetap melihat NAV_DATA
  penuh, jangan ikut difilter (kalau difilter, judul halaman jadi "OIMS")
