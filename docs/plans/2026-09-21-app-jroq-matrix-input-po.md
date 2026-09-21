# app-jroq — Matrix input Target per SKU di form PO Produksi

**Prioritas:** P2 · **Tipe:** enhancement

## Masalah

Form `/produksi/po/baru` mengisi varian **satu per satu** lewat `useFieldArray`:
klik "Tambah Baris" → pilih varian dari dropdown → isi Target → ulangi.

Untuk Nordic (8 warna × 5 ukuran = **40 SKU**), itu 40 kali klik-pilih-ketik.

Klien terbiasa matrix di Excel: satu tabel, warna sebagai baris, ukuran sebagai
kolom, tinggal mengisi angka. Semua kombinasi terlihat sekaligus.

## Keputusan yang sudah diambil (sesi tanya-jawab 18 Sep 2026)

1. **Matrix menampilkan SEMUA warna × ukuran sekaligus** — bukan pilih warna
   dulu baru muncul kolomnya.
2. **Hanya kolom Target yang jadi matrix.** Kolom Lebihan tetap input manual
   terpisah — klien konfirmasi langsung bahwa Lebihan diisi manual untuk
   jaga-jaga barang hilang, **bukan rumus tetap**.
   ⚠️ Lihat `app-itl4` (deferred): masih ada pertanyaan terbuka apakah Lebihan
   perlu di level produk. Jangan menghapus field ini.
3. **Varian tidak selalu simetris.** Data Nordic sekarang simetris (40 varian,
   terverifikasi), tapi jangan berasumsi semua produk begitu.

## Kondisi kode sekarang

`src/app/(with-layout)/produksi/po/_components/PoForm.tsx`:

| Baris | Isi |
|---|---|
| 27 | `EMPTY_ROW = { varianId, jumlahTarget, lebihanPcs }` |
| 68 | `useFieldArray({ name: "details" })` |
| 74-75 | `varianOptions` dari `useProdukDetail(produkId)`, difilter `isActive` |
| 170 | tombol "Tambah Baris", disabled kalau produk belum dipilih |
| 207-212 | ComboSelect varian per baris, filter `isActive \|\| id === tersimpan` |

Bentuk data yang dikirim ke server **tidak berubah** — tetap array `details`
berisi `{ varianId, jumlahTarget, lebihanPcs }`. Yang berubah hanya cara
mengisinya.

## Task 1 — Komponen matrix

Buat `_components/MatrixTargetInput.tsx`.

**Input:** daftar varian aktif (masing-masing punya `warnaId`, `warnaNama`,
`ukuran`, `id`), dan nilai sekarang.
**Output:** `onChange(varianId, jumlahTarget)`.

Susun grid dari varian yang ADA, jangan dari perkalian warna × ukuran:

```tsx
// Kumpulkan sumbu dari varian yang benar-benar ada.
// Produk yang variannya tidak simetris akan punya sel kosong — itu benar,
// dan sel itu TIDAK boleh bisa diisi.
const warna = [...new Map(varian.map(v => [v.warnaId, v.warnaNama])).entries()];
const ukuran = [...new Set(varian.map(v => v.ukuran))];
const cari = (warnaId: string, uk: string) =>
  varian.find(v => v.warnaId === warnaId && v.ukuran === uk);
```

Sel yang `cari()`-nya `undefined` dirender sebagai `—` yang tidak bisa diklik,
bukan input kosong. Kalau dibuat input, user mengisi angka untuk SKU yang tidak
ada dan datanya mustahil disimpan.

**Pakai `NumberInput`** dari `@/components/ui/NumberInput`, jangan `<input>`
mentah — komponen itu sudah menangani pemisah ribuan dan sinkronisasi draft
(diperbaiki di `app-823x`).

**Mobile:** matrix 8×5 tidak muat di layar HP. Bungkus dengan
`overflow-x-auto`, dan buat kolom warna `sticky left-0` supaya user tahu sedang
mengisi baris warna apa saat menggeser.

## Task 2 — Sambungkan ke form

Ganti daftar `useFieldArray` dengan matrix, tapi **pertahankan bentuk datanya**.

Cara paling sedikit risikonya: matrix menulis ke `details` yang sama.

```tsx
// Satu baris details per varian yang targetnya terisi.
// Varian dengan target kosong TIDAK dikirim — jangan mengirim baris nol,
// karena itu akan membuat WO Cutting untuk SKU yang tidak dipesan.
const setTarget = (varianId: string, nilai: number | undefined) => {
  const idx = fields.findIndex(f => f.varianId === varianId);
  if (nilai === undefined || nilai === 0) {
    if (idx >= 0) remove(idx);
    return;
  }
  if (idx >= 0) setValue(`details.${idx}.jumlahTarget`, nilai, { shouldValidate: true });
  else append({ varianId, jumlahTarget: nilai, lebihanPcs: undefined });
};
```

⚠️ `remove()` di tengah pengetikan akan mengubah indeks baris lain. Kalau itu
bikin nilai lompat-lompat, simpan state matrix terpisah (`Record<varianId,
number>`) dan sinkronkan ke `details` sekali saja saat submit.

**Lebihan Pcs:** tetap per baris, tampilkan sebagai daftar terpisah di bawah
matrix yang hanya memuat varian dengan target terisi. Jangan dijadikan matrix
kedua — klien mengisinya jarang dan tidak untuk semua SKU.

## Task 3 — Estimasi kebutuhan bahan (live preview)

Sekarang estimasi baru bisa dilihat **setelah PO disimpan**
(`getEstimasiBahan(poId)`, `po-produksi.ts:386`). Klien ingin melihatnya saat
mengisi.

Arsitekturnya (keputusan 18 Sep):

1. **BOM di-fetch SEKALI** saat produk dipilih — query ringan, per produk
2. **Perkalian dihitung di FRONTEND**, instan, tanpa request per ketikan
3. **Stok tersedia tetap dari server** (berubah real-time, tidak aman di-cache),
   pakai **debounce ~500ms** atau tombol refresh — **BUKAN tiap keystroke**

Rumusnya: `kebutuhan = Σ(target + lebihan) × qtyPerVarian` dari BOM aktif.

⚠️ **Jangan menyalin rumus dari `getEstimasiBahan`.** Kalau dua tempat menghitung
hal yang sama dengan kode terpisah, angkanya akan berbeda suatu hari. Ekstrak ke
`src/lib/produksi/estimasi.ts` (server-only tanpa `"use server"` supaya bisa
menerima `tx`), lalu dipakai keduanya. Pola ini sudah terbukti di
`src/lib/jahit/rekap.ts`.

Kalau ekstraksi itu terlalu besar untuk issue ini, **lewati Task 3** dan buat
kartu terpisah. Matrix input sendiri sudah memberi manfaat besar.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Buka `/produksi/po/baru`, pilih produk **Nordic** (8 warna × 5 ukuran):
   matrix menampilkan 40 sel sekaligus.
3. Isi 3 sel, simpan → PO tersimpan dengan **3 baris detail**, bukan 40.
4. Isi lalu **kosongkan** satu sel → barisnya hilang dari detail, tidak tersimpan
   sebagai nol.
5. Pilih produk yang variannya **tidak simetris** (kalau ada) → sel yang tidak
   punya varian tampil `—` dan tidak bisa diisi.
6. Ganti produk di tengah pengisian → matrix ter-reset, tidak menyisakan varian
   produk lama.
7. **Mobile** (< 850px): matrix bisa digeser horizontal, kolom warna tetap
   terlihat.
8. Edit PO lama → nilai lama muncul di sel yang benar.

## Yang TIDAK dikerjakan

- Tidak mengubah bentuk data yang dikirim ke server.
- Tidak menghapus field Lebihan Pcs — `app-itl4` masih terbuka.
- Tidak mengubah `getEstimasiBahan` yang dipakai halaman detail PO.
