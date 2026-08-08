# Plan: oims-6c3 — Toggle Kartu/Tabel Pindah ke Atas Search

## Context

Di mobile, toggle "Kartu | Tabel" muncul di bawah toolbar search/filter. Owner minta toggle ada di paling atas — sebelum search — supaya user langsung tahu bisa ganti view sebelum filter. Perubahan urutan render saja, 1 file.

## Files

- `src/components/ui/table/table.tsx` — swap urutan render toggle vs `{children}`

## Task 1 — Pindah urutan render

Baca `table.tsx`. Struktur saat ini di dalam `DataTable` JSX:

```tsx
<div className="rounded-xl border ...">
  {children}                    ← toolbar (search, filter, button)
  <div className="sm:hidden">   ← toggle Kartu/Tabel — DI SINI SEKARANG
    <div className="flex items-center gap-1 p-3 pb-0">
      ...
    </div>
  </div>
  {/* card view */}
  {/* desktop table */}
</div>
```

Target — pindah `<div className="sm:hidden">` ke SEBELUM `{children}`, dan ganti `pb-0` → `pb-3`:

```tsx
<div className="rounded-xl border ...">
  <div className="sm:hidden">   ← PINDAH KE SINI
    <div className="flex items-center gap-1 p-3 pb-3">  ← pb-3
      ...
    </div>
  </div>
  {children}                    ← toolbar sekarang di bawah toggle
  {/* card view */}
  {/* desktop table */}
</div>
```

Hanya 2 perubahan:
1. Urutan blok `sm:hidden` dan `{children}` ditukar
2. `pb-0` → `pb-3` untuk spacing antara toggle dan search di bawahnya

## Task 2 — Verifikasi

- Mobile: toggle Kartu/Tabel di paling atas, search di bawahnya
- Desktop (`sm:`): `sm:hidden` tidak tampil → tidak ada efek visual
- Toggle state tetap berfungsi (card ↔ tabel masih switch)
- Cek halaman supplier (toolbar lengkap) + barang masuk (ada button Tambah)
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — reorder render saja
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
