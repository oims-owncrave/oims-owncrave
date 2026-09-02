# 🧭 Dashboard: OIMS Owncrave

> Ringkas: file ini kontrol arah. Task detail di beads, plan di docs/plans/.
> Diperbarui: 2026-09-02 · Versi: v0.1.0 · Status: **Tahap 1 selesai (44 issue closed); Tahap 2–4 belum dipecah jadi issue — langkah berikutnya sesi planning breakdown Tahap 2.**

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
| Tahap 2 — Produksi, Cutting, Bundling | ⏳ | — | epic `oims-5yr` (belum dipecah) |
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

### Gelombang 1 — Planning: Breakdown Tahap 2

Sesi:
- `oims-5yr plan-breakdown-tahap2` | oims-5yr | /oims-plan: pecah epic jadi issue anak + plan + prompt (PRD Tahap 2 §5–24 + referensi §2–5, §10)

| # | Issue | Prio | Kenapa di sini |
|---|---|---|---|
| 1 | `oims-5yr` epic: Tahap 2 — Produksi, Cutting & Bundling | P1 | Induk semua eksekusi berikutnya; tanpa breakdown tidak ada issue yang bisa dieksekusi |

Setelah breakdown, gelombang eksekusi Tahap 2 diisi di sini. Urutan kasar yang
diharapkan: schema/master (produk, varian, BOM) → PO produksi → cutting → bundling →
dashboard WIP. Gap paling berisiko (belum pernah teruji di app lama): BOM +
keterhubungan ke inventory bahan, pemakaian aktual/sisa/limbah.

### Gelombang 2 — Antrean tahap berikutnya (breakdown just-in-time)

Belum ada sesi — masing-masing dapat sesi `/oims-plan` sendiri setelah tahap
sebelumnya berjalan, supaya plan tidak basi.

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

- 2026-09-02: dashboard pertama — adopsi sistem eksekusi issue (applications.md Jalur 2); Tahap 1 epic ditutup, Tahap 5 di-defer.
