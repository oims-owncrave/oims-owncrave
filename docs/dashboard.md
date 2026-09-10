# 🧭 Dashboard: OIMS Owncrave

> Ringkas: file ini kontrol arah. Task detail di beads, plan di docs/plans/.
> Diperbarui: 2026-09-10 · Versi: v0.1.0 · Status: **TAHAP 4 SELESAI — 15 issue inti closed (4A-4D), epic oims-ckp closed. Belum di-smoke-test end-to-end. Sisa: 4 backlog P3 lintas tahap.**

## 🎯 Visi

ERP produksi garmen Owncrave, dibangun bertahap. Tahap 1 (inventory bahan) live;
Tahap 2–4 (produksi → jahit vendor → QC → stok jadi) menyusul; Tahap 5 (keuangan/HPP)
di-skip dulu. Referensi alur teruji dari app lama: `docs/referensi-oims-production.md`.

## 📊 Status Fitur

| Fitur | Status | Route | Issue terbuka |
|---|---|---|---|
| Master Data (kategori/satuan/supplier/bahan/warna) | ✅ | /master/* | — |
| Barang Masuk & Keluar | ✅ | /inventory/* | — |
| Stok, Mutasi, Penyesuaian (approval) | ✅ | /inventory/* | — |
| Dashboard + Laporan Tahap 1 | ✅ | /dashboard, /laporan | — |
| Auth, User Mgmt, Audit Log | ✅ | /sistem/* | — |
| Import Excel master + bahan | ✅ | /master/* | — |
| Tahap 2 — Produksi, Cutting, Bundling | ✅ | /produksi/* | — (epic closed 2026-09-02) |
| Tahap 3 — Penjahitan Vendor | ✅ | /vendor/* | — (epic closed 2026-09-03) · 2 backlog P3 |
| Tahap 4 — QC, Finishing & Packing | ✅ | /qc/* (10 route), /master/* | epic closed 2026-09-10 (15/15) · 2 backlog P3 |
| Tahap 5 — Keuangan/HPP | ⏸ skip | — | epic `oims-rcr` (deferred) |

## 🔵 Urutan Rencana — 3 Epic Aktif

Aturan sesi: **1 sesi = 1 gelombang** (berhenti lebih awal kalau ~6 issue tersentuh /
ada mutasi produksi / temuan besar — detail di `docs/claude/orchestrator-workflow.md`).

Prinsip urutan: ikuti dependensi domain produksi — Tahap 2 → 3 → 4 (tiap tahap konsumsi
output tahap sebelumnya). Breakdown just-in-time per tahap: issue Tahap 3–4 dibuat
setelah Tahap 2 jalan, supaya plan tidak basi. Bekal breakdown: PRD
(`docs/OIMS_PRD_Tahap_1_sampai_5.md`) + `docs/referensi-oims-production.md`.
Dependency: tidak ada blocker antar issue saat ini (semua epic).

### ✅ Gelombang 1 — Planning: Breakdown Tahap 2 — SELESAI (2026-09-02)

Sesi: `oims-5yr plan-breakdown-tahap2` — 13 issue anak dibuat + deps; wave 2A di-plan penuh.

### ✅ Gelombang 2 — Eksekusi Tahap 2A: Fondasi — SELESAI (Claude, 2026-09-02, approved + closed)

Master produk + varian + BOM. Riwayat lengkap di Changelog; plan di docs/plans/2026-09-02-oims-5yr.{1,2,3}-*.md.

### ✅ Gelombang 3 — Tahap 2B: PO & Bahan — SELESAI (Claude, 2026-09-02, GH #14)

PO produksi (snapshot BOM saat approve) + estimasi kebutuhan on-the-fly + permintaan bahan
(dikeluarkan derived dari barang keluar via FK `barang_keluar.permintaan_bahan_id`).
Smoke test disarankan: PO draft→setujui → estimasi muncul → buat PB prefill kekurangan →
approve PB → barang keluar pilih PB → cek progres dikeluarkan di detail PB.

### ✅ Gelombang 4 — Tahap 2C: Cutting — SELESAI (Claude, 2026-09-02, GH #15)

Penerimaan cutting (BK ber-PB, kondisi+selisih) → WO cutting (7 status, hub detail) →
pemakaian aktual (rekonsiliasi + varians vs BOM) → hasil cutting (bertahap + rekap vs target).
Smoke test: penerimaan dari BK → buat WO (prefill PO) → mulai kerjakan → catat hasil →
catat pemakaian → cek rekonsiliasi/varians → selesai → verifikasi owner.

### ✅ Gelombang 5 — Tahap 2D: Bundling & WIP — SELESAI (Claude, 2026-09-02, GH #16) — TAHAP 2 TUTUP

Sisa bahan (retur gudang via mutasi retur_masuk) + limbah (nilai kerugian) + bundling
(guard hasil tersedia + label print) + WIP derived + kartu ringkasan.
Pending kecil: QR di label butuh package `qrcode` (tunggu approve Abu); grafik dashboard
T2 ditunda sampai ada data historis produksi.

### ✅ Gelombang 6 — Planning: Breakdown Tahap 3 — SELESAI (2026-09-02)

Sesi: `oims-eba plan-breakdown-tahap3` — epic dipecah jadi **15 issue anak** (13 inti + 2 backlog)
+ rantai dependensi. Keputusan cakupan: **jalur tengah** — struktur relasional penuh PRD
(penugasan & pengiriman tabel terpisah, surat jalan, penerimaan bertahap, retur, biaya jasa),
tapi sederhanakan yang app lama buktikan tak terpakai: 18 status WIP → ~7 derived, progres %
derived dari setoran (bukan input manual vendor), standar durasi + kinerja vendor → backlog P3.
Dekorasi sablon/bordir **masuk Tahap 3** (bukan ditunda) supaya reuse master vendor + tarif +
surat jalan, bukan refactor belakangan.

### ✅ Gelombang 7 — Tahap 3A: Master & Tarif — SELESAI (Claude, 2026-09-03)

| # | Issue | Prio | Status |
|---|---|---|---|
| 1 | ~~`oims-eba.1` Master Vendor Jahit (kapabilitas, rekening, termin)~~ | P1 | ready |
| 2 | ~~`oims-eba.3` Master Lokasi Produksi~~ | P2 | ready |
| 3 | ~~`oims-eba.2` Master Penjahit (internal/eksternal)~~ | P1 | blocked by .1, .3 |
| 4 | ~~`oims-eba.4` Tarif Jasa Jahit berversi + snapshot~~ | P1 | blocked by .1, .2 |

Butuh plan file + migration (Claude via MCP) sebelum Antigravity mulai.

### ✅ Gelombang 8 — Tahap 3B: Penugasan & Kirim — SELESAI (Claude, 2026-09-03)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-eba.5` Penugasan Jahit (ASG-JHT, guard bundel)~~ | P1 | Konsumsi bundel Tahap 2; butuh tarif (.4) |
| 2 | ~~`oims-eba.6` Pengiriman Jahit + Serah Terima Bundel~~ | P2 | Kirim fisik dari penugasan; butuh lokasi (.3) |
| 3 | ~~`oims-eba.7` Surat Jalan Jahit PDF (SJ-JHT + QR)~~ | P2 | Cetak dari pengiriman; dipakai ulang dekorasi (.13) |

### ✅ Gelombang 9 — Tahap 3C: Terima Hasil & Selisih — SELESAI (Claude, 2026-09-03)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-eba.8` Penerimaan Hasil Jahit bertahap (RCV-JHT)~~ | P2 | Inti WIP — sisa di vendor derived dari sini |
| 2 | ~~`oims-eba.9` Selisih: kurang/lebih, hilang, rusak~~ | P2 | Turunan detail penerimaan; hilang butuh approval |
| 3 | ~~`oims-eba.10` Retur & Perbaikan Jahit (RTN-JHT)~~ | P2 | Loop perbaikan sebelum QC Tahap 4 |

### ✅ Gelombang 10 — Tahap 3D: Biaya, WIP & Dekorasi — SELESAI (Claude, 2026-09-03)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-eba.11` Biaya Jasa Jahit (tagihan bersih)~~ | P2 | Jumlah diakui butuh penerimaan (.8) + retur (.10) |
| 2 | ~~`oims-eba.12` WIP Jahit derived + Dashboard T3~~ | P2 | Rangkum seluruh rantai; penutup monitoring |
| 3 | ~~`oims-eba.13` Dekorasi Sablon/Bordir~~ | P2 | Reuse vendor (.1) + surat jalan (.7); paralel bundling |

### ✅ Smoke Test Tahap 3 — LOLOS (Claude browser + SQL, 2026-09-03)

Prasyarat Tahap 2 di-seed via SQL (produk SMK, PO-9001, 3 bundel seri 9001-9003 = 100 pcs).
6 langkah kritis lewat browser, tiap hasil diverifikasi query DB:

| # | Uji | Bukti |
|---|---|---|
| 1 | Master vendor + kode auto | VDR-0001, kapabilitas {jahit,sablon}, audit CREATE |
| 2 | Tarif berversi | v1 25rb aktif → v2 30rb draft → aktifkan → v1 nonaktif otomatis, tepat 1 aktif |
| 3 | Penugasan + snapshot | prefill 30rb (aktif), snapshot di 3 detail, estimasi Rp 3jt |
| 4 | Guard bundel | 0 bundel bebas setelah ditugaskan, dropdown PO kosong |
| 5 | Kirim + SJ | 1 transaksi: SHP-0001 + SJ-0001 + 3 bundel sudah_dikirim + penugasan aktif |
| 6 | Terima sebagian | RCV-0001 (30 baik, 5 rusak) → sisa 10/40/20, SLS-0001 rusak otomatis, WIP 70 · 30% |

**2 bug ketemu (lolos tsc + build, halaman tak bisa dipakai):** render loop form penerimaan
(`735bcee`) · Date di raw sql bikin /vendor/wip 500 (`24dcb1a`). Keduanya di-fix.

Belum diuji (langkah 7-12 checklist lama): serah terima kondisi, retur loop, keputusan
selisih, biaya verifikasi, dekorasi end-to-end. Diuji sambil pakai.

**Data uji masih di DB** (seri 9001, vendor VDR-0001, produk SMK) — hapus kalau mengganggu.

**Pertanyaan terbuka ke Abu:** dekorasi wajib selesai sebelum bundling? Sekarang TIDAK di-enforce.

### ✅ Gelombang 11 — Planning: Breakdown Tahap 4 — SELESAI (2026-09-10)

Sesi: `oims-ckp plan-breakdown-tahap4` — epic dipecah jadi **17 issue anak** (15 inti + 2 backlog)
+ rantai dependensi. **3 keputusan cakupan** (dijawab Abu, bukan asumsi):

| Pertanyaan | Keputusan | Alasan |
|---|---|---|
| Granularitas QC | **Per varian agregat** (bukan per pcs PRD §11) | Hulu T2-T3 semua agregat; app lama sukses tanpa per-pcs (ref §10). Per-pcs → backlog `.16` |
| Finishing & packing | **Modul penuh** FIN + PKG + master kemasan | Gap terbesar PRD (app lama tak punya), dijanjikan ke klien |
| Stok barang jadi | **Tabel + mutasi sendiri**, pola immutable stok bahan | Kunci komposit beda (SKU+grade+gudang+batch); numpang tabel T1 mengotori query stok bahan yang sudah live |

Titik sambung T3→T4: `penerimaan_hasil_jahit_detail.jumlah_baik` (baik **visual**, bukan lolos QC —
sudah dirancang begitu di `schema.ts:1180`). **Tak perlu ubah tabel Tahap 3.**
Vendor `qcMode='vendor'` → lewati antrean QC internal (ref §6).

**Koreksi temuan sesi ini:** proyek TIDAK punya DB trigger untuk cache stok (diverifikasi via MCP) —
cache di-maintain dalam Server Action transaction + `SELECT ... FOR UPDATE` (`barang-masuk.ts:25-120`).
Issue `.13` sudah dikoreksi supaya executor tidak membuat trigger baru.

### ✅ Gelombang 12 — Tahap 4A: Fondasi QC — SELESAI (Claude, 2026-09-10)

Dieksekusi langsung oleh Claude atas permintaan Abu (deviasi dari Antigravity, sama
seperti Tahap 2-3). 3 commit, tsc + build clean, **diverifikasi lewat SQL bukan cuma layar**.

| # | Issue | Prio | Commit | Bukti |
|---|---|---|---|---|
| 1 | ~~`oims-ckp.2` Master Jenis Cacat + Kemasan~~ | P1 | `8958493` | hapus→buat ulang kode sama BERHASIL (partial unique); duplikat aktif ditolak `unique_violation` |
| 2 | ~~`oims-ckp.3` Master Gudang & Lokasi Barang Jadi~~ | P2 | `48e5990` | 2 gudang di-set default berurutan → tetap tepat 1 default |
| 3 | ~~`oims-ckp.4` Penerimaan ke QC (IN-QC) + Antrean derived~~ | P1 | `66d8594` | kirim 25/30 → sisa 5; `qc_mode=vendor` → 0 baris di antrean; soft delete → sisa balik 30 |

Route baru: `/master/{jenis-cacat,kemasan,gudang-jadi}` + `/qc/{penerimaan,antrean}`.
Data uji sudah dibersihkan; `qc_mode` VDR-0001 dikembalikan ke `internal`.

**Catatan pola** (dipakai lagi di 4B): `z.coerce.number()` bikin tipe input rhf jadi
`unknown` — pakai `z.input`/`z.output` terpisah (`KemasanFormValues` vs `KemasanInput`).
Service yang semua cabang suksesnya di dalam transaksi butuh return type union eksplisit,
kalau tidak `res.error` error tipe di hook.

### ✅ Gelombang 13 — Tahap 4B: Standar, WO & Hasil QC — SELESAI (Claude, 2026-09-10)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-ckp.1` Master Standar QC berversi + snapshot~~ | P1 | Butuh jenis cacat (`.2`); pola tarif berversi |
| 2 | ~~`oims-ckp.5` Work Order QC + metode 100% vs sampling~~ | P1 | Butuh standar (`.1`) + antrean (`.4`) |
| 3 | ~~`oims-ckp.6` Hasil QC per varian + grade A/B/C/perbaikan/reject~~ | P1 | **Inti Tahap 4** — sumber angka yield/COPQ |
| 4 | ~~`oims-ckp.7` Temuan Cacat (jenis, keparahan, foto, penyebab)~~ | P2 | Akar masalah di balik defect rate |

### ✅ Gelombang 14 — Tahap 4C: Rework, Re-QC & Reject — SELESAI (Claude, 2026-09-10)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-ckp.8` Perbaikan Internal + Retur Perbaikan Vendor~~ | P2 | Dua jalur rework, guard total bersama |
| 2 | ~~`oims-ckp.9` Re-QC + grade akhir~~ | P2 | Penutup loop — tanpa ini barang perbaikan menggantung |
| 3 | ~~`oims-ckp.10` Karantina Reject + tindakan (approval owner)~~ | P2 | Stage sendiri seperti app lama; tindakan = keputusan uang |

### ✅ Gelombang 15 — Tahap 4D: Finishing, Packing & Barang Jadi — SELESAI (Claude, 2026-09-10)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-ckp.11` Finishing + proses + pemakaian label/hangtag~~ | P2 | Gap PRD; pemakaian label kurangi stok bahan via `mutasi_stok` |
| 2 | ~~`oims-ckp.12` Packing + kemasan + checklist ter-guard~~ | P2 | Batch ditentukan di sini (dimensi stok jadi) |
| 3 | ~~`oims-ckp.13` Barang Jadi + Stok + Mutasi immutable~~ | P1 | **Penutup rantai** — stok jadi bertambah |
| 4 | ~~`oims-ckp.14` Transfer antar gudang + Penyesuaian (approval)~~ | P2 | Stok jadi tak statis |
| 5 | ~~`oims-ckp.15` Dashboard T4 + Yield, Defect Rate, COPQ~~ | P2 | Rangkum semua; isi 2 kolom AlurProduksi yang sudah disiapkan |

### Gelombang 16 — Antrean tahap berikutnya

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-eba` epic: Tahap 3 — Penjahitan Internal & Vendor~~ | P4 | Closed 2026-09-03 setelah smoke test |
| 2 | ~~`oims-ckp` epic: Tahap 4 — QC, Finishing & Packing~~ | P4 | Closed 2026-09-10 (15/15 inti) |
| 3 | ~~`oims-rcr`~~ epic: Tahap 5 — Keuangan, HPP & Laporan | P4 | Deferred — skip dulu, greenfield tanpa referensi (referensi §10) |

### Gelombang 17 — Tahap 2 lanjutan: sisa PRD + import (branch phase-2)

Dikerjakan SETELAH Tahap 3 ditutup — checkout kembali ke branch `phase-2` (arahan Abu 2026-09-03).
Keduanya dijanjikan ke klien di proposal penawaran v4, jadi bukan opsional.

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | ~~`oims-dr5` Tahap 2 sisa: QR label bundel + grafik dashboard T2~~ | P2 | Scope PRD §19 + §21 yang ditunda saat 2D; QR butuh `pnpm add qrcode` (sudah di-approve) |
| 2 | ~~`oims-oiq` Import Excel: warna, produk, varian, BOM~~ | P2 | Bonus di luar PRD; infra import Tahap 1 sudah generic, tinggal tambah entitas |

### Gelombang 18 — Backlog Tahap 3-4 (P3, ditunda sadar — bukan lupa)

| # | Issue | Prio | Kenapa ditunda |
|---|---|---|---|
| 1 | `oims-eba.14` Standar Durasi Jahit | P3 | App lama tak punya; target selesai manual dulu — angkat kalau operator mengeluh |
| 2 | `oims-eba.15` Kinerja Vendor grade A-D + Nilai WIP | P3 | Butuh data historis beberapa siklus supaya grade bermakna |
| 3 | `oims-ckp.16` QC per pcs + barcode/QR per unit | P3 | Hulu T2-T3 tak punya identitas pcs; angkat kalau produk premium butuh telusur per helai |
| 4 | `oims-ckp.17` Kinerja Vendor dari data QC (defect rate) | P3 | Gabung dengan `oims-eba.15` — satu halaman kinerja (ketepatan waktu + kualitas) |

---

## ✅ Sudah Dikerjakan (rolling 4 minggu)

- 2026-08-24..30: import Excel batch master data + bahan (oims-jpn.15, oims-jpn.16)
- 2026-08-13: audit log + laporan Tahap 1 (oims-jpn.13, oims-jpn.14) — Tahap 1 komplit
- 2026-08-09..12: polish mobile UI batch (oims-g05.*, oims-y5k, oims-xlp, oims-6c3, oims-76v, oims-8i9, oims-ghs)

## 📌 Catatan

- Tahap 5 (`oims-rcr`): **skip/deferred** — greenfield murni, tak ada referensi implementasi (`docs/referensi-oims-production.md` §10).
- Epic `oims-jpn` (Tahap 1): closed 2026-09-02 — semua 44 anak selesai.
- Eksekutor default: **Antigravity** (Gemini Flash High) dari prompt file `docs/prompts/`; review via `/oims-review`. Planning via `/oims-plan`.
- Issue baru hasil breakdown: tandai `plan:` di catatan untuk yang butuh plan file (≥3 file / keputusan desain / bentuk belum jelas).

## 📜 Changelog

- 2026-09-10 (sesi 4b-4d): **TAHAP 4 KODE SELESAI** — 12 issue lagi dieksekusi Claude dalam sesi yang sama (permintaan Abu, lanjut dari 4A). 4B: standar QC berversi (partial unique index "tepat 1 aktif", lebih kuat dari tarif T3 yang cuma dijaga kode), WO QC + sampling + snapshot standar, hasil QC per varian (rumus keseimbangan di-guard TIGA lapis: Zod, Server Action, DB CHECK), temuan cacat + guard tak melebihi produk bermasalah. 4C: rework dua jalur dengan **guard kapasitas bersama** (satu fungsi dipanggil dua jalur — kalau terpisah bisa saling melampaui), Re-QC dengan DB CHECK sumber wajib + hitungan putaran, karantina reject dengan approval gate. 4D: finishing (pemakaian label kurangi stok bahan via mutasi_stok), packing (checklist 10 titik di-guard keras saat selesai), **barang jadi + stok immutable** (satu-satunya `.set({kuantitas})` di `lib/qc/stok-fg.ts`, sudah diaudit), transfer 2-fase, penyesuaian ber-approval, rumus yield/COPQ di satu modul (COPQ kembalikan null untuk komponen tanpa sumber, bukan 0 palsu). 3 migration via MCP (4B/4C/4D), 20 tabel baru, 10 route /qc/* aktif, tsc+build clean. Verifikasi SQL tiap gelombang. Epic oims-ckp CLOSED. **Belum smoke test end-to-end** — data uji dihapus setiap selesai verifikasi.
- 2026-09-10 (sesi 4a lanjutan): eksekusi gelombang 4A oleh Claude (permintaan Abu, lanjut di sesi yang sama) — oims-ckp.2 master jenis cacat + kemasan, oims-ckp.3 master gudang barang jadi (isDefault tepat satu via transaksi, pola aktivasi tarif T3), oims-ckp.4 penerimaan QC + antrean DERIVED (guard sisa dihitung ulang di dalam transaksi, skip vendor ber-qcMode vendor). 3 commit, 5 route baru, tsc + build clean. **Verifikasi lewat SQL** (bukan build clean): kirim 25/30 → sisa 5 · qc_mode=vendor → 0 baris antrean · soft delete → sisa balik 30 · hapus+buat ulang kode sama berhasil (partial unique) · duplikat aktif ditolak · 2 gudang default → tetap 1. Data uji dibersihkan. Rantai deps jalan: oims-ckp.1 otomatis ready. Pelajaran tipe: z.coerce.number() butuh z.input/z.output terpisah untuk rhf; service transaksi butuh return type union eksplisit.
- 2026-09-10 (sesi 4a): breakdown Tahap 4 — epic oims-ckp dipecah jadi **17 issue anak** (15 inti + 2 backlog) + rantai dependensi. 3 keputusan cakupan dijawab Abu: QC **per varian agregat** (bukan per pcs PRD §11 — hulu T2-T3 semua agregat, per-pcs jadi backlog .16), finishing/packing **modul penuh** (gap terbesar PRD, dijanjikan ke klien), stok barang jadi **tabel + mutasi sendiri** dengan pola immutable stok bahan (kunci komposit SKU+grade+gudang+batch). Gelombang 4A (.2 master jenis cacat+kemasan, .3 master gudang, .4 penerimaan QC+antrean derived) sudah plan+prompt lengkap; migration `tahap4a_master_qc_gudang_penerimaan_qc` applied via MCP (6 enum + 5 tabel, semua unique index PARTIAL — diverifikasi), schema.ts + document-number.ts ter-update, tsc clean. Checklist review Tahap 4 (18 poin) masuk skill oims-review. **Koreksi temuan:** proyek TIDAK punya DB trigger untuk cache stok — cache di-maintain dalam Server Action transaction + SELECT FOR UPDATE (barang-masuk.ts); issue .13 dikoreksi supaya executor tak bikin trigger baru. GH issue breakdown belum dibuat (diblok classifier) — body siap di scratchpad.
- 2026-09-03 (sesi 3c): smoke test Tahap 3 oleh Claude (browser + SQL, seed prasyarat T2 via SQL) — 6 langkah lolos. 2 bug ketemu & di-fix: infinite render loop form penerimaan (default `= []` inline jadi dependency useMemo/useEffect) dan objek Date di raw sql template bikin /vendor/wip crash. Keduanya lolos tsc+build tapi halaman tak terpakai — bukti build clean ≠ verifikasi. 13 issue inti + epic oims-eba CLOSED. Aturan verifikasi masuk orchestrator-workflow + second-brain (verifikasi_hasil_kerja.md). Proposal penawaran v4 direvisi (6 poin).
- 2026-09-03 (sesi 3b): TAHAP 3 KODE SELESAI — 13 issue inti dieksekusi langsung oleh Claude dalam satu sesi (permintaan Abu, deviasi dari Antigravity), 13 commit. 3A master vendor/lokasi/penjahit + tarif berversi; 3B penugasan (guard bundel satu penugasan aktif) + pengiriman + surat jalan berwatermark; 3C penerimaan bertahap + selisih dengan keputusan owner + loop retur; 3D biaya jasa (diakui = Σ baik) + WIP 7 label derived + dekorasi sablon/bordir. Rumus WIP tunggal di src/lib/jahit/rekap.ts. Dashboard: kartu per-tahap diganti ALUR PRODUKSI lintas tahap (pola app lama §11) supaya Tahap 4 tinggal isi 2 kolom. 4 migration via MCP, 20 tabel baru, build clean. Beads masih in_progress — menunggu smoke test Abu.
- 2026-09-02 (sesi 3a): breakdown Tahap 3 — epic oims-eba dipecah jadi 15 issue anak (oims-eba.1-15) + rantai dependensi. Cakupan jalur tengah: struktur relasional penuh PRD, tapi 18 status WIP dipadatkan jadi ~7 derived, progres % derived dari setoran, standar durasi + kinerja vendor → backlog P3. Dekorasi sablon/bordir masuk T3 (reuse master vendor/tarif/SJ). Checklist review Tahap 3 masuk skill oims-review. Pertanyaan terbuka: urutan dekorasi vs bundling (belum di-enforce).
- 2026-09-02 (sesi 2e): eksekusi 2D oleh Claude — TAHAP 2 SELESAI: oims-5yr.11 sisa+limbah (retur gudang = mutasi retur_masuk + FK sisa_bahan_id), oims-5yr.12 bundling (guard hasil tersedia, label thermal, QR pending package), oims-5yr.13 WIP derived + ringkasan. Epic oims-5yr closed. GH #16. Antrean: breakdown Tahap 3 (sesi baru).
- 2026-09-02 (sesi 2d): eksekusi 2C oleh Claude: oims-5yr.7 penerimaan cutting, oims-5yr.8 WO cutting (transisi status tervalidasi + verifikasi owner), oims-5yr.9 pemakaian aktual (rekonsiliasi + snapshot harga + varians), oims-5yr.10 hasil cutting (bertahap + rekap). GH #15. Route /produksi/{penerimaan-cutting,wo-cutting}.
- 2026-09-02 (sesi 2c): eksekusi 2B oleh Claude: oims-5yr.4 PO produksi (PO-YYYY-NNNN, approval owner + snapshot BOM), oims-5yr.5 estimasi kebutuhan (pcs efektif × BOM × toleransi vs stok), oims-5yr.6 permintaan bahan (PB + integrasi barang keluar, dikeluarkan derived). Bonus oims-cd5: mobile default view tabel + tab Tabel kiri. 2A di-approve Abu & closed. GH #14.
- 2026-09-02 (sesi 2b): eksekusi wave 2A langsung oleh Claude (permintaan Abu, deviasi dari Antigravity): oims-5yr.1 master produk + nav PRODUKSI, oims-5yr.2 varian matrix+SKU, oims-5yr.3 BOM full lifecycle. 6 route /produksi/* baru, tsc + build clean, 3 commit. Beads masih in_progress — menunggu approve Abu.
- 2026-09-02 (sesi 2): breakdown Tahap 2 — 13 issue anak (oims-5yr.1-13) + deps rantai PRD §4. Wave 2A (produk/varian/BOM) plan+prompt+GH #11-13, migration produk/varian_produk/bom/bom_detail applied via MCP, schema.ts ter-update, checklist review Tahap 2 masuk skill oims-review. 3 commit (1 per issue).
- 2026-09-02: dashboard pertama — adopsi sistem eksekusi issue (applications.md Jalur 2); Tahap 1 epic ditutup, Tahap 5 di-defer.
