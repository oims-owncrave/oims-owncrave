# UI Components & Conventions — OIMS Owncrave

> Aturan repo untuk komponen UI reusable. Semua dev + AI executor (Antigravity) WAJIB baca sebelum bikin/edit halaman. Tujuan: konsistensi tampilan, terutama desktop vs mobile.

## PageHeader — judul + breadcrumb tiap halaman (WAJIB)

**Komponen:** `src/components/ui/PageHeader.tsx`

Tiap halaman (`page.tsx`) pakai `<PageHeader>` untuk judul + breadcrumb. **JANGAN** tulis `<h2>` judul manual di page.

```tsx
import { PageHeader } from "@/components/ui/PageHeader";

<PageHeader
  title="Stok Bahan"
  breadcrumb={[{ label: "Inventory" }, { label: "Stok Bahan" }]}
/>
```

**Kenapa:**
- `PageHeader` **desktop-only** (`hidden min-[850px]:flex`). Di mobile (< 850px), judul di-handle `MobilePageHeader` (sticky top, dari header layout) — lihat bawah. Kalau pakai `<h2>` manual, judul dobel di mobile (header mobile + h2 halaman).
- Konsisten: judul + breadcrumb seragam semua halaman.

**Props:** `title` (wajib), `breadcrumb?` (array `{label, href?}`), `className?`, `children?` (mis. tombol aksi di sebelah judul).

## Header mobile app-like (otomatis, jangan diutak-atik per halaman)

Header mobile (< 850px) di-handle di level layout (`src/components/layouts/header/`), BUKAN per halaman:

- **`/dashboard`** → `MobileHomeHeader` — greeting card gradient (avatar inisial + nama + role + tombol Settings).
- **Halaman lain** → `MobilePageHeader` — judul dinamis (dari `getPageTitle(pathname)` di `sidebar/data`) + back-arrow (muncul kalau route dalam, `segments.length > 2`), sticky top.

**Implikasi untuk halaman baru:**
- Judul mobile OTOMATIS dari `NAV_DATA` (lewat `getPageTitle`). Pastikan route halaman baru terdaftar di `NAV_DATA` (`sidebar/data/index.ts`) supaya judulnya benar.
- Pakai `PageHeader` untuk judul desktop. Mobile tak perlu apa-apa (layout handle).

## Card grid responsive (mobile 2 kolom)

Grid card (StatCards, SummaryCard) pakai **2 kolom dari mobile**, bukan 1:

```tsx
// ✅ benar
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
// ❌ hindari — 1 kolom di HP bikin scroll panjang
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

Value angka: `text-lg ... lg:text-xl` (mobile lebih kecil biar angka panjang/Rp tak overflow di card sempit).

## Bottom nav & Menu (mobile, otomatis)

`src/components/layouts/bottom-nav/` — 5 slot (< 850px). Slot **parent** (Master/Inventory/Laporan) buka bottom-sheet child; slot **leaf** (Dashboard) navigate langsung; slot **Menu** = accordion semua section (collapse per parent, reuse pola sidebar). Isi dari `NAV_DATA` — nambah section baru otomatis muncul. Jangan hardcode menu di bottom-nav.

## Tabel

Pakai DataTable kit `src/components/ui/table/`. Lihat `ColumnDef` untuk kolom. (Card view mobile: lihat issue oims-g05.5 kalau sudah selesai.)

## Referensi cepat komponen UI

| Komponen | File | Untuk |
|---|---|---|
| PageHeader | `ui/PageHeader.tsx` | Judul + breadcrumb halaman (desktop) |
| Breadcrumb | `ui/Breadcrumb.tsx` | Trail navigasi |
| Button, Input, Select, ComboSelect, MultiSelect | `ui/` | Form |
| ConfirmDialog, Tooltip, Spinner, Checkbox | `ui/` | — |
| DataTable + hooks | `ui/table/` | Tabel |
