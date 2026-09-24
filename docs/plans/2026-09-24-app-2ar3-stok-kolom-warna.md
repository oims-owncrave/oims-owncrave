# app-2ar3 — Stok Bahan: tambah kolom Warna

**Feedback klien 24 Sep 2026.** Tabel `/inventory/stok` tidak menampilkan warna bahan.
Kain beda warna (RJN HITAM vs RJN PETROL) cuma bisa dibedakan dari nama.

`bahan.warna_id` **sudah ada** (nullable, 36 dari 92 bahan terisi). Tidak ada migration.
Pola join-nya sudah dipakai di `src/services/bahan.ts:77` (`warnaNama: warna.nama`).

2 file. Tanpa migration.

---

## Task 1 — Service: join warna

File: `src/services/stok.ts`

1. Import `warna`:
   ```ts
   import { stok, bahan, kategori, satuan, warna } from "@/db/schema";
   ```
2. Tipe `StokRow` — tambah setelah `nama`:
   ```ts
   warnaNama: string | null;
   ```
3. Di `select({...})` `listStok` — tambah setelah `nama: bahan.nama,`:
   ```ts
   warnaNama: warna.nama,
   ```
4. Tambah join setelah `.leftJoin(satuan, ...)`:
   ```ts
   .leftJoin(warna, eq(bahan.warnaId, warna.id))
   ```
   `leftJoin` — bahan tanpa warna tetap tampil.

Cek pemanggil lain yang membangun `StokRow` manual (kalau ada, tsc akan protes):
`grep -rn "StokRow" src`.

## Task 2 — Tabel: kolom Warna

File: `src/app/(with-layout)/inventory/stok/_components/StokTable.tsx`

Sisipkan kolom **setelah** `nama` (sebelum `kategoriNama`):
```tsx
{
  key: "warnaNama",
  label: "Warna",
  mobileRole: "detail",
  renderCell: (item) => item.warnaNama || "-",
},
```

Search (`TableSearch`) — cek apakah `useTable` mencari di semua kolom string. Kalau
search hanya kode/nama (lihat implementasi di `src/components/ui/table`), JANGAN ubah
— di luar scope.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Buka `/inventory/stok`: kolom **Warna** muncul antara Nama Bahan dan Kategori.
   RJN HITAM → `HITAM`, RJN PETROL → `PETROL`, bahan tanpa warna → `-`.
3. Mobile (≤640px): warna tampil sebagai baris detail di kartu.
4. Toggle kolom (tombol **Kolom**) bisa menyembunyikan Warna.

## Commit

```
feat(inventory/stok): kolom Warna di tabel stok bahan

fixes #22
```

## CLAUDE.md Check
- [ ] Pattern baru? Tidak.
- [ ] Tabel baru? Tidak.
- [ ] Route baru? Tidak.
