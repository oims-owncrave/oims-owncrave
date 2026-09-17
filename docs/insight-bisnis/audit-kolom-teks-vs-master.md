# Audit 12 kolom teks: mana FK terselubung, mana yang memang bebas

> Hasil app-gtf4.5, dikerjakan 17 Sep 2026. Kriteria dari kartunya sendiri:
> **"kalau ini salah ketik, ada yang rugi?"** Ya → FK. Tidak → teks bebas, dan alasannya
> ditulis supaya tidak diaudit ulang tiap kuartal.
>
> Sumber: `src/db/schema.ts`, pemakaian di `src/services|lib|app`, dan isi DB dev
> (`fzkszkhjswtcugrqjzgx`) per 17 Sep.

## Ringkasan keputusan

| # | Kolom | Putusan | Alasan singkat |
|---|---|---|---|
| 1 | `barangKeluar.tujuan` :566 | **FK opsional ke `poProduksi`** + sisakan teks | Tujuan sebenarnya = PO. Sudah ada autofill dari PB, jadi niatnya memang tertaut |
| 2 | `varianProduk.jenisKelamin` :686 | **pgEnum** | Daftar tertutup 3 nilai, sudah Select di UI, tapi jalur import Excel bisa menitip nilai apa pun |
| 3 | `lokasiProduksi.pic` :1025 | **FK ke `users`** (tunggu staf terdaftar) | `workOrderCutting.pic` sudah FK users — ini tertinggal, bukan pilihan desain |
| 4 | `pekerjaanDekorasi.pengirim` :1445 | **FK ke `users`** (tunggu staf) | Staf internal yang menyerahkan; pola sama dengan pengiriman jahit |
| 5 | `penerimaanDekorasi.penerima` :1465 | **teks bebas, TETAP** | Orang di pihak vendor, bukan staf kita. Tidak ada masternya |
| 6 | `kemasan.bahanKemasan` :1509 | **teks bebas, TETAP** | Sudah ada komentar eksplisit di schema:1500. Spesifikasi material, bukan entitas |
| 7 | `gudangBarangJadi.picNama` :1537 | **FK ke `users`** (tunggu staf) | Sama dengan no.3 |
| 8 | `penerimaanQc.penerima` :1566 | **FK ke `users`** (tunggu staf) | Petugas QC internal. `lokasiId` di baris atasnya sudah FK |
| 9 | `karantinaReject.lokasiSimpan` :1916 | **teks bebas, TETAP** | Lokasi fisik ad-hoc ("rak karantina A"). Sejalan dengan schema:1527 (rak sengaja bukan tabel) |
| 10 | `mutasiBarangJadi.referensiTipe` :2158 | **pgEnum** | 4 nilai, semua ditentukan kode, nol input user |
| 11 | `transferBarangJadi.pengirim` :2179 | **FK ke `users`** (tunggu staf) | Belum ada form — paling murah diubah sekarang |
| 12 | `transferBarangJadi.penerima` :2180 | **FK ke `users`** (tunggu staf) | Sama. `penerimaanBarangJadi.penerimaId` sudah FK users, ini tertinggal |
| 13 | `pengirimanJahit.kendaraan` :1177 | **teks bebas, TETAP** | Plat nomor/jenis mobil. Salah ketik = nol rugi, cuma catatan pelengkap surat jalan |
| 14 | `pengirimanJahit.kurir` :1178, `penerimaanHasilJahit.kurirResi` :1319, `pekerjaanDekorasi.kurir` :1446 | **teks bebas, TETAP** | Nama ekspedisi (JNE/J&T) + no. resi. Pihak eksternal publik, kita tidak punya dan tidak perlu master ekspedisi |

Rekap: **6 jadi FK ke users**, **2 jadi pgEnum**, **1 FK ke PO**, **5 tetap teks bebas**.

Catatan: kolom 13-14 ditemukan 18 Sep saat cek form Pengiriman Vendor langsung (bukan dari
grep awal `schema.ts`) — bukti bahwa 24 kolom di kartu epic bukan hitungan final. Kalau nanti
nemu kolom lain yang terlewat, tambahkan di sini juga, jangan diputuskan sambil lalu di chat.

## PENGHALANG UTAMA: master `users` baru berisi 1 baris

DB dev: `users` = **1 baris** (`Owner Owncrave`, role `owner`). Staf gudang, admin produksi,
petugas QC belum terdaftar.

Artinya 6 keputusan "FK ke users" **tidak bisa dieksekusi sekarang** — dropdown-nya akan
cuma berisi satu nama, dan form jadi mustahil diisi dengan benar. Ini bukan soal teknis:
klien harus mendaftarkan stafnya lebih dulu.

Urutan yang benar:
1. Klien daftarkan staf ke menu Pengguna (siapa saja yang mengantar, menerima, jadi PIC)
2. Baru 6 kolom itu diubah jadi FK

Kalau dibalik, hasilnya form yang tidak bisa dipakai.

**Yang tidak terhalang ini:** no.2 dan no.10 (pgEnum), no.1 (FK ke PO), dan 3 kolom yang
tetap teks. Itu bisa dikerjakan tanpa menunggu siapa pun.

## Alasan per kolom

### 1. `barangKeluar.tujuan` → FK opsional ke `poProduksi`

Komentar kodenya sendiri menulis contoh `"Cutting PO-001"`, dan form sudah autofill
`"<nomor PB> / <nomor PO>"` dari permintaan bahan (`BarangKeluarForm.tsx:103-104`). Jadi
yang dimaksud memang PO — cuma disimpan sebagai kalimat.

Ruginya kalau salah ketik: bahan keluar tidak terhubung ke PO mana pun, sehingga biaya
bahan tidak bisa dibebankan ke PO. Itu langsung memukul HPP di Tahap 5.

Bentuk: tambah `poId` FK nullable, **teks `tujuan` tetap dipertahankan** untuk keperluan
non-PO (mis. "sampel", "perbaikan internal"). Bukan menggantikan.

### 2. `varianProduk.jenisKelamin` → pgEnum

Nilainya cuma `Pria`, `Wanita`, `Unisex`. UI sudah `<Select>`, tapi daftar itu
**diduplikasi di 2 file** (`VarianEditModal.tsx:24`, `VarianGenerateModal.tsx:18`) dan
**jalur import Excel melewati Select sepenuhnya** (`services/import.ts:565,606` menerima
apa pun isi sel).

Jadi ruginya nyata: import Excel bisa memasukkan `"Laki-laki"`, `"pria"`, `"L"` — lalu
filter/laporan per jenis kelamin pecah tanpa error.

Proyek ini punya 56 pgEnum, konvensinya jelas (nilai snake_case lowercase). Catatan
penting dari audit: **nama enum tidak pernah di-import ke luar `schema.ts`** — daftar
dropdown selalu ditulis ulang manual. Jadi menambah pgEnum **tidak otomatis** memperbaiki
UI; opsi Select harus tetap disamakan tangan.

Nilai enum: `pria`, `wanita`, `unisex` (lowercase, ikut konvensi). Label UI tetap kapital.

### 3, 4, 7, 8, 11, 12. Enam kolom orang → FK ke `users`

Semua ini menyimpan **nama staf internal Owncrave**. Bukti bahwa ini memang seharusnya
FK sudah ada di repo sendiri — polanya dipakai di tempat lain:

| Sudah FK ke users | Masih teks |
|---|---|
| `workOrderCutting.pic` :843 (ComboSelect) | `lokasiProduksi.pic` :1025 |
| `karantinaReject.picId` :1917 (ComboSelect) | `gudangBarangJadi.picNama` :1537 |
| `penerimaanBarangJadi.penerimaId` :2092 (ComboSelect) | `transferBarangJadi.penerima` :2180 |
| `createdBy` di hampir semua tabel transaksi | `penerimaanQc.penerima` :1566 |

Jadi ini **inkonsistensi**, bukan perbedaan sengaja. Di `karantinaReject` bahkan mencolok:
`picId` pakai ComboSelect, `lokasiSimpan` di baris sebelahnya pakai Input — satu tabel,
dua gaya.

Ruginya kalau salah ketik: tidak bisa menghitung beban kerja per orang, tidak bisa melacak
siapa menerima barang saat terjadi selisih. "Bu Nur" dan "Bu nur" jadi dua orang.

**Kenapa `created_by` tidak cukup:** `created_by` = siapa yang mengetik entri. `penerima` =
siapa yang menerima barang secara fisik. Sering orang berbeda (admin mengetik, staf gudang
menerima). Keduanya perlu.

Prasyarat: master users terisi (lihat bagian penghalang di atas).

### 5. `penerimaanDekorasi.penerima` → tetap teks bebas

Berbeda dari 6 di atas: ini **orang di pihak vendor dekorasi**, bukan staf kita. Kita tidak
punya master untuk karyawan vendor, dan membuatnya berlebihan — kita tidak mengelola
kepegawaian vendor.

Ruginya kalau salah ketik: nyaris nol. Nama ini fungsinya bukti serah terima di surat
jalan, bukan dimensi laporan.

Catatan: `penerimaanBundelVendor.penerima` (app-gtf4.1) juga kasus ini — "siapa yang
menerima di vendor". Jadi dari 6 kolom di gtf4.1, tidak semuanya jadi FK.

### 6. `kemasan.bahanKemasan` → tetap teks bebas

Sudah ada komentar eksplisit di `schema.ts:1500`:
`// bahanKemasan = teks deskriptif (mis. "PE 0.05mm"), BUKAN FK — kemasan bukan bahan produksi.`

Keputusan ini sudah pernah diambil dan beralasan. Isinya spesifikasi material
(`"PE 0.05mm"`), bukan nama entitas. Dimensi terstrukturnya sudah ada di sebelahnya:
`jenis` (kemasanJenisEnum) + `supplierId` (FK).

### 9. `karantinaReject.lokasiSimpan` → tetap teks bebas

Isinya lokasi fisik ad-hoc: `"Rak karantina A"`. Membuat master untuk rak berarti klien
harus mendaftarkan tiap rak sebelum memakainya — beban administratif yang tidak sebanding.

Sejalan dengan keputusan yang sudah ada di `schema.ts:1527`:
`Rak = kolom teks di barang_jadi_detail, sengaja bukan tabel.`

Ruginya kalau salah ketik: barang karantina sulit dicari secara fisik, tapi jumlah dan
statusnya tetap benar — tidak ada angka yang salah.

### 10. `mutasiBarangJadi.referensiTipe` → pgEnum

Daftar tertutup, **4 nilai, semuanya ditulis kode**, nol input user, nol zod schema:

| Nilai | Lokasi |
|---|---|
| `barang_jadi` | `services/barang-jadi.ts:271` |
| `tindakan_reject` | `services/barang-jadi.ts:339` |
| `transfer_barang_jadi` | `services/transfer-fg.ts:230,250,271` |
| `penyesuaian_stok_fg` | `services/transfer-fg.ts:376` |

Kolom `jenis` di tabel yang sama sudah pakai `mutasiFgJenisEnum`. Jadi enum untuk
`referensiTipe` ikut pola tetangganya.

Ruginya kalau salah ketik: salah ketik di kode (bukan user) → mutasi tidak bisa dilacak ke
dokumen asalnya. Index `mutasi_fg_referensi_idx` jadi tidak berguna. Enum menutup ini di
tingkat DB.

Catatan: `referensiId` sengaja tanpa `.references()` (polymorphic, menunjuk beberapa tabel).
Itu benar dan tidak perlu diubah — yang dikunci cuma tipenya.

## Urutan kerja yang disarankan

**Tanpa menunggu siapa pun** (bisa sekarang):
1. `referensiTipe` → pgEnum. Paling aman: nol input user, nol UI tersentuh.
2. `jenisKelamin` → pgEnum + satukan daftar opsi yang terduplikasi + tutup lubang import Excel.
3. `transferBarangJadi.pengirim/penerima` → FK. **Belum ada form**, jadi nol UI rusak.
   (Dropdown-nya tetap kosong sampai staf terdaftar, tapi skemanya sudah benar.)
4. Tulis komentar alasan di 3 kolom yang tetap teks (no.5, 6, 9) supaya tidak diaudit ulang.

**Perlu klien mendaftarkan staf lebih dulu:**
5. `lokasiProduksi.pic`, `gudangBarangJadi.picNama`, `pekerjaanDekorasi.pengirim`,
   `penerimaanQc.penerima` → FK ke users + ganti Input jadi ComboSelect.

**Perlu keputusan bentuk:**
6. `barangKeluar.tujuan` → FK ke PO. Perlu dipastikan: apakah barang keluar SELALU untuk
   PO, atau ada yang memang bukan (sampel, perbaikan)? Kalau ada, `poId` nullable + teks
   tetap. Kalau selalu, `poId` notNull dan teks dibuang.

## Yang perlu ditanyakan ke klien (gabung dengan pertanyaan Konveksi)

1. **Daftarkan staf siapa saja ke menu Pengguna?** Siapa yang biasanya mengantar bundel,
   menerima setoran, jadi PIC lokasi/gudang, dan jadi petugas QC. Tanpa ini, 6 kolom di
   atas tidak bisa diperbaiki.
2. **Barang keluar selalu untuk PO produksi, atau ada keperluan lain?** (menentukan
   `poId` nullable atau tidak)

Pertanyaan Konveksi (vendor vs penjahit) ada di
[istilah-vendor-penjahit-konveksi.md](istilah-vendor-penjahit-konveksi.md).

## Catatan untuk pelaksana

- Migrasi dev **lewat `psql`**, bukan `drizzle-kit generate` (snapshot drizzle sudah tidak
  konsisten: journal mencatat `0002` tanpa file SQL-nya). Folder `drizzle/` juga tidak
  ter-track git.
- Pola FK yang diikuti: `<tabel>_<kolom>_<target>_<kolomtarget>_fk`, contoh nyata
  `karantina_reject_pic_id_users_id_fk`.
- Pola ComboSelect user yang sudah benar: `qc/stok-jadi/_components/StokJadiPageClient.tsx:177-181`
  — filter `isActive || id === nilaiTersimpan` supaya nilai lama tetap tampil walau user
  sudah dinonaktifkan. Ikut ini, jangan filter `isActive` saja.
- Menambah pgEnum **tidak** otomatis menyetir dropdown — opsi di komponen ditulis manual.
  Samakan tangan, dan jangan tinggalkan daftar terduplikasi seperti `JENIS_KELAMIN_OPTIONS`.
