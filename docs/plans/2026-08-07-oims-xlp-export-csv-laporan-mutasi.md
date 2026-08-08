# Plan: oims-xlp — Export CSV Sejajar Filter Bahan (Laporan Mutasi)

## Context

Di halaman Laporan Mutasi (`/laporan/mutasi/`), button "Export CSV" ada di baris sendiri di bawah semua filter. Owner minta Export CSV sejajar dengan filter "Semua Bahan" di baris pertama. DateInput from/to tetap di baris kedua. Desktop tidak berubah.

## Files

- `src/app/(with-layout)/laporan/mutasi/_components/LaporanMutasiTable.tsx`

## Task 1 — Baca file dan identifikasi struktur filter

Baca `LaporanMutasiTable.tsx`. Cari bagian filter/summary bar. File ini punya:
- ComboSelect "Semua Bahan"
- DateInput dari/sampai
- Export CSV button
- (mungkin juga ComboSelect tipe mutasi — lihat aktual)

## Task 2 — Susun ulang layout mobile

Target layout mobile:
```
Baris 1: [ComboSelect Semua Bahan (flex-1)] [Export CSV (shrink-0)]
Baris 2: [Dari Tanggal (flex-1)] [Sampai Tanggal (flex-1)]
```

Implementasi — di dalam filter bar card, susun:

```tsx
{/* Baris 1 */}
<div className="flex items-center gap-2">
  <ComboSelect
    variant="filter"
    placeholder="Semua bahan"
    options={...}
    value={...}
    onChange={...}
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

{/* Baris 2 */}
<div className="flex items-center gap-2">
  <DateInput value={from} onChange={onFromChange} placeholder="Dari Tanggal" containerClassName="flex-1" className="w-full" />
  <DateInput value={to} onChange={onToChange} placeholder="Sampai Tanggal" containerClassName="flex-1" className="w-full" />
</div>
```

Jika ada ComboSelect tipe mutasi tambahan, letakkan di baris 2 atau baris 3 sesuai lebar — jangan paksakan 1 baris.

Parent wrapper filter bar: pastikan punya `flex flex-col gap-3` untuk mobile dan `sm:flex-row sm:items-center sm:gap-4` untuk desktop.

## Task 3 — Verifikasi

- Mobile: Semua Bahan + Export CSV sejajar (baris 1), date range baris 2
- Desktop: filter + export sejajar horizontal (tidak berubah)
- Fungsi export tidak berubah — hanya layout
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Tidak
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
