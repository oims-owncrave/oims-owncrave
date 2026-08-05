# 🗺️ Roadmap: OIMS Owncrave

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Spec detail di [`docs/konsep-produksi.md`], PRD di [`~/second-brain/3.Resources/freelance/aplikasi-produksi/OIMS_PRD_Tahap_1_sampai_5.md`], task detail di tracker (prefix `oims-`), plan per-fitur di [`docs/plans/`].
> Diperbarui: 2026-08-05 · Status: **Tahap 1 FEATURE COMPLETE — semua fitur inventory + dashboard + laporan + audit log selesai. Berikutnya: serah terima + training.**

---

## 🎯 MVP & Post-MVP

> **Definisi MVP dalam 1 kalimat:** Tahap 1 (Inventory & Fondasi) jalan di environment klien — stok bahan bisa dicatat, dilihat, dan di-audit oleh tim Owncrave.
> Aturan pilah: *"Apakah fitur ini bagian dari alur Inventory + Fondasi Tahap 1?"* → ya = MVP, tidak = Post-MVP.

### MVP — SEKARANG (jalur ke Tahap 1 live di Owncrave)

Urut. Tujuan akhir = **Tahap 1 serah terima ke Owncrave + 1 sesi training**.

| # | Item | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~Bootstrap projek (scaffold + UI kit + PWA + schema)~~ | Fondasi coding — **DONE** (`sb-ow9`). | ✅ |
| ✅ | ~~**Auth + manajemen user + hak akses per role**~~ | Login wajib ada sebelum fitur lain | ✅ auth+shell+user mgmt (jpn.3,4) **DONE** |
| ✅ | ~~Master data (kategori, satuan, supplier, bahan)~~ | CRUD master = prerequisite semua transaksi | ✅ semua master (jpn.1,2,6,7) **DONE** |
| ✅ | ~~Barang masuk + detail~~ | Pencatatan bahan dari supplier | ✅ jpn.5 **DONE** |
| ✅ | ~~Barang keluar + detail~~ | Pengeluaran bahan ke produksi | ✅ jpn.8 **DONE** |
| ✅ | ~~Stok + mutasi stok (immutable ledger)~~ | Core inventory — append-only, no manual edit | ✅ jpn.9+11 **DONE** |
| ✅ | ~~Penyesuaian stok (dengan approval flow)~~ | PRD mensyaratkan approval owner | ✅ jpn.12 **DONE** |
| ✅ | ~~Dashboard inventory (ringkasan + panel peringatan)~~ | Owner perlu visibilitas tanpa buka tabel | ✅ jpn.10 **DONE** |
| ✅ | ~~Laporan Tahap 1 (barang masuk/keluar/stok/mutasi/nilai persediaan)~~ | Klien butuh laporan PDF/export | ✅ jpn.13 **DONE** |
| ✅ | ~~Audit log (semua aksi penting tercatat)~~ | PRD wajib, fondasi compliance | ✅ jpn.14 **DONE** |
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
| User management + roles | ✅ | `/sistem/pengguna` | jpn.3 done — CRUD user, roles, password reset |
| Master data | ✅ | `/master/*` | kategori/satuan/supplier/bahan semua ✅ (jpn.1,2,6,7) |
| Loading UX (nav + button spinner) | ✅ | global | oims-99y — Spinner, Button loading, useLinkStatus nav, auth spinner |
| Barang masuk | ✅ | `/inventory/barang-masuk` | jpn.5 done — header+detail, weighted avg, mutasi, nomor BM |
| Barang keluar | ✅ | `/inventory/barang-keluar` | jpn.8 done — guard stok, snapshot harga, mutasi negatif, nomor BK |
| Stok bahan | ✅ | `/inventory/stok` | jpn.9 done — view + summary cards + alert kritis + filter ComboSelect |
| Mutasi stok | ✅ | `/inventory/mutasi` | jpn.11 done — ledger server-side paginate + filter bahan/tipe/tanggal |
| Penyesuaian stok | ✅ | `/inventory/penyesuaian` | jpn.12 done — approval flow (owner approve/reject), mutasi atomik, audit log |
| Dashboard | ✅ | `/dashboard` | jpn.10 done — StatCards 8 KPI + PerluPerhatian (stok kritis + penyesuaian pending) |
| Laporan | ✅ | `/laporan/*` | jpn.13 done — 5 laporan (barang masuk/keluar/stok/mutasi/nilai persediaan) + filter periode + export CSV |

**Ringkasan:** Tahap 1 FEATURE COMPLETE. Semua fitur: master data + transaksi + stok/mutasi + penyesuaian + dashboard + laporan + audit log. Berikutnya: serah terima + training (jpn serah terima).

---

## 🚧 Next Up — Urutan Eksekusi (dependency-ordered)

Semua plan + prompt Antigravity siap di `docs/plans/` + `docs/prompts/`. Eksekusi per urutan (blocker naik dari atas).

### 🔴 GELOMBANG 1 — Fondasi (kerjakan dulu, bisa paralel)
- [x] `oims-jpn.3` — User management + roles (P1) ✅ **DONE**
- [x] `oims-jpn.2` — Master kategori (P2) ✅ **DONE**
- [x] `oims-jpn.1` — Master satuan (P2) ✅ **DONE**
- [x] `oims-jpn.6` — Master supplier (P2) ✅ **DONE**

### ⚡ GELOMBANG 2 — Bahan + Transaksi
- [x] `oims-jpn.7` — Master bahan ✅ **DONE**
- [x] `oims-jpn.5` — Barang masuk ✅ **DONE** — weighted avg + mutasi + nomor BM
- [x] `oims-jpn.8` — Barang keluar ✅ **DONE** — guard stok + snapshot harga + nomor BK

### 🟢 GELOMBANG 3 — View + Approval
- [x] `oims-jpn.9` — Stok bahan ✅ **DONE** — view + summary cards + alert kritis
- [x] `oims-jpn.11` — Mutasi stok ✅ **DONE** — ledger server-side + filter bahan/tipe/tanggal
- [x] `oims-jpn.12` — Penyesuaian stok ✅ **DONE** — approval flow owner approve/reject + mutasi atomik

### 🔵 GELOMBANG 4 — Dashboard + Laporan + Audit
- [x] `oims-jpn.10` — Dashboard inventory ✅ **DONE** — StatCards 8 KPI + PerluPerhatian (stok kritis + penyesuaian pending)
- [x] `oims-jpn.13` — Laporan Tahap 1 ✅ **DONE** — 5 laporan + filter periode + export CSV (zero-dep)
- [x] `oims-jpn.14` — Audit log viewer ✅ **DONE** — server paginate + filter tabel/aksi/user/tanggal + diff modal

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

- **2026-08-05** — Audit log viewer (jpn.14) selesai + reviewed. Server-side pagination (50/page). Filter: pelaku, tabel, aksi, date range. Diff modal (before/after JSON). requireRole owner-only. Fix: hapus double pagination (TablePagination + server controls conflict). Tahap 1 FEATURE COMPLETE.

- **2026-08-05** — Laporan Tahap 1 (jpn.13) selesai + reviewed. 5 laporan: barang masuk/keluar/stok/mutasi/nilai persediaan. Filter periode (date range). Export CSV zero-dep dengan BOM UTF-8 untuk Excel. Nilai persediaan grouped by kategori. Berikutnya: audit log (jpn.14).

- **2026-08-05** — Dashboard inventory (jpn.10) selesai + reviewed. StatCards 8 KPI (bahan aktif, supplier, nilai persediaan, transaksi bulan ini/hari ini, kritis, penyesuaian pending). PerluPerhatian: panel stok kritis + penyesuaian pending dengan loading nav. Queries parallel, staleTime 30s. Fix: read-only display div h-11 → h-10 (align dengan Input py-2.5) di barang-masuk/keluar/penyesuaian form. Berikutnya: laporan (jpn.13).

- **2026-08-05** — Penyesuaian stok (jpn.12) selesai + reviewed. Approval flow: owner approve/reject, mutasi atomik (FOR UPDATE), audit log tiap aksi. Fix: z.coerce.number schema, rejectPenyesuaian dalam tx. Filter mutasi pindah ke toolbar. Berikutnya: dashboard (jpn.10).

- **2026-08-05** — Stok bahan (jpn.9) + Mutasi stok (jpn.11) selesai + reviewed. Fix: hapus duplicate h2 di PageClient, ganti `<select>` native → ComboSelect (filter kategori stok, bahan mutasi, tipe mutasi), checkbox native → Checkbox kit. Berikutnya: penyesuaian stok (jpn.12).

- **2026-08-05** — Barang masuk (jpn.5) + Barang keluar (jpn.8) selesai + reviewed. Guard stok (FOR UPDATE + duplicate bahanId aggregation), snapshot harga rata2, mutasi negatif, retry nomor dokumen. Loading button nav (useTransition) diterapkan konsisten. Berikutnya: view stok (jpn.9).

- **2026-08-04** — Loading UX (oims-99y): Spinner component + Button `loading` prop + nav loading inline (useLinkStatus) + spinner login/logout. Fix FK dropdown tampil entitas nonaktif (filter isActive, keep-selected). Distandarisasi ke `_pola` + `ui_conventions` (§12) + bootstrap.

- **2026-08-04** — Master bahan (jpn.7) selesai + reviewed (kolom harga dibuang, stok format Number(), dropdown ComboSelect, createBahan transaction). SEMUA master data Tahap 1 SELESAI (kategori/satuan/supplier/bahan). Berikutnya fase transaksi: jpn.5 barang masuk (weighted avg + mutasi + nomor dokumen).

- **2026-08-04** — Master satuan (jpn.1) + supplier (jpn.6) selesai + reviewed. Directive copy-JSX ditambah ke semua prompt tabel (executor Antigravity tak meleset visual lagi — supplier zero perbaikan). Gelombang 1 (fondasi master) SELESAI. Berikutnya jpn.7 (bahan).

- **2026-08-04** — Master kategori (jpn.2) selesai: CRUD + partial unique index (soft-delete safe) + toast semantik + Checkbox label. Pola master CRUD distandarisasi ke `docs/plans/_pola-master-crud.md` + `ui_conventions.md` (vault, global). Skill new-project-bootstrap diperbaiki (point ke standar UI). Semua plan+prompt jpn.1-13 sync ke standar.

- **2026-08-03** — Auth (username signin) + admin shell (sidebar+header+dark mode, port PMS) + user mgmt plan selesai. 13 plan Tahap 1 + prompt Antigravity dibuat (jpn.1-14). Supabase MCP tersambung, test user superadmin (owner).
- **2026-08-03** — Roadmap dibuat. Bootstrap projek selesai (sb-ow9): scaffold, UI kit, PWA, schema Tahap 1, dokumen. Migrasi npm→pnpm selesai. Penawaran direvisi (Opsi B default, anchoring total, catatan Fase 2).
