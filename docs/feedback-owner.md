# Feedback Owner — Demo Tahap 1

> Rapihan catatan demo. **Belum dikonfirmasi ke klien.**
> Poin ⭐ = perlu ditanyakan balik ke klien (ada contoh/analogi biar gampang).
> Bagian _"Catatan teknis (internal)"_ = untuk internal, tak perlu ditunjukkan ke klien.

---

## 1. Harga Bahan ⭐

**Yang klien mau:** harga bahan bisa dicatat, dan kalau bahan yang sama dibeli lagi dengan harga beda, harga itu tetap kelihatan (bukan langsung tercampur jadi satu angka).

**Tanyakan ke klien (pakai contoh ini):**

> "Misal beli **Kain Katun**:
> - Bulan lalu beli 10 meter, harga Rp 50.000/meter
> - Bulan ini beli 10 meter, harga naik Rp 55.000/meter
>
> Bapak mau lihatnya yang mana:
>
> **Pilihan A** — Tetap **1 bahan** 'Kain Katun', tapi ada **riwayat harga**: bisa lihat 'dulu beli 50rb, sekarang 55rb'. Stok gabung jadi 20 meter.
>
> **Pilihan B** — Jadi **2 baris terpisah**: 'Kain Katun 50rb' dan 'Kain Katun 55rb', masing-masing stoknya sendiri."

Jawaban ini menentukan cara kami buat. Kebanyakan bisnis pakai **Pilihan A** (lebih rapi), tapi kami ikut kebutuhan klien.

> **Catatan teknis (internal):** Pilihan A = kerjaan kecil (sistem sudah hitung harga rata-rata otomatis, tinggal tampilkan riwayatnya). Pilihan B = kerjaan besar (ubah cara sistem simpan bahan). Wajib tanya klien dulu sebelum mulai.

**Rencana input harga (form barang masuk):**
- Saat pilih bahan, muncul info **harga pembelian sebelumnya** (riwayat beberapa pembelian terakhir: tanggal + harga) sebagai acuan. User tetap ketik harga sendiri (tak auto-isi) — jadi kalau harga berubah, tinggal masukkan yang baru sambil lihat acuan.

**Kenapa ini penting (bukan sekадar tampilan):**
Harga bahan masuk itu dasar hitung **modal produk (HPP)** → menentukan **laba, harga jual, pajak, nilai stok**. Ini nyambung ke laporan keuangan (Tahap 5 nanti). Sistem sekarang sudah hitung **harga rata-rata** otomatis (metode paling umum & aman). Feedback klien soal 'harga real' cukup dijawab dengan **menampilkan riwayat harga** — metode hitungnya tetap sama, jadi tak ganggu keuangan nanti.

> **Catatan teknis (internal):** JANGAN arahkan ke Pilihan B (bahan jadi 2 entri per harga) — itu merusak weighted-average + HPP + bikin 1 bahan fisik jadi 2 identitas → laporan Tahap 5 kacau. Arahkan klien ke A (1 bahan + riwayat). Ganti metode costing = rombak besar + risiko integritas keuangan.

---

## 2. Master Warna ⭐

**Yang klien mau:** ada data master warna (bisa tambah/edit daftar warna, seperti daftar kategori/satuan yang sudah ada).

**Tanyakan ke klien:**

> "Warna ini mau dipakai gimana?
> - **(a)** Cuma daftar warna dulu (misal: Merah, Biru, Hitam), berdiri sendiri. ATAU
> - **(b)** Menempel ke bahan — tiap bahan punya warna (misal 'Kain Katun — Merah', 'Kain Katun — Biru')."

> **Catatan teknis (internal):** Kalau (b), warna jadi atribut bahan → berdampak ke identitas stok (bahan+warna bisa jadi SKU beda, mirip isu harga di poin 1). Kalau (a), cukup CRUD master baru seperti kategori. Tanya dulu sebelum plan.

---

## 3. Dashboard — Perbandingan & Bahan Terlaris

**Yang klien mau:**
- Lihat **perbandingan bulan ini vs bulan lalu** (jumlah transaksi naik atau turun).
- Ada **total transaksi** per periode.
- **10 bahan yang paling banyak keluar** (bahan terlaris/terpakai).

**Tanyakan ke klien (kecil saja):**

> "Untuk daftar 10 bahan paling banyak keluar — diurutkan dari yang **jumlah/kuantitas keluarnya** paling banyak, atau dari yang **nilai rupiahnya** paling besar?"

> **Catatan teknis (internal):** Paling siap dikerjakan — data sudah ada di `mutasi_stok` + `barang_keluar`, tinggal query agregat + widget. Perbandingan periode: default bulan-ini-vs-bulan-lalu + indikator naik/turun. Bisa dibuat dulu tanpa nunggu (interpretasi wajar), klien koreksi dari hasil jadi.

---

## Ringkasan

| # | Item | Perlu tanya klien? | Catatan |
|---|---|---|---|
| 1 | Harga bahan | ⭐ Ya — Pilihan A atau B (ada contoh Kain Katun) | Paling berisiko kalau salah tebak |
| 2 | Master warna | ⭐ Ya — daftar sendiri (a) atau nempel bahan (b) | — |
| 3 | Dashboard (perbandingan + top 10) | Kecil — cuma urutan top 10 (kuantitas/rupiah) | Bisa dibuat dulu, klien koreksi dari hasil |

**Langkah:** tanyakan poin ⭐ ke klien (pakai contoh di atas) → dashboard bisa mulai dikerjakan duluan sambil nunggu jawaban.
