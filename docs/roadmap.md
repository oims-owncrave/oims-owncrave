# 🗺️ Roadmap: OIMS Owncrave

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Spec detail di [`docs/konsep-produksi.md`], PRD di [`~/second-brain/3.Resources/freelance/aplikasi-produksi/OIMS_PRD_Tahap_1_sampai_5.md`], task detail di tracker (prefix `oims-`), plan per-fitur di [`docs/plans/`].
> Diperbarui: 2026-09-22 · Status: **Tahap 1-4 selesai. Gelombang H, J, K TUNTAS — M3.1 (`app-2fq`) CLOSED. 10 dari 10 pertanyaan klien terjawab. Sisa 2 kartu di M3.2 (`app-nkw`): `app-nkw.1` ✅ **SELESAI & terverifikasi browser**. Tersisa **satu kartu**: `app-05i4` (reset prod → isi master dari Excel → isi stok dari aplikasi klien).**

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
| Tahap 2 — Produksi, Cutting, Bundling | ✅ | `/produksi/*` | epic oims-5yr closed 2026-09-02 (13/13) |
| Tahap 3 — Penjahitan Vendor & WIP | ✅ | `/vendor/*` | epic oims-eba closed 2026-09-03, smoke test 6 langkah lolos |
| Tahap 4 — QC, Finishing & Packing | ✅ | `/qc/*` (10 route) | epic oims-ckp closed 2026-09-10 (15/15) · belum smoke test |

**Ringkasan:** Tahap 1 FEATURE COMPLETE. GELOMBANG A + B SELESAI. lkw.1+2+3+4 done. Mobile UI polish batch (xlp/6c3/76v/8i9/ghs) done. Fitur aktif, siap serah terima Tahap 1.

---

## 🚧 Next Up — Urutan Eksekusi (pasca-Tahap-1)

> Tahap 1 (jpn.1-14) SEMUA selesai — riwayatnya di Changelog. Sekarang fokus polish + feedback owner sebelum Tahap 2.
> Plan + prompt siap di `docs/plans/` + `docs/prompts/`. Kerjakan berurutan.

### ✅ GELOMBANG A — Mobile App-Like Polish (`oims-g05`) — SELESAI

Redesign UX mobile jadi app-like (tiru school-management). Staf pakai HP di gudang/produksi. Semua sudah di-plan.

- [x] `oims-g05.1` — **Fix flash sidebar + buang drawer mobile** (P1 bug) ✅ **DONE** (unblocks g05.2, g05.3)
- [x] `oims-g05.2` — Bottom nav parent buka sheet + Menu accordion (P2) ✅ **DONE**
- [x] `oims-g05.3` — Header mobile app-like (greeting + judul/back) (P2) ✅ **DONE**
- [x] `oims-g05.4` — StatCards 2-kolom di mobile (P3) ✅ **DONE**
- [x] `oims-g05.5` — Card view tabel mobile + filter rapi + toggle/sort (P2) ✅ **DONE**
- [x] `oims-g05.6` — PageHeader mobile page title (P3, tambahan owner) ✅ **DONE**
- [x] `oims-g05.7` — Wave shape header home mobile (P3) ✅ **DONE**
- [x] `oims-g05.8` — Card action kebab menu mobile (P3) ✅ **DONE**

> Urutan: g05.1 dulu → g05.2 + g05.3 → g05.4 + g05.5 (paralel, independen).
> Arsitektur nav dirancang scalable ke Tahap 2-5 (~9 section) — slot Menu accordion. Detail: `docs/plans/2026-08-05-oims-g05.2-*.md`.

### ✅ GELOMBANG B — Feedback Owner Tahap 1 (`oims-lkw`) — SELESAI

Dari demo klien (terkonfirmasi). Plan+prompt di docs/plans + docs/prompts. Urut: dashboard → warna → harga.

- [x] `oims-lkw.1` — **Dashboard**: aktivitas transaksi (filter periode) + top 10 bahan keluar by kuantitas ✅ **DONE** (deviasi: filter interaktif ganti perbandingan → lkw.4)
- [x] `oims-lkw.2` — **Master warna** + FK warnaId di bahan (model 1 bahan=1 warna) ✅ **DONE**
- [x] `oims-lkw.3` — **Riwayat harga** di form barang masuk (metode rata-rata TETAP) ✅ **DONE**
- [x] `oims-lkw.4` — **Dashboard indikator perbandingan** naik/turun vs periode lalu (P3) ✅ **DONE**

### 🔄 GELOMBANG C — Mobile Polish Batch 2 + Bugfix — HAMPIR SELESAI

Feedback tampilan mobile lanjutan (dari demo). Plan+prompt di docs/plans + docs/prompts (2026-08-07/08).

- [x] `oims-ghs` — **Splash screen PWA** (logo + nama + 3 titik loading, fade-out) ✅ **DONE**
- [x] `oims-6c3` — Toggle Kartu/Tabel pindah ke atas search/filter ✅ **DONE**
- [x] `oims-76v` — Export CSV lebar setengah (laporan barang masuk & keluar) ✅ **DONE**
- [x] `oims-xlp` — Laporan Mutasi: Export CSV sejajar filter Semua Bahan ✅ **DONE**
- [x] `oims-8i9` — Mobile table: search compact + FAB button Tambah ✅ **DONE**
- [x] `oims-59w` — **Bugfix scroll reset** toggle Kartu/Tabel (focus-scroll → scroll-lock 250ms) ✅ **DONE**
- [x] `oims-y5k` — Card mobile: highlight section background abu-abu (warna table header)

### 🔜 GELOMBANG D — Import Batch Excel (di-plan, siap eksekusi Antigravity)

Insert batch data master via upload Excel (.xlsx) + template kosong (header + 1 baris contoh). Import MURNI insert. Format .xlsx (SheetJS `xlsx`), all-or-nothing (1 error → rollback semua + daftar baris gagal). Plan+prompt siap di `docs/plans/` + `docs/prompts/`.

- [x] `oims-jpn.15` — **Import infra + master flat** (kategori/satuan/supplier): uploader, parser xlsx, template generator, validator, batch action all-or-nothing. ⏳ belum jalan
- [x] `oims-jpn.16` — **Import bahan** (FK resolve teks→UUID, auto-kode BH-{KAT}-{NNN}, transaksi + baris stok 0). ⏳ belum jalan — **depends oims-jpn.15**

Urutan eksekusi: jpn.15 dulu (fondasi), jpn.16 nebeng infra-nya.

### 🔜 GELOMBANG E — Tahap 2: Produksi, Cutting & Bundling (`oims-5yr.1-13`)

Epic `oims-5yr` dipecah 13 issue anak (2026-09-02), rantai dependensi ikuti alur PRD §4.
Wave 2A (fondasi) sudah di-plan + prompt + migration DB applied — siap eksekusi Antigravity.
Wave berikutnya di-plan just-in-time setelah 2A jalan (plan tidak basi). Kontrol eksekusi: `docs/dashboard.md`.

- [x] `oims-5yr.1` — **Master Produk** + nav section PRODUKSI ✅ **DONE** (GH #11, eksekusi Claude)
- [x] `oims-5yr.2` — **Varian Produk** matrix warna×ukuran + SKU auto ✅ **DONE** (GH #12)
- [x] `oims-5yr.3` — **BOM** versi + satu aktif per produk ✅ **DONE** (GH #13)
- [x] `oims-5yr.4-6` — PO Produksi, estimasi kebutuhan, permintaan bahan ✅ **DONE** (GH #14)
- [x] `oims-5yr.7-10` — penerimaan cutting, WO cutting, pemakaian aktual, hasil cutting ✅ **DONE** (GH #15)
- [x] `oims-5yr.11-13` — sisa+limbah, bundling+label, WIP+ringkasan ✅ **DONE** (GH #16) — **TAHAP 2 KOMPLIT, epic closed**

### ✅ GELOMBANG F — Tahap 3: Penjahitan Vendor & WIP (`oims-eba.1-13`) — SELESAI

Epic `oims-eba` dipecah 15 issue (13 inti + 2 backlog P3) 2026-09-02, dieksekusi Claude 2026-09-03.
Smoke test 6 langkah lolos (browser + SQL); 2 bug ketemu & di-fix (render loop form penerimaan,
Date di raw sql). Epic closed. Backlog P3 tersisa: `oims-eba.14` standar durasi, `oims-eba.15` kinerja vendor.

### ✅ GELOMBANG G — Tahap 4: QC, Finishing & Packing (`oims-ckp.1-15`) — SELESAI

Epic `oims-ckp` dipecah **17 issue** (15 inti + 2 backlog) 2026-09-10 + rantai dependensi penuh.
Keputusan cakupan (dijawab Abu): QC **per varian agregat** bukan per pcs · finishing/packing **modul penuh** ·
stok barang jadi **tabel + mutasi sendiri** dengan pola immutable stok bahan.
Titik sambung T3→T4 = `penerimaan_hasil_jahit_detail.jumlah_baik` (baik visual, bukan lolos QC) —
tabel Tahap 3 tidak diubah. Kontrol eksekusi bergelombang: `docs/dashboard.md`.

- [x] **4A fondasi** ✅ **DONE** (Claude 2026-09-10, 3 commit, terverifikasi SQL): `oims-ckp.2` master jenis cacat+kemasan · `oims-ckp.3` master gudang barang jadi · `oims-ckp.4` penerimaan QC + antrean derived
- [x] **4B QC inti** ✅ **DONE**: `.1` standar QC berversi · `.5` WO QC + sampling · `.6` hasil QC + grade · `.7` temuan cacat
- [x] **4C rework** ✅ **DONE**: `.8` perbaikan internal + retur vendor · `.9` Re-QC · `.10` karantina reject
- [x] **4D barang jadi** ✅ **DONE**: `.11` finishing · `.12` packing · `.13` barang jadi + stok + mutasi · `.14` transfer + penyesuaian · `.15` dashboard + yield/COPQ
- [ ] Backlog P3: `.16` QC per pcs + barcode · `.17` kinerja vendor dari data QC

### 🔜 GELOMBANG H — Integritas data & UX loading (18 Sep 2026)

Feedback Abu sebagai developer: kolom teks bebas yang seharusnya FK ke master, dan
loading indicator yang hilang di banyak navigasi. Detail: `app-gtf4` (epic, PARENT
`app-2fq` M3.1), `app-9bkl`/`app-9g1l`/`app-vhaa`/`app-7u06`.

- [x] `app-vhaa` — Fix sidebar submenu >7 item terpotong `max-h-96` ✅ **DONE** (commit `2ed9ea5`)
- [x] `app-9bkl` — Loading indicator (icon jadi Spinner) di 22 file navigasi ✅ **DONE** (commit `0c05bfd`)
- [x] `app-9g1l` — Sisa loading indicator: dashboard card, link kecil, dual-button ✅ **DONE** (commit `641cde5`)
- [x] `app-gtf4.5` — Audit 14 kolom teks vs master (6 FK users, 2 pgEnum, 1 FK PO, 5 tetap teks) ✅ **DONE**, dokumen `docs/insight-bisnis/audit-kolom-teks-vs-master.md` (commit `44be143`)
- [x] `app-7u06` — **Row highlight** (`getRowLoading`) di 18 tabel dengan icon mata ✅ **DONE** (Antigravity eksekusi + Claude review 18 Sep: fix AuditLogTable kode mati + WoQcTable tombol terlewat)
- [x] `app-bvre` — Row loading overlay desktop disamakan mobile ✅ **DONE** (Antigravity eksekusi Opsi A, direvisi Claude ke Opsi B setelah screenshot Abu: overlay `<td absolute inset-0>` — data tetap redup + spinner tengah, bukan colSpan yang buang data)
- [x] `app-gtf4.1` — Sambungkan pengirim/penerima jahit ke master (P1) ✅ **DONE** (Antigravity + review Claude 21 Sep, **0 error, tanpa fix**). 3 kolom jadi FK ke users/vendor/penjahit, 3 kolom pihak vendor tetap teks — diverifikasi lewat `information_schema` + DB CHECK, bukan layar (browser gagal 2x). ⚠️ **Prod belum dimigrasi** — pemetaan teks→FK di sana harus dicek manual.
- [x] `app-glx1` — `barangKeluar.tujuan` → FK notNull ke PO ✅ **DONE** (Antigravity + review Claude 21 Sep: 1 fix — PO tidak ikut dikosongkan saat PB dibatalkan). Belum diverifikasi visual
- [x] `app-gtf4.4` — Ukuran/spesifikasi bahan jadi kolom sendiri (P1) ✅ **DONE** (Antigravity + review Claude 21 Sep, **0 error, 1 bersih-bersih**: field `ukuran` mubazir di `getBahanBomAktif` dibuang). Arah akhirnya BERBEDA dari catatan awal: `bahan.ukuran` (dimensi fisik) memang jadi kolom sendiri, terpisah dari `bomDetail.berlakuUkuran` (ukuran baju yang berlaku) — dua hal beda, dan komentar `schema.ts:504-506` menegaskan pemisahan itu. Bug data asli terperbaiki: 24/30/32 inch yang semuanya tertulis 66cm kini 61/76/81cm; 6 "Vision GMC No5" akhirnya bisa dibedakan. 16 dari 61 bahan terisi ukuran, 9 dropdown menampilkannya. Belum diverifikasi visual.
- [x] `app-gtf4.2` — jenisKerusakan & bagianProduk → master (P2) ✅ **DONE** (Antigravity + review Claude 21 Sep, 0 error, 1 fix: nav entry belum sejalan dengan guard halaman). Master Bagian Produk baru berisi 10 isian awal.
- [x] `app-gtf4.3` — ~~Kategori/Brand/Jenis produk → master~~ → **DIHAPUS** (P2) ✅ **DONE** (Claude langsung 21 Sep, terverifikasi browser). Arah berubah setelah ditelusuri: ketiganya tak dipakai query mana pun, asalnya placeholder plan 2 Sep, dan `kategori`/`jenis` isinya tertukar arti. Bukan dibuatkan master.
- [x] `app-gy84` — Potret ulang 2 gambar tutorial T2 yang basi (P2) ✅ **DITUTUP, bukan dikerjakan** (keputusan Abu 21 Sep: *"skip itu, nanti saja lagi kalau memang mau jadi buat dokumentasi, saya mempertimbangkan tanpa dokumentasi juga sekarang"*). Kalau dokumentasi jadi dibuat, buka kartu baru — gambar mana yang basi mungkin sudah berubah lagi.

Epic `app-gtf4` TUNTAS — kelima anaknya (gtf4.1-gtf4.5) closed. Angka resleting yang
dulu memblokir `app-gtf4.4` sudah terjawab, dan `app-gtf4.3` berakhir dihapus, bukan
dibuatkan master.

**Gelombang H SELESAI seluruhnya.** `app-gy84` ditutup tanpa dikerjakan (dokumentasi
diparkir), `app-itl4` dilipat ke `app-1u2w` — pertanyaannya sudah terjawab: lebihan
level produk disembunyikan, bukan dihapus. Lihat Gelombang K.

### 🔜 GELOMBANG J — Audit komponen UI + perbaikan halaman (21 Sep 2026)

Lahir dari review `app-glx1`: satu bug ComboSelect memicu pertanyaan "apa lagi yang
menyimpang dari spec industri?" Audit `src/components/ui/` menemukan 5 temuan; 3 di
antaranya dinaikkan jadi aturan tetap di vault (`ui_conventions.md` §12b/§12c/§12d),
2 sisanya cukup jadi issue karena belum menggigit.

Plan+prompt semuanya siap. Dua batch, boleh paralel (tidak ada file yang bertabrakan).

**Batch A — komponen UI bersama** ✅ **SELESAI** (Antigravity + review Claude 21 Sep, terverifikasi browser):
- [x] `app-823x` — **P1** NumberInput: draft ketikan tidak sinkron saat `value` diubah dari luar. 32 file. Angka uang/stok bisa tersimpan beda dari yang terlihat, **tanpa gejala apa pun**. Jalur nyata terverifikasi di `DekorasiForm`
- [x] `app-egkt` — Modal tanpa Escape/focus return/scroll lock: `ConfirmDialog` (42 file, selalu di jalur hapus) + `ImportExcelModal` (8 file). Pola benarnya sudah ada di repo (`Lightbox.tsx`) tapi tak menyeberang
- [x] `app-n5fy` — ImportExcelModal: pilih file bernama sama dua kali tak terdeteksi (`e.target.value` tak direset). Alur import memang iteratif, jadi pasti kena
- [x] `app-46vb` — ComboSelect tombol clear (prop `clearable` opt-in) + keyboard navigation di ComboSelect & MultiSelect

**Batch B — halaman** ✅ **SELESAI** (Antigravity + review Claude 21 Sep, terverifikasi browser):
- [x] `app-qr6o` — Sidebar difilter per role sampai level item/subitem. **Scope menu saja** (keputusan Abu 21 Sep) — tiga tempat harus diubah bareng (sidebar, bottom-nav, menu-sheet), kalau cuma sidebar mobile tetap bocor
- [x] `app-fbra` — Peringatan (bukan larangan) saat bikin Template Dekorasi untuk produk yang `dekorasiProses='none'`

**P3 hasil audit, sengaja ditunda** — belum menggigit, jangan dikerjakan sebelum ada
pemicunya: `app-66nu` (DateInput tak di-portal, akan terpotong kalau dipakai dalam
modal — sekarang 6 pemakai semuanya halaman datar), `app-2ttp` (SingleSelect mode
single tidak konsisten — **0 pemakai**, jebakan yang menunggu pemakai pertama).

⚠️ **Utang yang dibuka `app-qr6o`:** menyembunyikan menu BUKAN proteksi. Tidak ada
`middleware.ts`, dan guard per-halaman tidak merata (`inventory/stok` nol guard). Setelah
`app-qr6o` ditutup, akses lewat URL langsung TETAP terbuka. Sudah dicatat di `CLAUDE.md`
§ Utang Teknis. Butuh keputusan bisnis role→route sebelum bisa dikerjakan.

### ✅ GELOMBANG K — Lebihan bahan + estimasi live di form PO (21 Sep 2026) — SELESAI

- [x] `app-1u2w` — **Lebihan pindah ke level bahan + estimasi live** (P2) ✅ **DONE**
  (Antigravity Task 2-6 + review Claude 21 Sep, **0 error, 2 fix**). Migration Task 1
  dieksekusi Claude via MCP ke dev + prod. Blok "Estimasi Kebutuhan Bahan" kini muncul
  di form PO saat mengisi target, lengkap kolom Lebihan manual per bahan + badge stok.
  Blok "Lebihan Pcs" per varian disembunyikan lewat `TAMPILKAN_LEBIHAN_VARIAN`.
  **Terverifikasi browser** (PO-2026-0002 Malabar): 10 dari 10 poin verifikasi lolos —
  preview muncul otomatis, lebihan berubah seketika, simpan/edit/audit benar, regresi
  WO Cutting aman.


Lahir dari pertanyaan Abu saat review `app-jroq`: *"kenapa tidak ada langsung muncul
bahan yang dibutuhkan yah? lalu untuk mengisi data lebihan bahan nya dimana dong?"*
Sesi planning 21 Sep malam menggali Excel klien + repo klien; arahnya berubah dua kali,
jadi catatan ini menyimpan **kesimpulan akhirnya**, bukan langkah-langkahnya.

**Temuan 1 — "Lebihan" klien ada di level BAHAN, bukan produk.** Di `_PRODUKSI OWNC.xlsx`,
lembar "SURAT JALAN KEBUTUHAN AKSESORIS" menaruh Lebihan per baris bahan (Kepala Resleting
1, Cebol 2, Stopper 5, Tali Resleting 5, Tali Hantag 5, Plastik 2). Angkanya identik di
24 sheet PO lintas 3 produk (NORDIC/SUPERNOVA/HIDDEN) selama 4 bulan. Kita menaruhnya di
`poProduksiDetail.lebihanPcs` — per varian jaket, diisi ulang tiap PO.

**Temuan 2 — keteraturan itu BUKAN aturan.** `app-itl4` sudah merekam klarifikasi langsung
klien 18 Sep: angka konsisten itu **kebiasaan manual**, bukan formula, dan klien mau tetap
mengisi sendiri per situasi ("jangan bikin auto-suggest"). Tujuannya jaga-jaga barang
**hilang/kurang** (logistik), bukan reject kualitas. Jadi rencana "kolom default di master
bahan" — yang sempat disusun malam ini — **ditolak oleh data yang sudah ada**. Dicatat di
sini supaya tidak diusulkan ulang.

**Temuan 3 — app klien tidak punya pembanding.** Repo `3_resources/oims/oims-production`:
tidak ada BOM, tidak ada bahan, tidak ada lebihan. Seluruh state satu JSON blob di
`app_state.payload`. PO di sana cuma `{color, size, qty}[]`. Tak ada yang bisa ditiru.

**Bentuk yang disepakati Abu 21 Sep:**
- Tabel baru `po_produksi_lebihan_bahan` (po_id, bahan_id, lebihan) — **diisi manual per PO
  per bahan**, kosong secara default. Tulis setelah PO tersimpan, satu transaksi (pola
  `poProduksiDetail`).
- Blok "Kebutuhan Bahan" di form PO menggantikan tempat blok "Lebihan Pcs (Opsional)":
  daftar bahan + kolom Lebihan manual + badge cukup/kurang. Perkalian BOM di frontend
  (instan), stok dari server dengan **debounce ~500ms** — bukan tombol "Hitung" (tombol
  melimpahkan kerja ke user dan bisa menampilkan angka basi).
- Lebihan per varian disembunyikan lewat konstanta `TAMPILKAN_LEBIHAN_VARIAN = false`,
  **bukan di-comment-out** (kode terkomentari tidak ikut type-check dan akan busuk).
  Kolom DB dipertahankan. ⚠️ Efek samping yang harus disadari: `WoForm.tsx:82` memakai
  `targetCutting = jumlahTarget + lebihanPcs` — dengan lebihan selalu 0, rencana cutting
  jatuh ke target polos. Itu justru sesuai Excel klien, tapi harus disengaja, bukan kaget.
- Rumus estimasi diekstrak ke `src/lib/produksi/estimasi.ts` (server-only tanpa
  `"use server"`, pola `src/lib/jahit/rekap.ts`). **Jangan salin rumus ke frontend.**

**Urutan wajib: rumus dulu, tampilan belakangan.** Live preview menampilkan hasil
`getEstimasiBahan`; kalau preview dibangun sebelum rumusnya final, ia dibongkar dua kali.

Menggantikan rencana lama `app-1u2w` (a/b/c) — deskripsi kartunya masih menyebut
`pcs efektif = jumlahTarget + lebihanPcs`, yang sudah tidak berlaku (koreksinya sudah
ditambahkan sebagai `bd note`). `app-itl4` **ditutup & dilipat ke sini** — pertanyaannya
("klien mau lebihan di level produk?") terjawab: disembunyikan, tidak dihapus.

Semua kerja Gelombang K ada di **satu kartu `app-1u2w`**, plan+prompt sudah siap.

### 🔜 GELOMBANG I — Sederhanakan sidebar: gabung menu jadi tab (18 Sep 2026)

Ide Abu: sidebar terlalu banyak item (Master Data 15, Laporan 5, Vendor & Gudang
7, QC 10) padahal banyak yang nyambung. **Satu kartu `app-z4wp` berisi checklist
6 poin** — sempat dipecah jadi 6 issue terpisah, dilipat lagi 18 Sep atas
permintaan Abu (6 kartu sejajar bikin list ramai padahal satu tema).

Pola wajib: `CuttingPageClient.tsx`. Reuse komponen `<Nama>Table.tsx` LANGSUNG,
bukan `PageClient` (yang bawa `PageHeader` sendiri → header numpuk).

Checklist di `app-z4wp` (detail lengkap + peringatan teknis ada di kartunya):
1. Data Bahan 5→1 (P2) — plan+prompt SIAP, GH #19
2. Laporan 5→1 (P3)
3. Data Mitra 4→1 (P3) — cek Tarif berversi, mungkin tetap terpisah
4. Surat Jalan jadi tab di Pengiriman Vendor 7→6 (P3) — cek: dipakai 2 alur (jahit + dekorasi)
5. Data QC master 2→1 (P4) — cek Standar QC berversi
6. QC 2 pasang tab 10→8 (P4) — Penerimaan+Antrean, Rework+Re-QC

Sengaja TIDAK digabung: QC selain 2 pasang di poin 6 (rantai FK + approval tiap
tahap), Persediaan 5 item (tiap form logic transaksi beda), Produksi/Produk/BOM
(BOM berversi, Produk punya varian).

Efek total kalau semua selesai: Master Data 15→~4, Laporan 5→1, Vendor & Gudang
7→6, QC 10→8.

Urutan: poin 1 dulu sebagai percobaan pola (plan+prompt sudah siap). Sisanya
di-plan just-in-time setelah pola terbukti, biar plan tidak keburu basi.

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

- **2026-09-21 (13)** — `app-z4wp` poin 3 & 4 selesai, poin 5 ditambahkan. **Poin 3 (Laporan):** 5 halaman jadi 1 bertab, instruksinya sengaja kebalikan poin 1-2 (reuse `Client` bukan `Table`, karena `PageHeader` di sini ada di `page.tsx`). 1 fix dariku: pemuatan pertama tiap tab tak punya indikator — `DataTable` ternyata sudah punya `isLoading` + skeleton, cuma tak pernah disambungkan. **Poin 4 (QC 10→8):** tanpa fix. Alur kerja diverifikasi di browser, bukan cuma tampilan — kirim bundel ke QC, tab Penerimaan 0→1 dan Antrean 6→4 tanpa reload. Sempat terlihat gagal, ternyata validasi "Penerima wajib diisi" yang menolak; kucek DB dulu sebelum menyimpulkan bug. **Poin 5 baru:** klien bilang QC masih terlalu banyak. Abu menunjukkan aplikasi lama klien membaginya jadi 2 grup sidebar, dan **pembagian itu lebih baik dari caraku** — aku menggabung berdasarkan hulu-hilir, klien memisahkan jalur normal dari jalur pengecualian. Rencananya 3 grup (QC · Rework & Karantina · Finishing & Gudang), 8 entri jadi 7 tapi tiap accordion tinggal 2-3 baris. Plus Finishing+Packing jadi tab — `konsep-produksi.md` sendiri menulisnya sebagai satu langkah. Bagian tersulitnya: role Finishing dan Packing **berbeda**, jadi guard halaman pakai union dan tabnya disaring.
- **2026-09-21 (12)** — Prompt poin 3 & 4 `app-z4wp` ditulis. Keduanya disesuaikan dengan struktur nyata, bukan disalin dari poin sebelumnya. **Poin 3 (Laporan):** diperiksa dulu — `PageHeader` ada di `page.tsx`, **bukan** di komponen, jadi instruksinya justru **kebalikan** poin 1 & 2: reuse `Client` langsung, bukan cuma `Table`. Kalau ikut kebiasaan poin sebelumnya, semua state filter harus ditulis ulang. Ditambah dua peringatan: state filter tetap milik tiap Client (kalau disatukan, ganti tanggal di satu laporan ikut mengubah yang lain), dan jangan fetch kelima laporan sekaligus karena Nilai Persediaan menghitung seluruh stok. **Poin 4 (QC):** diverifikasi keempat menu yang digabung rolenya **sama persis**, jadi tidak perlu filter tab maupun `opsional()` — lebih sederhana dari poin 2. Bagian Surat Jalan **sengaja dilewati** (dirujuk dua alur). Verifikasi utamanya bukan tampilan tapi **alur kerja**: angka Antrean harus ikut berubah setelah mencatat penerimaan. **Temuan sampingan → `app-yok1` (P3):** nav QC dibatasi `owner, admin_produksi` padahal `READ_ROLES` service mengizinkan semua role — menu lebih **ketat** dari server, kebalikan dari ketimpangan biasa. Saya sendiri yang mengisi roles itu saat `app-qr6o` tanpa mencatat alasannya. Perlu diputuskan mana yang benar sebelum "diperbaiki".
- **2026-09-21 (11)** — `app-z4wp` poin 2 selesai, **tanpa fix review**. Master Data **12 entri → 4 halaman** bertab, heading dibuang: Data Bahan, Data Produk, Data Mitra, Data QC. 3 halaman baru, 12 route lama jadi redirect, 22 file diubah, 0 error. Bagian baru yang belum pernah ada — **tab difilter per role** — ketiga jebakannya ditangani benar: tab aktif divalidasi terhadap daftar yang *sudah* difilter (bukan daftar penuh), data tab terlarang dibungkus `opsional()` tepat di 4 service terbatas saja, dan halaman gabungan sengaja tak diberi guard supaya role yang cuma boleh sebagian tab tetap bisa masuk. Diverifikasi di layar sebagai Staf Gudang 1: `?tab=bom` → tab BOM hilang dan jatuh ke Produk dengan data tampil; Data QC hanya menyisakan Jenis Cacat; `/vendor/penjahit` mendarat tepat di tab Penjahit dengan Tarif tersembunyi. Sebagai owner keempat tab muncul. Link internal bersih, breadcrumb halaman anak sudah diarahkan ulang, dan `[id]/page.tsx` tak tersentuh sama sekali. Catatan: laporan menyebut "glitch-free navigation" lewat `replaceState`+`popstate` seolah tambahan — dicek, pola itu sudah dipakai sejak poin 1. Sisa: poin 3 (Laporan, plan siap, prompt belum) dan poin 4 (QC + Surat Jalan, paling berisiko).
- **2026-09-22 (3)** — `app-nkw.1` selesai, **0 fix, 10/10 verifikasi browser lolos**. 5 file baru + 19 diubah; tab ke-6 "Kontak Vendor" di Data Mitra, 6 kolom nama jadi FK + snapshot (3 ke `kontak_vendor`, 3 ke `users`). **Dua uji yang paling mudah luput dibuktikan langsung:** (1) hapus kontak lalu buat ulang nama sama persis → berhasil, bukan 500 — DB menyimpan dua "Pak Dedi" berdampingan, satu soft-deleted satu aktif, jadi partial unique memang bekerja; (2) nama kontak diubah di master → nama di surat jalan lama **tidak ikut berubah**. Yang kedua itu inti fiturnya, diuji di dua jalur (kontak vendor & staf `users`), dan justru alasan klien memilih opsi (b): kalau barang hilang, yang ditanya adalah orang yang menerima **waktu itu**. **Uji #5 sempat tidak bisa dijalankan** karena WIP jahit di dev sudah selesai semua sehingga dropdown penugasan kosong — atas keputusan Abu, data uji dibuat lebih dulu (bundel + penugasan baru, data lama tidak disentuh). Kontak sengaja ditaruh di **dua** vendor supaya penyaringan benar-benar teruji, bukan sekadar "dropdown ada isinya": dropdown vendor A menampilkan 2 kontaknya dan tidak membocorkan kontak vendor B. Seluruh data uji dibersihkan setelahnya — termasuk `surat_jalan_jahit` yang ternyata ikut terbuat otomatis dan menahan penghapusan lewat FK. Dev kembali persis ke kondisi semula.
- **2026-09-22 (2)** — Planning `app-nkw.1` (kontak per vendor): plan + prompt siap, Task 1 migration dieksekusi Claude via MCP ke dev + prod, `tsc` 0 error. **Cakupannya melebar saat planning, dan itu disengaja.** Awalnya cuma 3 kolom pihak vendor; pengecekan `penerimaanDekorasi` menemukan kelompok kedua — tiga kolom yang menyimpan **staf kita** sebagai teks bebas padahal master `users` sudah ada. Abu memutuskan digabung: temanya sama (nama orang jadi FK + snapshot), memisah berarti dua sesi review untuk pola identik. Jadi 6 kolom, dua sumber dropdown: `kontak_vendor` (tabel baru) untuk orang vendor, `users` untuk staf kita. **Pembedanya diverifikasi dari UI, bukan ditebak dari nama kolom** — Dekorasi ternyata modal "Terima Hasil Dekorasi" yang muncul saat barang datang KEMBALI dari vendor, jadi penerimanya kita; QC berlabel "Nama petugas penerima"; Transfer antar gudang kita sendiri. Keputusan desain yang mengikat: **FK + snapshot nama, bukan FK saja** — justru karena alasan Ucup memilih (b) adalah supaya bisa ditanyai kalau barang hilang, nama di surat jalan lama harus tetap terbaca walau kontaknya dinonaktifkan. Juga: tab ke-6 di Data Mitra, bukan halaman master baru (arah proyek sedang mengurangi entri master), dan dropdown kosong tidak memblokir simpan. Data dev: `transfer_barang_jadi` 0 baris dan form-nya belum ketemu — prompt melarang membuatnya.
- **2026-09-22** — **Semua 10 pertanyaan klien terjawab.** Ucup menjawab tiga susulan pagi ini. **No. 4 (angka resleting):** *"iya begitu"* — 30=76cm, 32=81cm, 34=86cm, persis pola yang kami duga. **No. 6 (Lebihan level produk):** *"butuhnya di level bahan, dan itu pun opsional"* — membenarkan arah `app-1u2w`. Dua-duanya **nol perubahan kode**, tapi keduanya dikerjakan SEBELUM jawabannya masuk, dan itu layak dicatat sebagai pelajaran, bukan sebagai keberuntungan: `docs/pertanyaan-klien-18sep.md` sudah menulis tegas *"ini dugaan kami, bukan jawaban Ucup, jangan langsung dipakai"*, namun 76/81/86 tetap masuk DB semalam sebagai fakta. Kalau Ucup menjawab lain, data klien salah tanpa ada yang tahu. Aturannya ke depan: kolom dibiarkan kosong sampai jawaban masuk. Yang menyelamatkan no. 6 bukan tebakan yang tepat, melainkan bentuk keputusannya — disembunyikan lewat konstanta, kolom DB utuh, sehingga bisa dibatalkan. **No. 10 (nama penerima di konveksi):** opsi **(b)** — *"penting nama orangnya, soalnya kalo ada barang kurang/ilang nanti nanyanya ke orang itu"*. Ini satu-satunya yang menyisakan pekerjaan → kartu baru `app-nkw.1`: tabel `kontak_vendor`, dikelola sebagai seksi di halaman Vendor yang sudah ada (bukan halaman master ke-15 — arah proyek justru sedang mengurangi entri master), dan tiga kolom teks bebas jadi **FK + snapshot nama**. Snapshot-nya wajib justru karena alasan Ucup memilih (b): nama di surat jalan lama harus tetap terbaca walau orangnya nonaktif. Tiga kolom itu diverifikasi ulang di `schema.ts` (1203, 1258, 1345); tiga kolom `penerima` lain sengaja tidak ikut karena beda konteks.
- **2026-09-21 (16)** — Backlog data dirapikan jadi **satu kartu**. `app-6rc5` terbaca seolah pekerjaan kedua padahal isinya analisis bentuk data aplikasi klien (satu JSON blob di `app_state.payload`, tak ada ID relasional, endpoint `/api/state`) — nol langkah kerja. Dilipat ke `app-05i4` sebagai rujukan langkah 3, ditandai `[DILIPAT app-05i4]`, ditutup. **Koreksi urutan:** saya sempat menyebut "migrasi dulu, reset terakhir" — salah, dan Abu yang menangkapnya. Urutan benar ada di dalam `app-05i4` sendiri: reset → isi master dari Excel → isi stok. Migrasi dulu lalu reset berarti menghapus pekerjaan sendiri. Sebabnya saya membaca judul (`TERAKHIR`) sebagai urutan kerja, tanpa membuka isinya.
- **2026-09-21 (15)** — **M3.1 (`app-2fq`) ditutup.** Dua kartu sisa dipindah ke M3.2 (`app-nkw`) atas keputusan Abu: `app-6rc5` (migrasi data klien) dan `app-05i4` (reset prod + isi ulang) memang lebih tepat berjalan bersama serah terima, bukan menahan milestone data. M3.1 kini berisi hanya pekerjaan yang benar-benar selesai: epic `app-gtf4` (5 anak) + `app-7u06`.
- **2026-09-21 (14)** — `app-1u2w` selesai — **Gelombang K tuntas.** Antigravity Task 2-6, `tsc` 0 error, **2 fix saat review**. Hasilnya: blok "Estimasi Kebutuhan Bahan" muncul di form PO sambil mengisi target (BOM + stok + badge cukup/kurang), dengan kolom Lebihan manual per bahan; blok "Lebihan Pcs" per varian hilang dari layar lewat konstanta, kolom DB utuh. **Fix 1 — lebihan ikut memicu query server.** `lebihanBahan` dimasukkan ke `previewInput`, jadi tiap mengetik angka Lebihan kena debounce 500ms + round-trip, padahal BOM dan stok tak berubah karenanya — angkanya baru bergerak setelah ½ detik, gejala yang persis kita hindari saat menolak tombol "Hitung". Diperbaiki: server dipanggil untuk target saja, lebihan dijumlahkan + status stok dihitung ulang saat render, jadi seketika. **Fix 2 —** `useForm<PoFormInput, any, PoInput>` satu-satunya `any` di seluruh form aplikasi; diganti `unknown` (slot `TContext`, tak dipakai). Yang sudah benar dan mudah luput: rumus menambahkan lebihan **setelah** toleransi persen dan **setelah** agregasi multi-baris BOM — lebih tepat dari plan saya yang menaruhnya per baris; `enabled` di hook menjaga kondisi yang sama dengan guard service; `keepPreviousData` mencegah tabel berkedip; `getEstimasiBahan` tetap memakai `jumlahTarget + lebihanPcs` supaya PO lama yang terlanjur punya lebihan varian tidak berubah angkanya. `WoForm.tsx` tidak disentuh — `targetCutting` kini = target polos, sesuai Excel klien. **Terverifikasi browser 21 Sep** — PO uji `PO-2026-0002` (Malabar, target 10 pcs Hijau/M): blok Estimasi muncul sendiri tanpa klik (BOM-202609-0006 v2, 20 baris bahan, badge stok); Lebihan Benang Tambang diisi 5 → Total `5 Pcs` jadi `10 Pcs` **seketika saat mengetik**, membuktikan fix 1; simpan → 1 baris di DB (baris nol tidak ikut, filter `>0` bekerja); edit → nilai termuat kembali, diubah jadi 3 → tetap 1 baris (delete-then-insert benar); `audit_log` mencatat CREATE 5 → UPDATE 3; halaman detail menampilkan 5+3=8 Pcs; **regresi WO Cutting aman** — `Isi dari PO` pada PO-2026-0001 keluar 62/42/52 (target + `lebihanPcs` 2 milik PO lama), jadi kolom tersembunyi tetap dihormati untuk data lama. Tabel `Target per SKU` di detail tinggal 3 kolom. PO uji sudah dihapus dari dev setelah verifikasi (jejaknya tetap di `audit_log`).
- **2026-09-21 (13)** — Planning Gelombang K: `app-1u2w` di-plan+prompt, siap Antigravity. **Arah berubah dua kali malam ini, dan pembatalannya yang paling penting dicatat.** Penggalian Excel klien (24 sheet PO, 3 produk, Juni–Agustus) menemukan Lebihan tercatat **per bahan** dengan angka identik lintas produk — menggoda dijadikan kolom default di master bahan, dan rencana itu sempat disusun. Dibatalkan setelah membaca `app-itl4`: klien sudah menyatakan 18 Sep bahwa keteraturan itu **kebiasaan manual, bukan aturan**, dan mereka menolak auto-suggest. Jadi bentuknya **tabel `po_produksi_lebihan_bahan` diisi manual per PO**. Repo klien diperiksa juga sebagai pembanding — tidak ada BOM, bahan, maupun lebihan sama sekali (seluruh state satu JSON blob), jadi tak ada yang bisa ditiru. **Task 1 (migration) dieksekusi Claude via MCP ke dev DAN prod** supaya tidak tertinggal seperti `app-gtf4.1`; `schema.ts` ter-update, `tsc` 0 error. Keputusan desain lain: lebihan varian **disembunyikan lewat konstanta**, bukan di-comment-out (kode terkomentari tak ikut type-check → busuk) dan bukan dihapus; preview pakai **debounce 500ms**, bukan tombol "Hitung" (tombol melimpahkan kerja ke user dan bisa menampilkan angka basi); rumus tetap **satu sumber** di `lib/produksi/estimasi.ts`, tidak disalin ke frontend. Efek samping yang sengaja diterima: `WoForm.tsx:82` `targetCutting = target + 0`, jadi rencana cutting = target — sesuai Excel klien yang memang tak punya konsep "potong jaket ekstra".
- **2026-09-21 (12)** — Bersih-bersih backlog: `app-itl4` ditutup & dilipat ke `app-1u2w` (`[DILIPAT app-1u2w]` di akhir judul, pola hub), dan dua catatan roadmap dibetulkan — `app-gy84` ditulis "belum disentuh" padahal sudah ditutup Abu hari yang sama (diparkir, bukan dikerjakan: dokumentasi Tahap 2 sedang dipertimbangkan ulang). Header status ikut dikoreksi. **Backlog OIMS kini 3 kartu:** `app-1u2w` (seluruh Gelombang K), `app-6rc5` + `app-05i4` (migrasi & reset prod, sengaja paling akhir).
- **2026-09-21 (11)** — `app-gtf4.4` selesai — **epic `app-gtf4` tuntas, kelima anaknya closed.** 22 file, `tsc` 0 error, 1 bersih-bersih saat review (field `ukuran` ditambahkan ke `getBahanBomAktif` tapi satu-satunya pemanggilnya cuma memetakan `bahanId`+`hargaSatuan` — dibuang). Yang sebenarnya diperbaiki bukan tampilan melainkan **data yang sudah salah dan tak terdeteksi**: BH-TR-SLG-005/009/010 menulis 24, 30, dan 32 inch dengan cm yang sama persis (66cm) — mustahil, dan tak ada yang bisa mengeceknya selama angka itu cuma teks di dalam nama. Kini 61/76/81cm di kolom sendiri, dan enam bahan bernama sama "Vision GMC No5" akhirnya punya pembeda (24–34 inch, semua unik). 16 dari 61 bahan terisi, 9 dropdown menampilkannya. **Regresi yang dijaga:** `bomDetail.berlakuUkuran` utuh (24 baris, `L,XL` dst masih ada) — `bahan.ukuran` itu dimensi fisik, `berlakuUkuran` itu ukuran baju, dua hal beda dan komentar `schema.ts:504-506` menegaskannya. **Koreksi catatan roadmap sendiri:** baris lama menulis "BUKAN field baru di master bahan", padahal justru kolom itu yang dibuat — arahnya berubah setelah angka resleting terjawab. Dua dropdown `qc/pemeriksaan` & `qc/standar` yang masih polos sengaja dilewati: isinya Bagian Produk, bukan bahan. Belum diverifikasi visual. Ditulis juga **Gelombang K** — hasil penggalian Excel klien + repo klien malam ini, termasuk pembatalan rencana "lebihan default di master bahan" karena `app-itl4` sudah merekam klien menolak auto-suggest.
- **2026-09-21 (10)** — `app-z4wp` poin 1 selesai + checklist direvisi total. **Poin 1:** Kategori/Satuan/Warna/Bahan jadi 1 halaman 4 tab, route lama jadi redirect, link dashboard diarahkan ulang. Jebakan utama dihindari — reuse `Table` bukan `PageClient`, jadi PageHeader tetap satu. **Supplier dikeluarkan** atas keputusan Abu: dia penjual bahan, sementara vendor/penjahit penyedia jasa, jadi dikelompokkan menurut jenis pihak lebih mudah ditebak. Keberatan saya (menambah supplier dari form Barang Masuk jadi perlu pindah grup) gugur setelah diperiksa — bedanya satu klik, dan hanya saat ada supplier baru. **Checklist direvisi:** Abu melihat heading "DATA BAHAN" kini menaungi satu entri saja dan mengusulkan Produk+BOM digabung juga. Dua keberatan lama saya gugur: berversi bukan alasan (tab hanya mengganti isi layar, alur versi tetap utuh), dan halaman anak tidak menghalangi (yang digabung cuma daftarnya). Enam poin lama jadi empat: poin 2 = Master Data 12 entri → **4 halaman tanpa heading** (menggabungkan poin 3 & 5 lama), poin 3 = Laporan, poin 4 = QC + Surat Jalan. Tiga plan ditulis, prompt poin 2 siap. Bagian baru yang belum pernah ada: **tab difilter per role** — BOM/Tarif/Standar QC/Bagian Produk dibatasi produksi, tabnya disembunyikan dan datanya dibungkus `opsional()` supaya halaman tak crash. Surat Jalan diverifikasi dirujuk **dua alur** (jahit + dekorasi), jadi menaruhnya sebagai tab di Pengiriman perlu diputuskan dulu — kalau ragu, dilewati.
- **2026-09-21 (9)** — `app-gtf4.2` selesai. 18 file diubah + 4 baru: master Bagian Produk (page + 3 komponen + service + Zod + hook), tiga kolom teks jadi dropdown, entri nav. Yang membuktikan prompt bekerja: **kesebelas file UI/schema yang saya daftar eksplisit semuanya disentuh** — 7 typecheck error hanya menunjuk 3 service, jadi tanpa daftar itu form dan tampilannya akan tertinggal sementara typecheck sudah hijau. Yang benar dan mudah luput: `leftJoin` di ketiga service (kalau `innerJoin`, baris ber-FK NULL akan hilang dari daftar), `?? "—"` untuk nilai kosong, filter `isActive`, dan `'\\D'` di regexp. **Partial unique index diuji langsung** — soft-delete BP-10 lalu insert kode sama berhasil, dua baris hidup berdampingan. **1 fix review:** entri nav dibuat tanpa `roles` sementara halamannya dijaga `bolehAkses(['owner','admin_produksi'])`, jadi gudang melihat menunya lalu ditolak — ketimpangan menu-vs-server yang persis dihindari di `app-qr6o`. **Koreksi prompt saya:** saya menyuruh pakai `generateDocNumber`, padahal itu untuk nomor transaksi `[TIPE]-YYYYMM-NNNN`, bukan kode master. Antigravity membuat generator `BP-NN` sendiri, dan itu yang benar. Epic `app-gtf4` tinggal `.4` yang menunggu jawaban Ucup.
- **2026-09-21 (8)** — `app-gtf4.3` selesai, dikerjakan Claude langsung. Abu melihat tabel Master Produk masih menampilkan kolom Kategori/Brand/Jenis berisi `—` semua (kolomnya sudah hilang dari DB, kodenya belum) dan minta sekalian dibereskan. 7 file: `ProdukTable` (3 definisi kolom — ini yang terlihat di layar, dan justru file yang belum tercatat di plan), `ProdukFormModal` (prop, defaultValues, reset, seluruh blok 3 Input), `ProdukPageClient` (helper `saran()` + 3 prop), `ProdukDetailClient` (3 InfoItem + grid 6→3 kolom), Zod schema. Terverifikasi di browser: tabel bersih, form tinggal 5 field, simpan produk baru berhasil, dan **regresi Laporan Stok dicek** — filter kategori masih jalan karena itu `bahan.kategoriId`, hal yang berbeda meski namanya mirip. 10 error milik issue ini habis; sisa 7 murni `app-gtf4.2`.
- **2026-09-21 (7)** — `app-qdqu` dikerjakan + migrasi MCP untuk 2 issue berikutnya. **app-qdqu:** 12 halaman `/baru` & `/edit` crash dengan overlay Runtime Error saat role tak berhak membukanya. Ternyata semuanya **sudah punya** `requireRole` eksplisit — kebijakannya benar, yang salah cara menolaknya. Jadi fix cukup satu titik: helper `bolehAkses()` (mengembalikan boolean, tidak melempar) + komponen `AksesDitolak` yang meniru pola `not-found.tsx`. Nol daftar role diubah, `WRITE_ROLES` di 18 service tidak disentuh. Terverifikasi sebagai Staf Gudang 1: `/vendor/penugasan/baru` menampilkan pesan + tombol keluar, `/vendor/penerimaan/baru` tetap membuka form — dan yang kedua sekaligus memperlihatkan hasil `app-gtf4.1` di layar (Penerima = dropdown petugas gudang, Pengirim vendor = teks). **Migrasi MCP dev + prod** untuk `app-gtf4.2` (tabel baru `bagian_produk` + 10 isian awal, 3 kolom FK, buang 3 kolom teks) dan `app-gtf4.3` (buang `kategori`/`brand`/`jenis` dari produk). Diverifikasi sebelum tiap `DROP COLUMN`: prod ketiga kolom QC seluruhnya NULL, produk hanya satu nilai seragam, dan 2 baris `jenis_cacat` milik klien tetap utuh. Menyisakan **17 typecheck error yang disengaja** sebagai peta kerja (10 untuk `.3`, 7 untuk `.2`) — termasuk `ProdukTable.tsx` yang belum tercatat di plan, ditemukan justru dari error itu. Prompt gabungan `.2`+`.3` ditulis, dan prompt `app-z4wp.1` (18 Sep) disegarkan karena menyebut `requireRole` yang polanya sudah berganti.
- **2026-09-21 (6)** — `app-gtf4.1` selesai, **0 error, tanpa fix review**. 18 file: 3 schema Zod, 4 service, 10 komponen/halaman, plus `listUserOptions()` baru. Tiga kolom jadi FK ke `users`/`vendor`/`penjahit`, tiga kolom pihak vendor tetap teks — tidak ada yang tertukar (dicek lewat `information_schema`). DB CHECK `bundling_tujuan_tunggal` nol pelanggaran, dan join mengembalikan nama master sungguhan (`BND-202609-0002` → "CV Jahit Cibaduyut"). Browser gagal dua kali, jadi verifikasi lewat DB + pembacaan kode — untuk issue yang intinya relasi data, itu justru lebih tepat daripada melihat layar. Satu kecurigaan saya gugur saat dicek: `listUserOptions` sempat terlihat terlalu longgar (mengizinkan keuangan & viewer), ternyata `READ_ROLES` halaman pemanggilnya memang memuat keduanya. **Prod belum dimigrasi.** Juga di-plan hari ini: `app-gtf4.2` (jenisKerusakan → master + tabel baru `bagian_produk` berisi 10 isian awal) dan `app-gtf4.3` — yang berubah arah total setelah ditelusuri: ketiga kolom `kategori`/`brand`/`jenis` ternyata **tidak dipakai query mana pun**, asalnya placeholder plan 2 Sep ("upgrade kalau owner minta" — owner tak pernah minta), `brand` tak ada di aplikasi lama klien, dan `kategori`/`jenis` isinya tertukar arti. Keputusan Abu: **hapus ketiganya**, bukan dibuatkan master.
- **2026-09-21 (5)** — Batch B selesai (2 issue). `app-fbra` lolos tanpa fix — peringatan amber di form Template Dekorasi + badge di tabel, Simpan tetap aktif (peringatan bukan larangan), terbukti di baris HBK Hidden Black yang memicu issue. `app-qr6o` butuh 2 perbaikan: **(1) Task 5 dilewati** — infrastruktur filter lengkap dan benar, tapi `grep "roles:"` di NAV_DATA = **0**, jadi semua menu tetap lolos dan hasilnya identik dengan sebelum perubahan. Bukan salah eksekusi: plan saya menulis "jangan mengarang", dan Antigravity patuh dengan tidak mengisi sama sekali. Diisi saat review, diturunkan dari yang sudah dienforce server. **Koreksi data yang mengubah keputusan:** ekstraksi pertama saya cuma menangkap konstanta `READ_ROLES` lalu menyimpulkan "viewer tak diizinkan di mana pun" — SALAH, viewer diizinkan lewat `requireRole([...])` inline di stok/mutasi/laporan/bahan/barang-masuk/barang-keluar. Kalau diisi berdasar peta pertama, viewer kehilangan akses yang server justru berikan. **(2) Bug desain** yang ketemu lewat pengujian: `roles` di subitem tak pernah terpakai kalau induknya menyaring habis — "Biaya Jasa Jahit" (keuangan) mati karena induk "Vendor & Gudang" tak memuat keuangan; sama untuk Packing/Stok Jadi terhadap gudang. Diperbaiki: roles induk = union anak-anaknya, subitem yang lebih sempit dibatasi eksplisit. Hasil terukur: owner 11 grup, produksi 10, gudang 7 (QC muncul tapi isinya hanya Packing + Stok Jadi), keuangan 6 (Vendor & Gudang hanya Biaya Jasa Jahit), viewer 5. Prinsipnya: **sidebar mencerminkan server, tidak lebih ketat tidak lebih longgar** — 10 master tanpa `requireRole` sengaja dibiarkan terbuka karena menyembunyikannya hanya ilusi (URL tetap jalan).
- **2026-09-21 (4)** — Batch A selesai (4 issue, Antigravity + review Claude, terverifikasi browser). `app-823x` NumberInput draft sinkron, `app-egkt` hook `useModalBehavior` di 2 modal (50 file pemakai), `app-n5fy` reset `e.target.value`, `app-46vb` tombol clear + keyboard nav di ComboSelect & MultiSelect. **2 fix saat review, keduanya salah di PLAN saya bukan eksekusi Antigravity:** (1) `useModalBehavior(open && !loading, ...)` bikin scroll lock lepas + fokus kabur ke belakang backdrop begitu proses hapus mulai, padahal dialog masih tampil — dipisah jadi `open` (terlihat) vs `closable` (boleh ditutup); (2) `onClose` arrow baru tiap render di deps array bikin effect pasang-lepas terus, dan tiap lepas merebut fokus user — disimpan di ref. Saya sempat menandai yang kedua "kalau mau rapi" di plan; ternyata bug. 1 fix lagi murni temuan review: `navigable` ComboSelect dihitung dari `filtered` polos padahal panel merender per grup — urutan keyboard beda dari urutan tampilan (MultiSelect sudah benar, ComboSelect tidak; 0 pemakai ber-grup jadi belum menggigit). Verifikasi browser membuktikan yang paling penting: ketik `12,5` koma bertahan (regresi paling berbahaya tidak terjadi), dan klik × di PB membersihkan PO sekaligus memunculkan validasi — jalur defensif di `BarangKeluarForm` yang komentarnya menyebut "belum bisa dipicu" akhirnya hidup. Jalur asli `app-823x` di `/vendor/dekorasi/baru` tak bisa diuji (dropdown WO kosong — itu justru kondisi `app-fbra`), jadi dibuktikan lewat form Barang Keluar + simulasi node. Typecheck 9 error, semua milik `app-gtf4.1`, nol regresi.
- **2026-09-21 (3)** — Audit komponen UI + planning batch 6 issue (Gelombang J). Dipicu satu bug ComboSelect di review app-glx1: kalau satu komponen menyimpang dari spec industri, apa lagi? Audit `src/components/ui/` menemukan 5 temuan. **Disaring, bukan semua dinaikkan jadi aturan** — 3 naik ke `ui_conventions.md` vault (§12c input angka draft, §12d modal Escape/focus/scroll, §12b diperluas ke MultiSelect + keyboard), 2 cukup jadi beads karena belum menggigit (DateInput 6 pemakai halaman datar, SingleSelect 0 pemakai). Yang paling serius `app-823x` (P1): NumberInput menampilkan ketikan lama saat `value` diubah dari luar — 32 file, angka uang/stok bisa tersimpan beda dari yang terlihat **tanpa gejala**, dan jalurnya terverifikasi nyata di DekorasiForm (dropdown ber-`preventDefault` sengaja mencegah blur). **Koreksi diagnosis:** audit awal keliru menuduh `handleSelect` ComboSelect salah — dibaca langsung, cabang single sudah benar; yang hilang cuma tombol clear. Aturan vault + deskripsi beads sudah dibetulkan supaya tak menyesatkan. 6 issue di-plan+prompt jadi 2 batch (A komponen, B halaman). `app-qr6o` dipersempit ke **menu saja** atas keputusan Abu — temuan sampingannya: tak ada `middleware.ts` dan guard halaman tak merata (`inventory/stok` nol), jadi sembunyikan menu ≠ proteksi; dicatat di CLAUDE.md § Utang Teknis. Juga ditulis aturan global baru di `~/.claude/CLAUDE.md`: subagent mewarisi model induk kalau `model` tak diisi — wajib diisi eksplisit, explorer cukup Sonnet.
- **2026-09-21 (2)** — app-glx1 selesai: Antigravity eksekusi Task 2-5, direview Claude. 10 file (8 sesuai plan + 2 helper `listActivePoOptions` & `poId` di PB yang memang dibutuhkan dropdown). Kualitas rapi — guard PB↔PO terpasang persis, `requireRole` + filter soft-delete di helper baru, `ComboSelect` pakai objek error sesuai API komponen. 1 fix review: saat PB dikosongkan, `poId` tidak ikut dibersihkan sehingga PO warisan PB lama nyangkut tanpa disadari user. Typecheck: 4 error milik issue ini hilang, sisa 9 murni milik app-gtf4.1.
- **2026-09-21** — Planning batch integritas data: 2 issue di-plan+prompt setelah jawaban klien lengkap (app-gtf4.1 sambung pengirim/penerima ke master GH #21, app-glx1 barangKeluar→PO GH #20). **DB migration kedua issue sudah dieksekusi Claude via MCP** (dev `fzkszkhjswtcugrqjzgx`): 4 kolom teks dibuang, 5 kolom FK baru + 1 CHECK + 3 index. `schema.ts` ter-update, menyisakan 13 typecheck error yang SENGAJA — itu peta kerja Antigravity (9 untuk gtf4.1, 4 untuk glx1), nol kejutan di luar file target. Keputusan kunci: pengirim/penerima = staf internal (bukan penjahit), tempat jahit 1 daftar tapi bentuk kolom tetap 2 (ikut pola `penugasanJahit`, siap kalau nanti pakai CV), dan hanya 3 dari 6 kolom jadi FK — 3 sisanya orang pihak vendor, sengaja tetap teks. Dari 9 pertanyaan klien: 7 terjawab tuntas, 2 (angka resleting, Lebihan Pcs) kena salah paham dan disusun ulang.
- **2026-09-18 (5)** — Epic app-z4wp dibuat: gabung menu master data jadi tab (4 anak, lihat Gelombang I). app-z4wp.1 (Data Bahan) di-plan lengkap + GH #19, siap eksekusi Antigravity. app-z4wp.2-4 dicatat cakupannya, belum di-plan detail. Bonus fix: app-g23s — regex `\D` di 3 fungsi generate kode (lokasi/vendor/penjahit) kehilangan backslash lewat postgres.js sql tagged template, fix `\\D`, diverifikasi via node script langsung.
- **2026-09-18 (4)** — app-bvre selesai + direvisi: Antigravity eksekusi Opsi A (colSpan) sesuai plan, Abu screenshot hasilnya dan nilai kurang (data hilang total, bukan "buram+spinner"). Claude revisi ke Opsi B: `<TableCell className="absolute inset-0">` — `<tr>` sudah `position:relative` jadi otomatis containing block, overlay melebar ke seluruh row tanpa hitung lebar kolom manual. Kekhawatiran sticky/pinned column (alasan awal tolak Opsi B) ternyata tak relevan — dicek ulang, nol tabel pakai sticky aktif. Terverifikasi visual `/produksi/permintaan-bahan`. 1 file `table.tsx`, otomatis berlaku 16+ tabel.
- **2026-09-18 (3)** — app-bvre di-plan: row loading overlay desktop tak konsisten dengan mobile (cuma kolom No. jadi spinner kecil, bukan overlay 1 spinner di tengah baris). Opsi A dipilih Abu: `<TableCell colSpan>` menggantikan seluruh baris saat loading (kolom No. ikut hilang), reuse rumus colSpan yang sudah ada di file yang sama. 1 file (`table.tsx`), otomatis berlaku ke 16+ tabel. GH #18, plan+prompt siap eksekusi Antigravity.
- **2026-09-18 (2)** — app-7u06 dieksekusi Antigravity + direview Claude: row highlight `getRowLoading` di 16/18 tabel (13 reuse pendingId, 3 pola BomTable). 2 penyimpangan ditemukan saat review: AuditLogTable dapat state loading yang gak pernah kelihatan (modal instant, bukan navigasi) — dihapus; KarantinaPageClient terlewat Antigravity — ternyata bukan kandidat sama sekali (bukan DataTable, icon Eye cuma toggle expand) — kesalahan di plan, bukan eksekusi. Bonus fix: WoQcTable tombol "Catat hasil QC" gak ke-highlight + belum pernah dapat icon-spinner app-9bkl. Typecheck pass. Epic Gelombang H: 5/9 selesai.
- **2026-09-18** — Planning + eksekusi Gelombang H: 4 issue selesai & commit (app-vhaa sidebar fix, app-9bkl+app-9g1l loading indicator 28 file total, app-gtf4.5 audit 14 kolom teks vs master). app-7u06 di-plan ulang (cakupan 7→18 file, verifikasi kode), plan+prompt+GH #17 siap eksekusi Antigravity. app-gtf4.1/.4 tertahan jawaban klien — insight ditulis di `docs/insight-bisnis/` (Konveksi vs Vendor/Penjahit, audit kolom teks). 5 kartu backlog lama diparkir (app-abz, oims-ckp.16, oims-eba.14, app-616, oims-rcr) dengan suffix `[PARKIR]`.
- **2026-09-10 (3)** — **TAHAP 4 KODE SELESAI**: 4B (standar QC berversi + WO QC/sampling + hasil QC per varian + temuan cacat), 4C (rework dua jalur guard bersama + Re-QC + karantina reject ber-approval), 4D (finishing + packing checklist ter-guard + barang jadi stok immutable + transfer 2-fase + penyesuaian + rumus yield/COPQ). 15 issue inti closed, epic `oims-ckp` closed. 3 migration via MCP, 20 tabel baru, 10 route `/qc/*`, tsc + build clean, verifikasi SQL tiap gelombang. Aturan kritis yang dijaga: rumus keseimbangan grade tiga lapis (Zod + Server Action + DB CHECK), guard kapasitas rework satu fungsi untuk dua jalur, approval gate sebelum tindakan reject/penyesuaian berdampak, stok barang jadi immutable (satu-satunya penulis kuantitas di `lib/qc/stok-fg.ts`). COPQ mengembalikan null untuk komponen tanpa sumber (Tahap 5 skip), bukan 0. **Belum smoke test end-to-end** — perlu sesi tersendiri.
- **2026-09-10 (2)** — Eksekusi Tahap 4A oleh Claude (lanjut di sesi planning, permintaan Abu): `oims-ckp.2` master jenis cacat + kemasan, `oims-ckp.3` master gudang barang jadi (isDefault tepat satu dalam transaksi), `oims-ckp.4` penerimaan QC + antrean DERIVED (guard sisa dihitung ulang di transaksi; vendor ber-qcMode `vendor` dilewati). 3 issue closed, 3 commit, 5 route baru, tsc + build clean. Verifikasi lewat SQL: kirim 25/30 → sisa 5 · qc_mode=vendor → 0 baris antrean · soft delete → sisa balik 30 · hapus+buat ulang kode sama berhasil · duplikat aktif ditolak · 2 gudang default → tetap 1. Berikutnya: 4B (standar QC berversi, WO QC, hasil QC + grade).
- **2026-09-10** — Planning breakdown Tahap 4: epic `oims-ckp` dipecah **17 issue anak** (15 inti + 2 backlog P3) + rantai dependensi. 3 keputusan cakupan dijawab Abu: QC **per varian agregat** (bukan per pcs PRD §11 — hulu T2-T3 semua agregat, app lama sukses tanpa; per-pcs jadi backlog `.16`), finishing/packing **modul penuh** (gap terbesar PRD, dijanjikan klien), stok barang jadi **tabel + mutasi sendiri** pola immutable stok bahan (kunci komposit SKU+grade+gudang+batch). Gelombang 4A (`.2` master jenis cacat+kemasan, `.3` master gudang, `.4` penerimaan QC + antrean derived) di-plan+prompt; migration `tahap4a_master_qc_gudang_penerimaan_qc` applied via MCP (6 enum + 5 tabel, unique index semua PARTIAL — diverifikasi query), schema.ts + document-number.ts ter-update, tsc clean. Checklist review Tahap 4 (18 poin) masuk skill oims-review. Koreksi: proyek TIDAK punya DB trigger cache stok — di-maintain dalam Server Action transaction + SELECT FOR UPDATE; issue `.13` dikoreksi. Siap eksekusi Antigravity (urutan `.2` → `.3` → `.4`).
- **2026-09-03** — Tahap 3 SELESAI: 13 issue inti dieksekusi Claude (3A master vendor/lokasi/penjahit + tarif berversi, 3B penugasan + pengiriman + surat jalan, 3C penerimaan bertahap + selisih + retur, 3D biaya jasa + WIP 7 label derived + dekorasi). Smoke test 6 langkah lolos (browser + SQL); 2 bug ketemu & di-fix (render loop form penerimaan `735bcee`, Date di raw sql bikin /vendor/wip 500 `24dcb1a`) — bukti build clean ≠ verifikasi. Epic oims-eba closed. Dashboard: kartu per-tahap diganti ALUR PRODUKSI lintas tahap.
- **2026-09-02 (4)** — Tahap 2 SELESAI (2D, Claude): sisa bahan → mutasi retur_masuk, limbah + nilai kerugian, bundling + guard hasil + label print, WIP derived + ringkasan produksi. Epic oims-5yr closed (13/13). Pending: QR label (package qrcode), grafik T2 (nunggu data). Berikutnya: breakdown Tahap 3 (oims-eba, sesi baru).
- **2026-09-02 (3)** — Eksekusi Tahap 2C (Claude): penerimaan cutting, WO cutting 7 status, pemakaian bahan aktual (rekonsiliasi PRD §14 — gap terbesar app lama), hasil cutting bertahap + rekap. oims-5yr.7-10 (GH #15). Sisa Tahap 2: bundling + WIP (5yr.11-13).
- **2026-09-02 (2)** — Eksekusi Tahap 2A+2B langsung oleh Claude (deviasi Antigravity, permintaan Abu): master produk, varian+SKU, BOM berversi, PO produksi + approval + snapshot BOM, estimasi kebutuhan bahan, permintaan bahan + integrasi barang keluar. 6 issue closed (oims-5yr.1-6), GH #11-14. Bonus: mobile default view tabel (oims-cd5). Route baru: /produksi/{produk,bom,po,permintaan-bahan}.

- **2026-09-02** — Planning breakdown Tahap 2: epic `oims-5yr` dipecah 13 issue anak (`oims-5yr.1-13`) + rantai dependensi. Wave 2A (master produk, varian, BOM) di-plan+prompt (GH #11-13) + migration DB applied via MCP (`produk`, `varian_produk`, `bom`, `bom_detail`) + schema.ts. Checklist review Tahap 2 ditambah ke skill oims-review. Siap eksekusi Antigravity.

- **2026-08-08** — Planning Gelombang D (import batch Excel): 2 issue di-plan+beads+prompt (oims-jpn.15 infra+master flat, oims-jpn.16 bahan FK). Format .xlsx SheetJS, all-or-nothing, import murni insert. Siap eksekusi Antigravity (jpn.15 dulu → jpn.16).
- **2026-08-08** — Gelombang C (mobile polish batch 2) hampir kelar. oims-ghs (splash PWA), oims-6c3 (toggle ke atas), oims-76v + oims-xlp (export CSV layout), oims-8i9 (FAB + search compact) DONE. Bugfix oims-59w: scroll reset toggle Kartu/Tabel — root cause = focus-scroll (kebab card curi fokus → browser auto-scroll), fix scroll-lock 250ms di useLayoutEffect (insight ke memory). oims-y5k (card highlight bg) selesai. Skill baru `oims-plan` (orchestrator sesi planning: new-feature-workflow → roadmap). Berikutnya: Gelombang D import batch Excel.


- **2026-08-08** — Mobile UI polish batch (oims-xlp/6c3/76v/8i9/ghs) selesai. Toggle Kartu/Tabel dipindah ke atas toolbar (6c3). Search compact + FAB button Tambah mobile (8i9). Export CSV sejajar filter 2-kolom di laporan barang masuk/keluar (76v) + mutasi (xlp). Card highlight bg abu (y5k). Splash screen PWA 1.2s + fade (ghs). Pola baru terdokumentasi di docs/claude/ui-components.md.

- **2026-08-07** — oims-lkw.2 selesai. Master warna CRUD (partial unique index soft-delete safe, audit log, tiru pola kategori). FK warnaId nullable di bahan. ComboSelect warna di form bahan + kolom Warna di tabel. Nav Warna masuk Master Data. Migration applied via Supabase MCP. GELOMBANG B (feedback owner) SELESAI.

- **2026-08-07** — oims-lkw.3 selesai. Riwayat harga di form barang masuk: getRiwayatHargaBahan (5 terakhir), DetailRow per-row komponen untuk hook, hint 2 terakhir di bawah field harga + klik auto-fill. BarangKeluarForm UI polish mobile (card wrapper). Metode weighted-avg tak berubah.

- **2026-08-07** — oims-lkw.4 selesai. DeltaBadge (TrendingUp/Down/Minus + % vs periode lalu) di kartu Masuk/Keluar AktivitasTransaksi. getPreviousDateRange JS-side (durasi sama digeser mundur), subquery prev ikut 1 round-trip. Guard prev=0. Berikutnya: lkw.2 (master warna).

- **2026-08-07** — oims-g05.8 selesai. CardKebabDropdown di table.tsx: MoreVertical trigger pojok kanan card, TableActionsVariantContext.Provider inject variant=menu, DropdownClose bungkus item aksi. Desktop table tak berubah. GELOMBANG A (mobile app-like polish) SELESAI.

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
