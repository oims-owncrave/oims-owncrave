# Plan: oims-8i9 — FAB Button Tambah + Search Compact Mobile

## Context

Di mobile saat mode "Tabel", button "Tambah [Entitas]" di toolbar memakan lebar penuh dan mendorong search ke baris sendiri. Owner minta: search sejajar dengan toggle Kolom, dan button Tambah jadi FAB (floating action button) di pojok kanan bawah — mirip school-management halaman presensi. Desktop tidak berubah.

## Files

1. `src/components/ui/table/table.tsx` — tambah prop `mobileFab`
2. `src/app/(with-layout)/master/supplier/_components/SupplierTable.tsx`
3. `src/app/(with-layout)/master/bahan/_components/BahanTable.tsx`
4. `src/app/(with-layout)/master/kategori/_components/KategoriTable.tsx`
5. `src/app/(with-layout)/master/satuan/_components/SatuanTable.tsx`
6. `src/app/(with-layout)/master/warna/_components/WarnaTable.tsx`

## Task 1 — Tambah prop `mobileFab` ke DataTable

Baca `src/components/ui/table/table.tsx`. Tambah ke `DataTableProps`:

```tsx
/** FAB untuk mobile mode Tabel — render fixed bottom-right di atas bottom nav. */
mobileFab?: React.ReactNode
```

Render FAB di dalam `TableContext.Provider`, setelah close div utama tabel (atau di dalam Provider sebelum closing tag):

```tsx
{mobileFab && table.mobileView === "table" && (
  <div className="sm:hidden fixed bottom-20 right-4 z-40">
    {mobileFab}
  </div>
)}
```

- `bottom-20` = 80px dari bawah (bottom nav ~56px + 24px margin)
- `sm:hidden` = hanya mobile
- `z-40` = di atas konten, di bawah modal/sheet

## Task 2 — Apply FAB di 5 halaman master

Untuk setiap halaman master (supplier, bahan, kategori, satuan, warna), baca file-nya dulu. Pola perubahan:

**Di `<DataTable>` component call**, tambah prop `mobileFab`:

```tsx
<DataTable
  table={table}
  mobileFab={
    <Button
      onClick={onAdd}
      className="flex h-14 w-14 items-center justify-center rounded-full p-0 shadow-lg"
    >
      <Plus size={24} />
    </Button>
  }
>
  ...existing children...
</DataTable>
```

Import `Plus` dari `lucide-react` (cek apakah sudah diimport, jika belum tambahkan).

**Button Tambah di toolbar desktop TETAP ada** — tidak dihapus. FAB adalah tambahan untuk mobile.

Halaman yang perlu diupdate (baca `DataTable` call di masing-masing):
- `SupplierTable.tsx`
- `BahanTable.tsx`
- `KategoriTable.tsx`
- `SatuanTable.tsx`
- `WarnaTable.tsx`

## Task 3 — Verifikasi

- Mobile mode Kartu: FAB tidak muncul
- Mobile mode Tabel: FAB muncul pojok kanan bawah di atas bottom nav
- Klik FAB → sama efek dengan button Tambah di toolbar (panggil `onAdd`)
- Desktop: FAB tidak muncul (`sm:hidden`)
- Halaman inventory (barang masuk, keluar) skip — navigasi ke halaman baru, bukan modal
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Ya — prop `mobileFab` di DataTable. Dokumentasikan di `docs/claude/ui-components.md` setelah implementasi.
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
