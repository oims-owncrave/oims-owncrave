# Pemetaan Excel Klien → Skema OIMS

Sumber: `_PRODUKSI OWNC.xlsx` (vault `1.Projects/Q3-2026/HFG3-OIMS/`, tidak masuk repo).
Dibuat untuk **app-2fq kerjaan no.2**. Dipakai sebagai acuan saat input data real (no.3).

Workbook punya 38 sheet. Yang dipakai: **5 sheet DRAF** (BOM + HPP per produk) dan
**STOK** (daftar bahan + peta produk/ukuran). 32 sheet sisanya riwayat produksi per
tanggal — tidak dipakai untuk master, tapi berguna kalau nanti mau rekonstruksi stok awal.

## 1. Peta kolom sheet DRAF → tabel OIMS

| Kolom Excel | Isi | Tujuan di OIMS |
|---|---|---|
| A1 | `SKU PRODUK : <NAMA>` | `produk.nama`, `produk.kode` |
| B | Nama bahan | `bahan.nama` (lewat pencocokan, lihat §4) |
| C / D | Satuan + kemasan beli (Roll, Kg, Lusin, Pax) | konteks pembelian — **bukan** `bahan.satuan` |
| E / F / G | Isi kemasan: Pcs / Yard / Meter | penyebut konversi (lihat §2) |
| H | Harga per meter/pcs | `bahan.hargaRataRata` (awal), lalu dikelola sistem |
| I | Total harga kemasan | tidak dipakai |
| J | "Jadi Jaket" — 1 kemasan jadi berapa jaket | **bukan** kuantitas BOM, lihat §2 |
| K | Lokasi beli | `supplier` (opsional, belum tentu perlu) |
| M | Biaya bahan per jaket | **sumber kuantitas** (lihat §2) — nilainya sendiri Tahap 5 |
| N | Keterangan pemakaian | `bom_detail.keterangan` |
| P / Q / R | Varian warna bahan + nama varian + kode benang | `warna`, `varian_produk` |

Blok bawah sheet (ongkos kerja, HPP, profit) = **Tahap 5** (epic `oims-rcr`, deferred 2027).
Jangan dibangun sekarang; cukup dicatat bahwa datanya sudah tersedia.

## 2. Konversi kuantitas BOM — KOREKSI atas asumsi awal

Deskripsi issue menyebut **kuantitas = 1/J**. Setelah diperiksa ke seluruh 91 baris berharga,
**itu tidak benar**. Rumus yang benar:

```
kuantitas per jaket = M / H
```

dengan M = biaya bahan per jaket (kolom M), H = harga per satuan (kolom H).
Hubungan J dengan keduanya: `J = isi_kemasan / kuantitas`, jadi 1/J hanya benar
ketika isi kemasan = 1.

Bukti — 1/J vs M/H dibanding keterangan klien sendiri di kolom N:

| Bahan | 1/J | M/H | Kata kolom N |
|---|---|---|---|
| Velcro | 0,00875 | **0,16** | "penggunaan velcro 16cm /jaket" |
| Taliqur | 0,025 | **2,5** | "2,5 Meter /jaket" |
| Mata itik | 0,0016 | **8** | "Penggunaan 8 mata" |
| Stopper Botol | 0,008 | **4** | "4 stopper botol /jaket" |
| Kepala Rslt Cebol | 0,04 | **4** | "kepala resleting saku 4pcs /jaket" |
| Parasut RJN | 0,0175 | **1,6** | "rata-rata 1,6 Meter" |

M/H cocok dengan kalimat klien di **semua** baris; 1/J tidak cocok di satu pun kecuali
kebetulan isi kemasan = 1. Diuji menyeluruh: **91 dari 91 baris** konsisten
(`(M/H) x J` selalu sama dengan isi kemasan di kolom E atau G).

**10 baris tanpa M** semuanya resleting ukuran non-utama (28Inch, 32Inch, Vislon 24/28...).
M sengaja dikosongkan klien supaya HPP tidak dihitung berlipat — satu jaket hanya pakai
satu ukuran resleting. Kuantitasnya tetap **1 pcs**, dibedakan lewat `berlakuUkuran`.
Velcro di HIDDEN BLACK memang 0 (tidak dipakai di produk itu).

## 3. Satuan: beli vs pakai

Excel mencampur dua satuan dalam satu baris. Yang masuk `bahan.satuanId` adalah **satuan pakai**
(yang dipakai kolom M/H), bukan kemasan beli:

| Bahan | Kemasan beli (D) | Satuan pakai | Alasan |
|---|---|---|---|
| Parasut RJN | Roll (91,44 m) | **Meter** | M/H = 1,6 → meter |
| Puring Bilabong | Kg (100 m) | **Meter** | M/H = 1,25 → meter |
| Benang Tambang | Lusin (12 pcs) | **Pcs** | M/H = 0,4 → pcs |
| Resleting Coil | Lusin (12 pcs) | **Pcs** | 1 pcs/jaket |
| Mata itik | Pax (5000 pcs) | **Pcs** | 8 pcs/jaket |

Konsekuensi: **harga masuk per satuan pakai**, bukan per kemasan. Saat barang masuk, klien
membeli per Roll/Kg/Lusin — jumlahnya harus dikonversi dulu ke satuan pakai. Ini perlu
dikonfirmasi ke klien sebelum no.3; kalau mereka ingin input per kemasan, butuh kolom
konversi yang sekarang belum ada di skema (CLAUDE.md melarang konversi implicit antar satuan).

## 4. Pencocokan nama bahan Excel ↔ master (32 bahan)

**23 sudah ada**, 17 belum. Nama di master lebih pendek (kategori sudah
memisahkan), jadi pencocokan berdasar makna bukan teks.

### Sudah ada — pakai yang ini, jangan buat baru

| Excel | Master |
|---|---|
| Kain Keras 25N | `BH-AKSS-006` |
| Kancing Cetek 15mm Plastik | `BH-AKSS-010` |
| Karet Elastis SR Biru 1 inch /2,5cm | `BH-AKSS-002` |
| Kepala Resleing YKK Depan Vislon 5 Lock | `BH-KP-RTG-003` |
| Kepala Resleing YKK Depan cnda 5 Lock | `BH-KP-RTG-001` |
| Kepala Resleting YKK Cebol cnda 5 | `BH-KP-RTG-002` |
| Label Size Chart (M,L,XL,XXL,3XL) | `BH-AKSS-009` |
| Mata itik / ST 350 N & ST Ring 350 N, Hitam | `BH-AKSS-007+008` |
| Plastik Bening 35x40 (07) | `BH-FNSG-004` |
| Resleting Coil DSJK No5, Hitam 28Inch/71cm (M) | `BH-TR-SLG-001` |
| Resleting Coil DSJK No5, Hitam 30Inch/75cm (L,XL) | `BH-TR-SLG-002` |
| Resleting Coil DSJK No5, Hitam 32Inch/81cm (XXL, 3XL) | `BH-TR-SLG-003` |
| Resleting Roll DS Nylon 5 Black 1,2Kg | `BH-TR-SLG-004` |
| Resleting Vislon GMC No5, Hitam 24Inch/66cm (S,M) | `BH-TR-SLG-005` |
| Resleting Vislon GMC No5, Hitam 26Inch/66cm (L,XL) | `BH-TR-SLG-006` |
| Resleting Vislon GMC No5, Hitam 28Inch/71cm (XXL) | `BH-TR-SLG-007` |
| Stiker Size Chart | `BH-FNSG-001` |
| Stop Resleting | `BH-AKSS-003` |
| Stopper Botol Bening | `BH-AKSS-005` |
| Tali Hantag | `BH-FNSG-002` |
| Tali Resleting / Puller Rope Hitam | `BH-TR-SLG-008` |
| Taliqur/ Karet String 2,5mm Hitam (Premium) | `BH-AKSS-004` |
| Velcro Hitam 1 inch /2,5cm | `BH-AKSS-001` |

Catatan `Mata itik / ST 350 N & ST Ring 350 N`: di Excel **satu baris**, di master sudah
**dua bahan** (`BH-AKSS-007` mata itik + `BH-AKSS-008` ring). Keterangan klien
"Mata itik 16gram, ring 9gram" membenarkan pemisahan itu. BOM perlu **dua baris**,
masing-masing 8 pcs.

### Belum ada di master — perlu dibuat

| Bahan | Dipakai produk | Catatan |
|---|---|---|
| Benang Tambang | NORDIC, OBYSSE | nama generik |
| Benang Tambang (Hitam,Olive,Mocca) | HIDDEN BLACK, SUPERNOVA | warna ikut varian — jangan jadi 3 bahan |
| Benang Tambang (Hitam,Petrol, Hijau Army) | MALABAR | idem |
| Label Size Chart (S,M,L,XL,XXL) | NORDIC, OBYSSE | master punya versi (M,L,XL,XXL,3XL) — beda rentang ukuran |
| Parasut Crinkle Dusky | NORDIC | kain utama Nordic |
| Parasut RJN | OBYSSE | sama dgn Rinjani? konfirmasi klien |
| Parasut RJN (Rinjani) | MALABAR, SUPERNOVA | kain utama — lihat keputusan di bawah |
| Parasut RJN lite (Rinjani) | HIDDEN BLACK | varian lebih tipis — bahan sendiri |
| Puring BILABONG 120GSM | OBYSSE | kemungkinan sama dgn di atas |
| Puring Bilabong 45 /120Gsm (Tebal) | HIDDEN BLACK, MALABAR, SUPERNOVA | master punya `BH-KFR-001 BILABONG` tanpa gramasi — pisah tebal/tipis? |
| Puring Jala Mesh/Basket | MALABAR, NORDIC | puring Nordic/Malabar |
| Puring Peles2 (bagian lengan) | NORDIC, OBYSSE | puring lengan |
| Resleting Coil 15Inch/40cm (Resleting hoodie) | MALABAR | resleting hoodie Malabar |
| Resleting Vislon GMC No5, Hitam 30Inch/66cm (S,M) | OBYSSE | OBYSSE pakai ukuran berbeda dari Nordic |
| Resleting Vislon GMC No5, Hitam 32Inch/66cm (XL,XXL) | OBYSSE | idem |
| Resleting Vislon GMC No5, Hitam 34Inch/71cm (XXL) | OBYSSE | idem |
| Resleting jepang 25cm | HIDDEN BLACK | Hidden Black |

### Keputusan yang perlu diambil sebelum no.3

**Kain utama: satu bahan atau per warna?** Master sekarang sudah memecah per warna
(`RJN HITAM`, `RJN OLIVE`, `RJN MOCCA`, `RJN PETROL`, `RJN GREEN FOREST`) sementara Excel
menulis satu baris `Parasut RJN (Rinjani)` dan warnanya ada di kolom P.

Rekomendasi: **pertahankan per-warna**. Stok kain memang dihitung per warna — tidak bisa
memakai rol hitam untuk jaket olive. `bahan.warnaId` sudah ada di skema untuk ini.
Konsekuensinya BOM per produk harus menyebut warna spesifik, artinya **BOM per varian**,
bukan per produk. Tapi `bom.produkId` mengikat BOM ke produk, bukan varian.

Jalan tengah yang muat di skema sekarang: baris BOM memakai kain warna **default** produk,
lalu pemakaian nyata dicatat saat WO cutting (yang memang per varian). Perlu dikonfirmasi
ke Abu — ini menentukan bentuk data no.3.

**Benang** punya persoalan sama: Excel menyebut `Benang Tambang (Hitam,Olive,Mocca)` — satu
baris, tiga warna. Sheet STOK memecahnya jadi 9 kode benang. Saran: satu bahan
`Benang Tambang` dengan `warnaId`, dibuat sebanyak warna yang dipakai.

## 5. Produk & varian

5 produk (OBYSSE sebelumnya tidak pernah disebut):

| Produk | Varian warna | Jumlah | Bahan di BOM |
|---|---|---|---|
| SUPERNOVA | HITAM, OLIVE, MOCCA | 3 | 20 |
| NORDIC | HITAM, OLIVE ARMY, PETROL, KHAKI, ABU, MAROON, SAGE, NAVY | 8 | 21 |
| OBYSSE | HITAM, OLIVE ARMY, PETROL, KHAKI, ABU, MAROON, SAGE, NAVY | 8 | 20 |
| HIDDEN BLACK | HITAM, OLIVE, MOCCA | 3 | 19 |
| MALABAR | HITAM, PETROL, HIJAU | 3 | 22 |

**DRAF OBYSSE judulnya masih `SKU PRODUK : KEMEJA NORDIC`** — terkonfirmasi, sheet hasil
salin dari Nordic. Varian warnanya juga persis sama dengan Nordic (8 warna identik), tapi
**BOM-nya berbeda**: OBYSSE pakai Vislon 30/32/34 Inch sementara Nordic 24/26/28 Inch, dan
OBYSSE memakai `Parasut RJN` sedangkan Nordic `Parasut Crinkle Dusky`. Jadi ini memang produk
terpisah, hanya judulnya lupa diganti. **Tetap konfirmasi ke klien** sebelum input.

### Ukuran per produk

Ukuran tidak seragam. Dari blok "KEBUTUHAN KAIN RJN" di sheet DRAF:

| Produk | Ukuran | Kebutuhan kain per ukuran |
|---|---|---|
| NORDIC | S, M, L, XL, XXL | 140, 145, 155, 162, 170 cm |
| MALABAR | S, M, L, XL, XXL, 3XL | 170, 170, 180, 190, 195, 200 cm |
| SUPERNOVA / HIDDEN BLACK | M, L, XL, XXL, 3XL | (dari label size chart & resleting) |

**Temuan baru, tidak ada di deskripsi issue**: kebutuhan kain berbeda per ukuran.
BOM sekarang menyimpan satu `kuantitas` per bahan (1,6 m untuk Parasut RJN) — itu
angka rata-rata. Kalau klien ingin presisi per ukuran, `bom_detail` perlu baris terpisah
per ukuran memakai `berlakuUkuran`. Untuk no.3 cukup pakai angka rata-rata dulu;
catat ini sebagai kemungkinan penghalusan nanti.

## 6. Peta ukuran bahan (kerjaan no.4)

Sheet STOK kolom PCS — **7 bahan** punya peta ukuran (issue menyebut 5):

| Bahan | Produk | Berlaku ukuran |
|---|---|---|
| Resleting Coil DSJK No5, Hitam 28Inch/71cm (M) | Supernova, Malabar | M |
| Resleting Coil DSJK No5, Hitam 30Inch/75cm (L,XL) | Supernova, Malabar | L,XL |
| Resleting Coil DSJK No5, Hitam 32Inch/81cm (XXL, 3XL) | Supernova, Malabar | XXL, 3XL |
| Resleting Vislon GMC No5, Hitam 24Inch/66cm (S,M) | Nordic | S,M |
| Resleting Vislon GMC No5, Hitam 26Inch/66cm (L,XL) | Nordic | L,XL |
| Resleting Vislon GMC No5, Hitam 28Inch/71cm (XXL) | Nordic | XXL |
| Label Size Chart (M,L,XL,XXL,3XL) | Semua Produk | M,L,XL,XXL,3XL |

Semuanya masuk `bom_detail.berlakuUkuran` — **bukan** kolom baru di master bahan, sesuai
keputusan di kerjaan no.4. Perhatikan formatnya: `L,XL` dan `XXL, 3XL` (ada yang pakai spasi
setelah koma). Perlu disepakati satu format sebelum input — usul: tanpa spasi, `XXL,3XL`.

## 7. Blok STOK lain yang belum tercatat di issue

Sheet STOK ternyata punya **3 blok**, bukan 2:

| Blok | Jumlah | Status |
|---|---|---|
| STOK AKSESORIS | 29 | sebagian sudah di master |
| STOK BENANG | 9 kode warna | belum ada di master |
| **STOK LABEL** | 8 | **belum pernah disebut** — label bordir kotak/bulat/belakang, punggung, karet, slip, washing |

Label bordir kemungkinan masuk ranah **dekorasi** (`produk.dekorasiProses`) ketimbang bahan
biasa. Perlu diputuskan sebelum no.3.

## 8. Urutan input untuk no.3

FK saling bergantung, jadi urutannya mengikat:

1. `satuan` (Meter, Pcs, Kg, Yard) — cek yang sudah ada
2. `kategori` bahan — sudah ada 6 (AKSESORIS, FINISHING, KAIN FURING, KAIN UTAMA, KEPALA RESLETING, TALI RESLETING)
3. `warna` — dari kolom P/Q + 9 kode benang
4. `bahan` — 23 sudah ada, 17 perlu dibuat (lihat §4)
5. `produk` — 5
6. `varian_produk` — warna x ukuran per produk
7. `bom` (versi 1, status aktif) + `bom_detail` — 102 baris total

Verifikasi sesudahnya: jumlah baris per tabel, tidak ada bahan kembar (cek partial unique
index aktif), tepat satu BOM aktif per produk.

**Prasyarat**: kerjakan **2b** (pisah DB klien vs dev/demo) lebih dulu. DB yang sekarang
masih berisi data percobaan — termasuk produk "Smoke Test Jacket", PO-2026-0002 dan
BOM-202609-0001 yang dibuat saat verifikasi sesi 15 Sep.


---

## Hasil input (no.3) — 15 Sep 2026

Dijalankan ke **DB dev** (`fzkszkhjswtcugrqjzgx`) lewat `scripts/seed-data-real.mjs --apply`.
Skrip idempoten dan menolak jalan kalau `.env.local` menunjuk DB klien.

| | jumlah |
|---|---|
| produk | 5 |
| varian (SKU) | 128 |
| warna | 13 |
| bahan | 61 (32 lama + 22 kain per warna + 7 baru lain) |
| BOM aktif | 5 |
| baris `bom_detail` | 101 |

Per produk: Supernova 15 varian / 20 bahan, Nordic 40/21, OBYSSE 40/20,
Hidden Black 15/18, Malabar 18/22.

Invarian diperiksa: tidak ada bahan kembar, tidak ada SKU kembar, tepat satu BOM aktif
per produk.

### Keputusan yang diambil saat input

**Kain utama per warna** (Abu, 15 Sep). 22 baris bahan kain dibuat: RJN 11 warna,
Crinkle Dusky 8, RJN Lite 3. Baris BOM menunjuk kain **warna default** produk (varian
pertama); pemakaian nyata per varian dicatat saat WO cutting.

**Ukuran Supernova & Hidden Black** = M, L, XL, XXL, 3XL. Tidak ada blok "KEBUTUHAN KAIN"
di dua sheet ini, tapi ukurannya tertulis lewat dua jalur yang saling cocok: `Label Size
Chart (M,L,XL,XXL,3XL)` dan rentang resleting 28Inch (M) + 30Inch (L,XL) + 32Inch (XXL,3XL).

**Koreksi OBYSSE.** Excel menulis resleting S,M / **XL,XXL** / XXL — huruf L tidak muncul
dan XXL dobel, padahal label size chart-nya menyebut S,M,L,XL,XXL. Sheet OBYSSE hasil salin
Nordic (judulnya masih "KEMEJA NORDIC"), jadi baris 32Inch diperlakukan **L,XL** mengikuti
pola Nordic. Baris itu ditandai di `bom_detail.keterangan` dengan `[koreksi: ...]` supaya
mudah dilacak. Sudah ditanyakan ke klien 15 Sep; kalau jawabannya lain, ubah baris itu saja.

**Satuan mata itik & ring** diubah dari Kilogram ke Picis. Excel menghitung per pcs
("Penggunaan 8 mata (Mata itik 16gram, ring 9gram) for 100pcs"), sehingga BOM sempat
terbaca "8 Kg" di UI.

### Satu baris sengaja dilewati

Velcro di Hidden Black: di Excel nilainya 0 (H=0, M=0, J=0) — memang tidak dipakai di
produk itu. Jadi 101 dari 102 baris, bukan kegagalan pemetaan.

### Berkas

- `data-real-klien.json` — data terstruktur hasil pembacaan Excel, sumber input
- `peta-bahan.json` — pemetaan nama bahan Excel → nama di master
