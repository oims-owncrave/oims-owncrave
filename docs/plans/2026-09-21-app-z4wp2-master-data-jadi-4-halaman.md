# app-z4wp poin 2 — Master Data jadi 4 halaman bertab

**Menggantikan** poin 3 (Data Mitra) dan poin 5 (Data QC) di checklist lama —
keduanya dikerjakan sekaligus di sini karena polanya sama persis.

**Keputusan Abu 21 Sep 2026:** 4 halaman, heading dibuang, tab yang tak boleh
dilihat role tertentu **disembunyikan** (bukan ditampilkan abu-abu).

## Kondisi sekarang

Setelah poin 1 selesai, Master Data berisi **12 entri** dalam 4 heading:

| Heading | Entri | Role |
|---|---|---|
| Data Bahan | Data Bahan | semua |
| Data Produk | Produk · **BOM** · Kemasan · Gudang Barang Jadi | BOM: owner+produksi |
| Data Mitra | Supplier · Vendor · Penjahit · Lokasi Produksi · **Tarif Jasa Jahit** | Tarif: owner+produksi |
| Data QC | **Standar QC** · Jenis Cacat · **Bagian Produk** | keduanya: owner+produksi |

Heading yang menaungi satu entri (Data Bahan) sudah tidak berguna — itu yang
memicu issue ini.

## Hasil yang dituju

**12 entri → 4 entri, tanpa heading.**

| Halaman baru | Tab |
|---|---|
| `/master/data-bahan` | Bahan · Kategori · Satuan · Warna *(sudah ada)* |
| `/master/data-produk` | Produk · BOM · Kemasan · Gudang Barang Jadi |
| `/master/data-mitra` | Supplier · Vendor · Penjahit · Lokasi Produksi · Tarif Jasa Jahit |
| `/master/data-qc` | Standar QC · Jenis Cacat · Bagian Produk |

## Dua keberatan lama yang sudah gugur

Checklist 18 Sep menandai beberapa hal "mungkin tetap terpisah". Setelah poin 1
terbukti, alasannya tidak bertahan:

**1. "BOM & Standar QC & Tarif berversi, jangan digabung."**
Berversi bukan alasan. Tab hanya mengganti isi layar — alur versi tetap utuh di
dalam tab itu, persis seperti sekarang. Yang benar-benar tidak boleh digabung
adalah dua hal yang alur kerjanya **saling menyela**, bukan yang kebetulan rumit.

**2. "Produk punya varian, BOM punya halaman anak."**
Yang digabung hanya halaman **daftar**-nya. Klik detail tetap pindah halaman
seperti sekarang (`/produksi/produk/[id]`, `/produksi/bom/[id]`). Yang berubah
cuma dari mana daftarnya dibuka.

Halaman anak yang tetap berdiri sendiri (jangan disentuh):
`produksi/produk/[id]`, `produksi/bom/baru`, `produksi/bom/[id]`,
`produksi/bom/[id]/edit`, `qc/standar/*`.

---

## Pola wajib (sudah terbukti di poin 1)

Tiru `src/app/(with-layout)/master/data-bahan/` — itu hasil poin 1 yang sudah
berjalan, bukan teori.

1. **Reuse `<Nama>Table.tsx` LANGSUNG**, bukan `PageClient.tsx`. Tiap PageClient
   membawa `PageHeader` sendiri; kalau dipanggil apa adanya, hasilnya 4 header
   menumpuk.
2. **Satu `PageHeader`** di komponen gabungan, bukan per tab.
3. **Tiap tab punya state modal sendiri** — jangan satu state global untuk tipe
   data yang berbeda.
4. **Tab sinkron dengan URL** (`?tab=xxx`) supaya bisa di-bookmark, dan route
   lama redirect ke tab yang sesuai.
5. **Route lama jangan dihapus** — ganti `page.tsx`-nya jadi `redirect()`.
   Folder `_components/` tetap, karena Table-nya dipakai halaman gabungan.

## Tab difilter per role — bagian baru yang belum ada di poin 1

Poin 1 tidak perlu ini (keempat tabnya terbuka semua role). Tiga halaman baru
butuh, karena isinya campur.

Halaman menerima role, lalu menyaring daftar tab sebelum dirender:

```tsx
// page.tsx (Server Component)
const user = await getCurrentUser();
const role = user?.role ?? "viewer";
// ...
<DataProdukPageClient role={role} ... />
```

```tsx
// PageClient
const SEMUA_TAB = [
  { key: "produk", label: "Produk", count: produkItems.length },
  { key: "bom", label: "BOM", count: bomItems.length, roles: ["owner", "admin_produksi"] },
  { key: "kemasan", label: "Kemasan", count: kemasanItems.length },
  { key: "gudang", label: "Gudang Barang Jadi", count: gudangItems.length },
] as const;

const tabs = SEMUA_TAB.filter((t) => !t.roles || t.roles.includes(role));
```

**Tiga hal yang mudah salah di sini:**

- **Tab aktif harus divalidasi terhadap `tabs`, bukan `SEMUA_TAB`.** Kalau
  gudang membuka `?tab=bom`, jatuhkan ke tab pertama yang boleh — jangan render
  tab kosong.
- **Data tab terlarang jangan di-fetch sama sekali.** Di `page.tsx`, bungkus
  dengan `opsional()` dari `src/lib/auth.ts` (dibuat di app-qdqu):
  ```tsx
  const bomList = await opsional(listBom(), []);
  ```
  Service-nya sendiri sudah dijaga `requireRole`; tanpa `opsional()` halaman
  akan crash untuk role yang tak berhak — persis bug yang diperbaiki di
  `/produksi/bundling`.
- **Jangan beri guard di level halaman.** Halaman gabungan harus terbuka untuk
  semua role; yang disaring adalah tab-nya. Kalau halaman diberi
  `bolehAkses([...])`, role yang cuma boleh sebagian tab ikut tertolak.

## Entri nav

Ganti 12 entri jadi 4, **tanpa `heading`**:

```ts
{ title: "Data Bahan", url: "/master/data-bahan" },
{ title: "Data Produk", url: "/master/data-produk" },
{ title: "Data Mitra", url: "/master/data-mitra" },
{ title: "Data QC", url: "/master/data-qc" },
```

**Jangan beri `roles` pada keempatnya.** Tiap halaman punya tab yang boleh
dilihat semua role (Produk, Supplier, Jenis Cacat), jadi menyembunyikan seluruh
entri akan menutup akses yang sah.

## Redirect route lama

| Lama | Baru |
|---|---|
| `/produksi/produk` | `/master/data-produk?tab=produk` |
| `/produksi/bom` | `/master/data-produk?tab=bom` |
| `/master/kemasan` | `/master/data-produk?tab=kemasan` |
| `/master/gudang-jadi` | `/master/data-produk?tab=gudang` |
| `/master/supplier` | `/master/data-mitra?tab=supplier` |
| `/vendor/daftar` | `/master/data-mitra?tab=vendor` |
| `/vendor/penjahit` | `/master/data-mitra?tab=penjahit` |
| `/vendor/lokasi` | `/master/data-mitra?tab=lokasi` |
| `/vendor/tarif` | `/master/data-mitra?tab=tarif` |
| `/qc/standar` | `/master/data-qc?tab=standar` |
| `/master/jenis-cacat` | `/master/data-qc?tab=jenis-cacat` |
| `/master/bagian-produk` | `/master/data-qc?tab=bagian-produk` |

⚠️ `/produksi/produk` dan `/produksi/bom` punya halaman anak. Redirect hanya
`page.tsx` di root folder itu — **jangan sentuh** `[id]/page.tsx`, `baru/`,
atau `[id]/edit/`.

⚠️ `/qc/standar` juga punya halaman anak (4 page.tsx). Sama: hanya root.

## Link internal

Grep sebelum lapor selesai:

```bash
grep -rn 'href="/produksi/produk"\|href="/produksi/bom"\|href="/master/kemasan"\|href="/master/gudang-jadi"\|href="/master/supplier"\|href="/vendor/daftar"\|href="/vendor/penjahit"\|href="/vendor/lokasi"\|href="/vendor/tarif"\|href="/qc/standar"\|href="/master/jenis-cacat"\|href="/master/bagian-produk"' src/
```

Termasuk tombol "kembali" di halaman anak — mis. detail BOM yang mengarah balik
ke `/produksi/bom` harus jadi `/master/data-produk?tab=bom`.

Poin 1 menemukan satu di `dashboard/_components/StatCards.tsx`. Cek lagi.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Sidebar Master Data: **4 baris, tanpa heading**.
3. Tiap halaman: **satu** PageHeader, tab berpindah, URL ikut berubah.
4. Buka route lama → mendarat di tab yang benar.
5. **Filter tab (paling penting):** login sebagai `admin_gudang`, buka Data
   Produk → tab BOM **tidak muncul**. Buka Data QC → hanya tab Jenis Cacat.
   Ketik `?tab=bom` langsung → jatuh ke tab pertama yang boleh, tidak kosong
   dan tidak crash.
6. Halaman anak tetap jalan: klik detail produk, detail BOM, edit BOM.
7. Tombol kembali di halaman anak mengarah ke tab yang benar.

## Yang TIDAK dikerjakan

- Tidak menyentuh halaman anak (`[id]`, `baru`, `edit`).
- Tidak menggabungkan menu di luar Master Data — Laporan, Surat Jalan, dan QC
  operasional punya plan sendiri.
- Tidak mengubah `roles` entri nav mana pun selain menghapus 12 entri lama.
