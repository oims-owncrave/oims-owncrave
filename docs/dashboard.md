# 🧭 Dashboard: OIMS Owncrave

> Ringkas: file ini kontrol arah. Task detail di beads, plan di docs/plans/.
> Diperbarui: 2026-09-02 · Versi: v0.1.0 · Status: **Tahap 2 wave 2A (produk/varian/BOM) SELESAI dieksekusi Claude — menunggu review/approve Abu, lalu bd close + lanjut 2B.**

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
| Tahap 2 — Produksi, Cutting, Bundling | 🔨 | /produksi/* | `oims-5yr.1-13` (2A siap eksekusi) |
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

### Gelombang 2 — Eksekusi Tahap 2A: Fondasi (produk → varian → BOM) — ✅ DIEKSEKUSI (Claude, 2026-09-02)

Deviasi rencana: dieksekusi langsung Claude di sesi planning (permintaan Abu), bukan Antigravity.
tsc + next build clean, commit per issue. Status: **menunggu review + approve Abu → bd close**.
Smoke test yang disarankan: CRUD produk, generate matrix varian, siklus BOM draft→aktif→versi baru.

| # | Issue | Prio | Prompt | Kenapa di sini |
|---|---|---|---|---|
| 1 | `oims-5yr.1` Master Produk + nav PRODUKSI | P1 | docs/prompts/2026-09-02-oims-5yr.1-master-produk.md | Fondasi semua Tahap 2 |
| 2 | `oims-5yr.2` Varian Produk (matrix + SKU) | P1 | docs/prompts/2026-09-02-oims-5yr.2-varian-produk.md | Dibutuhkan PO detail per SKU |
| 3 | `oims-5yr.3` BOM (versi, satu aktif) | P1 | docs/prompts/2026-09-02-oims-5yr.3-bom.md | Gap terbesar (tak ada referensi app lama) — dasar estimasi bahan |

### Gelombang 3 — Planning + Eksekusi Tahap 2B: PO & Bahan

Sesi planning: `oims-5yr.4-6 plan-tahap2b-po-bahan` (/oims-plan, just-in-time setelah 2A closed).

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | `oims-5yr.4` PO Produksi (status, approval) | P2 | Induk semua transaksi cutting |
| 2 | `oims-5yr.5` Estimasi Kebutuhan Bahan | P2 | BOM × target + cek stok |
| 3 | `oims-5yr.6` Permintaan Bahan | P2 | Integrasi barang keluar Tahap 1 ke PO |

### Gelombang 4+ — Cutting lalu Bundling & WIP (plan just-in-time per gelombang)

Gap berisiko: pemakaian aktual/sisa/limbah (rekonsiliasi §14) — belum pernah teruji di app lama.

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | `oims-5yr.7` Penerimaan Bahan oleh Cutting | P2 | Serah terima + kondisi |
| 2 | `oims-5yr.8` Work Order Cutting | P2 | WO-CUT + status |
| 3 | `oims-5yr.9` Pemakaian Bahan Aktual | P2 | Rekonsiliasi + varians vs BOM |
| 4 | `oims-5yr.10` Hasil Cutting | P2 | Per SKU baik/rusak/kurang/lebih |
| 5 | `oims-5yr.11` Sisa Bahan + Limbah | P2 | Sisa → mutasi retur_masuk |
| 6 | `oims-5yr.12` Bundling + Label QR | P2 | Output akhir Tahap 2 |
| 7 | `oims-5yr.13` WIP derived + Dashboard T2 | P2 | Penutup tahap |
| 8 | `oims-5yr` epic Tahap 2 (induk) | P4 | Ditutup setelah 13 anak selesai |

### Gelombang 5 — Antrean tahap berikutnya (breakdown just-in-time)

Belum ada sesi — masing-masing dapat sesi `/oims-plan` sendiri setelah tahap
sebelumnya berjalan, supaya plan tidak basi. Trigger: saat issue eksekusi tahap
berjalan tersisa ≤2, sesi penutup WAJIB menambah baris sesi breakdown berikutnya
di sini (orchestrator-workflow.md langkah 9).

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

- 2026-09-02 (sesi 2b): eksekusi wave 2A langsung oleh Claude (permintaan Abu, deviasi dari Antigravity): oims-5yr.1 master produk + nav PRODUKSI, oims-5yr.2 varian matrix+SKU, oims-5yr.3 BOM full lifecycle. 6 route /produksi/* baru, tsc + build clean, 3 commit. Beads masih in_progress — menunggu approve Abu.
- 2026-09-02 (sesi 2): breakdown Tahap 2 — 13 issue anak (oims-5yr.1-13) + deps rantai PRD §4. Wave 2A (produk/varian/BOM) plan+prompt+GH #11-13, migration produk/varian_produk/bom/bom_detail applied via MCP, schema.ts ter-update, checklist review Tahap 2 masuk skill oims-review. 3 commit (1 per issue).
- 2026-09-02: dashboard pertama — adopsi sistem eksekusi issue (applications.md Jalur 2); Tahap 1 epic ditutup, Tahap 5 di-defer.
