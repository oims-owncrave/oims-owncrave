# 🗺️ Roadmap: OIMS Owncrave

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Spec detail di [`docs/konsep-produksi.md`], PRD di [`~/second-brain/3.Resources/freelance/aplikasi-produksi/OIMS_PRD_Tahap_1_sampai_5.md`], task detail di tracker (prefix `oims-`), plan per-fitur di [`docs/plans/`].
> Diperbarui: 2026-08-05 · Status: **Tahap 1 selesai + serah terima beres. Sekarang: mobile app-like polish (oims-g05) → lalu feedback owner (harga/warna/dashboard).**

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
| ✅ | ~~Serah terima + training 1 sesi~~ | Milestone selesai Tahap 1 | ✅ **DONE** |

### Post-MVP — NANTI (per tahap penawaran)

| Item | Isi | Catatan |
|---|---|---|
| Tahap 2 | Produksi, Cutting & Bundling (PO produksi, BOM, work order cutting, bundling+label QR) | Depends Tahap 1 live |
| Tahap 3 | Penjahitan Internal & Vendor (penugasan, surat jalan PDF, WIP monitoring, penerimaan hasil) | Depends Tahap 2 |
| Tahap 4 | QC, Finishing & Packing (standar QC, grading A/B/C/Reject, stok barang jadi) | Depends Tahap 3 |
| Tahap 5 | Keuangan, HPP & Laporan Keuangan (COA, kas/hutang, HPP per PO/unit, jurnal, L/R, neraca) | Depends Tahap 4. Stack: web-app wajib (BUKAN Sheets) |
| Skill new-project-bootstrap | Destilasi pola bootstrap ini jadi skill reusable | `sb-g12` — blocked until OIMS bootstrap terbukti |

---

## 🗂️ Manajemen Sesi (Claude)

Eksekusi kode = Antigravity. Claude = plan + review + diskusi. Sesi dikelompokkan by **tipe kerja** (detail: `~/.claude/CLAUDE.md` → Manajemen Sesi Chat).

| Tipe sesi | Untuk | Naming | Batch |
|---|---|---|---|
| **plan** | Diskusi ide + bikin beads + plan + prompt | `oims-<id> plan-<slug>` | ✅ banyak plan/sesi |
| **review** | Review hasil Antigravity → fix → close → commit | `oims-<id> review-<slug>` | ✅ 2-4 issue kecil |
| **bugfix** | Debug error/regresi runtime | `oims-<id> bugfix-<slug>` | ❌ fokus 1 |
| **discuss** | Diskusi global / roadmap / arah projek (tanpa issue) | `oims discuss-<topik>` | — |

**Naming = title deskriptif**, bukan cuma kode (kode saja bikin lupa lagi bahas apa). Rename: `/rename <nama>`.
**Aturan cepat:** kerjaan sejenis+kecil → batch 1 sesi. Fase ganti / issue besar / context ~70% → sesi baru.

## 📅 Timeline

Catatan kecepatan + histori (buat PM + retrospektif).

| Tanggal | Fase | Catatan |
|---|---|---|
| 2026-08-03 (Sen) | Bootstrap + konsep | Scaffold, UI kit, PWA, schema, 13 plan Tahap 1. Banyak konsep UI/struktur (bukan pure fitur) → cepat. |
| 2026-08-03–05 (Sen–Rab) | Tahap 1 build | jpn.1-14 semua selesai (master, transaksi, stok, dashboard, laporan, audit). ~3 hari dengan AI executor. |
| 2026-08-05 (Rab) | Serah terima | Tahap 1 FEATURE COMPLETE + serah terima + training. |
| 2026-08-05 (Jum) | Feedback + polish | Demo → feedback owner. Mobile app-like polish (g05) + Gelombang B plan (lkw). |

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

**Ringkasan:** Tahap 1 FEATURE COMPLETE. Semua fitur: master data + transaksi + stok/mutasi + penyesuaian + dashboard + laporan + audit log. Polish: g05.7 (wave header) ✅. Berikutnya: g05.8 (card kebab).

---

## 🚧 Next Up — Urutan Eksekusi (pasca-Tahap-1)

> Tahap 1 (jpn.1-14) SEMUA selesai — riwayatnya di Changelog. Sekarang fokus polish + feedback owner sebelum Tahap 2.
> Plan + prompt siap di `docs/plans/` + `docs/prompts/`. Kerjakan berurutan.

### 🟡 GELOMBANG A — Mobile App-Like Polish (`oims-g05`) — HAMPIR SELESAI

Redesign UX mobile jadi app-like (tiru school-management). Staf pakai HP di gudang/produksi. Semua sudah di-plan.

- [x] `oims-g05.1` — **Fix flash sidebar + buang drawer mobile** (P1 bug) ✅ **DONE** (unblocks g05.2, g05.3)
- [x] `oims-g05.2` — Bottom nav parent buka sheet + Menu accordion (P2) ✅ **DONE**
- [x] `oims-g05.3` — Header mobile app-like (greeting + judul/back) (P2) ✅ **DONE**
- [x] `oims-g05.4` — StatCards 2-kolom di mobile (P3) ✅ **DONE**
- [x] `oims-g05.5` — Card view tabel mobile + filter rapi + toggle/sort (P2) ✅ **DONE**
- [x] `oims-g05.6` — PageHeader mobile page title (P3, tambahan owner) ✅ **DONE**
- [x] `oims-g05.7` — Wave shape header home mobile (P3) ✅ **DONE**
- [ ] `oims-g05.8` — Card action kebab menu mobile (P3). Plan+prompt SIAP. · **sesi:** review (batch)

> Urutan: g05.1 dulu → g05.2 + g05.3 → g05.4 + g05.5 (paralel, independen).
> Arsitektur nav dirancang scalable ke Tahap 2-5 (~9 section) — slot Menu accordion. Detail: `docs/plans/2026-08-05-oims-g05.2-*.md`.

### 🟢 GELOMBANG B — Feedback Owner Tahap 1 (`oims-lkw`, plan+prompt SIAP)

Dari demo klien (terkonfirmasi). Plan+prompt di docs/plans + docs/prompts. Urut: dashboard → warna → harga.

- [x] `oims-lkw.1` — **Dashboard**: aktivitas transaksi (filter periode) + top 10 bahan keluar by kuantitas ✅ **DONE** (deviasi: filter interaktif ganti perbandingan → lkw.4)
- [ ] `oims-lkw.2` — **Master warna** + FK warnaId di bahan (model 1 bahan=1 warna). 2 migration. Plan+prompt SIAP. · **sesi:** review SENDIRI (besar + migration) → `oims-lkw review-master-warna`
- [ ] `oims-lkw.3` — **Riwayat harga** di form barang masuk (metode rata-rata TETAP). Plan+prompt SIAP. · **sesi:** review (bisa batch dgn lkw kecil)
- [ ] `oims-lkw.4` — **Dashboard indikator perbandingan** naik/turun vs periode lalu (P3). Plan+prompt SIAP. · **sesi:** review (batch dgn g05.7/8)

### 🧹 Nice-to-have (kapan saja)
- [ ] Vitest untuk document-number generator + weighted average

## 📋 Prompt Antigravity

Prompt eksekusi per issue di `docs/prompts/`. Tahap 1 (jpn.1-14) sudah selesai — prompt-nya arsip. Prompt aktif sekarang: `docs/prompts/2026-08-05-oims-g05.*.md`.

**Aturan per issue:** paste prompt → Antigravity eksekusi → sesi Claude baru (Opus) review → commit kalau lolos → `bd close`.

## 📌 Catatan

- Stack **Opsi B (web-app) untuk semua tahap** — termasuk Tahap 5 keuangan. GAS+Sheets DITOLAK untuk keuangan (risiko integritas data).
- `numeric` untuk semua angka duit dan kuantitas — garmen pakai desimal (0.5 meter).
- `mutasi_stok` = append-only ledger. Gak ada UPDATE/DELETE — invariant paling kritis di sistem.
- Nomor dokumen format: `[TIPE]-YYYYMM-NNNN` (BM-202608-0001, BK-202608-0001, PS-202608-0001).
- PWA icon nyata (logogram OW) sudah terpasang di `public/icons/` (192/512/apple-touch).

---

## 📜 Changelog

- **2026-08-07** — oims-g05.7 selesai. Wave SVG di MobileHomeHeader — lengkung di bawah gradient, fill match bg konten (gray-2 / dark #020d1a), konten z-10, overflow-hidden. Berikutnya: g05.8 (card action kebab menu mobile).

- **2026-08-05** — oims-g05.5 + g05.6 selesai. Card view mobile terpusat di DataTable (heuristik + mobileRole), toggle Card/Table, sort dropdown (ComboSelect), ColumnToggle kondisional, filter toolbar stack mobile. PageHeader (title+breadcrumb) apply ~20 halaman + dokumentasi docs/claude/ui-components.md. GELOMBANG A (mobile polish) SELESAI.

- **2026-08-05** — oims-g05.2 + g05.3 selesai + reviewed. Bottom nav slot parent (Master/Inventory/Laporan) buka bottom-sheet child, slot Menu = accordion collapse per parent (scalable Tahap 2-5). Header mobile app-like: greeting card gradient di /dashboard, judul dinamis + back-arrow di halaman lain, desktop header tak berubah. Deviasi: slot Sistem->Master (Sistem ke Menu), Pengaturan dapat section Tema+Logout (kompensasi kontrol yang hilang dari header mobile). Juga: dashboard query timeout fix (oims-yja, commit e8ca4da).

- **2026-08-05** — oims-g05.1 selesai + reviewed. Sidebar desktop-only (mobile pakai bottom nav), branch drawer mobile dibuang → fix bug flash cold-load (root cause: isMobile telat sync di context). Header dead hamburger dihapus. Fix sampingan: next.config images.qualities [75,100] (warning logo quality). g05.2 + g05.3 unblocked.

- **2026-08-05** — Roadmap direstруktur pasca-Tahap-1. Tahap 1 + serah terima beres. Next Up diganti: Gelombang A = mobile app-like polish (oims-g05, 5 sub-issue, sudah di-plan) → Gelombang B = feedback owner (dashboard enhancement + master warna + riwayat harga bahan). Keputusan: metode harga tetap rata-rata bergerak (insight-bisnis/metode-harga-bahan-hpp.md), nav scalable ke Tahap 2-5 via Menu accordion.

- **2026-08-05** — PWA install via halaman pengaturan (oims-rup). Hapus auto-popup install prompt. Tambah halaman sistem/pengaturan dengan install button. State deferredPrompt di-share via Zustand store (pwa-store). iOS: instruksi Share → Add to Home Screen.

- **2026-08-05** — Mobile bottom nav (oims-2xn) + PWA icon (oims-yxe) selesai. Bottom nav 5-slot hybrid: Dashboard/Inventory/Laporan/Sistem(owner)/Menu — muncul di <850px, sembunyi di desktop. Menu buka bottom-sheet 18 item grouped per section. Hamburger header dihide di mobile (digantikan slot Menu). PWA icon real (logogram OW) dari assets/pwa/ ke public/icons/ (192/512/apple-touch). BUILD_VERSION bumped ke 2026-08-05.

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
