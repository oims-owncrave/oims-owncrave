# app-z4wp poin 3 — Laporan 5 halaman jadi 1 bertab

**Paling bersih dari semua poin.** Tidak ada halaman anak, tidak ada yang
berversi, tidak ada filter role — kelima laporan terbuka untuk semua role
(`laporan.ts` memakai `requireRole` inline yang memuat seluruh role).

## Kondisi sekarang

| Route | Halaman |
|---|---|
| `/laporan/barang-masuk` | Laporan Barang Masuk |
| `/laporan/barang-keluar` | Laporan Barang Keluar |
| `/laporan/stok` | Laporan Stok Bahan |
| `/laporan/nilai-persediaan` | Laporan Nilai Persediaan |
| `/laporan/mutasi` | Laporan Mutasi Stok |

Lima entri sidebar, lima route datar. Tidak ada `[id]` atau sub-halaman.

## Hasil yang dituju

Satu halaman `/laporan` dengan 5 tab. Sidebar: 5 entri → 1.

## Pola wajib

Tiru `src/app/(with-layout)/master/data-bahan/` — hasil poin 1 yang sudah
berjalan.

1. **Reuse komponen tabel/client tiap laporan LANGSUNG**, bukan `PageClient`-nya
   kalau PageClient itu membawa `PageHeader` sendiri. Baca kelimanya dulu
   sebelum menulis kode — sebagian mungkin sudah memisahkan header, sebagian
   belum.
2. **Satu `PageHeader`** di komponen gabungan.
3. **Tab sinkron URL** (`?tab=stok`), route lama `redirect()` ke tab yang sesuai.
4. Route lama jangan dihapus foldernya — `_components/`-nya masih dipakai.

## Yang berbeda dari poin 1: tiap laporan punya filter sendiri

Ini bagian yang mudah salah. Kelima laporan punya kontrol filter berbeda —
Laporan Stok punya dropdown kategori, yang lain punya rentang tanggal, dan
Nilai Persediaan mungkin punya keduanya.

**State filter harus milik tiap tab, bukan satu state global.** Kalau digabung,
mengganti tanggal di Barang Masuk akan ikut mengubah Barang Keluar — atau lebih
buruk, filter kategori nyangkut di laporan yang tidak punya kategori.

Cara paling aman: biarkan tiap komponen laporan memegang state filternya sendiri
seperti sekarang, dan halaman gabungan hanya memilih komponen mana yang dirender.

**Jangan me-fetch kelima laporan sekaligus di `page.tsx`.** Laporan bisa berat
(nilai persediaan menghitung seluruh stok). Fetch data hanya untuk tab yang
sedang aktif, atau biarkan tiap komponen memuat datanya sendiri lewat hook yang
sudah ada.

## Entri nav

Ganti lima entri jadi satu, tanpa `roles` (sekarang juga tidak punya):

```ts
{ title: "Laporan", url: "/laporan" },
```

Perhatikan: item nav induknya sudah bernama "Laporan". Kalau entri anaknya juga
"Laporan", sidebar akan terlihat mengulang. **Pertimbangkan menjadikan item
induk itu sendiri sebagai link** (`url: "/laporan"`, `items: []`) alih-alih
punya satu anak — persis pola "Dashboard" di grup MENU UTAMA.

Itu keputusan kecil tapi hasilnya lebih rapi: satu baris, bukan accordion berisi
satu item.

## Redirect route lama

| Lama | Baru |
|---|---|
| `/laporan/barang-masuk` | `/laporan?tab=barang-masuk` |
| `/laporan/barang-keluar` | `/laporan?tab=barang-keluar` |
| `/laporan/stok` | `/laporan?tab=stok` |
| `/laporan/nilai-persediaan` | `/laporan?tab=nilai-persediaan` |
| `/laporan/mutasi` | `/laporan?tab=mutasi` |

⚠️ Route baru `/laporan` bertabrakan dengan folder `laporan/` yang sudah ada.
Buat `src/app/(with-layout)/laporan/page.tsx` (sebelumnya tidak ada file di
root folder itu — kelima laporan ada di subfolder). Pastikan tidak menimpa
apa pun.

## Link internal

```bash
grep -rn 'href="/laporan/' src/
```

Termasuk tombol Export CSV atau tautan dari dashboard kalau ada.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Sidebar: satu entri Laporan (bukan accordion berisi satu item).
3. Satu PageHeader, lima tab, URL ikut berubah.
4. Route lama mendarat di tab yang benar.
5. **Filter tidak bocor antar tab:** set rentang tanggal di Barang Masuk, pindah
   ke Barang Keluar, kembali lagi — filternya tidak tertukar.
6. Export CSV tiap tab masih menghasilkan data tab itu, bukan tab lain.
7. Laporan Stok: filter kategori masih jalan (ini `bahan.kategoriId`).

## Yang TIDAK dikerjakan

- Tidak mengubah isi laporan mana pun, hanya cara membukanya.
- Tidak menggabungkan laporan dengan Monitoring (WIP) — itu grup berbeda dan
  rolenya lebih ketat.
