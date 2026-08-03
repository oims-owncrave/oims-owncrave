# Plan: feat — Port DataTable Kit dari PMS

**Issue:** oims-7fr / GH-#<N>
**Date:** 2026-08-03
**Depends:** oims-93g (admin shell — dark tokens sudah ada)
**Blocks:** semua CRUD (jpn.3 UserTable, master data, transaksi, laporan pakai kit ini)

> **KEPUTUSAN:** OIMS pakai DataTable kaya fitur seperti PMS (pagination/search/sort/selection/column-toggle), BUKAN plain HTML table. Port utuh dari PMS, adaptasi v3→v4 + reuse UI kit OIMS.

---

## Context

Antigravity bikin plain `<table>` di jpn.3 (UserTable). Tak sesuai standar projek Abu — PMS/school-management pakai DataTable kit lengkap. Port kit ini jadi `src/components/ui/table/` reusable. Setelah ini, UserTable + semua tabel master/transaksi/laporan pakai `<DataTable>` declarative.

**Sumber (baca dari disk, di luar repo OIMS):**
```
/Applications/XAMPP/xamppfiles/htdocs/aw-miscroservices/portfolio-management-service/apps/frontend/src/components/ui/table/
```
9 file + `use-table.ts` (state hook, 10KB) + dependency `Checkbox`.

---

## ⚠️ Konflik / adaptasi (WAJIB tangani)

### 1. Tailwind v3 → v4
Sama seperti port sidebar (oims-93g). Token (`bg-gray-2`, `text-dark-4`, `border-stroke`, dll) sudah ada di `globals.css` `@theme` — REUSE, jangan bikin ulang. Kalau ada token baru yang dipakai table tapi belum ada → tambah ke `@theme`.

### 2. Dependency `Checkbox` (belum ada di OIMS)
PMS `table.tsx` + `table-selection.tsx` import `@/components/ui/checkbox`. OIMS belum punya. **Port juga** `src/components/ui/Checkbox.tsx` dari PMS (`.../src/components/ui/checkbox.tsx`), adaptasi v4. Simpel (checkbox styled).

### 3. `cn()` — AMAN
OIMS `src/lib/utils.ts` sudah twMerge+clsx. Reuse.

### 4. Tooltip API beda
PMS table pakai `@/components/ui/tooltip` (hover, `children`). OIMS `Tooltip` beda (`trigger`+`children`, click). Di `table.tsx` ada `headerTooltip` pakai Tooltip + HelpCircle. **Sesuaikan**: pakai OIMS Tooltip API atau native `title`. Jangan biarkan import error.

### 5. `manualPagination` / `useServerTable`
`use-table.ts` support server-side pagination (buat data besar mutasi/laporan). Port utuh — dipakai nanti. Kalau ada file `use-server-table.ts` di PMS, cek + port kalau perlu.

---

## Files to Create (port + adaptasi)

| File | Sumber PMS | Catatan |
|---|---|---|
| `src/components/ui/table/use-table.ts` | `use-table.ts` | State hook. Port utuh. Cek juga `use-server-table.ts` kalau ada. |
| `src/components/ui/table/table-primitives.tsx` | sama | Table/Thead/Tbody/Tr/Th/Td styled. |
| `src/components/ui/table/table.tsx` | sama | `<DataTable>` main. Sesuaikan Tooltip. |
| `src/components/ui/table/table-pagination.tsx` | sama | |
| `src/components/ui/table/table-search.tsx` | sama | |
| `src/components/ui/table/table-sorting.tsx` | sama | SortIndicator. |
| `src/components/ui/table/table-selection.tsx` | sama | Butuh Checkbox. |
| `src/components/ui/table/table-column-toggle.tsx` | sama | |
| `src/components/ui/table/table-skeleton.tsx` | sama | |
| `src/components/ui/table/table-toolbar.tsx` | sama | |
| `src/components/ui/table/table-actions.tsx` | sama | Row actions (edit/delete dropdown). |
| `src/components/ui/table/index.ts` | (buat) | Re-export DataTable, useTable, ColumnDef, dll. |
| `src/components/ui/Checkbox.tsx` | `checkbox.tsx` | Dependency baru, adaptasi v4. |

---

## Task 1 — Port Checkbox

Baca PMS `checkbox.tsx`, port ke `src/components/ui/Checkbox.tsx`, adaptasi v4 (dark token). Verifikasi standalone render.

## Task 2 — Port table-primitives + use-table

Fondasi. `table-primitives.tsx` (styled th/td) + `use-table.ts` (state hook, port utuh termasuk manualPagination). Zero UI logic error — ini murni state + styled elements.

## Task 3 — Port sub-komponen

table-search, table-sorting, table-skeleton, table-pagination, table-column-toggle, table-selection, table-toolbar, table-actions. Baca tiap file PMS, port, adaptasi token + Tooltip.

## Task 4 — Port DataTable main (table.tsx)

Komponen utama. Sesuaikan `headerTooltip` ke OIMS Tooltip/native title. Buat `index.ts` re-export.

## Task 5 — Refactor UserTable pakai DataTable

Ganti plain table di `src/components/user/UserTable.tsx` jadi `<DataTable>` dengan ColumnDef:
```typescript
const columns: ColumnDef<User>[] = [
  { key: "email", label: "Username", renderCell: (u) => u.email.split("@")[0] },
  { key: "displayName", label: "Nama" },
  { key: "role", label: "Role", renderCell: (u) => <RoleBadge role={u.role} /> },
  { key: "isActive", label: "Status", renderCell: (u) => <StatusBadge active={u.isActive} /> },
  // aksi via table-actions atau renderCell custom
];
const table = useTable({ data, columns, defaultPageSize: 10 });
// <DataTable table={table}> + <TableSearch> + <TablePagination>
```
Pertahankan: badge role/status, tombol Edit + Nonaktifkan (dengan ConfirmDialog), guard isSelf.

## Task 6 — Verifikasi

```bash
pnpm run type-check && pnpm run build
```
Manual: `/sistem/pengguna` → tabel dengan search (cari username), sort kolom (klik header), pagination (kalau >10 user), badge tetap, aksi jalan. Dark mode OK.

---

## Commit Template
```
feat(ui): port DataTable kit from PMS

- DataTable + useTable hook (sort/search/pagination/column-toggle/selection)
- Checkbox component, table primitives, sub-components
- Refactor UserTable to use DataTable (declarative ColumnDef)
- Tailwind v4 token adaptation, OIMS Tooltip integration

fixes #<N>
```

## CLAUDE.md Check
- [ ] UI kit baru: `src/components/ui/table/` (DataTable) + `Checkbox` → tambah ke daftar UI kit CLAUDE.md.
- [ ] Pattern: semua tabel CRUD pakai `<DataTable>` + `useTable` + `ColumnDef` → dokumentasikan (ganti plain table).
