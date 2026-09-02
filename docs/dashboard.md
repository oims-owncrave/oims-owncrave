# 🧭 Dashboard: OIMS Owncrave

> Ringkas: file ini kontrol arah. Task detail di beads, plan di docs/plans/.
> Diperbarui: 2026-09-03 · Versi: v0.1.0 · Status: **TAHAP 3 KODE SELESAI — 13/13 issue inti dieksekusi Claude (3A-3D), 13 commit, build clean. Menunggu smoke test Abu sebelum bd close + tutup epic.**

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
| Tahap 3 — Penjahitan Vendor | 🔵 | /vendor/* | 13 inti selesai (perlu smoke test) · 2 backlog P3 |
| Tahap 4 — QC & Barang Jadi | ⏳ | — | epic `oims-ckp` (belum dipecah) |
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

### 🔎 Smoke Test Tahap 3 (perlu Abu, sebelum bd close)

Urutan uji end-to-end — tiap langkah bergantung yang sebelumnya:

1. **Master**: buat vendor (kapabilitas jahit+sablon), lokasi, penjahit internal, tarif → aktifkan tarif
2. **Tarif berversi**: ubah nominal lewat "Buat Versi Baru" → aktifkan → cek versi lama jadi nonaktif, riwayat tetap ada
3. **Penugasan**: dari PO yang punya bundel siap kirim → tarif ter-prefill dari master → simpan draft → cek bundel yang sama TIDAK muncul di penugasan lain
4. **Kirim**: buat pengiriman → cek bundel jadi "sudah dikirim", penugasan draft→aktif, surat jalan tergenerate
5. **Surat jalan**: cetak → cetak lagi → cek watermark CETAK ULANG muncul
6. **Serah terima**: catat kondisi per bundel → pengiriman jadi "diterima"
7. **Terima hasil bertahap**: terima sebagian (ada yang rusak) → cek sisa WIP berkurang, kasus selisih rusak terbuka otomatis
8. **Retur**: dari baris rusak → kirim → terima hasil perbaikan → cek retur jadi "diterima kembali"
9. **Selisih**: putuskan kasus hilang ditanggung vendor → cek sisa WIP berkurang, penugasan bisa jadi selesai
10. **Biaya**: cek jumlah diakui = Σ baik, terapkan usulan potongan → verifikasi bertingkat sampai siap dibayar
11. **WIP + dashboard**: cek angka /vendor/wip konsisten dengan alur produksi di /dashboard
12. **Dekorasi**: set produk butuh sablon → buat template → buat pekerjaan → kirim → cetak SJ → terima bertahap

**Pertanyaan terbuka ke Abu:** dekorasi wajib selesai sebelum bundling? Sekarang TIDAK di-enforce (ikut app lama).

### Gelombang 11 — Antrean tahap berikutnya (breakdown just-in-time)

Trigger langkah 9 orchestrator TERPENUHI (issue eksekusi Tahap 3 = 0 tersisa).
- `oims-ckp plan-breakdown-tahap4` | oims-ckp | /oims-plan: pecah epic Tahap 4 jadi issue anak (PRD Tahap 4 + referensi §2-3, §6, §10 — QC, rework, karantina reject, finishing, packing, stok barang jadi)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | `oims-eba` epic: Tahap 3 — Penjahitan Internal & Vendor | P4 | Payung 15 anak; ditutup setelah gelombang 10 |
| 2 | `oims-ckp` epic: Tahap 4 — QC, Finishing & Packing | P4 | Konsumsi output Tahap 3 (hasil jahit siap QC) |
| 3 | ~~`oims-rcr`~~ epic: Tahap 5 — Keuangan, HPP & Laporan | P4 | Deferred — skip dulu, greenfield tanpa referensi (referensi §10) |

### Gelombang 12 — Backlog Tahap 3 (P3, ditunda sadar — bukan lupa)

| # | Issue | Prio | Kenapa ditunda |
|---|---|---|---|
| 1 | `oims-eba.14` Standar Durasi Jahit | P3 | App lama tak punya; target selesai manual dulu — angkat kalau operator mengeluh |
| 2 | `oims-eba.15` Kinerja Vendor grade A-D + Nilai WIP | P3 | Butuh data historis beberapa siklus supaya grade bermakna |

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

- 2026-09-03 (sesi 3b): TAHAP 3 KODE SELESAI — 13 issue inti dieksekusi langsung oleh Claude dalam satu sesi (permintaan Abu, deviasi dari Antigravity), 13 commit. 3A master vendor/lokasi/penjahit + tarif berversi; 3B penugasan (guard bundel satu penugasan aktif) + pengiriman + surat jalan berwatermark; 3C penerimaan bertahap + selisih dengan keputusan owner + loop retur; 3D biaya jasa (diakui = Σ baik) + WIP 7 label derived + dekorasi sablon/bordir. Rumus WIP tunggal di src/lib/jahit/rekap.ts. Dashboard: kartu per-tahap diganti ALUR PRODUKSI lintas tahap (pola app lama §11) supaya Tahap 4 tinggal isi 2 kolom. 4 migration via MCP, 20 tabel baru, build clean. Beads masih in_progress — menunggu smoke test Abu.
- 2026-09-02 (sesi 3a): breakdown Tahap 3 — epic oims-eba dipecah jadi 15 issue anak (oims-eba.1-15) + rantai dependensi. Cakupan jalur tengah: struktur relasional penuh PRD, tapi 18 status WIP dipadatkan jadi ~7 derived, progres % derived dari setoran, standar durasi + kinerja vendor → backlog P3. Dekorasi sablon/bordir masuk T3 (reuse master vendor/tarif/SJ). Checklist review Tahap 3 masuk skill oims-review. Pertanyaan terbuka: urutan dekorasi vs bundling (belum di-enforce).
- 2026-09-02 (sesi 2e): eksekusi 2D oleh Claude — TAHAP 2 SELESAI: oims-5yr.11 sisa+limbah (retur gudang = mutasi retur_masuk + FK sisa_bahan_id), oims-5yr.12 bundling (guard hasil tersedia, label thermal, QR pending package), oims-5yr.13 WIP derived + ringkasan. Epic oims-5yr closed. GH #16. Antrean: breakdown Tahap 3 (sesi baru).
- 2026-09-02 (sesi 2d): eksekusi 2C oleh Claude: oims-5yr.7 penerimaan cutting, oims-5yr.8 WO cutting (transisi status tervalidasi + verifikasi owner), oims-5yr.9 pemakaian aktual (rekonsiliasi + snapshot harga + varians), oims-5yr.10 hasil cutting (bertahap + rekap). GH #15. Route /produksi/{penerimaan-cutting,wo-cutting}.
- 2026-09-02 (sesi 2c): eksekusi 2B oleh Claude: oims-5yr.4 PO produksi (PO-YYYY-NNNN, approval owner + snapshot BOM), oims-5yr.5 estimasi kebutuhan (pcs efektif × BOM × toleransi vs stok), oims-5yr.6 permintaan bahan (PB + integrasi barang keluar, dikeluarkan derived). Bonus oims-cd5: mobile default view tabel + tab Tabel kiri. 2A di-approve Abu & closed. GH #14.
- 2026-09-02 (sesi 2b): eksekusi wave 2A langsung oleh Claude (permintaan Abu, deviasi dari Antigravity): oims-5yr.1 master produk + nav PRODUKSI, oims-5yr.2 varian matrix+SKU, oims-5yr.3 BOM full lifecycle. 6 route /produksi/* baru, tsc + build clean, 3 commit. Beads masih in_progress — menunggu approve Abu.
- 2026-09-02 (sesi 2): breakdown Tahap 2 — 13 issue anak (oims-5yr.1-13) + deps rantai PRD §4. Wave 2A (produk/varian/BOM) plan+prompt+GH #11-13, migration produk/varian_produk/bom/bom_detail applied via MCP, schema.ts ter-update, checklist review Tahap 2 masuk skill oims-review. 3 commit (1 per issue).
- 2026-09-02: dashboard pertama — adopsi sistem eksekusi issue (applications.md Jalur 2); Tahap 1 epic ditutup, Tahap 5 di-defer.
