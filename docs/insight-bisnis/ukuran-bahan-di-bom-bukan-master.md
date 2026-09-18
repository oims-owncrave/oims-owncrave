# Ukuran bahan ditentukan di BOM, bukan di master bahan

> Jawaban klien 18 Sep 2026 atas pertanyaan `app-gtf4.4`. Ditulis supaya tidak
> digali ulang — perjalanan menuju kesimpulan ini panjang dan sempat salah arah
> dua kali.

## Pertanyaan yang diajukan ke klien

> "Kalau bahan yang ada size-nya ini, berarti barangnya sama semua cuma beda
> label ukuran, atau tiap ukuran (M, L, XL, dst) itu barangnya beda-beda?"

Konteks: 4 bahan menyimpan ukuran di dalam **nama** — `Label Size Chart
(M,L,XL,XXL,3XL)`, `Label Size Chart (S,M,L,XL,XXL)`, dan 2 resleting Vision
GMC No5 yang namanya menyebut `(S,M)`.

## Jawaban klien

> "ini label size, hanya beda tiap ukuran saja"

Plus rujukan ke `docs/TEMPLET PRODUKSI JAKET.xlsx`: *"di file itu sudah dibuat
per size untuk kebutuhan produknya."*

## Apa arti jawaban itu (dibuktikan dari Excel klien)

Excel klien punya **2 tempat berbeda** yang menyebut Label Size Chart, dan
bedanya itu kunci jawabannya:

**1. Sheet `STOCK PRODUKSI` (stok gudang) — SATU baris saja:**
```
NO | NAMA              | PRODUK       | SIZE              | KET | HARGA
29 | Label Size Chart  | Semua Produk | M,L,XL,XXL,3XL    |     |
```
Kolom `SIZE` di sini cuma **daftar ukuran yang tersedia**, bukan pemecah stok.
Stoknya tetap satu baris.

**2. Sheet per produk (mis. `JAKET SUPEROVA`) — dipakai per blok ukuran:**
Sheet ini punya 5 blok terpisah (`SUPERNOVA SIZE M`, `SIZE L`, `SIZE XL`,
`SIZE XXL`, `SIZE 3XL`). Di **tiap blok**, baris bahannya sama persis
(`Label Size Chart`), yang berbeda cuma kolom `warna/size`:
```
blok SIZE L  : 15 | Label Size Chart | L   | 1.0 | pcs
blok SIZE XL : 15 | Label Size Chart | XL  | 1.0 | pcs
blok SIZE XXL: 15 | Label Size Chart | XXL | 1.0 | pcs
```

**Kesimpulan:** ukuran itu properti **pemakaian per produk**, bukan properti
identitas bahan. Persis seperti `bom_detail.berlakuUkuran` yang sudah ada di
OIMS.

## Keputusan untuk OIMS

| Hal | Keputusan |
|---|---|
| Field ukuran baru di master bahan | **TIDAK** — jangan ditambahkan |
| Ukuran di nama bahan (`"(M,L,XL,XXL,3XL)"`) | **DIBUANG** dari nama, nama jadi bersih |
| Tempat ukuran dicatat | `bom_detail.berlakuUkuran` — **sudah ada**, tinggal dipakai |
| Pecah bahan jadi 1 baris per ukuran | **TIDAK** — stok tetap satu baris per SKU |

Mekanismenya sudah berjalan di form BOM (`/produksi/bom/baru`): tiap baris bahan
punya kolom **Ukuran** (MultiSelect). Pilihannya diambil dari varian ukuran yang
dimiliki produk itu (`listUkuranPerProduk()` di `src/services/produk.ts:104`,
baca `varianProduk.ukuran`) — **bukan** dari nama bahan.

## Dua salah arah yang sempat terjadi (jangan diulang)

**Salah arah 1 — mengira perlu field ukuran di master bahan.**
Terpatahkan setelah cek form BOM: `berlakuUkuran` sudah menyediakan tempatnya.

**Salah arah 2 — mengira 2 baris Label Size Chart di DB dev berarti 2 SKU fisik
berbeda** (karena rentangnya beda: `M-3XL` untuk Supernova/Hidden/Odysse vs
`S-XXL` untuk Nordic). Sempat disusun rencana rename jadi dua nama berbeda.
Abu mengoreksi: *"2 baris ini cuman untuk contoh saja dari saya, jangan
di-overthinking."*

Catatan lapangan yang masih relevan dari penggalian itu: DB **prod** hanya punya
1 baris Label Size Chart (`BH-AKSS-009`), sedangkan **dev** punya 2 karena sesi
15 Sep menambahkan `BH-AKSS-011` saat mengimpor data Excel. Kalau nanti data
prod dilengkapi, pastikan dulu apakah rentang berbeda itu memang 2 SKU fisik
atau cukup 1 — jangan asumsikan dari dev.

## Hubungan ke pola proyek

Ini konsisten dengan pola yang sudah ada:
- `oims-lkw.2` — warna dipecah jadi bahan terpisah **karena stoknya memang beda
  fisik per warna**. Ukuran label TIDAK begitu — stoknya satu.
- `app-uf3d` / `app-ut7f` — `berlakuUkuran` di BOM baru saja diperbaiki untuk
  kasus resleting multi-ukuran. Kasus label ini memakai mekanisme yang sama.

Aturan turunannya: **kalau variasi mempengaruhi identitas fisik & saldo stok →
baris bahan terpisah. Kalau variasi cuma soal "dipakai di produk ukuran mana" →
`berlakuUkuran` di BOM.**
