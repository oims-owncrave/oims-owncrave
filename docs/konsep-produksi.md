# Konsep Domain Produksi Garmen — OIMS

Distilasi alur bisnis Owncrave dari PRD. Baca ini sebelum coding fitur produksi.

---

## Alur Besar

```
Pembelian Bahan
  → Barang Masuk (dari supplier)
  → Stok Bahan (gudang)
  → Barang Keluar (ke cutting)
  → Work Order Cutting
  → Bundling (+ label/QR)
  → Penugasan ke Penjahit Internal / Vendor Eksternal
  → Monitoring WIP (barang dalam proses)
  → Penerimaan Hasil Jahit
  → QC (quality control, grading A/B/C/Reject)
  → Finishing & Packing
  → Stok Barang Jadi
  → HPP (harga pokok produksi per PO/unit/SKU)
  → Laporan Keuangan
```

---

## Prinsip Invariant (TIDAK BOLEH dilanggar di kode)

| Prinsip | Implementasi |
|---|---|
| Stok tidak diedit langsung | `stok.kuantitas` = cache dari aggregate `mutasi_stok`. Mutasi = append-only ledger. Gak ada UPDATE/DELETE di `mutasi_stok`. |
| Soft delete di mana-mana | Pakai `deleted_at` timestamp, bukan hapus row. Query selalu filter `deleted_at IS NULL`. |
| Audit trail tiap aksi penting | Setiap CREATE/UPDATE/APPROVE tulis ke `audit_log` (tabel, record_id, data_before, data_after). |
| Nomor dokumen tiap transaksi | Format: `[TIPE]-YYYYMM-NNNN`. Contoh: `BM-202608-0001` (barang masuk), `BK-202608-0001` (barang keluar). Auto-generate, unique. |
| Satuan tidak boleh campur | Satu `bahan` punya satu `satuan_id`. Transaksi stok selalu dalam satuan yang sama. Gak ada konversi implicit. |
| Harga rata-rata bergerak | Metode weighted average. Tiap barang masuk → `bahan.harga_rata_rata` di-update = (stok lama × harga lama + qty baru × harga baru) / (stok lama + qty baru). |
| Penyesuaian stok butuh approval | `penyesuaian_stok.status` mulai `pending`, owner yang approve. Mutasi stok hanya terbuat setelah `approved`. |

---

## Istilah Domain

| Istilah | Arti |
|---|---|
| **PO Produksi** | Purchase Order internal — perintah produksi sejumlah item/SKU |
| **BOM** | Bill of Materials — daftar bahan + kuantitas per produk/varian |
| **WIP** | Work In Progress — bundel yang sedang dalam proses jahit di penjahit/vendor |
| **HPP** | Harga Pokok Produksi — total biaya (bahan + cutting + jahit + QC + finishing + overhead) per PO/unit |
| **Bundle** | Kelompok potongan bahan siap jahit, dilabeli QR code |
| **SKU** | Stock Keeping Unit — kombinasi produk + varian (ukuran, warna) |
| **Grade QC** | A (sempurna), B (cacat ringan, bisa jual), C (cacat sedang), Reject |
| **Yield** | Rasio barang jadi grade A vs total produksi — indikator efisiensi |

---

## Tahapan Sistem (5 tahap)

| Tahap | Modul | Status Beads |
|---|---|---|
| 1 | Inventory & Fondasi (login, master data, barang masuk/keluar, stok, mutasi, audit) | MVP |
| 2 | Produksi, Cutting & Bundling (PO, BOM, work order cutting, bundling+label) | Post-MVP |
| 3 | Penjahitan Internal & Vendor (penugasan, surat jalan, WIP monitoring, penerimaan hasil) | Post-MVP |
| 4 | QC, Finishing & Packing (standar QC, grading, perbaikan, stok barang jadi) | Post-MVP |
| 5 | Keuangan, HPP & Laporan (COA, kas/hutang, HPP per PO/unit, jurnal, laporan keuangan) | Post-MVP |

---

## Integrasi Antar Tahap

- Tahap 1 → Tahap 2: `barang_keluar` jadi sumber bahan untuk `work_order_cutting`
- Tahap 2 → Tahap 3: bundle jadi unit yang di-assign ke penjahit/vendor
- Tahap 3 → Tahap 4: hasil penerimaan jahit masuk antrean QC
- Tahap 4 → Tahap 1: barang jadi masuk stok terpisah (`stok_barang_jadi`)
- Semua tahap → Tahap 5: biaya aktual tiap tahap terakumulasi ke HPP per PO
