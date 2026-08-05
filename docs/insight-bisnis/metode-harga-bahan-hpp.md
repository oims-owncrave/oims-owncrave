# Metode Harga Bahan & Dampaknya ke HPP / Keuangan

> **Untuk apa file ini:** referensi keputusan bisnis saat klien/kamu bahas soal harga bahan, modal produk (HPP), dan laporan keuangan. Bahasa awam — bukan buku akuntansi. Dibuat 2026-08-05 dari pembahasan feedback owner Tahap 1.

---

## Inti dalam 1 kalimat

**Cara sistem menentukan "harga bahan saat keluar" itu menentukan angka modal (HPP) → laba → pajak → nilai stok → laporan keuangan.** Salah pilih metode = semua angka di kanan ikut salah.

Rantai dampaknya:

```
Harga bahan masuk → HPP (modal per produk) → Laba & harga jual → Pajak & nilai persediaan → Laporan keuangan (Tahap 5)
```

---

## Kenapa ada "pilihan metode"?

Karena harga bahan yang sama **berubah tiap beli**. Contoh **Kain Katun**:
- Beli pertama: 10 meter @ Rp 50.000
- Beli kedua: 10 meter @ Rp 55.000
- Sekarang stok 20 meter, campur dua harga.

Saat keluar 5 meter untuk produksi — **harga mana yang dipakai buat hitung modal?** Di sinilah metode menentukan.

---

## 3 Metode + Dampak Nyata

Contoh sama: keluar **5 meter**.

| Metode | Harga dipakai | Modal 5m | Karakter | Kapan cocok |
|---|---|---|---|---|
| **Harga Terakhir** | Rp 55.000 (beli terbaru) | Rp 275.000 | Ikut harga terbaru. Saat harga naik, laba kelihatan lebih kecil (hati-hati). | Saat harga bahan sering naik (inflasi tinggi) |
| **Rata-rata Bergerak** ⭐ | Rp 52.500 (campuran) | Rp 262.500 | Halus, tak lompat-lompat. Paling stabil & umum. | **Default OIMS. Paling aman untuk kebanyakan bisnis.** |
| **FIFO** (masuk duluan, keluar duluan) | Rp 50.000 (stok lama dulu) | Rp 250.000 | Modal ikut stok tertua; sisa stok dinilai harga terbaru. | Barang gampang usang / retail & garmen |

**Selisih modal dari data yang SAMA:** 250rb vs 262rb vs 275rb. Selisih ini **langsung jadi selisih laba di laporan.**

---

## Dampak ke bisnis (kenapa gak boleh asal ganti)

1. **Laba beda-beda** — metode beda → angka laba beda, padahal transaksinya sama.
2. **Pajak** — laba beda → pajak beda.
3. **Nilai persediaan (aset)** — nilai stok sisa di neraca ikut berubah.
4. **Konsistensi wajib** — dalam akuntansi, metode TAK BOLEH gonta-ganti tiap bulan. Pilih satu, pakai terus. Ganti metode = harus alasan kuat + pengaruh ke laporan dijelaskan.

---

## Posisi OIMS sekarang

- **Sudah pakai Rata-rata Bergerak** (`bahan.harga_rata_rata` dihitung ulang tiap barang masuk, harga tiap transaksi juga disimpan).
- Ini metode paling umum & stabil → **fondasi sudah benar**, tak perlu diubah.

---

## Kaitan dengan Feedback Owner (harga "data real")

Klien minta "harga pakai data real". Yang dimaksud = **transparansi** (bisa lihat harga asli tiap pembelian), BUKAN minta ganti metode hitung.

**Jawaban yang benar:**
- ✅ **Tetap metode rata-rata** (aman untuk keuangan Tahap 5).
- ✅ **Tambah tampilan riwayat harga** — di form barang masuk, saat pilih bahan, muncul harga pembelian sebelumnya (tanggal + harga) sebagai acuan.
- Hasil: klien dapat transparansi yang dia mau, metode hitung tak berubah, keuangan nanti tak terganggu.

**Yang HARUS dihindari:**
- ❌ Bikin bahan sama jadi 2 entri terpisah per harga ("Katun 50rb" & "Katun 55rb"). Ini merusak rata-rata + HPP, dan bikin 1 bahan fisik jadi 2 identitas → stok & laporan kacau.

---

## Untuk keputusan masa depan (Tahap 5 — Keuangan/HPP)

Saat bangun HPP & laporan keuangan nanti:
- HPP produk = turunan dari harga rata-rata bergerak bahan ini (sudah konsisten).
- Kalau suatu saat klien minta ganti metode (mis. ke FIFO), itu **keputusan besar** — perlu: alasan bisnis jelas, migrasi data historis, dan penjelasan dampak ke laporan. Jangan ambil ringan.
- Prinsip: **1 metode, konsisten, transparan.** Transparansi (lihat harga real) bisa ditambah tanpa ganti metode.
