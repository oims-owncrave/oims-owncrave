CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Perbaiki layout Export CSV di halaman Laporan Barang Masuk dan Laporan Barang Keluar — mobile only.

ISSUE: oims-76v (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-76v-export-csv-width

REQUIREMENTS:

**Tujuan:** Di mobile, button "Export CSV" lebarnya setengah, sejajar dengan info "Total Transaksi" di baris yang sama. Saat ini di mobile, Export CSV tampak sendiri full-width di bawah total. Target: Total (flex-1) | Export CSV (flex-1) dalam satu baris `flex gap-2`.

**File target:**
1. `src/app/(with-layout)/laporan/barang-masuk/_components/LaporanBarangMasukTable.tsx`
2. `src/app/(with-layout)/laporan/barang-keluar/_components/LaporanBarangKeluarTable.tsx`

**Task 1 — LaporanBarangMasukTable.tsx:**

Baca file dulu. Cari bagian `{/* Date filter & Summary Bar */}`. Saat ini struktur:

```tsx
<div className="flex flex-col gap-3 rounded-[10px] ... sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
  <div className="flex items-center gap-2">
    <DateInput ... /> {/* Dari Tanggal */}
    <DateInput ... /> {/* Sampai Tanggal */}
  </div>

  <div className="flex items-center justify-between gap-4">
    <div className="leading-tight">
      {/* Total Transaksi label + nilai */}
    </div>
    <Button variant="outline" ... onClick={handleExport}>
      Export CSV
    </Button>
  </div>
</div>
```

Target — ubah wrapper baris kedua dari `justify-between` ke `flex gap-2` dengan kedua item `flex-1`:

```tsx
<div className="flex items-center gap-2">
  <div className="flex-1 leading-tight">
    {/* Total Transaksi label + nilai — tetap sama */}
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

- `flex-1` di kedua elemen → masing-masing ambil setengah lebar
- Desktop (`sm:flex-row`): karena parent sudah `sm:flex-row sm:justify-between`, kedua elemen ini menjadi flex item sejajar dengan date filters → tampilan desktop tidak berubah signifikan

**Task 2 — LaporanBarangKeluarTable.tsx:**
- Pola persis sama dengan Task 1 — apply perubahan yang identik

**Task 3 — Cek visual:**
- Mobile: date filters baris 1, Total + Export CSV baris 2 (masing-masing 50%)
- Desktop: tidak berubah (filter + summary + button sejajar horizontal)
- Dark mode: tidak ada perubahan warna

CONSTRAINTS:
- Perubahan hanya di 2 file laporan tersebut
- Jangan ubah logic export, kolom CSV, atau apapun selain layout wrapper
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
