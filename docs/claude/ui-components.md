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

## DataTable — pola mobile (WAJIB baca sebelum bikin/edit tabel)

### Toggle Kartu/Tabel

Toggle view (Kartu|Tabel) di-render **di dalam `DataTable`**, bukan di toolbar. Urutan DOM mobile:

1. Toggle Kartu/Tabel pill (di dalam DataTable, `sm:hidden`, selalu paling atas)
2. `children` (toolbar search + filter — via `<TableToolbar>`)
3. Card view / Table view

Jangan re-order dengan CSS — sudah di-handle di `DataTable`. Scroll di-reset ke atas tiap toggle (scroll-lock 250ms via `useLayoutEffect`).

### Toolbar mobile: search + ColumnToggle sejajar

```tsx
<TableToolbar>
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <TableSearch table={table} placeholder="Cari..." className="flex-1 sm:w-64" />
    <ColumnToggle table={table} className="shrink-0" />
  </div>
  <Button onClick={onAdd} className="hidden sm:inline-flex">+ Tambah X</Button>
</TableToolbar>
```

`Button` Tambah pakai `hidden sm:inline-flex` di desktop — di mobile digantikan FAB.

### FAB (Floating Action Button) — button Tambah mobile

Halaman yang punya aksi "Tambah" pakai **FAB pojok kanan bawah** di mobile (di atas bottom nav), bukan button full-width di toolbar:

```tsx
// Import: import { Plus } from "lucide-react"
<DataTable
  table={table}
  showRowNumber
  mobileFab={
    <Button onClick={onAdd} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
      <Plus size={24} />
    </Button>
  }
/>
```

`mobileFab` di-render fixed `bottom-20 right-4 z-40` (di atas bottom nav 80px) — hanya tampil di mobile (`sm:hidden`). Berlaku untuk semua halaman master + inventory yang punya tombol buat transaksi baru.

### Export CSV mobile: sejajar filter (grid 2 kolom)

Button Export CSV di halaman laporan: lebar setengah (`flex-1`), sejajar dengan filter pertama dalam **grid 2 kolom**:

```tsx
<div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center">
  <ComboSelect variant="filter" placeholder="Semua X" ... className="w-full sm:w-40" />
  <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">Export CSV</Button>
</div>
// DateInput from/to tetap di baris terpisah di bawah
```

Desktop: flex biasa, tidak berubah.

### Card highlight — wrapper abu

Field `mobileRole: "highlight"` di card mobile dibungkus bg abu oleh `DataTable` secara otomatis:
`rounded-md bg-gray-1 dark:bg-dark-2 px-2 py-1 text-sm font-medium text-dark dark:text-white`
Tidak perlu custom per halaman.

## PWA Splash Screen

`src/components/PWA/index.tsx` — `SplashScreen` tampil saat cold load (1.2s + fade 500ms out).

- Gradient bg: `bg-linear-to-b from-[#1a56db] to-[#1e40af]`
- Logo: `/icons/icon-192.png` (h-24 w-24 rounded-[22px])
- Loading: 3 dots `animate-bounce` delay 0/150/300ms
- Tampil di semua browser (bukan PWA-only), tapi singkat

## Referensi cepat komponen UI

| Komponen | File | Untuk |
|---|---|---|
| PageHeader | `ui/PageHeader.tsx` | Judul + breadcrumb halaman (desktop) |
| Breadcrumb | `ui/Breadcrumb.tsx` | Trail navigasi |
| Button, Input, Select, ComboSelect, MultiSelect | `ui/` | Form |
| ConfirmDialog, Tooltip, Spinner, Checkbox | `ui/` | — |
| DataTable + hooks | `ui/table/` | Tabel |
