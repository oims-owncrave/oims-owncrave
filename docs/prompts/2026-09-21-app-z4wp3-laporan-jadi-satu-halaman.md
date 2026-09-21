CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules sebelum mulai.

TASK:
Eksekusi @docs/plans/2026-09-21-app-z4wp3-laporan-jadi-satu-halaman-tab.md

ISSUE: app-z4wp poin 3 — Laporan 5 halaman jadi 1 bertab.

---

## Pola sudah ada dan sudah berjalan

`src/app/(with-layout)/master/data-bahan/` dan `data-produk/` adalah hasil poin
1 & 2 yang sudah selesai dan terverifikasi. **Baca salah satunya dulu** —
struktur tab, sinkron URL lewat `replaceState` + `popstate`, semuanya sudah
benar di sana.

Lima laporan digabung jadi `/laporan`:
Barang Masuk · Barang Keluar · Stok · Nilai Persediaan · Mutasi Stok

---

## Tiga hal yang BERBEDA dari poin 1 & 2 — baca ini baik-baik

**1. `PageHeader` ada di `page.tsx`, BUKAN di komponen.**

Sudah diperiksa 21 Sep: kelima `_components/` laporan **tidak** memuat
`PageHeader`. Jadi jebakan "header menumpuk" yang jadi masalah utama di poin 1
dan 2 **tidak berlaku di sini**.

Artinya: **reuse `Laporan<Nama>Client.tsx` LANGSUNG** (bukan cuma Table-nya).
Client-lah yang memegang state filter dan memanggil hook datanya — kalau hanya
Table yang di-reuse, semua state filter harus ditulis ulang.

Ini kebalikan dari instruksi poin 1 & 2. Jangan ikuti kebiasaan dari sana.

**2. Tiap laporan punya filter sendiri — jangan disatukan.**

Laporan Stok punya dropdown kategori; yang lain punya rentang tanggal; Nilai
Persediaan mungkin keduanya. Kalau state filter digabung jadi satu, mengganti
tanggal di Barang Masuk akan ikut mengubah Barang Keluar.

**Biarkan tiap Client memegang state filternya sendiri seperti sekarang.**
Halaman gabungan hanya memilih Client mana yang dirender. Jangan mengangkat
state filter ke atas.

**3. JANGAN fetch kelima laporan sekaligus.**

Laporan bisa berat — Nilai Persediaan menghitung seluruh stok. Kalau `page.tsx`
memanggil kelima service di `Promise.all`, membuka satu tab berarti menunggu
kelimanya.

Pilihan yang benar: **biarkan tiap Client memuat datanya sendiri lewat hook yang
sudah ada** (`useLaporanStok`, dst). Server Component cukup menyiapkan data
untuk tab yang aktif saja, atau tidak sama sekali kalau hook-nya sudah cukup.

Kalau ragu, prioritaskan: **tab yang tidak dibuka tidak boleh memicu query.**

---

## Tanpa filter role

Kelima laporan terbuka untuk semua role — `laporan.ts` memakai `requireRole`
inline yang memuat seluruh role. Jadi **tidak perlu** pola penyaringan tab
seperti di poin 2, dan **jangan** beri guard `bolehAkses` di halaman.

---

## Entri nav: pertimbangkan pola Dashboard

Item nav induk sekarang sudah bernama "Laporan" dengan 5 anak. Kalau anaknya
tinggal satu dan juga bernama "Laporan", sidebar terlihat mengulang:

```
Laporan  ▾
   Laporan
```

**Jadikan item induknya sendiri sebagai link**, seperti "Dashboard" di grup
MENU UTAMA:

```ts
{
  title: "Laporan",
  url: "/laporan",
  icon: LaporanIcon,
  items: [],
}
```

Satu baris, bukan accordion berisi satu item.

---

## Route baru bertabrakan dengan folder lama

`/laporan` sekarang **tidak punya** `page.tsx` di root — kelima laporan ada di
subfolder. Jadi buat `src/app/(with-layout)/laporan/page.tsx` baru.

Pastikan tidak menimpa apa pun, dan kelima subfolder tetap ada (redirect +
`_components/` yang masih dipakai).

## Redirect

| Lama | Baru |
|---|---|
| `/laporan/barang-masuk` | `/laporan?tab=barang-masuk` |
| `/laporan/barang-keluar` | `/laporan?tab=barang-keluar` |
| `/laporan/stok` | `/laporan?tab=stok` |
| `/laporan/nilai-persediaan` | `/laporan?tab=nilai-persediaan` |
| `/laporan/mutasi` | `/laporan?tab=mutasi` |

## Link internal

```bash
grep -rn 'href="/laporan/' src/
```

Termasuk tautan dari dashboard kalau ada. Poin 1 menemukan satu di
`dashboard/_components/StatCards.tsx`.

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. Sidebar: satu entri "Laporan", **bukan accordion berisi satu item**
2. Satu PageHeader, lima tab, URL ikut berubah
3. Route lama mendarat di tab yang benar
4. **Filter tidak bocor antar tab** (paling penting): set rentang tanggal di
   Barang Masuk → pindah ke Barang Keluar → kembali lagi. Filternya tidak
   tertukar dan tidak ter-reset ke tab lain.
5. **Tab yang tidak dibuka tidak memicu query** — cek Network tab, membuka
   halaman hanya memuat data tab aktif
6. Laporan Stok: filter kategori masih jalan (ini `bahan.kategoriId`)
7. Export CSV tiap tab menghasilkan data tab itu, bukan tab lain

## Jangan dikerjakan

- `bd close`, `git commit`, `git push` — Abu yang menentukan setelah review
- Mengubah isi laporan mana pun; hanya cara membukanya yang berubah
- Menggabungkan Laporan dengan Monitoring (WIP) — grup berbeda, role lebih ketat
- Menyentuh Master Data (poin 1 & 2 sudah selesai)

## Laporan akhir (wajib)

- Konfirmasi PageHeader muncul sekali
- Hasil `npx tsc --noEmit`
- Konfirmasi tiap Client tetap memegang state filternya sendiri
- Bagaimana data dimuat — kelima sekaligus atau per tab aktif
- Daftar link internal yang diarahkan ulang (atau "tidak ada")
