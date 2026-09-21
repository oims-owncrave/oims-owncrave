CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules sebelum mulai.

TASK:
Eksekusi @docs/plans/2026-09-21-app-z4wp2-master-data-jadi-4-halaman.md

ISSUE: app-z4wp poin 2 — Master Data 12 entri jadi 4 halaman bertab.

---

## Pola sudah ADA dan sudah berjalan — tiru, jangan karang sendiri

`src/app/(with-layout)/master/data-bahan/` adalah hasil poin 1 yang sudah
selesai dan terverifikasi. **Baca itu dulu sebelum menulis kode apa pun.**
Struktur, cara sinkron URL, cara state modal dipisah per tab — semuanya sudah
benar di sana.

Yang dibuat sekarang: tiga halaman serupa.

| Halaman baru | Tab |
|---|---|
| `/master/data-produk` | Produk · BOM · Kemasan · Gudang Barang Jadi |
| `/master/data-mitra` | Supplier · Vendor · Penjahit · Lokasi Produksi · Tarif Jasa Jahit |
| `/master/data-qc` | Standar QC · Jenis Cacat · Bagian Produk |

`/master/data-bahan` sudah ada, **jangan diubah**.

---

## Empat hal yang paling mudah salah

**1. Reuse `<Nama>Table.tsx`, BUKAN `PageClient.tsx`.**
Tiap PageClient membawa `PageHeader` sendiri. Kalau dipanggil apa adanya,
hasilnya 4 header menumpuk. Ini jebakan utama, dan sudah terbukti di poin 1.

**2. Tab difilter per role — bagian BARU yang tidak ada di poin 1.**

Poin 1 tidak butuh ini (keempat tabnya terbuka semua role). Tiga halaman ini
isinya campur:

| Halaman | Tab terbatas | Role |
|---|---|---|
| Data Produk | BOM | owner, admin_produksi |
| Data Mitra | Tarif Jasa Jahit | owner, admin_produksi |
| Data QC | Standar QC, Bagian Produk | owner, admin_produksi |

Tab yang tak boleh dilihat **disembunyikan**, bukan ditampilkan abu-abu
(keputusan Abu). Polanya ada di plan — baca bagian "Tab difilter per role".

Tiga jebakan di dalamnya:
- Tab aktif divalidasi terhadap daftar tab yang **sudah difilter**. Kalau gudang
  membuka `?tab=bom`, jatuhkan ke tab pertama yang boleh — jangan render kosong.
- Data tab terlarang **jangan di-fetch**. Bungkus dengan `opsional()` dari
  `@/lib/auth`. Tanpa itu halaman crash untuk role yang tak berhak — persis bug
  yang diperbaiki di `/produksi/bundling` (app-qdqu).
- **Jangan beri guard di level halaman.** Halaman gabungan harus terbuka semua
  role; yang disaring tab-nya. Kalau halaman diberi `bolehAkses([...])`, role
  yang cuma boleh sebagian tab ikut tertolak seluruhnya.

**3. Halaman anak JANGAN disentuh.**
`/produksi/produk` dan `/produksi/bom` punya sub-halaman, begitu juga
`/qc/standar`. Yang jadi redirect **hanya `page.tsx` di root folder**:

```
produksi/produk/page.tsx        ← redirect
produksi/produk/[id]/page.tsx   ← JANGAN SENTUH
produksi/bom/page.tsx           ← redirect
produksi/bom/baru/page.tsx      ← JANGAN SENTUH
produksi/bom/[id]/page.tsx      ← JANGAN SENTUH
produksi/bom/[id]/edit/page.tsx ← JANGAN SENTUH
qc/standar/page.tsx             ← redirect
qc/standar/**                   ← JANGAN SENTUH (3 halaman anak)
```

**4. Entri nav: 12 jadi 4, TANPA `heading` dan TANPA `roles`.**

```ts
{ title: "Data Bahan", url: "/master/data-bahan" },
{ title: "Data Produk", url: "/master/data-produk" },
{ title: "Data Mitra", url: "/master/data-mitra" },
{ title: "Data QC", url: "/master/data-qc" },
```

Heading dibuang karena tiap grup kini tinggal satu entri. `roles` tidak dipakai
karena tiap halaman punya tab yang boleh dilihat semua role — menyembunyikan
seluruh entri akan menutup akses yang sah.

---

## Link internal — jangan lupa tombol kembali

```bash
grep -rn 'href="/produksi/produk"\|href="/produksi/bom"\|href="/master/kemasan"\|href="/master/gudang-jadi"\|href="/master/supplier"\|href="/vendor/daftar"\|href="/vendor/penjahit"\|href="/vendor/lokasi"\|href="/vendor/tarif"\|href="/qc/standar"\|href="/master/jenis-cacat"\|href="/master/bagian-produk"' src/
```

Termasuk tombol "kembali" di halaman anak — detail BOM yang mengarah balik ke
`/produksi/bom` harus jadi `/master/data-produk?tab=bom`. Poin 1 menemukan satu
di `dashboard/_components/StatCards.tsx`; cek lagi.

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. Sidebar Master Data: **4 baris, tanpa heading**
2. Tiap halaman: satu PageHeader, tab berpindah, URL ikut berubah
3. Route lama mendarat di tab yang benar
4. **Filter tab (paling penting):** login `admin_gudang` → Data Produk tanpa tab
   BOM, Data QC hanya tab Jenis Cacat. Ketik `?tab=bom` langsung → jatuh ke tab
   pertama yang boleh, tidak kosong dan tidak crash
5. Halaman anak tetap jalan: detail produk, detail BOM, edit BOM, standar QC
6. Tombol kembali di halaman anak mengarah ke tab yang benar

## Jangan dikerjakan

- `bd close`, `git commit`, `git push` — Abu yang menentukan setelah review
- Mengubah `/master/data-bahan` (sudah selesai di poin 1)
- Menyentuh halaman anak
- Menggabungkan menu di luar Master Data — Laporan dan QC punya plan sendiri

## Laporan akhir (wajib)

- Konfirmasi PageHeader muncul sekali per halaman, bukan per tab
- Hasil `npx tsc --noEmit`
- Daftar link internal yang ditemukan dan diarahkan ulang (atau "tidak ada")
- Konfirmasi halaman anak tidak disentuh
