# app-7yzg — Bandingkan struktur menu dengan aplikasi klien

**Prioritas:** P2 · **Tipe:** task
**Kerjakan setelah** `app-z4wp` selesai semua.

## Kekhawatiran yang mendasari

Abu, 21 Sep 2026:

> *"sepertinya buatan klien lebih simpel, yang kita masih ribet, walaupun memang
> yang kita itu lebih lengkap sih, tapi jangan sampai klien merasa buatan kita
> ini kok lebih ribet dan dia lebih memilih pakai hasil dia sendiri saja."*

Kekhawatiran ini tepat, dan **sudah terbukti sekali**: pola grup QC klien
(memisahkan jalur normal dari jalur pengecualian) ternyata lebih baik daripada
cara saya menggabung berdasarkan hulu-hilir. Itu menjadi `app-z4wp` poin 5.

Kalau ada satu pelajaran, kemungkinan ada yang lain.

## Angka pembanding (dihitung 21 Sep malam)

| | Klien | Kita |
|---|---|---|
| Grup | **8** | **12** |
| Entri | **21** | **36** |

Tapi angka mentah itu menyesatkan — cakupan kita memang lebih luas (Tahap 1-4
vs Tahap 1-2 mereka). Perbandingan yang adil ada di bawah.

## Struktur menu klien (dibaca dari `app/lib/navigation.ts`)

```
MANAJEMEN
  Master Data          Master Jaket · Master Vendor · Master QC · Master PIC

OPERASIONAL
  Produksi             Cutting · Bundle
  Sablon & Bordir      Sablon/Bordir
  Vendor & Gudang      Pengiriman Vendor · Penerimaan Gudang
  Quality Control      Pengiriman QC · Quality Control
  Rework & Karantina   Rework · Penerimaan Rework · QC Ulang · Karantina Reject
  Persediaan           Stok Barang Jadi

ANALITIK
  Laporan              Laporan Operasional · Laporan Keuangan · Riwayat Pembayaran
```

Plus `Dashboard` dan `Surat Jalan` di luar grup.

## Empat temuan awal — verifikasi dulu sebelum dipakai

Ini hasil pembacaan cepat, **bukan kesimpulan final**. Tugas issue ini
memverifikasi dan menambahkan.

### 1. Master mereka 4, kita 4 — tapi isinya beda jauh

```
klien : Master Jaket · Master Vendor · Master QC · Master PIC
kita  : Data Bahan · Data Produk · Data Mitra · Data QC
```

Jumlah grupnya **sama persis** setelah `app-z4wp` poin 2. Tapi punya kita
memuat 14 master di dalam tab, mereka 4 halaman datar.

**Pertanyaan:** apakah pemakai merasakan bedanya? Kalau tab kita bekerja,
seharusnya tidak. Perlu dicek dengan membuka dua-duanya berdampingan.

### 2. Mereka punya "Master PIC", kita tidak

PIC = penanggung jawab. Kita memakai tabel `users` untuk itu (`pengirimId`,
`penerimaId` dari `app-gtf4.1`).

**Pertanyaan:** apakah klien mengharapkan daftar PIC terpisah dari daftar
pengguna aplikasi? Orang yang bertanggung jawab atas WO belum tentu punya akun.

### 3. Penamaan mereka memakai kata kerja, kita memakai kata benda

```
klien : "Pengiriman QC"     kita : "Penerimaan QC"
klien : "Penerimaan Gudang" kita : "Penerimaan Hasil"
klien : "Master Jaket"      kita : "Data Produk"
```

Mereka menyebut **jaket**, kita menyebut **produk**. Klien membuat jaket.

**Ini kemungkinan temuan paling berharga** — penamaan tidak mengubah arsitektur
tapi sangat memengaruhi rasa familiar. Lihat memory
`nama-kode-vs-nama-layar`: sebut fitur pakai nama di menu, dan selisih antara
nama kode dengan nama layar adalah sinyal nama layarnya perlu ditinjau.

### 4. Mereka menggabung Laporan Operasional + Keuangan dalam satu grup

Kita memisah: `Laporan` (5 tab) di ANALITIK, dan keuangan belum ada (Tahap 5).

Tidak perlu diubah sekarang, tapi catat supaya saat Tahap 5 dibangun,
laporannya tidak jadi grup terpisah lagi.

## Cara menilai — jangan cuma menghitung menu

Tiga ukuran yang lebih berarti daripada jumlah entri:

1. **Berapa klik dari dashboard ke pekerjaan paling sering?**
   Misalnya "catat barang masuk". Hitung di kedua aplikasi.
2. **Berapa baris terlihat sekaligus saat satu accordion dibuka?**
   Lebih dari 7-8 baris mulai terasa banyak. Ini yang diperbaiki di poin 5.
3. **Apakah penamaannya memakai istilah yang mereka pakai sehari-hari?**
   Cek ke Excel klien (`docs/TEMPLET PRODUKSI JAKET.xlsx`,
   `docs/_PRODUKSI OWNC.xlsx`) — sheet-nya memakai istilah asli mereka.

## Yang dikerjakan

1. Buka `https://oims-production-eta.vercel.app/dashboard` dan aplikasi kita
   berdampingan. Bandingkan **rasa**, bukan cuma daftar.
2. Hitung ketiga ukuran di atas untuk 3 pekerjaan tersering (catat barang masuk,
   buat PO, catat hasil QC).
3. Verifikasi keempat temuan di atas — mana yang nyata, mana yang tidak.
4. Susun daftar usulan perubahan, **dipisah** antara:
   - penamaan (murah, berdampak besar)
   - pengelompokan (sedang)
   - penggabungan halaman (mahal, sudah banyak dikerjakan di `app-z4wp`)
5. Bawa ke Abu untuk diputuskan. **Jangan langsung mengubah** — penamaan
   menyentuh banyak file dan sebagian sudah dipakai klien.

## Yang TIDAK dikerjakan

- Tidak menyalin struktur klien mentah-mentah. Cakupan kita lebih luas; memaksa
  masuk ke 8 grup mereka akan membuat menu yang isinya 10 entri.
- Tidak mengubah penamaan tanpa keputusan Abu.
- Tidak menghapus fitur yang mereka tidak punya. Kelengkapan itu nilai jual;
  yang harus diperbaiki adalah rasanya, bukan cakupannya.
