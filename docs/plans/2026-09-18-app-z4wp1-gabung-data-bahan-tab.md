# app-z4wp.1 — Gabung Data Bahan jadi 1 halaman + tab

**Beads:** `app-z4wp` **poin 1** dari checklist

> Awalnya issue terpisah `app-z4wp.1`. Dilipat 18 Sep 2026 atas permintaan Abu —
> 6 issue sejajar bikin list ramai padahal satu tema, jadi digabung jadi 1 kartu
> `app-z4wp` berisi checklist 6 poin. Plan ini tetap berlaku untuk poin 1.

## Konteks

Sidebar Master Data punya 15 item, terlalu banyak (ide Abu 18 Sep 2026). 5 item
di grup "Data Bahan" (Kategori, Satuan, Warna, Bahan, Supplier) semuanya CRUD
sepele — form pendek (105-249 baris), nol alur multi-langkah, sudah dikelompokkan
`heading: "Data Bahan"` yang sama di `src/components/layouts/sidebar/data/index.ts`.

Pola gabung-jadi-tab **sudah ada** di proyek ini, jangan bikin pola baru:
`src/app/(with-layout)/produksi/cutting/_components/CuttingPageClient.tsx` —
`useState<Tab>`, array `tabs[]` dengan `count`, tombol dengan border-bottom
aktif, render kondisional `tab === "x" ? <ATable/> : <BTable/>`.

## PERHATIAN — reuse Table, BUKAN PageClient

Tiap master data sekarang punya 3 file: `<Nama>PageClient.tsx` (wrapper: state
modal + `PageHeader` + `<Nama>Table>` + `<Nama>FormModal>`), `<Nama>Table.tsx`
(tabel + toolbar), `<Nama>FormModal.tsx` (modal tambah/edit).

`CuttingPageClient` contoh me-reuse **`WoTable`/`PenerimaanTable` LANGSUNG**
(komponen Table, bukan PageClient) — karena `PageClient` bawa `PageHeader`
sendiri. Kalau 5 `PageClient` dipanggil apa adanya di dalam tab, hasilnya 5
`PageHeader` numpuk/berganti-ganti — SALAH.

**Yang harus dilakukan:** buat 1 `DataBahanPageClient.tsx` BARU yang:
1. Render **1 `PageHeader`** saja (judul "Data Bahan", breadcrumb `Master > Data Bahan`)
2. Render tab bar (pola persis `CuttingPageClient`)
3. Per tab, render kombinasi `<NamaTable>` + `<NamaFormModal>` + state modal
   milik tab itu sendiri (SETIAP tab butuh `modalOpen`/`editItem` sendiri-sendiri,
   jangan satu state global dipakai 5 tab — item yang diedit beda tipe data per tab)

Referensi isi tiap `PageClient` lama (state yang harus dipindah manual ke tab):
- `KategoriPageClient.tsx` — `modalOpen`, `importOpen`, `editItem`, `useKategoriList`, `ImportExcelModal` (config kolom kode+nama)
- `SatuanPageClient.tsx`, `WarnaPageClient.tsx`, `BahanPageClient.tsx`, `SupplierPageClient.tsx` — baca isi masing-masing, pola serupa tapi field/import config beda per tipe.

**Import Excel** — tiap `PageClient` lama punya `ImportExcelModal` sendiri
dengan config kolom beda (lihat contoh Kategori: kolom `kode`+`nama`). Bawa
SEMUA `ImportExcelModal` ke tab masing-masing, config asli, JANGAN disatukan
jadi 1 import generik — beda skema per tipe data.

## Struktur file baru

```
src/app/(with-layout)/master/data-bahan/
  page.tsx                          # Server Component: fetch 5 data source, requireRole
  _components/
    DataBahanPageClient.tsx         # 1 PageHeader + tab bar + 5 kombinasi Table+Modal
```

`page.tsx` fetch data awal buat SEMUA 5 tab sekaligus (5 query paralel via
`Promise.all`, pola sama seperti `bom/baru/page.tsx` yang sudah fetch 3 data
source paralel) — supaya pindah tab tidak perlu re-fetch, cukup pakai
`initialData` yang sudah ada + TanStack Query hook masing-masing tipe
(`useKategoriList`, `useSatuanList`, dst — SEMUA sudah ada, jangan bikin hook baru).

## Route lama

Redirect 5 route lama ke halaman baru dengan query param tab:
- `/master/kategori` → redirect `/master/data-bahan?tab=kategori`
- `/master/satuan` → redirect `/master/data-bahan?tab=satuan`
- `/master/warna` → redirect `/master/data-bahan?tab=warna`
- `/master/bahan` → redirect `/master/data-bahan?tab=bahan`
- `/master/supplier` → redirect `/master/data-bahan?tab=supplier`

Pakai Next.js `redirect()` di `page.tsx` masing-masing folder lama (JANGAN
hapus foldernya — biar link lama/bookmark tetap jalan). `DataBahanPageClient`
baca `?tab=` dari `useSearchParams()` buat set tab awal (default "kategori"
kalau param tidak ada/tidak valid).

**Cek dulu sebelum eksekusi:** grep `href="/master/kategori"` dkk di seluruh
`src/` — ada link internal lain (misal dari halaman Bahan yang link ke Kategori,
atau breadcrumb) yang perlu diarahkan ke `/master/data-bahan?tab=x` juga,
supaya user tidak lompat 2x redirect tanpa sadar.

## Update sidebar

`src/components/layouts/sidebar/data/index.ts` — 5 entry dengan `heading: "Data Bahan"`
diganti jadi 1 entry:
```ts
{ title: "Data Bahan", url: "/master/data-bahan", heading: "Data Bahan" }
```

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. Tiap tab: Tambah, Edit, Hapus (kalau ada), Import Excel — semua jalan seperti
   sebelum digabung, TIDAK ADA regresi fungsi.
3. Pindah tab lalu balik lagi — data tidak hilang/ke-refetch aneh (TanStack Query
   cache harusnya sudah menangani ini otomatis).
4. Buka route lama (`/master/kategori`) — harus redirect ke `/master/data-bahan?tab=kategori`
   dengan tab Kategori aktif.
5. Sidebar: submenu Master Data sekarang lebih pendek (grep jumlah item sebelum
   vs sesudah, harus turun dari 15 ke 11 — 5 item jadi 1).

## Yang TIDAK boleh disentuh

- Isi `<Nama>Table.tsx` dan `<Nama>FormModal.tsx` — reuse APA ADANYA, jangan
  refactor internal logicnya.
- Service/hook (`useKategoriList` dkk) — tidak berubah.
- Jangan hapus 5 folder route lama — cuma isi `page.tsx`-nya diganti jadi redirect.

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — reuse pola CuttingPageClient.
- [ ] Tabel database baru? Tidak.
- [ ] Route baru? Ya — `/master/data-bahan`. Tambahkan ke struktur folder di
      CLAUDE.md kalau relevan (opsional, tidak wajib untuk plan ini).
- [ ] Permission pattern baru? Tidak.
