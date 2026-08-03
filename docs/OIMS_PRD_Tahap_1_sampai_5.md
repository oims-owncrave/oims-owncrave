# OWNCRAVE INTEGRATED MANAGEMENT SYSTEM (OIMS)

## Kumpulan Product Requirements Document Tahap 1–5

**Nama aplikasi:** Owncrave Integrated Management System  
**Singkatan:** OIMS  
**Platform:** Google Apps Script Web App  
**Database:** Google Spreadsheet  
**Frontend:** HTML, CSS, JavaScript  
**Backend:** Google Apps Script  
**Status dokumen:** Konsolidasi PRD Tahap 1–5  
**Catatan:** Tahap 6 baru dibahas secara konsep dan belum dibuat sebagai PRD lengkap.

---

# DAFTAR ISI

1. [Gambaran Umum Sistem](#gambaran-umum-sistem)
2. [PRD Tahap 1 — Inventory Bahan dan Fondasi Sistem](#prd-tahap-1--inventory-bahan-dan-fondasi-sistem)
3. [PRD Tahap 2 — Produksi, Cutting, dan Bundling](#prd-tahap-2--produksi-cutting-dan-bundling)
4. [PRD Tahap 3 — Penjahitan Internal, Vendor Eksternal, dan Monitoring WIP](#prd-tahap-3--penjahitan-internal-vendor-eksternal-dan-monitoring-wip)
5. [PRD Tahap 4 — Quality Control, Finishing, Packing, dan Barang Jadi](#prd-tahap-4--quality-control-finishing-packing-dan-barang-jadi)
6. [PRD Tahap 5 — Keuangan, HPP, Hutang, Kas, dan Laporan Keuangan](#prd-tahap-5--keuangan-hpp-hutang-kas-dan-laporan-keuangan)
7. [Catatan Tahap 6](#catatan-tahap-6)

---

# GAMBARAN UMUM SISTEM

OIMS dirancang sebagai **satu aplikasi terintegrasi** dengan tiga kelompok modul utama:

1. **Inventory**
2. **Produksi/WIP**
3. **Keuangan**

Aplikasi dibangun bertahap agar stabil, mudah diuji, dan tidak mengganggu kegiatan operasional Owncrave.

Alur besar sistem:

```text
Pembelian Bahan
→ Barang Masuk
→ Stok Bahan
→ Barang Keluar
→ Cutting
→ Bundling
→ Penjahit Internal/Vendor
→ QC
→ Finishing
→ Packing
→ Barang Jadi
→ HPP
→ Laporan Keuangan
```

Prinsip utama:

- Satu aplikasi, tetapi kode modular.
- Satu sumber data utama.
- Setiap transaksi memiliki ID dan nomor dokumen.
- Stok tidak diedit langsung.
- Semua pergerakan dicatat melalui transaksi dan mutasi.
- Data yang sudah digunakan memakai soft delete.
- Setiap aktivitas penting memiliki audit trail.
- Dashboard owner berisi informasi yang dapat digunakan untuk mengambil keputusan.
- Data kuantitas tidak boleh mencampur satuan yang berbeda.
- Proses besar memakai batch read, batch write, pagination, cache, dan LockService.

---

# PRD TAHAP 1 — INVENTORY BAHAN DAN FONDASI SISTEM

## 1. Tujuan

Tahap 1 membangun fondasi aplikasi dan modul inventory bahan.

Tujuan:

- Mengetahui stok bahan aktual.
- Mengetahui riwayat bahan masuk dan keluar.
- Mengetahui nilai persediaan bahan.
- Mengurangi kesalahan pencatatan manual.
- Mencegah stok negatif.
- Menyediakan login, hak akses, dashboard, dan audit log.
- Menyiapkan titik integrasi ke proses cutting.

## 2. Ruang Lingkup

1. Setup database.
2. Sistem login.
3. Hak akses pengguna.
4. Dashboard inventory.
5. Master kategori.
6. Master satuan.
7. Master supplier.
8. Master bahan.
9. Barang masuk.
10. Barang keluar.
11. Stok bahan.
12. Mutasi stok.
13. Penyesuaian stok.
14. Stok minimum.
15. Nilai persediaan.
16. Log aktivitas.
17. Pengaturan aplikasi.
18. Fondasi integrasi ke produksi.

## 3. Jenis Pengguna

### Owner

- Akses penuh.
- Melihat seluruh dashboard dan laporan.
- Menyetujui penyesuaian stok.
- Mengelola pengguna dan hak akses.
- Membuka transaksi terkunci.
- Melihat audit log.

### Admin Gudang

- Mengelola master bahan.
- Mencatat barang masuk dan keluar.
- Melihat stok dan mutasi.
- Mengajukan penyesuaian stok.
- Tidak dapat mengubah pengaturan sistem atau laporan keuangan.

### Admin Produksi

- Melihat stok.
- Melihat barang keluar ke produksi.
- Melihat referensi PO dan tujuan cutting.

### Keuangan

- Melihat harga bahan.
- Melihat transaksi supplier.
- Melihat nilai persediaan.
- Mengekspor laporan pembelian.

### Viewer

- Hanya melihat dashboard dan laporan tertentu.

## 4. Struktur Menu

```text
DASHBOARD

INVENTORY
├── Master Bahan
├── Master Kategori
├── Master Satuan
├── Master Supplier
├── Barang Masuk
├── Barang Keluar
├── Penyesuaian Stok
├── Stok Bahan
└── Mutasi Stok

PRODUKSI
└── Barang Keluar ke Cutting

LAPORAN
├── Barang Masuk
├── Barang Keluar
├── Stok
├── Mutasi
├── Stok Minimum
└── Nilai Persediaan

SISTEM
├── Pengguna
├── Hak Akses
├── Log Aktivitas
└── Pengaturan
```

## 5. Dashboard Tahap 1

### Kartu ringkasan

- Total jenis bahan aktif.
- Total supplier aktif.
- Total nilai stok bahan.
- Barang masuk bulan berjalan.
- Barang keluar bulan berjalan.
- Jumlah bahan di bawah stok minimum.
- Jumlah transaksi hari ini.

### Grafik

- Barang masuk per bulan.
- Barang keluar per bulan.
- Nilai persediaan per kategori.
- Bahan paling banyak digunakan.
- Supplier dengan pembelian tertinggi.

### Perlu perhatian

- Bahan stok kritis.
- Transaksi menunggu persetujuan.
- Penyesuaian stok menunggu persetujuan.
- Barang keluar tanpa tujuan produksi.
- Anomali atau stok negatif.

## 6. Master Kategori

Contoh kategori:

- Bahan utama.
- Bahan luar.
- Bahan dalam.
- Furing.
- Resleting.
- Benang.
- Kancing.
- Tali.
- Stopper.
- Label.
- Packaging.
- Aksesoris lainnya.

Data:

- ID kategori.
- Kode kategori.
- Nama kategori.
- Deskripsi.
- Status aktif.
- Dibuat oleh.
- Tanggal dibuat.
- Diubah oleh.
- Tanggal diubah.

Aturan:

- Kode unik.
- Nama wajib diisi.
- Tidak boleh dihapus jika sudah digunakan.
- Dapat dinonaktifkan.

## 7. Master Satuan

Contoh:

- Meter.
- Yard.
- Kilogram.
- Gram.
- Pcs.
- Roll.
- Lusin.
- Set.
- Box.
- Pak.
- Cone.

Data:

- ID satuan.
- Kode.
- Nama.
- Singkatan.
- Digit desimal.
- Status.

## 8. Master Supplier

Data:

- ID supplier.
- Kode supplier.
- Nama supplier.
- Nama kontak.
- Telepon.
- Email.
- Alamat.
- Kota.
- Rekening.
- Bank.
- Pemilik rekening.
- Termin pembayaran.
- Catatan.
- Status aktif.

Aturan:

- Nama supplier wajib.
- Nomor supplier otomatis.
- Supplier yang memiliki transaksi tidak boleh dihapus permanen.
- Dapat dinonaktifkan.

## 9. Master Bahan

Data:

- ID bahan.
- Kode bahan.
- Nama bahan.
- Kategori.
- Jenis.
- Warna.
- Spesifikasi.
- Supplier utama.
- Satuan.
- Harga rata-rata.
- Harga pembelian terakhir.
- Stok awal.
- Stok minimum.
- Lokasi penyimpanan.
- Nomor rak.
- Foto.
- Catatan.
- Status.

Format kode:

```text
BH-[KATEGORI]-[NOMOR]
```

Contoh:

```text
BH-KAIN-0001
BH-FUR-0001
BH-RSL-0001
```

Aturan:

- Kode unik.
- Nama, kategori, dan satuan wajib.
- Saldo stok tidak diedit langsung dari master.
- Bahan yang sudah digunakan hanya dapat dinonaktifkan.

## 10. Barang Masuk

Sumber:

- Pembelian supplier.
- Retur produksi.
- Retur vendor.
- Transfer gudang.
- Penyesuaian bertambah.
- Stok awal.

Header:

- ID transaksi.
- Nomor barang masuk.
- Tanggal.
- Supplier.
- Nomor invoice.
- Nomor surat jalan.
- Jenis penerimaan.
- Gudang.
- Status.
- Catatan.
- Bukti dokumen.
- User pembuat.
- User penyetuju.

Detail:

- Bahan.
- Jumlah dipesan.
- Jumlah diterima.
- Jumlah ditolak.
- Satuan.
- Harga satuan.
- Diskon.
- Pajak.
- Total.
- Batch.
- Lokasi.

Nomor:

```text
BM-YYYYMM-0001
```

Status:

- Draft.
- Menunggu persetujuan.
- Disetujui.
- Selesai.
- Dibatalkan.

Aturan:

- Draft tidak memengaruhi stok.
- Stok bertambah setelah disetujui.
- Transaksi selesai tidak diedit langsung.
- Pembatalan atau koreksi memakai transaksi resmi.

## 11. Barang Keluar

Tujuan:

- Cutting.
- Sampel.
- Produksi internal.
- Vendor.
- Operasional.
- Retur supplier.
- Transfer gudang.
- Penyesuaian berkurang.

Header:

- ID transaksi.
- Nomor barang keluar.
- Tanggal.
- Tujuan.
- Divisi penerima.
- Penerima.
- Nomor PO.
- Gudang asal.
- Status.
- Catatan.
- User pembuat dan penyetuju.

Detail:

- Bahan.
- Jumlah permintaan.
- Jumlah dikeluarkan.
- Satuan.
- Harga rata-rata.
- Nilai bahan keluar.
- Batch.
- Lokasi.

Nomor:

```text
BK-YYYYMM-0001
```

Aturan:

- Tidak boleh melebihi stok.
- Draft tidak mengurangi stok.
- Stok berkurang setelah disetujui.
- Pembatalan mengembalikan stok.
- Barang keluar ke cutting membawa referensi produksi.

## 12. Stok Bahan

Rumus:

```text
Stok Tersedia
= Stok Awal
+ Barang Masuk Disetujui
- Barang Keluar Disetujui
+ Penyesuaian Bertambah
- Penyesuaian Berkurang
```

Informasi:

- Kode bahan.
- Nama.
- Kategori.
- Warna.
- Satuan.
- Total masuk.
- Total keluar.
- Total penyesuaian.
- Stok tersedia.
- Stok minimum.
- Status stok.
- Harga rata-rata.
- Nilai persediaan.
- Lokasi.

Status:

- Aman.
- Menipis.
- Kritis.
- Habis.
- Bermasalah.

## 13. Mutasi Stok

Data:

- ID mutasi.
- Tanggal dan waktu.
- Referensi.
- Jenis transaksi.
- Bahan.
- Stok sebelum.
- Jumlah masuk.
- Jumlah keluar.
- Stok sesudah.
- Harga.
- Nilai.
- Gudang.
- User.
- Catatan.

Aturan:

- Tidak dapat diedit manual.
- Dibuat otomatis dari transaksi.
- Tidak dapat dihapus.
- Kesalahan diperbaiki melalui pembatalan atau penyesuaian.

## 14. Penyesuaian Stok

Jenis:

- Bertambah.
- Berkurang.
- Barang rusak.
- Barang hilang.
- Salah input.
- Hasil stok opname.
- Alasan lainnya.

Data:

- Nomor penyesuaian.
- Tanggal.
- Bahan.
- Stok sistem.
- Stok fisik.
- Selisih.
- Alasan.
- Bukti foto.
- Status.
- Pembuat.
- Penyetuju.

Aturan:

- Alasan wajib.
- Penyesuaian material memerlukan persetujuan.
- Pembuat tidak boleh menyetujui sendiri kecuali owner.

## 15. Penilaian Persediaan

Metode: harga rata-rata bergerak.

```text
Harga Rata-Rata Baru =
((Stok Lama × Harga Rata-Rata Lama)
+ (Jumlah Masuk × Harga Pembelian))
÷ Total Stok Setelah Masuk
```

## 16. Laporan Tahap 1

- Laporan barang masuk.
- Laporan barang keluar.
- Laporan stok.
- Laporan mutasi.
- Laporan stok minimum.
- Laporan nilai persediaan.

## 17. Log Aktivitas

Mencatat:

- Login/logout.
- Tambah/edit/hapus.
- Persetujuan.
- Penolakan.
- Pembatalan.
- Penyesuaian.
- Export laporan.
- Perubahan hak akses.

## 18. Struktur Spreadsheet Tahap 1

```text
CONFIG
USERS
ROLES
ROLE_PERMISSIONS

MASTER_KATEGORI
MASTER_SATUAN
MASTER_SUPPLIER
MASTER_BAHAN

BARANG_MASUK
BARANG_MASUK_DETAIL

BARANG_KELUAR
BARANG_KELUAR_DETAIL

PENYESUAIAN_STOK
PENYESUAIAN_STOK_DETAIL

STOK_BAHAN
MUTASI_STOK

NOTIFIKASI
LOG_AKTIVITAS
COUNTERS
```

## 19. Struktur File GAS Tahap 1

```text
App.gs
Config.gs
Setup.gs
Auth.gs
Database.gs
Validation.gs
Utilities.gs
Numbering.gs
CacheService.gs
AuditService.gs
NotificationService.gs

CategoryService.gs
UnitService.gs
SupplierService.gs
MaterialService.gs
StockInService.gs
StockOutService.gs
AdjustmentService.gs
StockService.gs
ReportService.gs

index.html
style.html
components.html
script.html
dashboard.html
inventory.html
reports.html
settings.html
```

## 20. Kriteria Keberhasilan

- Login dan hak akses berjalan.
- Barang masuk menambah stok.
- Barang keluar mengurangi stok.
- Stok negatif dicegah.
- Mutasi tercatat otomatis.
- Nilai persediaan dapat dihitung.
- Stok kritis tampil di dashboard.
- Semua aktivitas penting tercatat.
- Barang keluar ke cutting siap diteruskan ke Tahap 2.

---

# PRD TAHAP 2 — PRODUKSI, CUTTING, DAN BUNDLING

## 1. Tujuan

- Membuat PO produksi.
- Menghitung kebutuhan bahan.
- Menghubungkan barang keluar ke PO.
- Mencatat penerimaan bahan oleh cutting.
- Membuat Work Order cutting.
- Mencatat pemakaian bahan aktual.
- Mencatat hasil cutting.
- Mencatat sisa dan limbah.
- Membuat bundel.
- Menampilkan WIP cutting.

## 2. Ruang Lingkup

1. Master produk.
2. Varian produk.
3. BOM.
4. PO produksi.
5. Estimasi kebutuhan bahan.
6. Permintaan bahan.
7. Integrasi barang keluar.
8. Penerimaan cutting.
9. Work Order cutting.
10. Proses cutting.
11. Pemakaian bahan aktual.
12. Hasil cutting.
13. Sisa bahan.
14. Limbah.
15. Bundling.
16. Label bundel.
17. Monitoring WIP.
18. Dashboard dan laporan.

## 3. Batas Tahap

Tahap 2 berakhir ketika bundel sudah lengkap dan siap diserahkan ke penjahit.

## 4. Alur

```text
Buat PO Produksi
→ Tentukan Produk, Warna, Ukuran, Jumlah
→ Hitung Kebutuhan Bahan
→ Buat Permintaan Bahan
→ Gudang Mengeluarkan Bahan
→ Cutting Menerima Bahan
→ Buat Work Order
→ Proses Cutting
→ Catat Pemakaian Aktual
→ Catat Hasil
→ Catat Sisa dan Limbah
→ Verifikasi
→ Buat Bundel
→ Cetak Label
→ Siap Dikirim ke Penjahit
```

## 5. Master Produk

Data:

- ID produk.
- Kode produk.
- Nama.
- Kategori.
- Brand.
- Jenis.
- Deskripsi.
- Foto.
- Status.

Aturan:

- Kode unik.
- Produk yang pernah dipakai tidak dapat dihapus permanen.

## 6. Varian Produk

Data:

- ID varian.
- Produk.
- SKU.
- Warna.
- Ukuran.
- Jenis kelamin.
- Status.

Aturan:

- Kombinasi produk, warna, ukuran unik.
- SKU dapat dibuat otomatis.

## 7. Bill of Materials

Header:

- ID BOM.
- Nomor BOM.
- Produk.
- Versi.
- Tanggal berlaku.
- Status.
- Catatan.
- Pembuat dan penyetuju.

Detail:

- Bahan.
- Jumlah kebutuhan.
- Satuan.
- Toleransi.
- Berlaku untuk ukuran.
- Keterangan.

Contoh:

```text
Nordic Jacket ukuran M:
- Tactical Crinkle 1,80 meter
- AirMesh 1,50 meter
- Resleting utama 1 pcs
- Resleting saku 4 pcs
- Stopper 2 pcs
- Label brand 1 pcs
- Label size 1 pcs
```

Aturan:

- Satu produk dapat memiliki beberapa versi.
- Hanya satu versi aktif per periode.
- Perubahan membuat versi baru.

## 8. PO Produksi

Header:

- ID PO.
- Nomor PO.
- Tanggal.
- Produk.
- Tanggal mulai.
- Target selesai.
- Total target.
- Prioritas.
- Penanggung jawab.
- Jenis produksi.
- Status.
- Catatan.

Detail:

- SKU.
- Warna.
- Ukuran.
- Jumlah target.
- Toleransi.
- Total rencana cutting.

Nomor:

```text
PO-YYYY-0001
```

Jenis:

- Produksi reguler.
- Restock.
- Produk baru.
- Sampel.
- Pre-order.
- Pesanan khusus.

Status:

- Draft.
- Menunggu persetujuan.
- Disetujui.
- Menunggu bahan.
- Bahan disiapkan.
- Sedang cutting.
- Cutting selesai.
- Bundling selesai.
- Siap jahit.
- Selesai.
- Dibatalkan.

## 9. Estimasi Kebutuhan Bahan

```text
Kebutuhan Bahan
= Target Produksi
× Kebutuhan BOM
× (1 + Toleransi)
```

Tampilan:

- Kebutuhan standar.
- Toleransi.
- Total kebutuhan.
- Stok tersedia.
- Kekurangan.
- Status.

Status:

- Tersedia.
- Sebagian tersedia.
- Tidak tersedia.
- Perlu pembelian.
- Perlu substitusi.

## 10. Permintaan Bahan

Header:

- Nomor permintaan.
- Nomor PO.
- Tanggal.
- Divisi peminta.
- Tanggal dibutuhkan.
- Gudang.
- Status.

Detail:

- Bahan.
- Kebutuhan.
- Stok.
- Jumlah diminta.
- Jumlah disetujui.
- Jumlah dikeluarkan.

Nomor:

```text
PB-YYYYMM-0001
```

## 11. Penerimaan Bahan oleh Cutting

Data:

- Nomor penerimaan.
- PO.
- Barang keluar.
- Tanggal serah.
- Tanggal terima.
- Penyerah.
- Penerima.
- Status.
- Detail bahan.
- Jumlah menurut gudang.
- Jumlah diterima.
- Selisih.
- Kondisi.

Kondisi:

- Baik.
- Kurang.
- Lebih.
- Rusak.
- Warna tidak sesuai.
- Spesifikasi tidak sesuai.

## 12. Work Order Cutting

Data:

- Nomor WO.
- PO.
- Produk.
- Tanggal.
- PIC.
- Meja cutting.
- Prioritas.
- Status.
- Warna.
- Ukuran.
- Target cutting.
- Jumlah layer.
- Panjang marker.
- Lebar kain.
- Nomor pola.

Nomor:

```text
WO-CUT-YYYYMM-0001
```

Status:

- Draft.
- Siap dikerjakan.
- Sedang dikerjakan.
- Ditunda.
- Selesai sebagian.
- Selesai.
- Diverifikasi.

## 13. Proses Cutting

Aktivitas:

- Persiapan bahan.
- Pemeriksaan kain.
- Gelar kain.
- Marker.
- Pemotongan.
- Pengecekan panel.
- Pengelompokan ukuran.
- Penyusunan bundel.

## 14. Pemakaian Bahan Aktual

Data:

- PO.
- Work Order.
- Bahan.
- Jumlah diterima.
- Jumlah digunakan.
- Jumlah sisa.
- Jumlah limbah.
- Selisih.
- Harga rata-rata.
- Nilai pemakaian.

Rekonsiliasi:

```text
Jumlah Diterima
= Jumlah Digunakan
+ Jumlah Sisa
+ Jumlah Limbah
+ Selisih Belum Dijelaskan
```

Varians:

```text
Varians Pemakaian
= Pemakaian Aktual - Kebutuhan Standar
```

## 15. Hasil Cutting

Header:

- Nomor hasil cutting.
- PO.
- Work Order.
- Produk.
- Warna.
- PIC.
- Status.

Detail:

- SKU.
- Ukuran.
- Target.
- Hasil baik.
- Hasil rusak.
- Hasil kurang.
- Hasil lebih.
- Total hasil.

Nomor:

```text
CUT-YYYYMM-0001
```

## 16. Sisa Bahan

Jenis:

- Kain utuh.
- Potongan besar.
- Potongan kecil.
- Aksesoris tidak terpakai.
- Bahan berlebih.

Status:

- Belum dikembalikan.
- Menunggu gudang.
- Diterima gudang.
- Disimpan di cutting.
- Dialokasikan ke PO lain.
- Tidak layak.

Sisa yang kembali ke gudang membuat mutasi stok masuk.

## 17. Limbah Cutting

Jenis:

- Potongan kecil.
- Kain cacat.
- Salah potong.
- Bahan rusak.
- Noda.
- Sampah produksi.

Data:

- PO.
- Work Order.
- Bahan.
- Jumlah.
- Jenis.
- Penyebab.
- Foto.
- Penanganan.
- Nilai kerugian.

Penanganan:

- Dibuang.
- Disimpan.
- Dijual.
- Digunakan untuk sampel.
- Digunakan untuk aksesori.
- Dikembalikan supplier.

## 18. Bundling

Header:

- ID bundel.
- Nomor bundel.
- PO.
- Work Order.
- Produk.
- Warna.
- Ukuran.
- Jumlah pcs.
- Rencana tujuan penjahit.
- Status.

Detail:

- Jenis panel.
- Jumlah panel per pcs.
- Total panel.
- Aksesoris.
- Status kelengkapan.

Nomor:

```text
BND-YYYYMM-0001
```

Status:

- Draft.
- Menunggu pemeriksaan.
- Lengkap.
- Tidak lengkap.
- Siap dikirim.
- Sudah dikirim.
- Dibatalkan.

Aturan:

- Hanya berasal dari hasil cutting baik.
- Tidak boleh melebihi hasil tersedia.
- Bundel yang sudah dikirim tidak dapat diedit.

## 19. Label Bundel

Informasi:

- Logo.
- Nomor bundel.
- PO.
- Produk.
- Warna.
- Ukuran.
- Jumlah.
- PIC.
- Tujuan.
- QR atau barcode.

## 20. WIP Cutting

Status:

- Menunggu bahan.
- Bahan sudah keluar.
- Menunggu diterima.
- Bahan diterima.
- Menunggu WO.
- Sedang cutting.
- Selesai sebagian.
- Menunggu verifikasi.
- Cutting selesai.
- Sedang bundling.
- Bundling selesai.
- Siap dikirim.

## 21. Dashboard Tahap 2

Kartu:

- Total PO aktif.
- PO menunggu bahan.
- PO sedang cutting.
- Target produksi.
- Hasil cutting.
- WIP cutting.
- Bundel siap jahit.
- Limbah bulan berjalan.
- PO terlambat.

Grafik:

- Target vs hasil.
- Pemakaian standar vs aktual.
- Limbah per kategori.
- Hasil per hari.
- Efisiensi per PO.

## 22. Struktur Spreadsheet Tahap 2

```text
MASTER_PRODUK
MASTER_VARIAN_PRODUK

BOM
BOM_DETAIL

PO_PRODUKSI
PO_PRODUKSI_DETAIL
PO_REVISION_LOG

PERMINTAAN_BAHAN
PERMINTAAN_BAHAN_DETAIL

PENERIMAAN_CUTTING
PENERIMAAN_CUTTING_DETAIL

WORK_ORDER_CUTTING
WORK_ORDER_CUTTING_DETAIL

PROSES_CUTTING
PEMAKAIAN_BAHAN_AKTUAL

HASIL_CUTTING
HASIL_CUTTING_DETAIL

SISA_BAHAN
LIMBAH_CUTTING

BUNDLING
BUNDLING_DETAIL

WIP_PRODUKSI
```

## 23. File GAS Tahap 2

```text
ProductService.gs
VariantService.gs
BOMService.gs
ProductionOrderService.gs
MaterialRequestService.gs
CuttingReceiptService.gs
CuttingWorkOrderService.gs
CuttingProcessService.gs
MaterialUsageService.gs
CuttingResultService.gs
MaterialReturnService.gs
WasteService.gs
BundlingService.gs
WIPService.gs
ProductionDashboardService.gs
ProductionReportService.gs
QRService.gs
PrintLabelService.gs
```

## 24. Kriteria Keberhasilan

- Produk, varian, dan BOM dapat dibuat.
- PO dapat dibuat dan disetujui.
- Kebutuhan bahan dapat dihitung.
- Barang keluar terhubung PO.
- Cutting dapat menerima bahan.
- Pemakaian aktual, hasil, sisa, dan limbah tercatat.
- Bundel dapat dibuat dan dicetak.
- WIP cutting terlihat di dashboard.
- Data siap diteruskan ke penjahitan.

---

# PRD TAHAP 3 — PENJAHITAN INTERNAL, VENDOR EKSTERNAL, DAN MONITORING WIP

## 1. Tujuan

- Mengelola penjahit internal dan vendor.
- Menugaskan bundel.
- Membuat pengiriman dan surat jalan.
- Melacak WIP jahit.
- Mencatat progres.
- Mencatat penerimaan hasil jahit.
- Mengelola selisih, kehilangan, kerusakan, dan retur.
- Menghitung estimasi biaya jahit.
- Menilai performa vendor.
- Menyiapkan hasil untuk QC.

## 2. Batas Tahap

Tahap 3 berakhir ketika hasil jahit sudah diterima dan siap masuk QC.

## 3. Alur

```text
Bundel Selesai
→ Tentukan Penjahit/Vendor
→ Buat Penugasan
→ Tentukan Tarif dan Deadline
→ Buat Pengiriman
→ Cetak Surat Jalan
→ Konfirmasi Penerimaan
→ Monitoring WIP
→ Update Progres
→ Pengiriman Hasil
→ Penerimaan Hasil
→ Rekonsiliasi
→ Retur/Perbaikan
→ Hitung Biaya
→ Siap QC
```

## 4. Master Penjahit

Data:

- ID.
- Kode.
- Nama.
- Jenis.
- Vendor/tim.
- Telepon.
- Alamat.
- Lokasi.
- Kapasitas harian.
- Keahlian.
- Produk yang biasa dikerjakan.
- Status.

Jenis:

- Internal.
- Eksternal individu.
- Anggota vendor.
- Freelance.
- Sampel.
- Spesialis perbaikan.

Kode:

```text
JHT-INT-0001
JHT-EXT-0001
```

## 5. Master Vendor

Data:

- ID vendor.
- Kode.
- Nama.
- Pemilik.
- Kontak.
- Telepon.
- Email.
- Alamat.
- Kota.
- Lokasi.
- Kapasitas.
- Jenis pekerjaan.
- Rekening.
- Termin.
- Tarif default.
- Lead time.
- Status.

Jenis pekerjaan:

- Jahit penuh.
- Jahit sebagian.
- Obras.
- Pasang resleting.
- Finishing.
- Packing.
- Jahit dan QC.
- Jahit sampai barang jadi.

## 6. Master Lokasi Produksi

Jenis:

- Workshop internal.
- Rumah penjahit.
- Vendor eksternal.
- Gudang transit.
- QC vendor.
- Finishing vendor.

## 7. Tarif Jasa Jahit

Data:

- ID tarif.
- Produk.
- Varian.
- Jenis pekerjaan.
- Vendor/penjahit.
- Dasar tarif.
- Nominal.
- Tanggal berlaku.
- Status.
- Penyetuju.

Dasar tarif:

- Per pcs.
- Per bundel.
- Per lusin.
- Per tahap.
- Borongan.
- Per jam.

Aturan:

- Tarif lama tidak ditimpa.
- Perubahan membuat versi baru.
- Transaksi menyimpan snapshot tarif.

## 8. Standar Durasi

Data:

- Produk.
- Pekerjaan.
- Jenis penjahit.
- Jumlah.
- Hari kerja.
- Kapasitas.
- Toleransi keterlambatan.

## 9. Penugasan Jahit

Header:

- Nomor penugasan.
- PO.
- Tanggal.
- Jenis penjahit.
- Vendor/penjahit.
- Lokasi tujuan.
- Rencana kirim.
- Target selesai.
- Jenis pekerjaan.
- Prioritas.
- Tarif.
- Estimasi biaya.
- Status.

Detail:

- Bundel.
- Produk.
- Warna.
- Ukuran.
- Jumlah.
- Tarif.
- Total.

Nomor:

```text
ASG-JHT-YYYYMM-0001
```

Aturan:

- Bundel harus siap dikirim.
- Tidak boleh memiliki dua penugasan aktif.
- Vendor harus aktif.
- Tarif dan target selesai wajib.

## 10. Pengiriman Jahit

Header:

- Nomor pengiriman.
- Nomor penugasan.
- PO.
- Tanggal/jam.
- Lokasi asal.
- Lokasi tujuan.
- Vendor/penjahit.
- Pengirim.
- Penerima.
- Kendaraan.
- Kurir.
- Total bundel.
- Total pcs.
- Status.
- Bukti foto.

Detail:

- Bundel.
- Produk.
- Warna.
- Ukuran.
- Jumlah.
- Kelengkapan panel.
- Aksesoris.
- Jenis pekerjaan.
- Target selesai.
- Tarif.

Nomor:

```text
SHP-JHT-YYYYMM-0001
```

## 11. Surat Jalan

Nomor:

```text
SJ-JHT-YYYYMM-0001
```

Isi:

- Logo dan identitas Owncrave.
- Nomor surat jalan.
- Tanggal.
- PO.
- Penugasan.
- Vendor.
- Alamat.
- Pengirim dan penerima.
- Daftar bundel.
- Produk, warna, ukuran, jumlah.
- Jenis pekerjaan.
- Target selesai.
- Tanda tangan.
- QR code.

Fitur:

- Cetak PDF.
- Simpan ke Drive.
- Cetak ulang dengan watermark.
- Watermark pembatalan.

## 12. Serah Terima Bundel

Data:

- Nomor penerimaan.
- Pengiriman.
- Surat jalan.
- Tanggal/jam.
- Penerima.
- Lokasi.
- Foto.
- Tanda tangan.
- Detail jumlah dan kondisi.

Kondisi:

- Lengkap.
- Bungkus rusak.
- Panel kurang.
- Aksesoris kurang.
- Salah produk.
- Salah warna.
- Salah ukuran.
- Ditolak.

## 13. Status WIP Jahit

```text
Menunggu Penugasan
Menunggu Pengiriman
Dalam Perjalanan
Menunggu Diterima
Sudah Diterima
Menunggu Mulai Jahit
Sedang Dijahit
Selesai Sebagian
Menunggu Pengiriman Kembali
Dalam Perjalanan ke Owncrave
Diterima Sebagian
Diterima Lengkap
Menunggu Pemeriksaan
Perlu Perbaikan
Sedang Diperbaiki
Selesai Jahit
Siap QC
Dibatalkan
```

## 14. Update Progres

Data:

- Penugasan.
- Tanggal.
- Persentase.
- Jumlah mulai.
- Jumlah selesai.
- Jumlah bermasalah.
- Estimasi selesai.
- Status.
- Kendala.
- Foto.

Rumus:

```text
Persentase Progres
= Jumlah Selesai ÷ Jumlah Dikirim × 100%
```

## 15. Monitoring WIP

Tampilan:

- PO.
- Penugasan.
- Surat jalan.
- Vendor.
- Produk.
- Warna.
- Ukuran.
- Jumlah dikirim.
- Jumlah selesai.
- Jumlah diterima.
- Sisa WIP.
- Tanggal kirim.
- Target selesai.
- Umur WIP.
- Progres.
- Keterlambatan.
- Nilai WIP.
- Estimasi biaya.

Rumus:

```text
Sisa WIP
= Jumlah Dikirim
- Jumlah Diterima Baik
- Jumlah Hilang Disetujui
- Jumlah Dibatalkan
```

## 16. Nilai WIP Jahit

Komponen:

- Nilai bahan.
- Biaya cutting.
- Biaya bundling.
- Aksesoris.
- Estimasi jasa jahit.
- Transportasi yang dialokasikan.

## 17. Pengiriman Hasil Jahit

Data:

- Nomor pengiriman hasil.
- Penugasan.
- PO.
- Vendor.
- Tanggal.
- Bundel.
- Pcs.
- Pengirim.
- Kurir/resi.
- Status.
- Detail selesai, belum selesai, bermasalah.

## 18. Penerimaan Hasil Jahit

Data:

- Nomor penerimaan.
- Pengiriman hasil.
- Penugasan.
- PO.
- Vendor.
- Tanggal/jam.
- Penerima.
- Lokasi.
- Bukti.
- Status.

Detail:

- Bundel.
- Produk.
- Warna.
- Ukuran.
- Jumlah dikirim.
- Jumlah kembali.
- Jumlah baik secara visual.
- Rusak.
- Kurang.
- Lebih.
- Belum selesai.

Nomor:

```text
RCV-JHT-YYYYMM-0001
```

Penerimaan boleh bertahap.

## 19. Selisih

Klasifikasi:

- Belum selesai.
- Tertinggal.
- Hilang.
- Rusak.
- Salah produk.
- Salah ukuran.
- Salah warna.
- Kelebihan.
- Salah hitung.
- Ditahan untuk perbaikan.

## 20. Barang Hilang

Data:

- Nomor kasus.
- PO.
- Penugasan.
- Vendor.
- Bundel.
- Produk.
- Jumlah.
- Nilai.
- Kronologi.
- Penanggung jawab.
- Bukti.
- Status investigasi.
- Keputusan.

## 21. Barang Rusak

Tingkat:

- Ringan.
- Sedang.
- Berat.
- Tidak dapat diperbaiki.
- Cacat bahan.
- Kesalahan cutting.
- Kesalahan jahit.
- Kesalahan aksesori.

## 22. Retur dan Perbaikan Jahit

Header:

- Nomor retur.
- Penerimaan hasil.
- Penugasan awal.
- PO.
- Vendor.
- Tanggal retur.
- Target kembali.
- Alasan.
- Status.

Detail:

- Bundel.
- Produk.
- Warna.
- Ukuran.
- Jumlah.
- Jenis kerusakan.
- Instruksi.
- Tarif perbaikan.
- Penanggung biaya.
- Foto.

Nomor:

```text
RTN-JHT-YYYYMM-0001
```

## 23. Penyelesaian Jahit

Rekonsiliasi:

```text
Jumlah Dikirim
= Jumlah Diterima
+ Jumlah Masih WIP
+ Jumlah Hilang Disetujui
+ Jumlah Rusak Final
+ Jumlah Dibatalkan
```

## 24. Biaya Jasa Jahit

```text
Biaya Jasa Dasar
= Jumlah Diakui × Tarif
```

```text
Tagihan Bersih
= Biaya Dasar
+ Bonus
+ Biaya Tambahan
- Potongan
- Uang Muka
```

Status biaya:

- Estimasi.
- Menunggu QC.
- Menunggu verifikasi.
- Diverifikasi produksi.
- Diverifikasi keuangan.
- Siap dibayar.
- Dibayar.
- Ditahan.
- Disengketakan.

## 25. Kinerja Vendor

Indikator:

- Ketepatan waktu.
- Penyelesaian.
- Kerusakan.
- Retur.
- Kehilangan.
- Lead time.
- Biaya.
- Komunikasi.
- Kapasitas.
- Jumlah pekerjaan.

Rumus:

```text
Ketepatan Waktu
= Pekerjaan Tepat Waktu ÷ Total Pekerjaan × 100%
```

```text
Tingkat Retur
= Pcs Diretur ÷ Pcs Diterima × 100%
```

Grade:

- A: sangat baik.
- B: baik.
- C: perlu pengawasan.
- D: bermasalah.
- Nonaktif.

## 26. Dashboard Tahap 3

Kartu:

- Total WIP jahit.
- WIP internal.
- WIP vendor.
- Nilai WIP.
- Pekerjaan mendekati deadline.
- Terlambat.
- Hasil diterima bulan ini.
- Retur.
- Estimasi biaya.
- Estimasi hutang vendor.

## 27. Struktur Spreadsheet Tahap 3

```text
MASTER_PENJAHIT
MASTER_VENDOR
MASTER_LOKASI_PRODUKSI

TARIF_JASA_JAHIT
STANDAR_DURASI_JAHIT

PENUGASAN_JAHIT
PENUGASAN_JAHIT_DETAIL

PENGIRIMAN_JAHIT
PENGIRIMAN_JAHIT_DETAIL

SURAT_JALAN_JAHIT

PENERIMAAN_BUNDEL_VENDOR
PENERIMAAN_BUNDEL_VENDOR_DETAIL

PROGRES_JAHIT

PENGIRIMAN_HASIL_JAHIT
PENGIRIMAN_HASIL_JAHIT_DETAIL

PENERIMAAN_HASIL_JAHIT
PENERIMAAN_HASIL_JAHIT_DETAIL

SELISIH_JAHIT
BARANG_HILANG
BARANG_RUSAK

RETUR_JAHIT
RETUR_JAHIT_DETAIL

BIAYA_JASA_JAHIT
HUTANG_JASA_VENDOR

WIP_JAHIT
VENDOR_PERFORMANCE
```

## 28. Kriteria Keberhasilan

- Penjahit dan vendor dapat dikelola.
- Bundel dapat ditugaskan dan dikirim.
- Surat jalan dapat dicetak.
- WIP dan progres dapat dipantau.
- Penerimaan bertahap berjalan.
- Selisih, kehilangan, kerusakan, dan retur dapat dikelola.
- Biaya jasa dan performa vendor dapat dihitung.
- Hasil dapat diteruskan ke QC.

---

# PRD TAHAP 4 — QUALITY CONTROL, FINISHING, PACKING, DAN BARANG JADI

## 1. Tujuan

- Menerima barang hasil jahit ke QC.
- Menjalankan pemeriksaan terstandar.
- Mencatat cacat.
- Menentukan grade.
- Mengelola perbaikan dan Re-QC.
- Menjalankan finishing.
- Menjalankan packing.
- Menerima barang jadi.
- Memperbarui stok barang jadi.
- Menghitung yield dan performa kualitas.

## 2. Batas Tahap

Tahap 4 berakhir ketika produk sudah lolos QC, selesai finishing dan packing, lalu masuk stok barang jadi siap jual.

## 3. Alur

```text
Hasil Jahit Diterima
→ Antrean QC
→ Work Order QC
→ Pemeriksaan
→ Hasil QC
→ Lolos / Perbaikan / Reject
→ Rework
→ Re-QC
→ Finishing
→ Trimming
→ Cleaning
→ Steam
→ Label dan Hangtag
→ Folding
→ Packing
→ Verifikasi
→ Gudang Barang Jadi
→ Stok Bertambah
```

## 4. Master Standar QC

Header:

- ID standar.
- Nomor.
- Produk.
- Kategori.
- Versi.
- Tanggal berlaku.
- Status.
- Penyetuju.

Detail:

- Tahap.
- Bagian produk.
- Kriteria.
- Metode.
- Tingkat kepentingan.
- Toleransi.
- Jenis cacat.
- Tindakan jika gagal.
- Wajib foto.
- Urutan.

Tingkat:

- Critical.
- Major.
- Minor.
- Cosmetic.

Aturan:

- Berversi.
- Tidak boleh menghapus standar yang sudah digunakan.
- Snapshot disimpan saat transaksi.

## 5. Master Jenis Cacat

Kategori:

- Bahan.
- Cutting.
- Jahit.
- Aksesori.
- Finishing.
- Packing.
- Ukuran.
- Warna.
- Label.
- Kebersihan.

Data:

- ID.
- Kode.
- Nama.
- Kategori.
- Keparahan.
- Sumber.
- Dapat diperbaiki.
- Tindakan.
- Status.

## 6. Grade Produk

### Grade A

Lolos standar dan siap dijual normal.

### Grade B

Cacat ringan, fungsi utama tidak terganggu.

### Grade C

Cacat terlihat, tidak layak sebagai produk normal.

### Reject

Tidak layak dijual atau tidak dapat diperbaiki.

## 7. Penerimaan ke QC

Data:

- Nomor penerimaan QC.
- Penerimaan hasil jahit.
- PO.
- Vendor.
- Tanggal.
- Lokasi.
- Bundel.
- Total pcs.
- Status.
- Penerima.
- Detail produk, SKU, warna, ukuran, jumlah.

Nomor:

```text
IN-QC-YYYYMM-0001
```

## 8. Antrean QC

Tampilan:

- PO.
- Bundel.
- Produk.
- Warna.
- Ukuran.
- Vendor.
- Jumlah.
- Tanggal masuk.
- Umur antrean.
- Prioritas.
- Target.
- PIC.

Prioritas:

- Normal.
- Tinggi.
- Mendesak.
- Launching.
- Pesanan khusus.
- Produksi terlambat.

## 9. Work Order QC

Data:

- Nomor WO.
- PO.
- Tanggal.
- Target.
- PIC.
- Supervisor.
- Metode.
- Jumlah sampel.
- Total.
- Status.
- Detail bundel dan standar QC.

Nomor:

```text
WO-QC-YYYYMM-0001
```

## 10. Metode Pemeriksaan

### Pemeriksaan 100%

Untuk produk premium, baru, bermasalah, hasil perbaikan, atau vendor baru.

### Sampling

Untuk produk berulang dan risiko rendah.

Data sampling:

- Populasi.
- Jumlah sampel.
- Batas diterima.
- Batas ditolak.
- Metode.
- Alasan.

## 11. Pemeriksaan per Pcs

Data:

- ID unit.
- PO.
- Bundel.
- SKU.
- Nomor urut.
- Barcode/QR.
- Petugas.
- Tanggal.
- Hasil.
- Grade.
- Status.

Checklist:

- Ukuran.
- Jahitan.
- Kain.
- Resleting.
- Furing.
- Saku.
- Aksesori.
- Label.
- Kebersihan.
- Simetri.
- Fungsi.
- Visual keseluruhan.

## 12. Temuan Cacat

Data:

- ID temuan.
- QC.
- Unit.
- Produk.
- Bagian.
- Jenis cacat.
- Keparahan.
- Jumlah.
- Penyebab awal.
- Penanggung jawab.
- Foto.
- Tindakan.
- Status.

Sumber:

- Supplier.
- Gudang.
- Cutting.
- Bundling.
- Penjahit internal.
- Vendor.
- QC.
- Finishing.
- Tidak diketahui.

## 13. Hasil QC

Data:

- Nomor QC.
- Work Order.
- PO.
- Vendor.
- Produk.
- SKU.
- Jumlah diperiksa.
- Grade A.
- Grade B.
- Grade C.
- Perbaikan.
- Reject.
- Belum diperiksa.
- Defect rate.
- Status.
- Verifikator.

Nomor:

```text
QC-YYYYMM-0001
```

Rumus:

```text
Jumlah Diperiksa
= Grade A + Grade B + Grade C + Perbaikan + Reject
```

```text
Defect Rate
= Produk Bermasalah ÷ Produk Diperiksa × 100%
```

## 14. Keputusan QC

- Lolos.
- Finishing.
- Perbaikan internal.
- Perbaikan vendor.
- Re-QC.
- Grade B.
- Grade C.
- Reject.
- Investigasi.
- Keputusan owner.

## 15. Perbaikan Internal

Data:

- Nomor perbaikan.
- QC.
- PO.
- Produk.
- SKU.
- Jumlah.
- Jenis cacat.
- Instruksi.
- PIC.
- Target.
- Estimasi biaya.
- Status.

## 16. Perbaikan Vendor

Data:

- Nomor retur QC.
- QC.
- Penugasan jahit.
- Vendor.
- Tanggal kirim.
- Target kembali.
- Penanggung biaya.
- Detail unit, produk, cacat, instruksi, foto, potongan.

Nomor:

```text
RTN-QC-YYYYMM-0001
```

## 17. Re-QC

Data:

- Nomor Re-QC.
- QC awal.
- Nomor perbaikan.
- Produk.
- SKU.
- Jumlah.
- Cacat sebelumnya.
- Hasil perbaikan.
- Hasil Re-QC.
- Grade akhir.
- Petugas.

Hasil:

- Lolos.
- Perbaikan ulang.
- Grade turun.
- Reject.

## 18. Barang Reject

Penyebab:

- Cacat bahan berat.
- Salah cutting.
- Salah ukuran berat.
- Kerusakan permanen.
- Noda permanen.
- Tidak sesuai desain.
- Rusak saat finishing.

Tindakan:

- Perbaiki menjadi Grade B.
- Jual minor defect.
- Sampel.
- Training.
- Bongkar aksesori.
- Musnahkan.
- Donasi.
- Keputusan lain.

## 19. Finishing

Header:

- Nomor finishing.
- PO.
- Tanggal masuk.
- Target.
- PIC.
- Lokasi.
- Jumlah.
- Status.

Detail:

- Produk.
- SKU.
- Warna.
- Ukuran.
- Jumlah.
- Jenis finishing.
- Status proses.

Nomor:

```text
FIN-YYYYMM-0001
```

## 20. Proses Finishing

- Trimming.
- Membersihkan kapur.
- Membersihkan noda.
- Memeriksa aksesori.
- Memeriksa resleting.
- Steam.
- Membentuk produk.
- Memasang label.
- Memasang hangtag.
- Memasang barcode.
- Pemeriksaan akhir.
- Folding.

## 21. Label dan Hangtag

Mencatat:

- Label brand.
- Label size.
- Label perawatan.
- Label komposisi.
- Hangtag.
- Barcode.
- Stiker ukuran.
- Stiker warna.
- Segel.

Jika label tercatat sebagai inventory, penggunaannya mengurangi stok bahan.

## 22. Master Kemasan

Data:

- ID.
- Kode.
- Nama.
- Jenis.
- Ukuran.
- Bahan.
- Supplier.
- Biaya.
- Stok minimum.
- Status.

Contoh:

- Polybag.
- Ziplock.
- Box.
- Dust bag.
- Kertas.
- Stiker.
- Thank-you card.
- Silica gel.

## 23. Packing

Header:

- Nomor packing.
- PO.
- Finishing.
- Tanggal.
- PIC.
- Lokasi.
- Total.
- Status.

Detail:

- Produk.
- SKU.
- Warna.
- Ukuran.
- Jumlah.
- Kemasan.
- Barcode.
- Batch.
- Lokasi tujuan.

Nomor:

```text
PKG-YYYYMM-0001
```

Checklist:

- SKU benar.
- Ukuran benar.
- Warna benar.
- Produk dilipat.
- Hangtag terpasang.
- Barcode sesuai.
- Kemasan bersih.
- Jumlah sesuai.
- Kemasan tertutup.
- Barcode dapat dipindai.

## 24. Barang Jadi

Header:

- Nomor barang jadi.
- PO.
- Packing.
- Tanggal masuk.
- Gudang tujuan.
- Penyerah.
- Penerima.
- Jumlah.
- Status.

Detail:

- Produk.
- SKU.
- Warna.
- Ukuran.
- Grade.
- Jumlah.
- HPP sementara.
- Batch.
- Rak.
- Barcode.

Nomor:

```text
FG-YYYYMM-0001
```

## 25. Stok Barang Jadi

Disimpan per:

- SKU.
- Grade.
- Gudang.
- Lokasi.
- Batch.

Informasi:

- Stok tersedia.
- Stok ditahan.
- Stok rusak.
- Stok siap jual.
- HPP rata-rata.
- Nilai persediaan.

```text
Stok Siap Jual
= Stok Tersedia
- Stok Ditahan
- Stok Rusak
- Stok Reservasi
```

## 26. Mutasi Barang Jadi

Jenis:

- Hasil produksi.
- Transfer.
- Penyesuaian.
- Barang rusak.
- Sample.
- Giveaway.
- Penjualan.
- Retur penjualan.
- Pemusnahan.
- Perubahan grade.

## 27. Transfer dan Penyesuaian

Transfer antar:

- Gudang utama.
- Gudang online.
- Toko offline.
- Studio.
- Lokasi sample.
- Transit.

Penyesuaian membutuhkan:

- Stok sistem.
- Stok fisik.
- Selisih.
- Alasan.
- Bukti.
- Persetujuan.

## 28. Yield Produksi

```text
QC Yield
= Jumlah Lolos QC ÷ Jumlah Diperiksa × 100%
```

```text
Finished Goods Yield
= Barang Jadi Grade A ÷ Target Produksi × 100%
```

## 29. Cost of Poor Quality

```text
Cost of Poor Quality
= Biaya Rework
+ Nilai Reject
+ Biaya Retur
+ Biaya Tambahan Finishing
+ Penurunan Nilai Grade
```

## 30. Dashboard Tahap 4

### QC

- Antrean.
- Sedang diperiksa.
- Lolos hari ini.
- Perbaikan.
- Reject.
- Defect rate.
- First Pass Yield.
- Terlambat.

### Finishing/Packing

- Antrean finishing.
- Sedang finishing.
- Selesai.
- Menunggu packing.
- Sedang packing.
- Output harian.
- Kekurangan label/kemasan.

### Barang Jadi

- Total stok siap jual.
- Nilai barang jadi.
- Barang masuk bulan ini.
- Grade A/B/C.
- SKU stok rendah.
- Produk ditahan.
- Produk rusak.
- Yield per PO.

## 31. Struktur Spreadsheet Tahap 4

```text
MASTER_STANDAR_QC
MASTER_STANDAR_QC_DETAIL
MASTER_JENIS_CACAT
MASTER_GRADE
MASTER_FINISHING
MASTER_KEMASAN
MASTER_LOKASI_FG

PENERIMAAN_QC
PENERIMAAN_QC_DETAIL

WORK_ORDER_QC
WORK_ORDER_QC_DETAIL

PEMERIKSAAN_QC
PEMERIKSAAN_QC_UNIT
TEMUAN_CACAT

HASIL_QC
HASIL_QC_DETAIL

PERBAIKAN_INTERNAL
PERBAIKAN_INTERNAL_DETAIL

RETUR_QC_VENDOR
RETUR_QC_VENDOR_DETAIL

RE_QC
RE_QC_DETAIL

BARANG_REJECT
TINDAKAN_REJECT

FINISHING
FINISHING_DETAIL
FINISHING_PROCESS

PACKING
PACKING_DETAIL

BARANG_JADI
BARANG_JADI_DETAIL

STOK_BARANG_JADI
MUTASI_BARANG_JADI
TRANSFER_BARANG_JADI
PENYESUAIAN_STOK_FG

QC_PERFORMANCE
PRODUCTION_YIELD
```

## 32. Kriteria Keberhasilan

- Barang masuk ke antrean QC.
- Checklist QC berjalan.
- Cacat dapat dicatat dan difoto.
- Grade ditentukan.
- Rework dan Re-QC terlacak.
- Finishing dan packing terkontrol.
- Barang jadi menambah stok.
- Mutasi barang jadi tercatat.
- Yield dan performa vendor dapat dihitung.

---

# PRD TAHAP 5 — KEUANGAN, HPP, HUTANG, KAS, DAN LAPORAN KEUANGAN

## 1. Tujuan

- Membuat fondasi akuntansi.
- Mengelola kas dan bank.
- Mengelola hutang supplier dan vendor.
- Mencatat biaya operasional.
- Mengumpulkan biaya produksi per PO.
- Menghitung HPP.
- Menilai bahan, WIP, dan barang jadi.
- Membuat jurnal otomatis.
- Membuat buku besar.
- Membuat laba rugi, neraca, dan arus kas.
- Menyediakan dashboard keuangan owner.

## 2. Prinsip Akuntansi

- Double-entry.
- Debit harus sama dengan kredit.
- Jurnal operasional dibuat otomatis.
- Jurnal otomatis tidak diedit langsung.
- Kesalahan diperbaiki dengan reversal.
- Periode tertutup tidak dapat diedit.
- Setiap transaksi memiliki referensi.
- Semua perubahan tercatat.

## 3. Ruang Lingkup

1. Master perusahaan.
2. Periode akuntansi.
3. Chart of Accounts.
4. Kas dan bank.
5. Metode pembayaran.
6. Kategori biaya.
7. Saldo awal.
8. Hutang supplier.
9. Hutang vendor.
10. Uang muka.
11. Pembayaran.
12. Kas masuk.
13. Kas keluar.
14. Transfer.
15. Biaya operasional.
16. Biaya produksi.
17. Alokasi overhead.
18. HPP PO.
19. HPP SKU.
20. Nilai persediaan.
21. Nilai WIP.
22. Nilai barang jadi.
23. Jurnal.
24. Buku besar.
25. Neraca saldo.
26. Laba rugi.
27. Neraca.
28. Arus kas.
29. Laporan hutang.
30. Rekonsiliasi.
31. Anggaran.
32. Tutup periode.
33. Dashboard owner.

## 4. Struktur Menu

```text
DASHBOARD
├── Owner
├── Keuangan
├── Hutang
├── Biaya Produksi
└── HPP

KEUANGAN
├── Kas Masuk
├── Kas Keluar
├── Transfer
├── Rekening
├── Biaya Operasional
├── Uang Muka
└── Rekonsiliasi

HUTANG
├── Supplier
├── Vendor
├── Pembayaran Supplier
├── Pembayaran Vendor
├── Jatuh Tempo
└── Riwayat

AKUNTANSI
├── Chart of Accounts
├── Jurnal Otomatis
├── Jurnal Manual
├── Buku Besar
├── Neraca Saldo
├── Tutup Periode
└── Audit

HPP DAN BIAYA
├── Bahan
├── Cutting
├── Jahit
├── QC
├── Finishing
├── Packing
├── Overhead
├── HPP per PO
├── HPP per SKU
└── Varians

LAPORAN
├── Laba Rugi
├── Neraca
├── Arus Kas
├── Hutang
├── Kas dan Bank
├── Biaya Produksi
├── HPP
├── Persediaan
└── Margin
```

## 5. Periode Akuntansi

Data:

- ID.
- Nama periode.
- Tanggal mulai.
- Tanggal selesai.
- Tahun fiskal.
- Status.
- Penutup.
- Tanggal penutupan.
- Catatan.

Status:

- Belum dibuka.
- Aktif.
- Menunggu review.
- Ditutup.
- Dibuka kembali.

## 6. Chart of Accounts

Kelompok:

### Aset

- Kas.
- Bank.
- Piutang.
- Uang muka.
- Persediaan bahan.
- WIP cutting.
- WIP jahit.
- WIP QC/finishing.
- Barang jadi.
- Perlengkapan.
- Aset tetap.
- Akumulasi penyusutan.

### Liabilitas

- Hutang supplier.
- Hutang vendor.
- Hutang biaya.
- Hutang pajak.
- Uang muka pelanggan.
- Hutang lain.

### Ekuitas

- Modal.
- Tambahan modal.
- Prive.
- Laba ditahan.
- Laba tahun berjalan.

### Pendapatan

- Penjualan.
- Penjualan Grade B.
- Penjualan limbah.
- Pendapatan lain.

### HPP

- Bahan.
- Aksesoris.
- Cutting.
- Jahit.
- QC.
- Finishing.
- Packing.
- Overhead.
- Selisih produksi.
- Reject.
- Penyesuaian persediaan.

### Beban Operasional

- Gaji.
- Sewa.
- Listrik.
- Air.
- Internet.
- Transportasi.
- BBM.
- Peralatan.
- Pemeliharaan.
- Marketing.
- Iklan.
- Konten.
- Marketplace.
- Administrasi.
- Bank.
- Penyusutan.
- Beban lain.

## 7. Contoh Kode Akun

```text
1000 ASET
1101 Kas Kecil
1102 Kas Operasional
1110 Bank BCA
1111 Bank Mandiri
1120 Piutang Usaha
1130 Uang Muka Supplier
1131 Uang Muka Vendor
1140 Persediaan Bahan Baku
1141 Persediaan Aksesoris
1142 Persediaan WIP Cutting
1143 Persediaan WIP Jahit
1144 Persediaan WIP QC dan Finishing
1145 Persediaan Barang Jadi

2000 LIABILITAS
2101 Hutang Supplier
2102 Hutang Vendor Jahit
2103 Hutang Gaji
2104 Hutang Operasional
2105 Hutang Pajak

3000 EKUITAS
3101 Modal Pemilik
3102 Tambahan Modal
3103 Prive
3201 Laba Ditahan
3202 Laba Tahun Berjalan

4000 PENDAPATAN
4101 Penjualan Produk
4102 Penjualan Grade B
4103 Penjualan Barang Reject
4104 Penjualan Limbah

5000 HPP
5101 HPP Bahan Baku
5102 HPP Aksesoris
5103 Biaya Cutting
5104 Biaya Jahit
5105 Biaya QC
5106 Biaya Finishing
5107 Biaya Packing
5108 Overhead Produksi
5109 Selisih Produksi
5110 Produk Reject

6000 BEBAN OPERASIONAL
6101 Beban Gaji
6102 Beban Sewa
6103 Beban Listrik
6105 Beban Internet
6106 Beban Transportasi
6110 Beban Marketing
6111 Beban Iklan
6114 Beban Administrasi
6115 Beban Bank
6116 Beban Penyusutan
```

## 8. Kas dan Bank

Data:

- ID akun.
- Kode akun.
- Nama.
- Jenis.
- Bank.
- Nomor rekening.
- Pemilik rekening.
- Mata uang.
- Saldo awal.
- Saldo sistem.
- Status.
- Boleh minus.

Jenis:

- Kas kecil.
- Kas operasional.
- Bank.
- Rekening marketplace.
- E-wallet.
- Dana transit.

## 9. Saldo Awal

Mencakup:

- Kas.
- Bank.
- Piutang.
- Persediaan.
- WIP.
- Barang jadi.
- Aset tetap.
- Hutang.
- Modal.
- Laba ditahan.

Aturan:

- Debit = kredit.
- Satu kali saat implementasi.
- Perubahan perlu persetujuan.

## 10. Hutang Supplier

Data:

- Nomor hutang.
- Supplier.
- Invoice.
- Barang masuk.
- Tanggal invoice.
- Jatuh tempo.
- Nilai.
- Diskon.
- Pajak.
- Uang muka.
- Pembayaran.
- Potongan.
- Sisa.
- Status.

```text
Sisa Hutang
= Nilai Invoice
- Uang Muka
- Pembayaran
- Potongan
```

## 11. Hutang Vendor

Sumber:

- Jahit.
- Cutting.
- Finishing.
- QC eksternal.
- Packing eksternal.
- Transportasi.
- Perbaikan.

Data:

- Vendor.
- Penugasan.
- PO.
- Jenis jasa.
- Jumlah diakui.
- Tarif.
- Biaya dasar.
- Bonus.
- Potongan.
- Uang muka.
- Nilai final.
- Sisa hutang.
- Jatuh tempo.
- Status.

## 12. Uang Muka

Data:

- Nomor.
- Pihak.
- Supplier/vendor.
- Tanggal.
- PO/penugasan.
- Jumlah.
- Metode.
- Rekening.
- Tujuan.
- Status penggunaan.
- Sisa.
- Bukti.

Aturan:

- Dicatat sebagai aset.
- Mengurangi hutang saat invoice muncul.

## 13. Pembayaran Supplier

Header:

- Nomor pembayaran.
- Supplier.
- Tanggal.
- Rekening.
- Metode.
- Total.
- Biaya bank.
- Referensi.
- Bukti.
- Status.
- Pembuat dan penyetuju.

Detail:

- Invoice.
- Nilai hutang.
- Jumlah dibayar.
- Diskon.
- Potongan.
- Sisa.

Nomor:

```text
PAY-SUP-YYYYMM-0001
```

## 14. Pembayaran Vendor

Nomor:

```text
PAY-VND-YYYYMM-0001
```

Terhubung ke:

- Penugasan.
- PO.
- QC.
- Potongan kerusakan.
- Potongan kehilangan.
- Bonus kualitas.
- Bonus ketepatan waktu.

## 15. Kas Masuk

Sumber:

- Setoran modal.
- Refund.
- Pengembalian uang muka.
- Penjualan limbah.
- Pendapatan lain.
- Pinjaman.
- Penjualan aset.

Nomor:

```text
KIN-YYYYMM-0001
```

## 16. Kas Keluar

Contoh:

- Listrik.
- Sewa.
- Transportasi.
- Pembelian kecil.
- Marketing.
- Peralatan.
- Gaji.
- Bank.
- Maintenance.

Nomor:

```text
KOUT-YYYYMM-0001
```

## 17. Transfer Kas/Bank

Jurnal:

```text
Debit: Kas/Bank Tujuan
Kredit: Kas/Bank Sumber
```

Biaya transfer dicatat terpisah.

## 18. Biaya Produksi

### Langsung

- Bahan utama.
- Bahan pendukung.
- Aksesoris.
- Cutting.
- Jahit.
- QC.
- Finishing.
- Packing.

### Tidak langsung

- Supervisor.
- Listrik.
- Sewa workshop.
- Penyusutan mesin.
- Peralatan kecil.
- Maintenance.
- Transportasi.
- Kebersihan.

## 19. Biaya Bahan Aktual

```text
Biaya Bahan Aktual
= Jumlah Digunakan × Harga Rata-Rata
```

Sisa yang kembali ke gudang tidak termasuk biaya final.

## 20. Biaya Cutting

Dapat dihitung berdasarkan:

- Per pcs.
- Per jam.
- Per PO.
- Per meter.
- Persentase.
- Alokasi manual.

## 21. Biaya Jahit

```text
Biaya Jahit Bersih
= Biaya Dasar
+ Bonus
+ Biaya Tambahan
- Potongan
```

## 22. Biaya QC, Finishing, dan Packing

QC:

- Upah petugas.
- Tarif per pcs.
- Re-QC.
- Inspeksi.

Finishing:

- Trimming.
- Cleaning.
- Steam.
- Labeling.
- Hangtag.
- Folding.

Packing:

- Polybag.
- Box.
- Stiker.
- Barcode.
- Thank-you card.
- Silica gel.
- Tenaga packing.

## 23. Overhead

Contoh:

- Listrik workshop.
- Sewa.
- Supervisor.
- Penyusutan.
- Maintenance.
- Air.
- Kebersihan.
- Peralatan kecil.

Metode alokasi:

- Unit.
- Jam kerja.
- Biaya tenaga kerja.
- Biaya bahan.
- Persentase.
- PO.

## 24. HPP per PO

```text
HPP PO
= Biaya Bahan Aktual
+ Biaya Cutting
+ Biaya Jahit
+ Biaya QC
+ Biaya Finishing
+ Biaya Packing
+ Overhead
+ Rework
+ Kerugian Produksi
- Nilai Sisa yang Dipulihkan
```

## 25. HPP per Unit

```text
HPP per Unit
= Total Biaya Produksi PO
÷ Jumlah Barang Jadi yang Diakui
```

## 26. HPP per SKU

Metode:

- Jumlah unit.
- Konsumsi bahan aktual.
- BOM standar.
- Bobot ukuran.
- Tarif khusus.
- Alokasi manual.

Status:

- Belum dihitung.
- Estimasi.
- Menunggu biaya.
- Menunggu hasil produksi.
- Menunggu QC.
- Menunggu overhead.
- Siap diverifikasi.
- Terverifikasi.
- Final.
- Dibuka kembali.

## 27. Nilai Persediaan

### Bahan

```text
Nilai Persediaan Bahan
= Stok × Harga Rata-Rata
```

### WIP

```text
Nilai WIP
= Biaya yang Sudah Terjadi
- Nilai yang Sudah Dipindahkan ke Tahap Berikutnya
```

### Barang Jadi

```text
Nilai Barang Jadi
= Stok Barang Jadi × HPP
```

## 28. Perpindahan Nilai

Bahan ke WIP Cutting:

```text
Debit Persediaan WIP Cutting
Kredit Persediaan Bahan
```

WIP Cutting ke WIP Jahit:

```text
Debit Persediaan WIP Jahit
Kredit Persediaan WIP Cutting
```

WIP Jahit ke WIP QC:

```text
Debit Persediaan WIP QC
Kredit Persediaan WIP Jahit
```

WIP ke Barang Jadi:

```text
Debit Persediaan Barang Jadi
Kredit Persediaan WIP
```

## 29. Jurnal Otomatis

Sumber:

- Pembelian.
- Barang masuk.
- Barang keluar.
- Retur.
- Biaya.
- Hutang.
- Pembayaran.
- Kas masuk/keluar.
- Transfer.
- Penyesuaian stok.
- Barang jadi.
- Reject.
- Rework.

Header:

- ID jurnal.
- Nomor.
- Tanggal.
- Periode.
- Jenis.
- Referensi.
- Deskripsi.
- Total debit.
- Total kredit.
- Status.
- Pembuat.
- Verifikator.

Detail:

- Akun.
- Debit.
- Kredit.
- Departemen.
- PO.
- Produk.
- Vendor.
- Supplier.
- Keterangan.

Nomor:

```text
JV-YYYYMM-0001
```

## 30. Jurnal Manual dan Reversal

Jurnal manual untuk:

- Penyusutan.
- Penyesuaian.
- Koreksi akun.
- Beban dibayar dimuka.
- Hutang biaya.

Reversal:

- Jurnal asal tidak dihapus.
- Reversal membalik debit dan kredit.
- Alasan wajib.
- Memerlukan persetujuan.

## 31. Buku Besar dan Neraca Saldo

Buku besar:

- Tanggal.
- Jurnal.
- Referensi.
- Keterangan.
- Debit.
- Kredit.
- Saldo.
- Departemen.
- PO.

Neraca saldo:

- Saldo awal.
- Mutasi debit.
- Mutasi kredit.
- Saldo akhir.

Debit dan kredit harus seimbang.

## 32. Laba Rugi

```text
Laba Kotor
= Pendapatan - HPP
```

```text
Laba Operasional
= Laba Kotor - Beban Operasional
```

```text
Laba Bersih
= Laba Operasional
+ Pendapatan Lain
- Beban Lain
- Pajak
```

## 33. Neraca

```text
Aset = Liabilitas + Ekuitas
```

Aset:

- Kas.
- Bank.
- Piutang.
- Uang muka.
- Persediaan.
- WIP.
- Barang jadi.
- Aset tetap.

Liabilitas:

- Hutang supplier.
- Hutang vendor.
- Hutang operasional.
- Hutang pajak.

Ekuitas:

- Modal.
- Prive.
- Laba ditahan.
- Laba tahun berjalan.

## 34. Arus Kas

### Operasi

- Penerimaan pelanggan.
- Pembayaran supplier.
- Pembayaran vendor.
- Gaji.
- Operasional.
- Pajak.

### Investasi

- Pembelian/penjualan aset.

### Pendanaan

- Modal.
- Prive.
- Pinjaman.
- Pembayaran pinjaman.

## 35. Laporan Hutang

Aging:

- Belum jatuh tempo.
- 1–30 hari.
- 31–60 hari.
- 61–90 hari.
- Lebih dari 90 hari.

## 36. Analisis Varians

```text
Varians Bahan
= Biaya Aktual - Biaya Standar
```

```text
Varians Tenaga Kerja
= Biaya Aktual - Biaya Standar
```

```text
Varians Overhead
= Overhead Aktual - Overhead Dialokasikan
```

## 37. Analisis Margin

```text
Margin = Harga Jual - HPP
```

```text
Margin %
= Margin ÷ Harga Jual × 100%
```

```text
Markup
= Margin ÷ HPP × 100%
```

## 38. Rekonsiliasi

### Bank

Membandingkan saldo sistem dan rekening.

### Persediaan

Membandingkan:

- Nilai stok bahan dengan akun persediaan.
- Nilai WIP dengan akun WIP.
- Nilai barang jadi dengan akun barang jadi.

## 39. Tutup Periode

Pemeriksaan:

- Semua jurnal seimbang.
- Tidak ada jurnal draft.
- Rekonsiliasi selesai.
- Hutang diperiksa.
- Persediaan direkonsiliasi.
- HPP final.
- Penyusutan dicatat.
- Laporan ditinjau.

## 40. Dashboard Owner

Kartu:

- Saldo kas.
- Saldo bank.
- Hutang supplier.
- Hutang vendor.
- Nilai persediaan bahan.
- Nilai WIP.
- Nilai barang jadi.
- Biaya produksi bulan ini.
- Laba kotor.
- Laba bersih.
- Arus kas bersih.
- HPP rata-rata.

Grafik:

- Pendapatan vs biaya.
- Laba kotor.
- Kas masuk vs keluar.
- Nilai persediaan.
- Hutang jatuh tempo.
- Biaya per tahap.
- HPP per produk.
- Margin produk.
- Anggaran vs realisasi.

Perlu perhatian:

- Hutang jatuh tempo.
- Kas rendah.
- HPP naik.
- Biaya melebihi standar.
- WIP tinggi.
- Persediaan terlalu besar.
- Produk margin rendah.
- Jurnal belum diverifikasi.
- Rekonsiliasi belum selesai.

## 41. Approval

Contoh:

```text
Sampai Rp1.000.000:
Supervisor

Rp1.000.001–Rp10.000.000:
Finance Manager

Di atas Rp10.000.000:
Owner
```

## 42. Struktur Spreadsheet Tahap 5

```text
COMPANY_CONFIG
ACCOUNTING_PERIOD

CHART_OF_ACCOUNTS
ACCOUNT_MAPPING
COST_CATEGORY
PAYMENT_METHOD
CASH_BANK_ACCOUNT

OPENING_BALANCE
OPENING_BALANCE_DETAIL

SUPPLIER_PAYABLE
SUPPLIER_PAYABLE_DETAIL
VENDOR_PAYABLE
VENDOR_PAYABLE_DETAIL

SUPPLIER_ADVANCE
VENDOR_ADVANCE

SUPPLIER_PAYMENT
SUPPLIER_PAYMENT_DETAIL
VENDOR_PAYMENT
VENDOR_PAYMENT_DETAIL

CASH_IN
CASH_OUT
CASH_TRANSFER

OPERATING_EXPENSE
PRODUCTION_COST
PRODUCTION_COST_DETAIL
OVERHEAD_ALLOCATION

HPP_PRODUCTION_ORDER
HPP_PRODUCTION_ORDER_DETAIL
HPP_SKU

INVENTORY_VALUATION
WIP_VALUATION
FINISHED_GOODS_VALUATION

JOURNAL
JOURNAL_DETAIL
JOURNAL_REVERSAL

GENERAL_LEDGER
TRIAL_BALANCE

BANK_RECONCILIATION
INVENTORY_RECONCILIATION

BUDGET
BUDGET_REALIZATION

PERIOD_CLOSING
FINANCIAL_APPROVAL
```

## 43. Kriteria Keberhasilan

- COA dan periode berjalan.
- Kas dan bank tercatat.
- Hutang supplier dan vendor terkontrol.
- Pembayaran bertahap berjalan.
- Biaya produksi terkumpul per PO.
- HPP per PO dan SKU dapat dihitung.
- Nilai persediaan dan WIP tersedia.
- Jurnal otomatis dan manual berjalan.
- Buku besar dan neraca saldo seimbang.
- Laba rugi, neraca, dan arus kas tersedia.
- Dashboard owner menampilkan kondisi keuangan aktual.

---

# CATATAN DASHBOARD OWNER

Kartu **Total Quantity Gabungan** tidak disarankan jika mencampur:

- Meter.
- Roll.
- Pcs.
- Cone.
- Kilogram.
- Barang WIP.
- Barang jadi.

Angka tersebut tidak dapat dipakai untuk keputusan.

Gunakan:

- Total nilai stok bahan.
- Jumlah jenis bahan.
- Bahan kritis.
- Total WIP produk dalam pcs.
- Total barang jadi dalam pcs.
- Nilai WIP.
- Nilai barang jadi.
- PO aktif.
- Produk terlambat.
- Defect rate.
- Hutang jatuh tempo.
- Saldo kas dan bank.

Jika quantity bahan perlu ditampilkan, pisahkan per satuan:

```text
Kain: 4.850 meter
Aksesori: 12.600 pcs
Benang: 320 cone
Bahan roll: 75 roll
Packaging: 4.200 pcs
```

Susunan dashboard owner yang direkomendasikan:

1. Ringkasan keuangan.
2. Perlu perhatian.
3. Pipeline produksi.
4. WIP per lokasi.
5. PO aktif.
6. Stok bahan kritis.
7. QC dan kualitas.
8. Barang jadi.
9. Hutang supplier dan vendor.
10. Tren bulanan.

---

# CATATAN TAHAP 6

Tahap 6 **belum dibuat sebagai PRD lengkap**.

Konsep yang sudah dibahas:

- Penjualan multichannel.
- Shopee.
- TikTok Shop.
- Tokopedia.
- Website.
- Offline.
- Import CSV/Excel.
- Mapping SKU.
- Reservasi stok.
- Mutasi stok penjualan.
- Settlement marketplace.
- Fee platform.
- Voucher.
- Retur.
- Gagal kirim.
- Piutang marketplace.
- HPP barang terjual.
- Margin per channel.
- Dashboard penjualan.

Rekomendasi teknis Tahap 6:

```text
Tahap 6A:
Master Channel, Import Penjualan, Mapping SKU

Tahap 6B:
Reservasi dan Mutasi Stok

Tahap 6C:
Settlement, Retur, dan Gagal Kirim

Tahap 6D:
Jurnal Otomatis dan Margin

Tahap 6E:
Dashboard Penjualan Owner
```

GAS masih dapat digunakan dengan syarat:

- Batch read/write.
- Pagination.
- Cache.
- Summary table.
- Queue import.
- Arsip data.
- LockService.
- Database modular.
- Tidak membaca seluruh spreadsheet pada setiap halaman.

---

# PENUTUP

PRD Tahap 1–5 membentuk alur lengkap:

```text
Inventory Bahan
→ Cutting
→ Bundling
→ Penjahit/Vendor
→ QC
→ Finishing
→ Packing
→ Barang Jadi
→ HPP
→ Keuangan
→ Dashboard Owner
```

Dokumen ini dapat digunakan sebagai:

- Acuan pengembangan Google Apps Script.
- Acuan struktur Google Spreadsheet.
- Acuan pembagian file backend dan frontend.
- Acuan pengujian.
- Acuan pembagian hak akses.
- Acuan pengembangan Tahap 6.
