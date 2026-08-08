CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif. Tabel pakai DataTable kit di src/components/ui/table/.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Mobile table view: search lebih compact + FAB (floating action button) untuk button Tambah.

ISSUE: oims-8i9 (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-8i9-fab-tambah

REQUIREMENTS:

**Tujuan:**
1. Saat mode "Tabel" di mobile, search input sejajar dengan tombol "Kolom" — bukan full-width sendiri
2. Button "Tambah [Entitas]" di halaman master & inventory dijadikan FAB floating pojok kanan bawah saat mobile mode "Tabel"

**Task 1 — Tambah prop `mobileFab` ke DataTable:**

Baca `src/components/ui/table/table.tsx` dulu.

Tambah prop ke `DataTableProps`:
```tsx
/** FAB (floating action button) untuk mobile mode Tabel. Render fixed bottom-right di atas bottom nav. */
mobileFab?: React.ReactNode
```

Render FAB: setelah close div utama (atau di dalam `TableContext.Provider` sebelum close), tambah:
```tsx
{/* FAB — hanya mobile, hanya saat mode tabel */}
{mobileFab && table.mobileView === "table" && (
  <div className="sm:hidden fixed bottom-20 right-4 z-40">
    {mobileFab}
  </div>
)}
```

- `bottom-20` = 80px dari bawah (di atas bottom nav ~56px + margin)
- `sm:hidden` = hanya mobile
- `z-40` = di atas konten, di bawah modal/dropdown

**Task 2 — Update TableToolbar search mobile saat mode tabel:**

Saat ini `TableSearch` di `table-search.tsx` selalu `w-full sm:w-64`. Itu ok. Yang perlu diubah: di `table-toolbar.tsx` atau di penggunaan, search tidak perlu full-width tersendiri di mobile saat ada toggle.

Cek `src/components/ui/table/table-toolbar.tsx` — wrapper classes. Jika wrapper sudah `flex flex-col gap-3`, search akan full-width. Tidak perlu ubah di sini — search compact sudah terjadi secara natural jika Kolom button ada di sebelahnya di baris yang sama.

**Cek apakah search + kolom sudah 1 baris:** Baca halaman supplier atau barang masuk, lihat `<TableToolbar>` — jika search dan ColumnToggle sudah di baris yang sama (keduanya dalam 1 flex row), tidak perlu ubah. Jika search full-width sendiri di mobile, tambah `className="flex-1"` di `<TableSearch>` component.

**Task 3 — Apply FAB di halaman-halaman yang punya button Tambah:**

Halaman prioritas (punya modal form, button Tambah di toolbar):
1. `src/app/(with-layout)/master/supplier/_components/SupplierTable.tsx`
2. `src/app/(with-layout)/master/bahan/_components/BahanTable.tsx`
3. `src/app/(with-layout)/master/kategori/_components/KategoriTable.tsx`
4. `src/app/(with-layout)/master/satuan/_components/SatuanTable.tsx`
5. `src/app/(with-layout)/master/warna/_components/WarnaTable.tsx`

Untuk setiap halaman:
- Di dalam `<DataTable table={table} ... mobileFab={<Button ...>...</Button>}>`, tambah prop `mobileFab`
- FAB button style:
  ```tsx
  mobileFab={
    <Button onClick={onAdd} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
      <Plus size={24} />
    </Button>
  }
  ```
- Import `Plus` dari lucide-react
- Button Tambah di toolbar desktop TETAP ada — tidak dihapus. Hanya di mobile mode tabel yang muncul FAB sebagai tambahan

**Untuk inventory** (barang masuk, barang keluar, penyesuaian) — skip untuk sekarang karena halaman tersebut navigasi ke halaman baru (bukan modal). FAB untuk halaman navigasi bisa dilakukan terpisah.

**Task 4 — Verifikasi:**
- Mobile mode Kartu: FAB tidak muncul (hanya mode Tabel)
- Mobile mode Tabel: FAB muncul pojok kanan bawah, di atas bottom nav
- Desktop: FAB tidak muncul (`sm:hidden`)
- Klik FAB → sama efeknya dengan button Tambah di toolbar

CONSTRAINTS:
- Jangan install dependency baru
- Button di toolbar desktop TETAP ada — FAB adalah TAMBAHAN untuk mobile mode tabel
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
