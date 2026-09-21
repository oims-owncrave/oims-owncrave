# app-823x — NumberInput: draft ketikan tidak sinkron saat value diubah dari luar

**Prioritas:** P1 · **Tipe:** bug · **Dampak:** 32 file pemakai
**Aturan konvensi:** `ui_conventions.md` §12c (vault)

## Masalah

`src/components/ui/NumberInput.tsx` menyimpan **draft string** terpisah dari nilai
numerik, supaya user bisa mengetik `"1,"` tanpa langsung terpangkas jadi `"1"`.
Polanya benar. Yang salah: draft hanya dibuang di `onBlur` (baris 67).

```tsx
const [draft, setDraft] = useState<string | null>(null);
// ...
value={draft ?? format(value, decimals)}   // baris 57 — draft menang selama tidak null
onBlur={(e) => { setDraft(null); onBlur?.(e); }}   // baris 66-69 — satu-satunya jalan buang draft
```

Kalau parent memanggil `setValue()` untuk field yang sama **selagi field masih
fokus**, layar tetap menampilkan ketikan lama padahal form state sudah berubah.

### Jalur nyata (sudah terverifikasi di kode, bukan teori)

`src/app/(with-layout)/vendor/dekorasi/_components/DekorasiForm.tsx`:

| Baris | Kode | Peran |
|---|---|---|
| 99 | `onChange={(v) => setValue("woId", ...)}` | ComboSelect WO |
| 69 | `if (wo) setValue("jumlah", wo.totalBaik, ...)` | effect autofill |
| 133 | `setValue("jumlah", v as number, ...)` | NumberInput "Jumlah (pcs)" |
| 75 | `if (t) setValue("tarif", Number(t.tarifDefault), ...)` | effect autofill |
| 139 | `setValue("tarif", v as number, ...)` | NumberInput "Tarif" |

Langkahnya:
1. User mengetik "Jumlah (pcs)" manual jadi `120`
2. **Tanpa klik ke mana pun**, langsung mengganti pilihan WO di ComboSelect
3. ComboSelect merender opsi dengan `onMouseDown` + `preventDefault` → NumberInput
   **tidak ter-blur** → `draft` tetap `"120"`
4. Effect baris 69 menulis `setValue("jumlah", wo.totalBaik)` = misal `340`
5. Input tetap menampilkan `120`. Yang tersimpan `340`.

Kembarannya di baris 75 (`tarif` di-prefill dari template setelah user ketik tarif
custom) → harga total dekorasi salah.

**Kenapa P1:** tidak ada gejalanya. Tak ada error, tak ada warning — angkanya cuma
salah. Dan field angka di proyek ini isinya harga dan kuantitas stok.

## Jebakan yang WAJIB dihindari

Fix naif ini **akan merusak pengetikan desimal**:

```tsx
useEffect(() => { setDraft(null) }, [value]);   // ❌ JANGAN
```

Sebabnya: saat user mengetik `"1,"`, handler baris 58-65 memanggil `onChange(1)`.
Jadi `value` ikut berubah **setiap ketukan**. Effect di atas akan membuang draft
`"1,"` dan menggantinya dengan `format(1)` = `"1"` — koma hilang, desimal mustahil
diketik. Ini persis bug yang dicegah komentar baris 44-46.

Draft hanya boleh dibuang kalau `value` berubah **bukan karena ketikan user**.

## Fix

Bandingkan `value` dengan hasil parse `draft`. Kalau sama, perubahan itu berasal
dari ketikan user sendiri → draft dipertahankan. Kalau beda, perubahan datang dari
luar → draft dibuang.

Ekstrak parsing jadi fungsi terpisah supaya dipakai dua tempat (handler + effect),
tidak disalin:

```tsx
import { forwardRef, useEffect, useRef, useState } from "react";

/** "12.310,5" -> 12310.5. Kosong/tak valid -> undefined. */
function parse(tampil: string): number | undefined {
  const angka = tampil.replace(/\./g, "").replace(",", ".");
  if (angka === "" || angka === ".") return undefined;
  const n = Number(angka);
  return Number.isNaN(n) ? undefined : n;
}
```

Di dalam komponen:

```tsx
const [draft, setDraft] = useState<string | null>(null);

// Nilai yang TERAKHIR dikirim komponen ini lewat onChange. Dipakai untuk
// membedakan perubahan value yang berasal dari ketikan user (draft dipertahankan,
// supaya "1," tidak terpangkas jadi "1") dan yang datang dari luar lewat setValue
// (draft dibuang, supaya layar tidak menampilkan angka basi).
const terakhirDikirim = useRef<number | undefined>(undefined);

useEffect(() => {
  const v = value === "" || value === null ? undefined : Number(value);
  const sama = Number.isNaN(v as number) ? value === undefined : v === terakhirDikirim.current;
  if (!sama) setDraft(null);
}, [value]);
```

Handler `onChange` menyimpan nilai yang dikirim:

```tsx
onChange={(e) => {
  const tampil = formatKetikan(e.target.value, decimals);
  setDraft(tampil);
  const n = parse(tampil);
  terakhirDikirim.current = n;
  onChange(n);
}}
```

`onBlur` tetap seperti sekarang (buang draft, kembali ke bentuk terformat).

### Catatan implementasi

- `value` bertipe `unknown` (baris 11) — normalisasi dulu sebelum membandingkan.
  `Number("")` = `0`, jadi string kosong harus ditangani terpisah, jangan langsung
  `Number(value)`.
- Handler lama memanggil `onChange(undefined)` untuk input kosong (baris 62) —
  perilaku ini **tidak boleh berubah**, `parse()` sudah mengembalikan `undefined`
  untuk kasus yang sama.
- Jangan ubah `format()` dan `formatKetikan()` — dua fungsi itu sudah benar.

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. **Desimal masih bisa diketik (regresi utama):** buka form mana pun dengan
   `decimals > 0`, mis. Barang Keluar → field Kuantitas. Ketik `1,5`. Kalau koma
   hilang saat mengetik, fix-nya salah — draft terbuang terlalu agresif.
3. **Bug aslinya hilang:** buka `/vendor/dekorasi/baru`. Ketik "Jumlah (pcs)" jadi
   `120`. **Tanpa klik ke tempat kosong**, langsung ganti pilihan WO. Angka di layar
   HARUS ikut berubah jadi angka dari WO. Ulangi untuk field "Tarif" dengan mengganti
   Template.
4. Ketik angka lalu klik ke luar — tampilan kembali terformat dengan pemisah ribuan
   (perilaku lama, jangan sampai hilang).

## Yang TIDAK dikerjakan di issue ini

- Tidak menyentuh `Input.tsx` (komponen dasar yang dibungkus).
- Tidak mengubah satu pun dari 32 file pemakai — fix murni di dalam `NumberInput`,
  kontrak prop-nya tidak berubah.
