# app-k575 — Tarif jasa jahit: hapus field Varian

**Feedback klien 24 Sep 2026.** Form *Tambah Tarif* (`/master/data-mitra?tab=tarif`)
tidak perlu pilihan **Varian** — tarif jahit berlaku per produk, bukan per warna/ukuran.

## Keputusan: buang dari UI saja, DB & service tetap

- Data prod 24 Sep: **0** tarif aktif yang `varian_id`-nya terisi. Tidak ada data yang hilang.
- `tarif_jasa_jahit.varian_id` tetap (nullable). Service `tarif-jasa-jahit.ts` dan
  fallback di `penugasan-jahit.ts:233-275` (varian spesifik → tarif umum) tetap jalan
  karena semua baris baru `varianId = null`.
- Zod schema `varianId: ...nullable()` tetap — form mengirim `null` dari `EMPTY`.

Kenapa tidak drop kolom: drop = migration + ubah 3 service demi nol manfaat. Kalau
suatu hari varian memang perlu, UI-nya tinggal dikembalikan.

2 file. Tanpa migration.

---

## Task 1 — Form

File: `src/app/(with-layout)/vendor/tarif/_components/TarifFormModal.tsx`

Hapus:
1. Import `getProdukDetail, type VarianRow` dari `@/services/varian-produk` (baris ~19).
2. State `const [varianList, setVarianList] = useState<VarianRow[]>([]);` (~58).
3. `useEffect` "varian ikut produk yang dipilih" (~98-105) seluruhnya.
4. `const varianOptions = [...]` (~128-131).
5. `<Select label="Varian" ... />` (~162-168).

**Jangan** hapus `varianId` dari `EMPTY` maupun dari `reset({... varianId: initialData.varianId ...})`
— nilainya tetap dikirim (null) supaya schema valid dan edit tarif lama tidak berubah diam-diam.

Setelah hapus, cek `useState` / `useEffect` masih dipakai; kalau tidak, rapikan import React.

## Task 2 — Tabel

File: `src/app/(with-layout)/vendor/tarif/_components/TarifTable.tsx`

Hapus kolom:
```tsx
{
  key: "varianSku",
  label: "Varian",
  renderCell: (item) => item.varianSku || "Semua varian",
},
```
`TarifRow.varianId/varianSku` biarkan (dipakai tipe & service).

## Verifikasi

1. `npx tsc --noEmit` → 0 error. `npx eslint` file yang diubah → tanpa unused import.
2. `/master/data-mitra?tab=tarif` → **Tambah Tarif**: urutan field Produk → Jenis
   Pekerjaan → Berlaku untuk/Vendor → Dasar/Nominal/Berlaku Sejak → Catatan. Tidak ada Varian.
3. Simpan tarif baru → sukses, muncul di tabel sebagai draft. Tabel tanpa kolom Varian.
4. Edit tarif existing → simpan → tidak error.
5. `/vendor/tarif` (halaman lama, pakai komponen sama) ikut berubah — wajar.

## Commit

```
feat(tarif): hapus pilihan varian di tarif jasa jahit

Tarif jahit berlaku per produk. Kolom DB varian_id tetap (nullable).

fixes #23
```

## CLAUDE.md Check
- [ ] Pattern baru? Tidak.
