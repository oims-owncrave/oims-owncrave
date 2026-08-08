# Plan: oims-76v — Export CSV Lebar Setengah (Laporan Barang Masuk & Keluar)

## Context

Di mobile, button "Export CSV" di halaman Laporan Barang Masuk dan Laporan Barang Keluar tampil full-width sendiri di baris terpisah dari info Total Transaksi. Owner minta Export CSV sejajar dengan Total — masing-masing setengah lebar. Desktop tidak berubah.

## Files

1. `src/app/(with-layout)/laporan/barang-masuk/_components/LaporanBarangMasukTable.tsx`
2. `src/app/(with-layout)/laporan/barang-keluar/_components/LaporanBarangKeluarTable.tsx`

## Task 1 — LaporanBarangMasukTable.tsx

Baca file. Cari `{/* Date filter & Summary Bar */}`. Saat ini baris kedua:

```tsx
<div className="flex items-center justify-between gap-4">
  <div className="leading-tight">
    {/* Total Transaksi */}
  </div>
  <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white" onClick={handleExport}>
    <Download size={16} className="mr-2" />
    Export CSV
  </Button>
</div>
```

Ubah wrapper dari `justify-between` ke `gap-2` dengan kedua item `flex-1`:

```tsx
<div className="flex items-center gap-2">
  <div className="flex-1 leading-tight">
    <span className="block text-xs font-medium text-dark-5 dark:text-dark-6">Total Transaksi</span>
    <p className="mt-0.5 text-base font-bold text-dark dark:text-white">
      {rupiah(totalNilai)}
    </p>
  </div>
  <Button
    variant="outline"
    className="flex-1 border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white"
    onClick={handleExport}
  >
    <Download size={16} className="mr-2" />
    Export CSV
  </Button>
</div>
```

Perubahan: `justify-between` → hilang, tambah `flex-1` di kedua elemen.

## Task 2 — LaporanBarangKeluarTable.tsx

Pola identik dengan Task 1 — apply perubahan yang sama di file ini. Pastikan baca file dulu sebelum edit.

## Task 3 — Verifikasi

- Mobile: Total Transaksi (kiri, 50%) | Export CSV (kanan, 50%) dalam 1 baris
- Date filters tetap di baris pertama (tidak berubah)
- Desktop (`sm:flex-row`): parent container sudah `sm:flex-row sm:justify-between`, elemen inner menyesuaikan → tampilan desktop tetap
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Tidak
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
