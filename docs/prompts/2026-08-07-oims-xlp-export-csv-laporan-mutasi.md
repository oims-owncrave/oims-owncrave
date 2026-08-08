CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Perbaiki layout Export CSV di halaman Laporan Mutasi — button sejajar dengan filter "Semua Bahan".

ISSUE: oims-xlp (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-xlp-export-csv-mutasi

REQUIREMENTS:

**Tujuan:** Di halaman Laporan Mutasi (`/laporan/mutasi/`), mobile layout: button "Export CSV" ada di baris yang sama dengan filter dropdown "Semua Bahan". Saat ini Export CSV ada di baris sendiri di bawah semua filter.

**File target:** `src/app/(with-layout)/laporan/mutasi/_components/LaporanMutasiTable.tsx`

**Task 1 — Baca file dan identifikasi layout filter:**

Baca `LaporanMutasiTable.tsx`. Cari bagian filter/summary bar. Halaman ini punya:
- ComboSelect "Semua Bahan" (dropdown pilih bahan)
- DateInput "Dari Tanggal" + "Sampai Tanggal"
- Export CSV button

**Task 2 — Ubah layout mobile:**

Target layout mobile:
```
Baris 1: [Semua Bahan (flex-1)] [Export CSV (flex-none, w-auto)]
Baris 2: [Dari Tanggal (flex-1)] [Sampai Tanggal (flex-1)]
```

Implementasi — di dalam filter bar card, susun:

```tsx
{/* Baris 1: Filter bahan + Export CSV */}
<div className="flex items-center gap-2">
  <ComboSelect
    variant="filter"
    placeholder="Semua bahan"
    ...
    className="flex-1"
  />
  <Button
    variant="outline"
    className="shrink-0 border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white"
    onClick={handleExport}
  >
    <Download size={16} className="mr-1.5" />
    Export CSV
  </Button>
</div>

{/* Baris 2: Date range */}
<div className="flex items-center gap-2">
  <DateInput value={from} onChange={onFromChange} placeholder="Dari Tanggal" containerClassName="flex-1" className="w-full" />
  <DateInput value={to} onChange={onToChange} placeholder="Sampai Tanggal" containerClassName="flex-1" className="w-full" />
</div>
```

- `flex-1` di ComboSelect → ambil sisa ruang
- `shrink-0` di Export CSV → lebar auto sesuai konten, tidak menyusut
- Desktop (`sm:flex-row`): pastikan parent container punya `sm:flex-row sm:items-center sm:justify-between` sehingga tampilan desktop tidak berubah. Jika perlu wrap kedua baris dalam `<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">`

**Task 3 — Verifikasi:**
- Mobile: bahan + export 1 baris, date range 1 baris di bawah
- Desktop: filter + export sejajar horizontal
- Fungsi export tidak berubah

CONSTRAINTS:
- Perubahan hanya di `LaporanMutasiTable.tsx`
- Jangan ubah logic export, kolom CSV, atau filter state
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
