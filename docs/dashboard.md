# 🧭 Dashboard: OIMS Owncrave

> Ringkas: file ini kontrol arah. Task detail di beads, plan di docs/plans/.
> Diperbarui: 2026-09-02 · Versi: v0.1.0 · Status: **TAHAP 2 SELESAI — 13/13 issue closed, epic oims-5yr ditutup. Berikutnya: sesi planning breakdown Tahap 3 (oims-eba).**

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
| Tahap 3 — Penjahitan Vendor | ⏳ | — | epic `oims-eba` (belum dipecah) |
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

### Gelombang 6 — Antrean tahap berikutnya (breakdown just-in-time)

Sesi berikutnya (Tahap 2 sudah tutup — trigger langkah 9 terpenuhi):
- `oims-eba plan-breakdown-tahap3` | oims-eba | /oims-plan: pecah epic Tahap 3 jadi issue anak (PRD Tahap 3 §4–28 + referensi §2–7, §10 — penjahit/vendor, tarif, penugasan, surat jalan, WIP jahit, penerimaan hasil, dekorasi sablon/bordir dari app lama)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | `oims-eba` epic: Tahap 3 — Penjahitan Internal & Vendor | P4 | Konsumsi output Tahap 2 (bundel); breakdown setelah Tahap 2 jalan |
| 2 | `oims-ckp` epic: Tahap 4 — QC, Finishing & Packing | P4 | Konsumsi output Tahap 3 (hasil jahit); breakdown paling akhir |
| 3 | ~~`oims-rcr`~~ epic: Tahap 5 — Keuangan, HPP & Laporan | P4 | Deferred — skip dulu, greenfield tanpa referensi (referensi §10) |

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

- 2026-09-02 (sesi 2e): eksekusi 2D oleh Claude — TAHAP 2 SELESAI: oims-5yr.11 sisa+limbah (retur gudang = mutasi retur_masuk + FK sisa_bahan_id), oims-5yr.12 bundling (guard hasil tersedia, label thermal, QR pending package), oims-5yr.13 WIP derived + ringkasan. Epic oims-5yr closed. GH #16. Antrean: breakdown Tahap 3 (sesi baru).
- 2026-09-02 (sesi 2d): eksekusi 2C oleh Claude: oims-5yr.7 penerimaan cutting, oims-5yr.8 WO cutting (transisi status tervalidasi + verifikasi owner), oims-5yr.9 pemakaian aktual (rekonsiliasi + snapshot harga + varians), oims-5yr.10 hasil cutting (bertahap + rekap). GH #15. Route /produksi/{penerimaan-cutting,wo-cutting}.
- 2026-09-02 (sesi 2c): eksekusi 2B oleh Claude: oims-5yr.4 PO produksi (PO-YYYY-NNNN, approval owner + snapshot BOM), oims-5yr.5 estimasi kebutuhan (pcs efektif × BOM × toleransi vs stok), oims-5yr.6 permintaan bahan (PB + integrasi barang keluar, dikeluarkan derived). Bonus oims-cd5: mobile default view tabel + tab Tabel kiri. 2A di-approve Abu & closed. GH #14.
- 2026-09-02 (sesi 2b): eksekusi wave 2A langsung oleh Claude (permintaan Abu, deviasi dari Antigravity): oims-5yr.1 master produk + nav PRODUKSI, oims-5yr.2 varian matrix+SKU, oims-5yr.3 BOM full lifecycle. 6 route /produksi/* baru, tsc + build clean, 3 commit. Beads masih in_progress — menunggu approve Abu.
- 2026-09-02 (sesi 2): breakdown Tahap 2 — 13 issue anak (oims-5yr.1-13) + deps rantai PRD §4. Wave 2A (produk/varian/BOM) plan+prompt+GH #11-13, migration produk/varian_produk/bom/bom_detail applied via MCP, schema.ts ter-update, checklist review Tahap 2 masuk skill oims-review. 3 commit (1 per issue).
- 2026-09-02: dashboard pertama — adopsi sistem eksekusi issue (applications.md Jalur 2); Tahap 1 epic ditutup, Tahap 5 di-defer.
