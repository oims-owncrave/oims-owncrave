# Alur Proses & Menu — Flowchart

Peta alur produksi Owncrave, dipetakan ke nama menu sidebar persis (bukan istilah PRD).
Baca [`konsep-produksi.md`](konsep-produksi.md) untuk istilah domain (BOM, WIP, HPP, dll).

---

## Flowchart Utama

```mermaid
flowchart TD
    subgraph P["📦 PERSEDIAAN — admin_gudang"]
        P1[Barang Masuk<br/>bahan dari supplier]
        P2[Stok Bahan<br/>gudang]
        P3[Barang Keluar<br/>bahan ke produksi]
        P1 --> P2 --> P3
    end

    subgraph PR["✂️ PRODUKSI — admin_produksi"]
        PR1[PO Produksi<br/>rencana: produk+warna+ukuran+qty]
        PR2[Permintaan Bahan<br/>hitung kebutuhan dari BOM]
        PR3[Cutting<br/>potong kain]
        PR4[Bundle<br/>ikat + label QR]
        PR1 --> PR2 --> PR3 --> PR4
    end

    subgraph V["🚚 VENDOR & GUDANG — admin_produksi"]
        V1[Penugasan Jahit]
        V2[Pengiriman Vendor]
        V3[Surat Jalan]
        V4[Penerimaan Hasil]
        V5{Ada masalah?}
        V6[Retur & Perbaikan]
        V7[Selisih & Kasus]
        V1 --> V2 --> V3 --> V4 --> V5
        V5 -->|ya| V6
        V5 -->|ya, kuantitas| V7
        V6 --> V4
    end

    subgraph S["🎨 SABLON & BORDIR — admin_produksi"]
        S1[Pekerjaan Dekorasi]
        S2[Template Dekorasi]
        S2 -.pakai template.-> S1
    end

    subgraph Q["✅ QUALITY CONTROL — admin_produksi (belum ada role QC khusus)"]
        Q1[Penerimaan QC]
        Q2[Antrean QC]
        Q3[Work Order QC]
        Q4[Pemeriksaan QC]
        Q5{Lolos grade?}
        Q6[Rework<br/>balik perbaiki]
        Q7[Re-QC]
        Q8[Karantina Reject]
        Q9[Finishing]
        Q10[Packing]
        Q11[Stok Barang Jadi]
        Q1 --> Q2 --> Q3 --> Q4 --> Q5
        Q5 -->|B: cacat ringan| Q6 --> Q7 --> Q5
        Q5 -->|C/Reject| Q8
        Q5 -->|A: sempurna| Q9 --> Q10 --> Q11
    end

    PR2 -.trigger.-> P3
    P3 -.eksekusi.-> PR3
    PR4 --> V1
    V4 -.opsional.-> S1
    S1 --> Q1
    V4 -->|tanpa dekorasi| Q1
```

---

## Cara Baca

1. **Persediaan** — bahan mentah masuk gudang, disimpan, lalu dikeluarkan untuk produksi. Modul ini yang paling sering dibuka harian.
2. **Produksi** — dimulai dari rencana (PO Produksi: mau bikin apa, warna, ukuran, qty), sistem hitung kebutuhan bahan (BOM) jadi **Permintaan Bahan** (dokumen minta ke gudang). Permintaan ini yang **memicu** Barang Keluar di Persediaan — bukan sebaliknya. Setelah bahan fisik diterima, baru Cutting (potong) jalan, hasil diikat jadi Bundle berlabel QR. Titik ini bahan **keluar dari kontrol internal**.
3. **Vendor & Gudang** — Bundle dikirim ke penjahit luar. Owncrave sendiri tidak menjahit. "Penerimaan Hasil" = baju jadi balik ke gudang internal. Kalau ada masalah kuantitas/kualitas → Retur atau catat di Selisih & Kasus.
4. **Sablon & Bordir** — opsional, hanya untuk item yang butuh dekorasi. Kalau tidak butuh, langsung ke QC.
5. **Quality Control** — tahap terakhir sebelum jadi stok final. Grade A lolos langsung, grade B masuk Rework lalu Re-QC (bisa berulang), grade C/Reject dikarantina (tidak dijual). Yang lolos → Finishing → Packing → **Stok Barang Jadi**.

**Inti kebingungan yang dijawab diagram ini**: barang **keluar-masuk gudang berkali-kali** (internal → vendor jahit → vendor sablon → QC internal), bukan sekali jalan seperti toko biasa. "Siap" di satu tahap belum berarti final — masih ada tahap berikut sampai ke Stok Barang Jadi.

**Persediaan dan Produksi bukan kerja paralel/bareng** — dua departemen beda yang saling nunggu, tetap sequential per unit kerja (PO → Permintaan Bahan → nunggu digudangkan → Barang Keluar → nunggu diterima → Cutting). Kelihatan seperti 2 kotak sejajar di diagram karena memang 2 tabel database beda yang saling rujuk, bukan 2 proses jalan bersamaan tanpa nunggu.

---

## Siapa Pegang Apa (Role)

Role sudah diimplementasi di kode (`requireRole()` per halaman), bukan sekadar rencana. **Sidebar tidak difilter per role** — semua orang lihat semua menu, tapi aksi create/edit dibatasi per halaman. Jadi admin_gudang **bisa lihat** halaman Permintaan Bahan (baca-saja), cuma tidak bisa buat/ubah dari situ.

| Role | Bisa CREATE/EDIT | Cuma bisa lihat |
|---|---|---|
| **owner** | Semua modul + approval | — |
| **admin_gudang** | Barang Masuk, Barang Keluar, Penyesuaian Stok | Permintaan Bahan, PO Produksi, dll (baca-saja) |
| **admin_produksi** | PO Produksi, Permintaan Bahan, WO Cutting, BOM, Penugasan Jahit, Dekorasi | Barang Masuk/Keluar (baca-saja — **tidak bisa** eksekusi sendiri) |
| **keuangan** | Tahap 5 (belum ada menu) | — |
| **viewer** | — | Semua modul, baca-saja |

**Kenapa dipisah begini (segregation of duty)**: yang **minta** bahan (admin_produksi) dan yang **kasih/eksekusi keluar** bahan (admin_gudang) harus 2 role beda — kalau 1 orang pegang dua-duanya, selisih stok gak ada kontrol silang.

**Alur konkret Permintaan Bahan → Barang Keluar** (terhubung otomatis via `barang_keluar.permintaan_bahan_id`, bukan input ulang manual):

```
admin_produksi: PO Produksi → submit Permintaan Bahan
                                    ↓
admin_gudang  : lihat menu Permintaan Bahan (baca-saja) → ada request masuk
                → buka Barang Keluar → pilih permintaan itu → input qty keluar
                                    ↓
                Stok Bahan berkurang, status Permintaan Bahan → terpenuhi
```

**QC dipegang `admin_produksi`** — tidak ada role `admin_qc` khusus (`src/services/rework.ts` baris 26: `WRITE_ROLES = ["owner", "admin_produksi"]`).

⚠️ Idealnya QC dipegang staf terpisah dari produksi, dengan alasan yang sama seperti pemisahan Persediaan↔Produksi di atas: orang tidak menilai hasil kerjanya sendiri dengan jujur. Tapi kalau tim Owncrave kecil, perangkapan itu wajar — yang penting jejaknya tercatat. Ditanyakan ke klien di `app-x98y`.

---

## Peta Tahap Sistem

| Menu Sidebar | Tahap PRD | Lihat juga |
|---|---|---|
| Persediaan | Tahap 1 | [`konsep-produksi.md`](konsep-produksi.md) §Tahapan Sistem |
| Produksi | Tahap 2 | — |
| Vendor & Gudang | Tahap 3 | — |
| Sablon & Bordir | Tahap 3 (dekorasi) | — |
| Quality Control | Tahap 4 | — |
| *(Keuangan, HPP)* | Tahap 5 | belum ada menu — akumulasi biaya tiap tahap di atas |

---

## Salah Paham yang Sering Terjadi

Dikumpulkan dari sesi pemahaman sistem 18 Sep 2026. Ini bagian yang paling
sering keliru dibaca — termasuk oleh AI yang menebak dari nama menu saja.

| Dugaan yang wajar | Kenyataannya |
|---|---|
| Mutasi Stok = ringkasan Barang Masuk/Keluar | Kebalikannya. Mutasi lebih **rinci** — satu nota masuk berisi 3 bahan jadi 3 baris mutasi. Yang ringkasan itu **Stok Bahan** (saldo akhir). |
| Barang Keluar memicu Permintaan Bahan | Kebalikannya. Permintaan Bahan ditulis dulu (oleh produksi), Barang Keluar yang menunjuk ke sana (`barang_keluar.permintaan_bahan_id`). |
| Permintaan Bahan = minta **beli** bahan | Bukan. Itu minta **ambil dari stok gudang** yang sudah ada. Pembelian ada di alur lain (Barang Masuk dari supplier). |
| Owncrave menjahit sendiri | Sebagian. Ada 5 jenis penjahit (`penjahitJenisEnum`): `internal`, `eksternal_individu`, `anggota_vendor`, `freelance`, `sampel`. Jadi campuran, bukan semuanya vendor luar. |
| PO Produksi langsung menampilkan daftar bahan | Tidak. Isi PO = **varian produk** (SKU warna×ukuran) yang mau dibuat. Bahannya dihitung otomatis di halaman **detail PO** setelah disimpan ("Estimasi Kebutuhan Bahan"). |
| "Lebihan" itu satu konsep | Dua konsep beda bernama sama. Di Excel klien = sisa/cadangan **bahan aksesoris**; di form PO = buffer **produk jadi**. Lihat `app-itl4`. |
| Barang jadi setelah dijahit langsung masuk gudang | Tidak. Masih harus lewat QC (bisa berulang kalau kena Rework), baru Finishing → Packing → Stok Barang Jadi. |

---

## Selisih Model Sistem vs Model Klien

Dua sumber dari klien (gambar skema "Skema Aplikasi Stok Bahan & WIF Produksi"
dan app vibe-coding mereka sendiri) menunjukkan cara mereka memandang alurnya.
Berguna bukan sebagai "mana yang benar" — app klien bukan referensi kebenaran —
tapi sebagai cerminan **model mental** mereka, yang menentukan apakah sebuah
menu terasa wajar atau membingungkan saat dipakai.

| Hal | Model klien | OIMS sekarang |
|---|---|---|
| Urutan Sablon/Bordir | Berurutan: Bundling → Sablon → Penjahit | Bebas — dekorasi menunjuk ke WO Cutting, "urutan tidak dipaksa sistem" |
| Finishing/Packing/Stok Jadi | Di luar QC (kotak "Penerimaan Gudang" terpisah) | Di dalam menu Quality Control |
| Grup QC | Dua menu: "Quality Control" (jalur normal) + "Rework & Karantina" (jalur bermasalah) | Satu accordion berisi 10 item |
| Istilah dokumen produksi | **WIF** ("Buat WIF / Order Produksi") | **PO Produksi** |
| Penerimaan barang dari rework | Menu sendiri ("Penerimaan Rework") | Belum ketemu padanan eksplisit |

Semua baris di atas ditanyakan ke klien di **`app-x98y`**.

Yang **bukan** masalah meski tidak ada di gambar klien: Permintaan Bahan, Surat
Jalan, Selisih & Kasus, Biaya Jasa Jahit, Antrean QC, Karantina Reject. Gambar
itu ringkasan satu halaman, wajar memadatkan. Semuanya punya dasar di PRD —
Antrean QC disebut 6×, Rework 5×, Re-QC 8×, dan Barang Reject punya bab sendiri
(bab 18). Jadi sistem memang **harus** lebih rinci dari gambar.

---

## Issue Terkait

| ID | Isi |
|---|---|
| `app-x98y` | Pertanyaan untuk klien: siapa yang periksa QC, urutan Sablon, istilah WIF/PO, penempatan Finishing/Packing |
| `app-qr6o` | Sidebar tidak difilter per role — semua user lihat semua menu |
| `app-jroq` | Matrix input Target per SKU di form PO Produksi (menggantikan dropdown satu-satu) |
| `app-itl4` | Field "Lebihan Pcs" — klien pernah minta atau tidak |
| `app-fbra` | Bisa buat Template Dekorasi tanpa peringatan kalau produk belum disetel dekorasinya |
| `app-pbxe` | Gabung menu Surat Jalan jadi tab di Pengiriman Vendor |
| `app-z4wp.5` | Gabung 2 pasang menu QC jadi tab (Penerimaan+Antrean, Rework+Re-QC) |
