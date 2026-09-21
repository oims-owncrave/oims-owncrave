# app-z4wp poin 5 — QC dipecah jadi 3 grup sidebar

**Keputusan Abu 21 Sep 2026 malam**, setelah klien bilang menu QC masih terlalu
banyak dan mengirim skema alur produksinya.

## Kenapa memecah grup, bukan menggabung lagi

Poin 4 sudah menggabung dua pasang (10 → 8). Menggabung lebih banyak mulai
berisiko: sisa menunya adalah tahap berurutan yang saling menyela.

Tapi **aplikasi lama klien** memberi jalan lain. Mereka membagi QC jadi dua grup
sidebar:

```
Quality Control          Rework & Karantina
├── Pengiriman QC        ├── Rework
└── Quality Control      ├── Penerimaan Rework
                         ├── QC Ulang
                         └── Karantina Reject
```

Klien memisahkan **jalur normal** dari **jalur pengecualian** — bukan
menggabungkan berdasarkan hulu-hilir seperti yang saya lakukan di poin 4.

Skema yang dikirim klien memperjelas: alur utamanya lurus
(`Penjahit → QC → Penerimaan Gudang → Stok Jaket Jadi`), dan `Retur/Perbaikan`
digambar sebagai **cabang merah** yang keluar saat "Tidak Lolos" lalu kembali ke
penjahit.

Pembagian itu lebih baik untuk kasus ini: petugas QC harian hanya membuka satu
accordion. Grup rework dibuka hanya saat ada barang bermasalah. Accordion yang
tertutup membuat menu terasa sedikit — dan itu yang diminta klien, bukan angka
totalnya.

## Hasil yang dituju

| Grup baru | Entri | Isi tab |
|---|---|---|
| **Quality Control** | Penerimaan QC | Penerimaan · Antrean *(sudah)* |
| | Work Order QC | — |
| | Pemeriksaan QC | — |
| **Rework & Karantina** | Rework | Rework · Re-QC *(sudah)* |
| | Karantina Reject | — |
| **Finishing & Gudang** | Finishing | Finishing *(produksi)* · **Packing** *(+gudang, baru)* |
| | Stok Barang Jadi | — |

**8 entri dalam 1 grup → 7 entri dalam 3 grup**, tiap accordion 2-3 baris.

## Bagian A — Gabung Finishing + Packing jadi tab

Satu-satunya penggabungan baru di poin ini.

Alasannya kuat dan dari dua arah:

1. `docs/konsep-produksi.md` baris 20 menulisnya sebagai **satu langkah**:
   `→ Finishing & Packing`
2. `packing.ts` baris 55-64 memakai *"Baris finishing selesai yang belum
   dipacking"* — pola hulu-hilir yang **sama persis** dengan Antrean terhadap
   Penerimaan, yang sudah terbukti aman di poin 4.

Tuan rumah: `/qc/finishing`. `/qc/packing` jadi redirect ke
`/qc/finishing?tab=packing`.

⚠️ Role keduanya **BERBEDA** — diverifikasi 21 Sep di
`sidebar/data/index.ts` baris 147-148:
```
Finishing : owner, admin_produksi
Packing   : owner, admin_produksi, admin_gudang
```

Jadi tab Packing perlu `roles` sendiri, dan guard halaman memakai
**union** keduanya (`owner, admin_produksi, admin_gudang`) supaya gudang tetap
bisa masuk untuk melihat tab Packing. Pola penyaringan tab ada di
`master/data-produk/`.

Data tab yang mungkin tak boleh dilihat dibungkus `opsional()` dari
`@/lib/auth`.

## Bagian B — Pecah jadi 3 grup di sidebar

`src/components/layouts/sidebar/data/index.ts`. Grup `Quality Control` sekarang
berisi 8 entri; pecah jadi tiga `NavItem` terpisah di dalam section
`OPERASIONAL`.

```ts
{
  title: "Quality Control",
  roles: ["owner", "admin_gudang", "admin_produksi"],  // union anak-anaknya
  icon: QcIcon,
  items: [
    { title: "Penerimaan QC", url: "/qc/penerimaan", roles: ["owner", "admin_gudang", "admin_produksi"] },
    { title: "Work Order QC", url: "/qc/wo", roles: ["owner", "admin_produksi"] },
    { title: "Pemeriksaan QC", url: "/qc/pemeriksaan", roles: ["owner", "admin_produksi"] },
  ],
},
{
  title: "Rework & Karantina",
  roles: ["owner", "admin_produksi"],
  icon: QcIcon,   // tidak ada ikon rework — lihat catatan di bawah
  items: [
    { title: "Rework", url: "/qc/rework", roles: ["owner", "admin_produksi"] },
    { title: "Karantina Reject", url: "/qc/reject", roles: ["owner", "admin_produksi"] },
  ],
},
{
  title: "Finishing & Gudang",
  roles: ["owner", "admin_produksi", "admin_gudang"],   // union
  icon: QcIcon,
  items: [
    // gudang ikut karena tab Packing di dalamnya, bukan karena Finishing-nya.
    // Saring tabnya di dalam halaman — gudang hanya melihat tab Packing.
    { title: "Finishing", url: "/qc/finishing", roles: ["owner", "admin_produksi", "admin_gudang"] },
    { title: "Stok Barang Jadi", url: "/qc/stok-jadi", roles: ["owner", "admin_produksi", "admin_gudang"] },
  ],
},
```

⚠️ **`roles` induk harus UNION anak-anaknya.** Kalau induk lebih sempit, grup
dibuang sebelum anaknya sempat diperiksa — pernah terjadi dan diperbaiki di
`app-qr6o`.

### Ikon — pakai yang sudah ada

Diverifikasi 21 Sep: `src/components/layouts/sidebar/icons.tsx` **tidak punya**
ikon rework maupun gudang. Yang tersedia: DashboardIcon, MasterIcon,
InventoryIcon, ProduksiIcon, VendorIcon, DekorasiIcon, QcIcon, MonitoringIcon,
LaporanIcon, SistemIcon, StokIcon, BarangMasukIcon, BarangKeluarIcon, LogIcon,
PenggunaIcon, PengaturanIcon, PageIcon.

**Pakai `QcIcon` untuk ketiga grup.** Jangan menambah ikon baru — judulnya sudah
membedakan, dan menambah SVG berarti menyentuh file yang tak ada hubungannya
dengan issue ini.

Kalau nanti ingin dibedakan, itu kartu tersendiri.

## Bagian C — Bottom nav

`src/components/layouts/bottom-nav/index.tsx` punya `NAV_SLOTS` yang menunjuk
`navItemTitle: "Quality Control"`. Setelah dipecah, slot itu hanya akan
menampilkan 3 entri pertama.

Putuskan: biarkan slot QC menunjuk grup pertama saja (paling sering dipakai),
atau tambah slot. **Jangan sampai Rework hilang dari mobile tanpa disadari** —
cek sheet "Menu" setelah perubahan.

## Redirect

| Lama | Baru |
|---|---|
| `/qc/packing` | `/qc/finishing?tab=packing` |

Route lain **tidak berubah** — yang berubah hanya pengelompokan di sidebar.

## Link internal

```bash
grep -rn 'href="/qc/packing"\|push("/qc/packing")' src/
```

Termasuk tombol lanjut dari Finishing ke Packing kalau ada.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Sidebar: **3 accordion terpisah**, masing-masing 2-3 baris.
3. `/qc/packing` mendarat di tab Packing.
4. **Alur kerja:** catat satu finishing, pindah ke tab Packing → item itu muncul
   sebagai kandidat. Kalau tidak, invalidate query belum mencakup tab sebelah
   (pola yang sama dengan `useRework` di poin 4).
5. **Filter role:** login `admin_gudang` → grup "Rework & Karantina" **tidak
   muncul sama sekali**; grup "Finishing & Gudang" muncul dengan kedua entri.
6. **Mobile:** buka sheet "Menu" di lebar < 850px, pastikan ketiga grup muncul
   dan Rework tidak hilang.

## Yang TIDAK dikerjakan

- Tidak menggabungkan Work Order + Pemeriksaan. Keduanya tahap berurutan yang
  saling menyela: WO dibuat dulu, pemeriksaan mengisinya. Kalau jadi tab, user
  bolak-balik saat memeriksa banyak WO.
- Tidak memindahkan Karantina Reject jadi tab. Butuh approval sebelum berdampak
  ke stok — alur persetujuan perlu layar penuh.
- Tidak menyentuh `/vendor/surat-jalan` (keputusan tertunda dari poin 4).
