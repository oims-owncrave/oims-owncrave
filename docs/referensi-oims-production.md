# Referensi: oims-production (Aplikasi Lama)

> Sumber: `~/Documents/Programs/Offline/oims/oims-production` — dibangun via ChatGPT/Codex, 50 commit (30 Jul – 30 Aug 2026), deploy Vercel + Supabase. Repo GitHub `bahtiary354/oims-production`.
>
> Aplikasi ini adalah **implementasi berjalan dari cakupan PRD Tahap 2–4** (`docs/OIMS_PRD_Tahap_1_sampai_5.md`) dalam bentuk yang sangat disederhanakan. Berharga sebagai referensi **alur bisnis & status produksi yang sudah teruji dipakai owner** — BUKAN referensi arsitektur (1 file `page.tsx` 485KB, seluruh state = 1 baris JSONB di tabel `app_state`).

## 1. Ringkasan Arsitektur (kenapa bukan contoh teknis)

- Seluruh aplikasi: `app/page.tsx` (485KB) + 1 API route `app/api/state/route.ts`.
- Database: 1 tabel `app_state (id, payload jsonb, updated_at)` — seluruh data aplikasi disimpan sebagai satu JSON (`AppData`), load/save utuh. Ada merge conflict resolver sederhana di client.
- Tidak ada auth per-role, tidak ada audit log, tidak ada mutasi stok immutable.
- Status TIDAK disimpan sebagai kolom — **diderivasi realtime** dari keberadaan record turunan (lihat §4). Ini pola penting yang layak ditiru secara konsep.

## 2. Rantai Stage Produksi

13 stage, disimpan sebagai `records[namaStage][]`. Tiap record punya `sourceId` yang menunjuk record di stage induk (parent-child).

| # | Stage | Prefix | Source (induk) | Perpindahan fisik |
|---|-------|--------|----------------|-------------------|
| 0 | Order Produksi | `PO` | — (induk semua) | — |
| 1 | Cutting | `CUT` | Order Produksi | — |
| 2 | Sablon/Bordir | `SBR` | Cutting | Gudang Cutting → Vendor Sablon/Bordir |
| 3 | Bundle | `BDL` | Cutting | — |
| 4 | Pengiriman Vendor | `KRM` | Bundle | Gudang Cutting → Vendor Jahit |
| 5 | Penerimaan Gudang | `TRM` | Pengiriman Vendor | Vendor Jahit → Gudang |
| 6 | Pengiriman QC | `KQC` | Penerimaan Gudang | Gudang → Quality Control |
| 7 | Quality Control | `QC` | Pengiriman QC | — |
| 8 | Rework | `RWK` | Quality Control / QC Ulang | Quality Control → Vendor Rework |
| 9 | Penerimaan Rework | `TRW` | Rework | Vendor Rework → Quality Control |
| 10 | QC Ulang | `QCR` | Penerimaan Rework | — |
| 11 | Karantina Reject | `RJT` | Quality Control / QC Ulang | — |
| 12 | Stok Barang Jadi | `STK` | Quality Control / QC Ulang | Quality Control → Stok Jadi |

```text
PO Produksi
 └─ Cutting (hasil potong aktual)
     ├─ Sablon/Bordir (opsional, per pekerjaan dekorasi — paralel dgn bundle)
     └─ Bundle (bagi hasil cutting jadi bundel)
         └─ Pengiriman Vendor (kirim bundel ke vendor jahit + surat jalan)
             └─ Penerimaan Gudang (terima setoran vendor, boleh bertahap)
                 └─ Pengiriman QC (kirim ke QC + surat jalan)   [skip jika QC di vendor]
                     └─ Quality Control (catat lolos / repair / reject per warna+ukuran)
                         ├─ lolos  → Stok Barang Jadi
                         ├─ repair → Rework → Penerimaan Rework → QC Ulang (loop ke 3 cabang lagi)
                         └─ reject → Karantina Reject
```

Hasil QC dipecah per varian (warna+ukuran) di `qcDetails[] {color, size, qty, passed, reject, repair}` — cabang Rework/Stok/Karantina masing-masing hanya mengambil porsi `repair`/`passed`/`reject`.

## 3. Label Status per Stage (yang tampil ke user)

Semua status derived, 3 tone: `waiting` / `partial` / `done`.

| Stage | Kondisi | Label |
|-------|---------|-------|
| Order Produksi | belum ada Cutting | Menunggu Cutting |
| | sudah ada Cutting | Selesai · Masuk Cutting |
| Cutting | belum dibundel sama sekali | Menunggu Bundle |
| | dibundel sebagian | Sebagian Dibundle |
| | semua dibundel, belum semua dikirim | Selesai Dibundle |
| | semua bundel terkirim | Seluruh Bundle Dikirim |
| Bundle (baris sisa) | hasil cutting belum masuk bundel | Belum dibundel |
| Bundle | belum ada Pengiriman Vendor | Menunggu Pengiriman Vendor |
| | sudah dikirim | Dikirim ke Vendor Jahit |
| Sablon/Bordir | selesai 0 | Di vendor dekorasi |
| | selesai sebagian | Selesai sebagian · n/total |
| | selesai semua | Selesai |
| Pengiriman Vendor | belum ada setoran | Masih Dijahit |
| | setoran sebagian | Setoran Sebagian · n/total |
| | setoran lengkap | Selesai Dijahit & Disetor |
| Penerimaan Gudang | qcMode=vendor | QC Vendor Selesai · [petugas] |
| | belum kirim QC | Menunggu Kirim QC |
| | kirim QC sebagian | Dikirim ke QC sebagian · n/total |
| | kirim QC semua | Seluruhnya dikirim ke QC |
| Pengiriman QC | belum diperiksa | Menunggu Pemeriksaan QC |
| | sudah diperiksa | Selesai Diperiksa QC |
| Quality Control / QC Ulang | ada hasil belum ditindaklanjuti | Menunggu tindak lanjut hasil QC |
| | semua repair→Rework, passed→Stok, reject→Karantina | Hasil ditindaklanjuti (· Reject dikarantina) |
| Rework | belum ada penerimaan | Sedang diperbaiki vendor |
| | sudah diterima | Hasil Rework diterima |
| Penerimaan Rework | belum QC ulang | Menunggu QC ulang |
| | sudah QC ulang | Selesai QC ulang |
| Stok Barang Jadi | — | Masuk Stok Barang Jadi (selalu done) |

## 4. Pola Derivasi Status (pola konsep yang layak ditiru)

- **Status = fungsi dari record turunan**, bukan kolom yang di-update. Contoh: status PO "Selesai · Masuk Cutting" murni karena ada record Cutting dengan `sourceId` = PO itu. Tidak ada risiko status basi/tidak sinkron.
- **Sisa/remaining dihitung dengan aritmetika varian**: `sisa = variants_induk − Σ variants_anak` per (warna, ukuran). Dipakai untuk: sisa belum dibundel, sisa di vendor (WIP jahit), sisa belum dikirim QC.
- **Penerimaan bertahap didukung natural**: 1 Pengiriman Vendor boleh punya banyak Penerimaan Gudang; sisa di vendor otomatis = dikirim − Σ diterima. Sama untuk kirim QC.
- **Satu bundel = satu pengiriman aktif**: bundel yang sudah masuk Pengiriman Vendor tidak bisa dikirim lagi (`sourceAvailable` cek existing).

## 5. Sub-flow Sablon/Bordir (Dekorasi)

- Per **model produk** disetel `decorationProcess`: `none | screenprint | embroidery | both`, plus daftar `decorationTemplates` (jenis, posisi, deskripsi, tarif default).
- Posisi dekorasi baku: Dada kiri, Dada kanan, Badan depan, Badan belakang, dst.
- Pekerjaan dekorasi dibuat **per template per cutting** (source = record Cutting), dikirim ke vendor dekorasi, dicatat `decorationCompleted` bertahap, plus tagihan (`decorationRate × qty`) dan pembayaran.
- Berjalan **paralel** dengan Bundle (dua-duanya anak Cutting). Flag `decorationRequiredBeforeBundle` / `decorationFinalStep` ada di schema tapi selalu `false` — urutan dekorasi-vs-bundle TIDAK pernah di-enforce di app lama. Catatan untuk rebuild: tanyakan owner apakah dekorasi wajib selesai sebelum bundling.
- Vendor punya `capabilities: ["sewing" | "screenprint" | "embroidery"]` + tarif per jenis — satu vendor bisa jahit sekaligus dekorasi.

## 6. Mode QC: Internal vs Vendor

- Vendor jahit punya `qcMode: "internal" | "vendor"`.
- `vendor` = QC dilakukan DI vendor (ada `qcOfficer` + `qcLocationCode`). Saat setoran diterima gudang, stage Pengiriman QC **di-skip** — status langsung "QC Vendor Selesai", label "Selesai diperiksa di vendor".
- `internal` = jalur normal Gudang → Pengiriman QC → Quality Control.
- Ada master `QCLocation` (lokasi QC + penerima + tarif QC per pcs + rekening).

## 7. Pembayaran (irisan Tahap 5 yang sudah jalan)

Tiga titik biaya jasa per pcs, semua pakai pola sama:

| Jenis | Dasar tagihan | ID pembayaran | Dicatat di stage |
|-------|---------------|---------------|------------------|
| Cutting | `cuttingRate × total` | `BYR-CUT-YYMM-NNN` | Cutting |
| Dekorasi | `decorationRate × total` | `BYR-DEK-YYMM-NNN` | Sablon/Bordir |
| Jahit vendor | `sewingRate × total` | `BYR-JHT-YYMM-NNN` | Penerimaan Gudang |

- Status pembayaran: `Belum dibayar` (paid ≤ 0) → `DP sebagian` (paid < tagihan) → `Lunas`.
- `paymentHistory[]` per record: tanggal, jumlah, PIC, requester, rekening tujuan, catatan, bisa **void** (dengan alasan, timestamp, siapa) — bukan delete.
- **Pembayaran mingguan** (`WeeklyPayment`, ID `BAY-{CUT|DEK|JHT|QC}-YYMM-NNN`): rekap banyak record jadi 1 pembayaran per payee per periode, dengan `lines[]` per record. Kind: `cutting | qc | vendor | decoration`. Ada juga tarif QC (`qcRate`) yang dibayar ke lokasi QC.
- Master Vendor / PIC / QCLocation semua simpan rekening bank (bankName, accountNumber, accountHolder) — dipakai prefill pembayaran.

## 8. Penomoran Dokumen

- Record stage: `{PREFIX}-{KODE_MODEL}-{YYYYMM}-{NNN}` (counter per stage). Contoh: `CUT-NRD-202608-001`, `BDL-NRD-202608-003`.
- Bundle punya kode pendek `B001`–`B999` di ujung ID; kode cutting bisa direkonstruksi dari ID bundel (`BDL-X-B001` → `CUT-X`).
- PO: `PO-YYYYMM-NNN`. Reject case: `RJT-`. Surat jalan: `SJ-`.
- Pembayaran: lihat §7 (`BYR-` per record, `BAY-` mingguan).
- Master: `VDR-` (vendor), `PIC-`, `QCL-` (lokasi QC), `DT-`/`DD-` (template/draft dekorasi).

## 9. Surat Jalan (Delivery Note)

Dibuat otomatis untuk **3 perpindahan** saja:

1. `Gudang Cutting → Vendor Jahit` (kirim bundel)
2. `Gudang → Quality Control` (kirim hasil jahit ke QC)
3. `Gudang Cutting → Vendor Sablon/Bordir` (kirim dekorasi)

Isi `Note`: nomor, tanggal, proses, sumber, model, from/to, varian per warna+ukuran, total, petugas, penerima, daftar bundel. Ada print view (termasuk kartu bundel thermal).

## 10. Mapping ke PRD Tahap 2–4

Apa yang app lama **implementasikan vs sederhanakan** dari PRD — checklist gap untuk rebuild:

### Tahap 2 (Produksi, Cutting, Bundling)

| PRD | App lama | Status |
|-----|----------|--------|
| Master produk + varian (warna×ukuran) | `Model {colors[], sizes[]}` — matrix varian | ✅ ada (tanpa SKU formal) |
| BOM + estimasi kebutuhan bahan | — | ❌ tidak ada |
| PO produksi (status 11 tahap) | Order Produksi, status derived 2 kondisi | ✅ disederhanakan |
| Permintaan bahan + integrasi barang keluar | — | ❌ tidak ada (tak terhubung inventory bahan) |
| Penerimaan cutting, WO cutting, proses cutting | langsung "catat hasil cutting" | ✅ sangat disederhanakan |
| Pemakaian aktual, sisa bahan, limbah | — | ❌ tidak ada |
| Bundling + label bundel | Bundle + kartu bundel thermal + QR | ✅ ada |
| WIP cutting | status derived per record | ✅ ada |

### Tahap 3 (Penjahitan Vendor, WIP)

| PRD | App lama | Status |
|-----|----------|--------|
| Master penjahit + vendor + lokasi | Vendor (+capabilities+rekening), PIC, QCLocation | ✅ ada, digabung |
| Tarif berversi + snapshot | `sewingRate` snapshot di record | ✅ snapshot ada, versi tarif tidak |
| Penugasan + pengiriman + surat jalan | Pengiriman Vendor + SJ otomatis | ✅ digabung 1 langkah |
| Serah terima + kondisi | — (langsung terima) | ⚠️ minimal |
| 18 status WIP jahit | derived: Masih Dijahit / Setoran Sebagian / Selesai | ✅ disederhanakan drastis |
| Update progres % dari vendor | tidak ada — progres = setoran diterima | ⚠️ beda pendekatan |
| Penerimaan bertahap | ✅ native (aritmetika varian) | ✅ ada |
| Selisih / hilang / rusak / retur jahit | hanya lewat QC reject/repair | ⚠️ sebagian |
| Biaya jasa + status pembayaran | BYR/BAY + Belum/DP/Lunas + void | ✅ ada, lebih maju dari PRD minimum |
| Kinerja vendor (grade A–D) | — | ❌ tidak ada |
| Dekorasi (sablon/bordir) sebagai flow sendiri | ✅ full sub-flow | ➕ TIDAK ada di PRD — tambahan dari kebutuhan riil |

### Tahap 4 (QC, Finishing, Packing, Barang Jadi)

| PRD | App lama | Status |
|-----|----------|--------|
| Standar QC berversi + jenis cacat + checklist | catatan bebas per varian | ❌ tidak ada |
| Grade A/B/C/Reject | hanya lolos / repair / reject | ✅ disederhanakan |
| Metode 100% vs sampling | implisit 100% | ⚠️ |
| QC per pcs + barcode | per varian (warna+ukuran), agregat | ✅ disederhanakan |
| Rework internal vs vendor + Re-QC | Rework → Penerimaan Rework → QC Ulang (loop) | ✅ ada, satu jalur |
| Karantina/tindakan reject | Karantina Reject (stage sendiri) | ✅ ada |
| Finishing + packing + kemasan | — | ❌ tidak ada |
| Barang jadi + stok per SKU/grade/lokasi | Stok Barang Jadi per model+warna+ukuran | ✅ disederhanakan (1 lokasi, tanpa grade) |
| Mutasi barang jadi | — (append record saja) | ⚠️ |
| Yield, defect rate, COPQ | dashboard hitung agregat sederhana | ⚠️ sebagian |

### Kesimpulan gap terbesar (yang PRD minta tapi belum pernah teruji di app lama)

BOM & keterhubungan ke inventory bahan (Tahap 1↔2), pemakaian aktual/sisa/limbah, standar QC & grade, finishing/packing, kinerja vendor. Sisanya sudah pernah jalan dalam bentuk sederhana — rebuild tinggal menormalkan ke schema relasional + aturan proyek (mutasi immutable, audit log, soft delete).

**Tahap 5 = greenfield murni.** Dari 33 poin ruang lingkup PRD Tahap 5, app lama cuma punya irisan pembayaran jasa vendor/pekerja (§7). Double-entry, COA, jurnal, kas, hutang supplier, HPP, laporan keuangan — semua tidak pernah ada implementasi referensi. Keputusan saat ini: **Tahap 5 di-skip dulu**, fokus Tahap 2–4.

## 11. Struktur Menu App Lama

Master Data · Produksi · Sablon & Bordir · Vendor & Gudang · Quality Control · Persediaan · Laporan — plus dashboard owner (PO Aktif, Di Area Cutting, Masih di Vendor, Menunggu QC, Stok Jadi, breakdown: Baru masuk gudang / Dalam antrean QC / Lolos belum masuk stok / Sedang repair / Reject).
