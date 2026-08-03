# 🗺️ Roadmap: OIMS Owncrave

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Spec detail di [`docs/konsep-produksi.md`], PRD di [`~/second-brain/3.Resources/freelance/aplikasi-produksi/OIMS_PRD_Tahap_1_sampai_5.md`], task detail di tracker (prefix `oims-`), plan per-fitur di [`docs/plans/`].
> Diperbarui: 2026-08-03 · Status: **Bootstrap selesai — Tahap 1 (Inventory) siap dikerjakan.**

---

## 🎯 MVP & Post-MVP

> **Definisi MVP dalam 1 kalimat:** Tahap 1 (Inventory & Fondasi) jalan di environment klien — stok bahan bisa dicatat, dilihat, dan di-audit oleh tim Owncrave.
> Aturan pilah: *"Apakah fitur ini bagian dari alur Inventory + Fondasi Tahap 1?"* → ya = MVP, tidak = Post-MVP.

### MVP — SEKARANG (jalur ke Tahap 1 live di Owncrave)

Urut. Tujuan akhir = **Tahap 1 serah terima ke Owncrave + 1 sesi training**.

| # | Item | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~Bootstrap projek (scaffold + UI kit + PWA + schema)~~ | Fondasi coding — **DONE** (`sb-ow9`). | ✅ |
| 1 | **Auth + manajemen user + hak akses per role** | Login wajib ada sebelum fitur lain | ⏳ |
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
| Auth + user management | ⏳ | `/signin`, `/signup` | Next: Supabase Auth + role check |
| Master data | ⏳ | `/master/*` | — |
| Inventory (barang masuk/keluar/stok/mutasi) | ⏳ | `/inventory/*` | — |
| Dashboard | ⏳ | `/dashboard` | Saat ini placeholder |
| Laporan | ⏳ | `/laporan/*` | — |

**Ringkasan:** Bootstrap selesai (scaffold + UI kit + PWA + schema + dokumen). 6 dari 11 item fondasi jadi. Siap mulai coding fitur Tahap 1.

---

## 🚧 Next Up

Urutan: fondasi auth dulu (semua fitur butuh login), lalu master data (prerequisite transaksi), baru transaksi inventory.

### 🔴 P1 — Critical
- [ ] `oims-xxx` — Auth: signin + signup + session (Supabase Auth + `@supabase/ssr`)
- [ ] `oims-xxx` — Role-based access control (middleware + per-route guard)

### ⚡ P2 — Penting
- [ ] `oims-xxx` — Master data: kategori, satuan, supplier, bahan (CRUD + soft delete)
- [ ] `oims-xxx` — Barang masuk (header + detail + generate nomor dokumen)
- [ ] `oims-xxx` — Barang keluar + otomatis update mutasi stok

### 🧹 P3 — Kualitas / Nice-to-have
- [ ] `oims-xxx` — Tambah ikon PWA nyata (ganti placeholder 1x1px)
- [ ] `oims-xxx` — Vitest unit test untuk schema helpers + nomor dokumen generator

---

## 📌 Catatan

- Stack **Opsi B (web-app) untuk semua tahap** — termasuk Tahap 5 keuangan. GAS+Sheets DITOLAK untuk keuangan (risiko integritas data).
- `numeric` untuk semua angka duit dan kuantitas — garmen pakai desimal (0.5 meter).
- `mutasi_stok` = append-only ledger. Gak ada UPDATE/DELETE — invariant paling kritis di sistem.
- Nomor dokumen format: `[TIPE]-YYYYMM-NNNN` (BM-202608-0001, BK-202608-0001, PS-202608-0001).
- PWA icon placeholder di `public/icons/` — ganti dengan ikon OIMS nyata sebelum serah terima klien.

---

## 📜 Changelog

- **2026-08-03** — Roadmap dibuat. Bootstrap projek selesai (sb-ow9): scaffold, UI kit, PWA, schema Tahap 1, dokumen. Migrasi npm→pnpm selesai. Penawaran direvisi (Opsi B default, anchoring total, catatan Fase 2).
