# Hak Akses — Peran × Halaman

**Sumber kebenaran tunggal.** Kalau `roles` di sidebar, `requireRole` di service,
atau guard halaman berbeda dari tabel ini, yang salah adalah kodenya.

Disusun 21 Sep 2026 untuk `app-yok1`, setelah ditemukan tiga ketimpangan yang
arahnya berbeda-beda (menu lebih ketat, menu lebih longgar, dan service lebih
ketat daripada PRD).

## Kenapa dokumen ini ada

Sebelumnya tidak ada satu tempat yang menyatakan siapa boleh apa:

| Ditulis kapan | Di mana | Masalahnya |
|---|---|---|
| Awal proyek | PRD §3 "Jenis Pengguna" | hanya deskripsi peran, tidak per halaman |
| Tiap fitur dibangun | `requireRole` di tiap service | ditulis terpisah-pisah, tak pernah dicek ke PRD |
| 21 Sep 2026 | `roles` di `sidebar/data/index.ts` | diturunkan dari service, **bukan** dari PRD |

Yang terakhir itu kesalahan saya: menyalin dari service berarti ikut menyalin
penyimpangannya, lalu melegitimasinya lewat menu.

PRD menyebut tabel `ROLE_PERMISSIONS` di §18, tapi isinya tidak pernah
dituliskan. Dokumen ini mengisi kekosongan itu.

## Lima peran (PRD §3, baris 105-142)

| Peran | Kata PRD |
|---|---|
| `owner` | Akses penuh. Melihat seluruh dashboard dan laporan. Menyetujui penyesuaian stok. Mengelola pengguna. Membuka transaksi terkunci. Melihat audit log. |
| `admin_gudang` | Mengelola master bahan. Mencatat barang masuk dan keluar. Melihat stok dan mutasi. Mengajukan penyesuaian stok. |
| `admin_produksi` | **Melihat stok. Melihat barang keluar ke produksi.** Melihat referensi PO dan tujuan cutting. |
| `keuangan` | Melihat harga bahan. Melihat transaksi supplier. Melihat nilai persediaan. Mengekspor laporan pembelian. |
| `viewer` | **Hanya melihat dashboard dan laporan tertentu.** |

Dua yang dicetak tebal adalah sumber ketimpangan terbesar, dijelaskan di bawah.

## Prinsip

1. **Menu mencerminkan server.** Tidak lebih ketat (menyembunyikan akses yang
   sah), tidak lebih longgar (menggoda lalu menolak).
2. **Membaca dan menulis dipisah.** Banyak peran boleh melihat sesuatu tanpa
   boleh mengubahnya. Kolom di tabel ini adalah hak **baca** — hak tulis
   ditulis terpisah di kolom terakhir.
3. **Tahap 1 mengikat PRD.** Untuk Tahap 2-4, PRD tidak merinci peran, jadi
   yang berlaku adalah kondisi sekarang sampai klien memutuskan.

---

## Tahap 1 — Inventory (PRD mengikat)

| Halaman | Baca | Tulis | Catatan |
|---|---|---|---|
| Dashboard | semua | — | PRD: viewer boleh |
| Master Bahan / Kategori / Satuan / Warna | semua | owner, gudang | PRD: gudang "mengelola master bahan" |
| Master Supplier | semua | owner, gudang | keuangan "melihat transaksi supplier" |
| Stok Bahan | semua | — | PRD: produksi & keuangan boleh melihat |
| Mutasi Stok | semua | — | turunan stok |
| Barang Masuk | owner, gudang, keuangan, viewer | owner, gudang | sudah benar di server |
| **Barang Keluar** | owner, gudang, keuangan, viewer, **+produksi** | owner, gudang | ⚠️ produksi belum ada — lihat di bawah |
| Penyesuaian Stok | owner, gudang | owner, gudang | approval: owner saja |
| Laporan (5 tab) | semua | — | PRD: viewer & keuangan masuk lewat sini |

### Yang harus dilonggarkan

**Barang Keluar — `admin_produksi` tidak ada di daftar baca.**

Fungsi baca di `barang-keluar.ts` (baris 178, 194):
```
sekarang  : requireRole(["owner", "admin_gudang", "keuangan", "viewer"])
seharusnya: + "admin_produksi"
```

PRD menyebut eksplisit admin_produksi "melihat barang keluar ke produksi", dan
struktur menu PRD §4 bahkan punya `PRODUKSI → Barang Keluar ke Cutting`. Staf
produksi sekarang tidak bisa melihat bahan yang keluar untuk produksinya
sendiri — padahal viewer bisa.

**Ini penyimpangan dari PRD, bukan sekadar ketidakcocokan menu.**

Fungsi tulis (baris 27) tetap `owner, admin_gudang` — produksi hanya membaca.

Catatan: Barang Masuk sudah benar (keuangan & viewer boleh membaca sejak awal).
Dugaan awal saya bahwa keuangan terkunci ternyata salah — baris 40 yang saya
lihat adalah fungsi tulis, bukan baca.

### Yang harus diketatkan

Hanya **Penyesuaian Stok** yang perlu dibatasi di menu — server-nya
`owner, admin_gudang`, tapi menunya terbuka untuk semua role, jadi viewer
mengklik lalu ditolak.

Barang Masuk & Keluar TIDAK perlu dibatasi di menu: semua role memang boleh
membacanya, yang dibatasi hanya tombol Tambah/Edit di dalamnya.

`roles` nav Persediaan menjadi:

```ts
// Stok Bahan & Mutasi: semua role (tanpa roles)
// Barang Masuk & Keluar: semua role boleh membaca (tanpa roles)
// yang dibatasi hanya tombol Tambah/Edit di dalamnya
{ title: "Penyesuaian Stok", roles: ["owner", "admin_gudang"] }
```

---

## Tahap 2-4 — Produksi, Vendor, QC (PRD tidak merinci)

PRD Tahap 2-5 tidak mengulang bagian "Jenis Pengguna", jadi tidak ada rujukan
per halaman. Yang berlaku: **kondisi server sekarang**, dengan menu disamakan
kepadanya.

| Kelompok | Baca | Sumber |
|---|---|---|
| Produksi (PO, Permintaan Bahan, Cutting, Bundle) | owner, produksi | `po-produksi.ts`, `bom.ts`, `bundling.ts` |
| Vendor & Gudang (Penugasan, Pengiriman, Penerimaan, Retur, Selisih) | owner, gudang, produksi | `pengiriman-jahit.ts`, `retur-jahit.ts` |
| Biaya Jasa Jahit | owner, produksi, **keuangan** | `biaya-jasa-jahit.ts` |
| Sablon & Bordir | owner, produksi | `dekorasi.ts` |
| QC pemeriksaan (WO, Pemeriksaan, Rework, Re-QC, Karantina, Finishing) | owner, produksi | `wo-qc.ts`, `rework.ts` |
| **QC penerimaan (Penerimaan QC, Antrean)** | owner, gudang, produksi | `penerimaan-qc.ts` |
| Packing & Stok Barang Jadi | owner, produksi, gudang | `packing.ts`, `barang-jadi.ts` |
| Monitoring (WIP) | owner, produksi | layar produksi |

### Yang harus diubah

**Menu QC sekarang lebih ketat dari server.** Saya isi `roles: [owner,
admin_produksi]` untuk kesepuluh menu QC saat `app-qr6o`, padahal beberapa
service-nya lebih longgar:

```
nav Penerimaan QC : owner, admin_produksi
server            : owner, admin_gudang, admin_produksi   <- gudang terkunci di menu
```

Gudang seharusnya melihat Penerimaan QC (dia yang menyerahkan barang ke QC).
Samakan `roles` nav dengan `READ_ROLES` masing-masing service.

---

## Master data yang belum punya guard sama sekali

Sepuluh master ini tidak punya `requireRole` di service-nya — terbuka untuk
semua yang login:

Kategori, Satuan, Warna, Supplier, Produk, Kemasan, Vendor, Penjahit,
Lokasi Produksi, Jenis Cacat.

**Dibiarkan terbuka untuk sekarang** (keputusan Abu 21 Sep). Menyembunyikannya
di menu tanpa guard server hanya ilusi — URL tetap bisa dibuka. Tercatat di
`CLAUDE.md` § Utang Teknis.

Kalau nanti diperketat, urutannya: pasang `requireRole` di service **dulu**,
baru `roles` di nav. Bukan sebaliknya.

---

## Cara memakai dokumen ini

Saat menambah halaman atau mengubah hak akses:

1. Cari barisnya di tabel ini. Kalau tidak ada, **tambahkan dulu** — jangan
   menebak dari halaman sebelah.
2. Pasang `requireRole` di service sesuai kolom Baca/Tulis.
3. Pasang `roles` di nav **sama persis** dengan kolom Baca.
4. Guard halaman pakai `bolehAkses` + `<AksesDitolak />`, bukan `requireRole`
   (yang melempar dan membuat halaman crash).

Untuk halaman bertab yang isinya campur role: **jangan** beri guard di level
halaman — saring tabnya saja, supaya peran yang boleh sebagian tab tetap bisa
masuk. Polanya ada di `master/data-produk/`.
