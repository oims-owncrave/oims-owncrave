# 🗺️ Roadmap: OIMS Owncrave

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Spec detail di [`docs/konsep-produksi.md`], PRD di [`~/second-brain/3.Resources/freelance/aplikasi-produksi/OIMS_PRD_Tahap_1_sampai_5.md`], task detail di tracker (prefix `oims-`), plan per-fitur di [`docs/plans/`].
> Diperbarui: 2026-08-03 · Status: **Tahap 1 in progress — auth + admin shell done, semua plan+prompt siap eksekusi.**

---

## 🎯 MVP & Post-MVP

> **Definisi MVP dalam 1 kalimat:** Tahap 1 (Inventory & Fondasi) jalan di environment klien — stok bahan bisa dicatat, dilihat, dan di-audit oleh tim Owncrave.
> Aturan pilah: *"Apakah fitur ini bagian dari alur Inventory + Fondasi Tahap 1?"* → ya = MVP, tidak = Post-MVP.

### MVP — SEKARANG (jalur ke Tahap 1 live di Owncrave)

Urut. Tujuan akhir = **Tahap 1 serah terima ke Owncrave + 1 sesi training**.

| # | Item | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~Bootstrap projek (scaffold + UI kit + PWA + schema)~~ | Fondasi coding — **DONE** (`sb-ow9`). | ✅ |
| 1 | **Auth + manajemen user + hak akses per role** | Login wajib ada sebelum fitur lain | 🔄 auth+shell ✅, user mgmt (jpn.3) plan siap |
| 2 | Master data (kategori, satuan, supplier, bahan) | CRUD master = prerequisite semua transaksi | ⏳ |
| 3 | Barang masuk + detail | Pencatatan bahan dari supplier | ⏳ |
| 4 | Barang keluar + detail | Pengeluaran bahan ke produksi | ⏳ |
| 5 | Stok + mutasi stok (immutable ledger) | Core inventory — append-only, no manual edit | ⏳ |
| 6 | Penyesuaian stok (dengan approval flow) | PRD mensyaratkan approval owner | ⏳ |
| 7 | Dashboard inventory (ringkasan + panel peringatan) | Owner perlu visibilitas tanpa buka tabel | ⏳ |
| 8 | Laporan Tahap 1 (barang masuk/keluar/stok/mutasi/nilai persediaan) | Klien butuh laporan PDF/export | ⏳ |
| 9 | Audit log (semua aksi penting tercatat) | PRD wajib, fondasi compliance | ⏳ |
| 10 | Serah terima + training 1 sesi | Milestone selesai Tahap 1 | ⏳ |

### Post-MVP — NANTI (per tahap penawaran)

| Item | Isi | Catatan |
|---|---|---|
| Tahap 2 | Produksi, Cutting & Bundling (PO produksi, BOM, work order cutting, bundling+label QR) | Depends Tahap 1 live |
| Tahap 3 | Penjahitan Internal & Vendor (penugasan, surat jalan PDF, WIP monitoring, penerimaan hasil) | Depends Tahap 2 |
| Tahap 4 | QC, Finishing & Packing (standar QC, grading A/B/C/Reject, stok barang jadi) | Depends Tahap 3 |
| Tahap 5 | Keuangan, HPP & Laporan Keuangan (COA, kas/hutang, HPP per PO/unit, jurnal, L/R, neraca) | Depends Tahap 4. Stack: web-app wajib (BUKAN Sheets) |
| Skill new-project-bootstrap | Destilasi pola bootstrap ini jadi skill reusable | `sb-g12` — blocked until OIMS bootstrap terbukti |

---

## 🎯 Visi

OIMS adalah satu aplikasi terintegrasi yang menghubungkan seluruh alur produksi garmen Owncrave — dari pembelian bahan sampai laporan keuangan. Dibangun bertahap (5 tahap) agar stabil, bisa langsung dipakai per tahap, dan setiap tahap jadi fondasi tahap berikutnya. Target jangka pendek: Tahap 1 jalan dan menggantikan pencatatan manual stok bahan. Target jangka panjang: semua alur produksi + HPP terotomasi dalam satu sistem.

---

## 📊 Status

Legenda: ✅ jadi · 🔄 sebagian / ada perbaikan terbuka · ⏳ belum jalan

| Item | Status | Route | Catatan |
|---|---|---|---|
| Scaffold + config + install | ✅ | — | Next16 + Drizzle + TanStack + Supabase stack |
| UI kit (Button, Input, Select, MultiSelect, ComboSelect, Tooltip) | ✅ | `src/components/ui/` | Port dari bf-v2 + ComboSelect dari PMS (v3→v4) |
| PWA (manifest + SW versioned + install prompt) | ✅ | `public/sw.js`, `manifest.json` | Manual, zero-dep, pola school-management |
| Schema Tahap 1 + migration | ✅ | `src/db/schema.ts`, `drizzle/` | 14 tabel, `numeric` untuk duit, immutable mutasi |
| Dokumen (CLAUDE.md, reference-projects, konsep-produksi) | ✅ | `docs/` | — |
| Build clean + TypeScript | ✅ | — | `pnpm run build` green (pnpm@10.33.0) |
| Auth (signin username-based) | ✅ | `/signin` | Supabase Auth, email sintetis @owncrave.local |
| Admin shell (sidebar+header+dark) | ✅ | `(with-layout)` | Port dari PMS (oims-93g) |
| User management + roles | 🔄 | `/sistem/pengguna` | Plan siap (jpn.3), belum eksekusi |
| Master data | ⏳ | `/master/*` | — |
| Inventory (barang masuk/keluar/stok/mutasi) | ⏳ | `/inventory/*` | — |
| Dashboard | ⏳ | `/dashboard` | Saat ini placeholder |
| Laporan | ⏳ | `/laporan/*` | — |

**Ringkasan:** Bootstrap + auth + admin shell selesai. **13 plan Tahap 1 + prompt Antigravity siap** (jpn.1-14). Eksekusi tinggal paste prompt ke Antigravity per urutan dependency.

---

## 🚧 Next Up — Urutan Eksekusi (dependency-ordered)

Semua plan + prompt Antigravity siap di `docs/plans/` + `docs/prompts/`. Eksekusi per urutan (blocker naik dari atas).

### 🔴 GELOMBANG 1 — Fondasi (kerjakan dulu, bisa paralel)
- [ ] `oims-jpn.3` — User management + roles (P1) — **prasyarat `requireRole` semua fitur**
- [ ] `oims-jpn.2` — Master kategori (P2)
- [ ] `oims-jpn.1` — Master satuan (P2)
- [ ] `oims-jpn.6` — Master supplier (P2)

### ⚡ GELOMBANG 2 — Bahan + Transaksi
- [ ] `oims-jpn.7` — Master bahan (butuh: kategori+satuan+supplier+user mgmt)
- [ ] `oims-jpn.5` — Barang masuk (butuh: bahan) — weighted avg + mutasi
- [ ] `oims-jpn.8` — Barang keluar (butuh: bahan+barang masuk) — guard stok + snapshot

### 🟢 GELOMBANG 3 — View + Approval
- [ ] `oims-jpn.9` — Stok bahan (view)
- [ ] `oims-jpn.11` — Mutasi stok (view ledger)
- [ ] `oims-jpn.12` — Penyesuaian stok (approval flow)

### 🔵 GELOMBANG 4 — Dashboard + Laporan + Audit
- [ ] `oims-jpn.10` — Dashboard inventory
- [ ] `oims-jpn.13` — Laporan Tahap 1 (P3)
- [ ] `oims-jpn.14` — Audit log viewer (P3)

### 🧹 Nice-to-have (kapan saja)
- [ ] Ikon PWA nyata (ganti placeholder)
- [ ] Vitest untuk document-number generator + weighted average

---

## 📋 Urutan Eksekusi Prompt (Antigravity)

Copy-paste prompt ke Antigravity satu per satu. Tunggu selesai + review sebelum lanjut. **Jangan lompat gelombang.**

| # | Issue | Prompt file |
|---|---|---|
| **G1 — Fondasi** | | |
| 1 | `jpn.3` user management ← **WAJIB PERTAMA** (bikin `requireRole`). Task 1 (seed superadmin via MCP) ✅ Claude, Antigravity mulai Task 2 | `docs/prompts/2026-08-03-oims-jpn.3-user-management.md` |
| 2 | `jpn.2` master kategori | `docs/prompts/2026-08-03-oims-jpn.2-master-kategori.md` |
| 3 | `jpn.1` master satuan | `docs/prompts/2026-08-03-oims-jpn.1-master-satuan.md` |
| 4 | `jpn.6` master supplier | `docs/prompts/2026-08-03-oims-jpn.6-master-supplier.md` |
| **G2 — Bahan + Transaksi** | | |
| 5 | `jpn.7` master bahan ← butuh 1,2,3,6 | `docs/prompts/2026-08-03-oims-jpn.7-master-bahan.md` |
| 6 | `jpn.5` barang masuk ← butuh bahan | `docs/prompts/2026-08-03-oims-jpn.5-barang-masuk.md` |
| 7 | `jpn.8` barang keluar ← butuh barang masuk | `docs/prompts/2026-08-03-oims-jpn.8-barang-keluar.md` |
| **G3 — View + Approval** | | |
| 8 | `jpn.9` stok bahan | `docs/prompts/2026-08-03-oims-jpn.9-stok-bahan.md` |
| 9 | `jpn.11` mutasi stok | `docs/prompts/2026-08-03-oims-jpn.11-mutasi-stok.md` |
| 10 | `jpn.12` penyesuaian stok | `docs/prompts/2026-08-03-oims-jpn.12-penyesuaian-stok.md` |
| **G4 — Dashboard + Laporan + Audit** | | |
| 11 | `jpn.10` dashboard | `docs/prompts/2026-08-03-oims-jpn.10-dashboard-inventory.md` |
| 12 | `jpn.13` laporan | `docs/prompts/2026-08-03-oims-jpn.13-laporan-tahap1.md` |
| 13 | `jpn.14` audit log | `docs/prompts/2026-08-03-oims-jpn.14-audit-log.md` |

**Aturan:**
- **Jangan lompat gelombang** — G2 butuh G1 selesai (import `requireRole`, FK master).
- Dalam 1 gelombang urutan bebas, **kecuali jpn.3 wajib pertama** (bikin `src/lib/auth.ts`).
- Per issue: paste prompt → Antigravity eksekusi → **sesi Claude baru (Opus) review** → commit kalau lolos → `bd close`.

---

## 📌 Catatan

- Stack **Opsi B (web-app) untuk semua tahap** — termasuk Tahap 5 keuangan. GAS+Sheets DITOLAK untuk keuangan (risiko integritas data).
- `numeric` untuk semua angka duit dan kuantitas — garmen pakai desimal (0.5 meter).
- `mutasi_stok` = append-only ledger. Gak ada UPDATE/DELETE — invariant paling kritis di sistem.
- Nomor dokumen format: `[TIPE]-YYYYMM-NNNN` (BM-202608-0001, BK-202608-0001, PS-202608-0001).
- PWA icon placeholder di `public/icons/` — ganti dengan ikon OIMS nyata sebelum serah terima klien.

---

## 📜 Changelog

- **2026-08-03** — Auth (username signin) + admin shell (sidebar+header+dark mode, port PMS) + user mgmt plan selesai. 13 plan Tahap 1 + prompt Antigravity dibuat (jpn.1-14). Supabase MCP tersambung, test user superadmin (owner).
- **2026-08-03** — Roadmap dibuat. Bootstrap projek selesai (sb-ow9): scaffold, UI kit, PWA, schema Tahap 1, dokumen. Migrasi npm→pnpm selesai. Penawaran direvisi (Opsi B default, anchoring total, catatan Fase 2).
