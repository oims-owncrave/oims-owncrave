# Plan: oims-y5k — Card Mobile Highlight Background Abu-abu

## Context

Di card mobile, bagian highlight (pojok kanan atas — kuantitas, subtotal, nilai) tampil tanpa background, terlihat mengambang. Owner minta diberi background abu-abu seperti warna header tabel (`bg-gray-1 dark:bg-dark-2` = `#f9fafb` / `#1f2a37`). Perubahan 1 baris wrapper di render card, 1 file.

## Files

- `src/components/ui/table/table.tsx` — wrap highlight div dengan background

## Task 1 — Tambah background di highlight render

Baca `table.tsx`. Cari bagian render card mobile — sekitar `highlights.map`. Saat ini:

```tsx
{highlights.map((h) => (
  <div key={h.col.key}>
    {renderVal(h.col, item, rowIndex, isExpanded, isSelected)}
  </div>
))}
```

Ubah menjadi:

```tsx
{highlights.map((h) => (
  <div
    key={h.col.key}
    className="rounded-md bg-gray-1 px-2 py-1 text-sm font-medium text-dark dark:bg-dark-2 dark:text-white"
  >
    {renderVal(h.col, item, rowIndex, isExpanded, isSelected)}
  </div>
))}
```

Kelas yang ditambah:
- `rounded-md` — shape pill ringan
- `bg-gray-1 dark:bg-dark-2` — abu terang / dark-2, identik dengan `<TableRow className="bg-gray-1 dark:bg-dark-2">` di header tabel
- `px-2 py-1` — padding compact
- `text-sm font-medium text-dark dark:text-white` — teks utama

**Catatan:** Jika `renderVal` return elemen dengan warna spesifik (misal `text-green-600` untuk kuantitas positif), warna itu tetap menang karena lebih spesifik — wrapper `text-dark` tidak override. Ini perilaku yang diinginkan.

## Task 2 — Pastikan kebab menu tidak terpengaruh

Render action/kebab ada terpisah di blok `{actions.length > 0 && <CardKebabDropdown ... />}` — tidak perlu diubah. Verifikasi urutan: highlights → kebab.

## Task 3 — Verifikasi

- Card barang masuk: subtotal/harga di kanan atas punya background abu-abu
- Card mutasi stok: kuantitas (+/-) punya background abu-abu, warna hijau/merah tetap terbaca
- Kebab menu (⋮) tidak punya background
- Dark mode: `dark:bg-dark-2` aktif
- Desktop: tidak ada card → tidak ada efek
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Tidak
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
