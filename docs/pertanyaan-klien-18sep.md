# Pertanyaan untuk Klien — 18 Sep 2026

> Kumpulan pertanyaan terbuka dari beberapa sesi kerja, digabung jadi satu daftar
> supaya tidak tercecer. Bagian **"Catatan internal"** tidak perlu ditunjukkan ke
> klien — itu untuk kita sendiri.
>
> Cara pakai: kirim bagian pertanyaannya saja. Begitu ada jawaban, catat balik ke
> kartu beads yang disebut di tiap poin, lalu centang di sini.

---

## 📋 Versi siap kirim WA (salin dari sini sampai garis penutup)

```
Pak, ada beberapa hal yang perlu saya tanyakan biar aplikasinya pas sama cara
kerja di lapangan. Kalau berkenan dijawab yang mana dulu juga tidak apa-apa —
nomor 1-3 yang paling saya butuhkan.

1. Siapa saja yang perlu bisa masuk ke aplikasi? Sebutkan nama + tugasnya.
   Misalnya staf gudang yang antar/terima barang, admin produksi, petugas QC.
   Nanti saya buatkan akunnya. (Sekarang baru ada 1 akun: Owner)

2. Untuk tempat jahit — mau dibuat 2 daftar terpisah (Perusahaan/CV sendiri,
   Penjahit perorangan sendiri), atau 1 daftar saja berisi semuanya?
   Bedanya terasa waktu bayar: perusahaan biasanya pakai rekening + termin,
   perorangan biasanya upah langsung.

3. Siapa yang memeriksa hasil jahitan (QC) di lapangan sekarang? Ada orang
   khusus, atau dikerjakan orang yang sama dengan yang urus produksi?

4. Ada 3 resleting yang ukurannya kayaknya salah ketik:
   - Vision GMC No5 24Inch/66cm
   - Vision GMC No5 30Inch/66cm
   - Vision GMC No5 32Inch/66cm
   Incinya beda-beda (24, 30, 32) tapi cm-nya sama semua 66cm. Yang benar
   berapa ya? (Yang lain sudah benar, misal 28inch/71cm)

5. Kalau bahan keluar dari gudang, itu selalu untuk pesanan/PO tertentu, atau
   ada juga yang keluar bukan untuk pesanan? Misal buat sampel atau perbaikan.

6. Soal "Lebihan" yang kemarin Bapak jelaskan (jaga-jaga barang hilang/kurang) —
   itu dipakai juga waktu menentukan jumlah produksi? Misal mau jual 100 pcs
   tapi diproduksi 105 pcs. Atau lebihan cuma untuk bahan saja?

7. Untuk produk yang ada sablon/bordir — sablon selalu dikerjakan sebelum kain
   dijahit, atau pernah ada yang disablon setelah jadi baju?

8. Sehari-hari Bapak menyebutnya "WIF" atau "PO Produksi"? Di gambar skema
   Bapak tertulis WIF, di aplikasi saya pakai PO Produksi. Saya ikut istilah
   yang biasa dipakai saja biar tidak bingung.

9. Finishing dan Packing itu menurut Bapak bagian dari pemeriksaan (QC), atau
   bagian dari gudang? Saya mau taruh menunya sesuai cara Bapak memandang.

Terima kasih Pak 🙏
```

---

## Urutan prioritas

Kalau tidak bisa tanya semua sekaligus, dahulukan **1-3** — ketiganya menahan
pekerjaan yang sudah siap jalan.

| # | Pertanyaan | Menahan | Kartu |
|---|---|---|---|
| 1 | Daftar staf untuk sistem | 6 form (Pengirim/PIC/Penerima) | `app-gtf4.1` |
| 2 | Konveksi: satu daftar atau dua? | Sambungan penjahit & vendor | `app-gtf4.1` |
| 3 | Siapa periksa QC di lapangan | Role & pembagian akses | `app-x98y` |
| 4 | Angka 66cm yang salah | Pembersihan nama bahan | `app-gtf4.4` |
| 5 | Barang keluar selalu untuk PO? | Sambungan barang keluar → PO | `app-gtf4.5` |
| 6 | Lebihan Pcs di level produk jadi | Field di form PO Produksi | `app-itl4` |
| 7 | Urutan sablon vs jahit | Aturan validasi dekorasi | `app-x98y` |
| 8 | Istilah: WIF atau PO Produksi? | Penamaan menu | `app-x98y` |
| 9 | Finishing/Packing masuk QC atau Gudang? | Pengelompokan menu | `app-x98y` |

---

## 1. Siapa saja yang perlu bisa masuk ke sistem? ⭐

Sekarang yang terdaftar baru **satu orang** (Owner). Padahal di beberapa form ada
isian nama orang — misalnya "Pengirim" waktu kirim barang ke penjahit, "PIC" di
lokasi produksi, "Penerima" waktu barang datang.

Sekarang isian itu masih **diketik manual**. Rencananya diganti jadi **pilih dari
daftar**, supaya tidak ada salah ketik nama.

**Pertanyaannya:**

> "Siapa saja orang yang perlu didaftarkan di sistem? Misalnya: staf gudang yang
> biasa antar/terima barang, admin produksi, petugas QC. Cukup sebutkan nama dan
> perannya — nanti kami buatkan akunnya."

**Catatan internal:** setiap nama = 1 akun login (username + password). Username
pakai pola peran (`gudang1`, `produksi1`) bukan nama orang, supaya kalau ganti
orang tinggal nonaktifkan akun lama + buat baru — riwayat transaksi tidak
tertukar. Kartu: `app-gtf4.1`. 6 form yang menunggu: Pengiriman Vendor, Lokasi
Produksi, Gudang Barang Jadi, Pekerjaan Dekorasi, Penerimaan QC.

---

## 2. "Konveksi" itu satu daftar atau dua? ⭐

Di Excel produksi, kolom **Konveksi** isinya campur: ada nama orang (*Mas Faizin*,
*Pak Bongki*), ada tim internal (*Internal, A Jajang*), ada nama daerah (*Tasik*,
*Cipedes*).

Di sistem, kami memisahkan jadi dua daftar: **Vendor** (perusahaan/CV) dan
**Penjahit** (perorangan).

**Pertanyaannya:**

> "Untuk tempat jahit — di sistem mau dibuat **dua daftar terpisah** (Perusahaan/CV
> sendiri, Penjahit perorangan sendiri), atau **satu daftar saja** berisi semuanya?
>
> Bedanya nanti terasa waktu pembayaran: perusahaan biasanya pakai rekening dan
> termin, kalau perorangan biasanya upah langsung. Kalau dipisah, pencatatannya
> lebih rapi. Kalau digabung, isinya lebih cepat."

**Catatan internal:** PRD sudah memisah jadi 2 master, tapi itu asumsi kami —
belum pernah dikonfirmasi. Detail lengkap: `docs/insight-bisnis/istilah-vendor-penjahit-konveksi.md`.
Kartu: `app-gtf4.1`.

---

## 3. Siapa yang memeriksa barang (QC) di lapangan? ⭐

Sekarang di sistem, pemeriksaan QC bisa dilakukan oleh admin produksi — belum ada
peran khusus QC.

**Pertanyaannya:**

> "Siapa yang sebenarnya memeriksa hasil jahitan di lapangan sekarang? Apakah ada
> orang khusus yang tugasnya memeriksa, atau dikerjakan orang yang sama dengan
> yang mengurus produksi?"

**Catatan internal:** idealnya QC terpisah dari produksi — orang cenderung tidak
menilai hasil kerjanya sendiri dengan jujur. Tapi kalau timnya kecil, merangkap
itu wajar, yang penting jejaknya tercatat. Kalau ada orangnya → buat role
`admin_qc`. Kartu: `app-x98y`.

---

## 4. Ukuran resleting yang tertulis salah ⭐

Ada 3 bahan resleting yang ukurannya janggal:

| Kode | Nama sekarang |
|---|---|
| BH-TR-SLG-005 | Vision GMC No5 **24Inch**/66cm |
| BH-TR-SLG-009 | Vision GMC No5 **30Inch**/66cm |
| BH-TR-SLG-010 | Vision GMC No5 **32Inch**/66cm |

Ketiganya ukuran inci-nya berbeda (24, 30, 32) tapi **sentimeternya sama semua:
66cm**. Padahal yang benar, 24 inci ≈ 61cm, 30 inci ≈ 76cm, 32 inci ≈ 81cm.

Bandingkan dengan yang sudah benar: `BH-TR-SLG-001 28inch/71cm`.

**Pertanyaannya:**

> "Untuk 3 resleting ini, yang benar ukuran berapa? Kelihatannya angka cm-nya
> salah ketik — ketiganya tertulis 66cm padahal incinya beda-beda."

**Catatan internal:** ini fakta produksi, tidak boleh kita tebak sendiri. Kartu:
`app-gtf4.4`. Perbaikan nama bahan (buang ukuran dari nama) menunggu ini.

---

## 5. Bahan keluar dari gudang — selalu untuk pesanan tertentu? ⭐

**Pertanyaannya:**

> "Kalau ada bahan keluar dari gudang, itu **selalu** untuk pesanan/PO tertentu,
> atau ada juga yang keluar bukan untuk pesanan? Misalnya untuk bikin sampel, atau
> untuk perbaikan barang."

**Catatan internal:** menentukan apakah kolom `poId` di barang keluar boleh kosong
(nullable) atau wajib. Kartu: `app-gtf4.5` (sudah ditutup, tapi keputusannya
dicatat di `docs/insight-bisnis/audit-kolom-teks-vs-master.md`).

---

## 6. "Lebihan" — perlu juga untuk produk jadi? ⭐

Klien sudah menjelaskan: di Excel, kolom **Lebihan** diisi manual untuk jaga-jaga
kalau ada barang hilang atau kurang. Itu sudah jelas untuk **bahan**.

**Pertanyaannya:**

> "Konsep 'lebihan untuk jaga-jaga' ini, apakah juga dipakai waktu menentukan
> **target jumlah produksi**? Misalnya mau jual 100 pcs, tapi diproduksi 105 pcs
> untuk jaga-jaga ada yang cacat.
>
> Atau lebihan cuma dipakai untuk bahan saja, sedangkan jumlah produksi ditentukan
> pas sesuai target?"

**Catatan internal:** kalau jawabannya "ya perlu" → field yang ada sekarang sudah
tepat, tutup kartu tanpa ubah kode. Kalau "tidak perlu" → pertimbangkan hapus
(dipakai di 7 file). Kartu: `app-itl4`. **JANGAN** bikin auto-hitung rasio —
klien sudah bilang mau isi manual.

---

## 7. Sablon dikerjakan sebelum atau sesudah dijahit? ⭐

**Pertanyaannya:**

> "Untuk produk yang ada sablon/bordirnya — sablon itu selalu dikerjakan **sebelum**
> kain dijahit, atau pernah ada yang disablon setelah jadi baju?"

**Catatan internal:** sistem sekarang membiarkan urutannya bebas (tidak dipaksa).
Kalau di lapangan sablon SELALU duluan, sebaiknya dikunci supaya tidak salah
input. Kartu: `app-x98y`.

---

## 8. Istilah: "WIF" atau "PO Produksi"?

Di gambar skema yang klien kirim, tertulis **"WIF"** (*Buat WIF / Order Produksi*).
Di aplikasi kami pakai istilah **"PO Produksi"**.

**Pertanyaannya:**

> "Sehari-hari Bapak menyebutnya apa — WIF atau PO Produksi? Kami ikut istilah yang
> biasa dipakai, biar tidak bingung."

**Catatan internal:** murah diperbaiki (ganti label menu). Sejalan dengan pola
proyek: istilah aplikasi ikut bahasa klien. Kartu: `app-x98y`.

---

## 9. Finishing & Packing — bagian QC atau Gudang?

Di aplikasi, menu **Finishing**, **Packing**, dan **Stok Barang Jadi** ada di dalam
grup *Quality Control*.

Tapi di gambar skema klien, urutannya: QC → **Penerimaan Gudang** → Stok Jaket Jadi
(tiga kotak terpisah).

**Pertanyaannya:**

> "Finishing dan Packing itu menurut Bapak bagian dari **pemeriksaan (QC)**, atau
> bagian dari **gudang**? Kami mau menaruh menunya sesuai cara Bapak memandang."

**Catatan internal:** app vibe-coding klien juga menaruh Finishing/Packing di luar
grup QC — dua sumber terpisah sama-sama begitu. Kartu: `app-x98y`.

---

## Sudah terjawab (arsip)

### ✅ Label Size Chart — ukuran di BOM, bukan master bahan
Dijawab 18 Sep: *"ini label size, hanya beda tiap ukuran saja"* + rujukan ke Excel
(sudah dibuat per size untuk kebutuhan produk). Keputusan: ukuran ditentukan di BOM,
nama bahan tinggal dibersihkan. Detail: `docs/insight-bisnis/ukuran-bahan-di-bom-bukan-master.md`
