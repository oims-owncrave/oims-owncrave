CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules sebelum mulai.
Hak akses: @docs/hak-akses.md — sumber kebenaran tunggal, jangan menebak.

TASK:
Eksekusi @docs/plans/2026-09-21-app-z4wp5-qc-jadi-tiga-grup.md

ISSUE: app-z4wp poin 5 — QC dipecah jadi 3 grup sidebar + Finishing/Packing jadi tab.

---

## Kenapa memecah grup, bukan menggabung lagi

Poin 4 sudah menggabung dua pasang (QC 10 → 8). Klien bilang masih terlalu
banyak, tapi menggabung lebih jauh mulai berisiko — sisa menunya tahap
berurutan yang saling menyela.

Aplikasi lama klien memberi jalan lain: mereka memisahkan **jalur normal** dari
**jalur pengecualian**, bukan menggabung berdasarkan hulu-hilir.

Hasilnya: **8 entri dalam 1 grup → 7 entri dalam 3 grup**, tiap accordion
2-3 baris. Jumlah total hampir sama, tapi yang bikin terasa sedikit adalah
accordion yang tertutup — petugas QC harian tak pernah melihat menu rework.

---

## Dua pekerjaan terpisah

### A. Gabung Finishing + Packing jadi tab

Tuan rumah `/qc/finishing`, `/qc/packing` jadi redirect ke
`/qc/finishing?tab=packing`.

⚠️ **Role keduanya BERBEDA** — ini bagian tersulitnya:
```
Finishing : owner, admin_produksi
Packing   : owner, admin_produksi, admin_gudang
```

Artinya:
- Guard halaman pakai **union**: `["owner", "admin_produksi", "admin_gudang"]`
  — kalau pakai daftar Finishing saja, gudang tertolak seluruhnya padahal tab
  Packing haknya
- **Tab Finishing perlu `roles` sendiri** `["owner", "admin_produksi"]`, supaya
  gudang yang masuk hanya melihat tab Packing
- Data tab terlarang dibungkus `opsional()` dari `@/lib/auth`, kalau tidak
  halaman crash untuk gudang

Pola penyaringan tab sudah ada dan terbukti di
`src/app/(with-layout)/master/data-produk/` — tiru dari sana, jangan karang.

### B. Pecah grup QC jadi 3 di sidebar

`src/components/layouts/sidebar/data/index.ts` — grup `Quality Control` sekarang
berisi 8 entri, pecah jadi tiga `NavItem` di dalam section `OPERASIONAL`:

| Grup | Entri |
|---|---|
| Quality Control | Penerimaan QC · Work Order QC · Pemeriksaan QC |
| Rework & Karantina | Rework · Karantina Reject |
| Finishing & Gudang | Finishing · Stok Barang Jadi |

Susunan lengkap beserta `roles` tiap entri ada di plan — **salin dari sana**,
jangan menyusun ulang.

⚠️ **`roles` induk harus UNION anak-anaknya.** Kalau induk lebih sempit, grup
dibuang sebelum anaknya sempat diperiksa. Ini pernah terjadi dan diperbaiki di
`app-qr6o` — jangan ulangi.

**Ikon: pakai `QcIcon` untuk ketiga grup.** Sudah diverifikasi, tidak ada ikon
rework maupun gudang di `sidebar/icons.tsx`. Jangan menambah SVG baru — judulnya
sudah membedakan.

### C. Bottom nav — jangan sampai Rework hilang di mobile

`bottom-nav/index.tsx` punya `NAV_SLOTS` yang menunjuk
`navItemTitle: "Quality Control"`. Setelah dipecah, slot itu hanya menampilkan
grup pertama.

Biarkan slot QC menunjuk grup pertama (paling sering dipakai), tapi **pastikan
ketiga grup tetap muncul di sheet "Menu"**. Cek di lebar < 850px sebelum lapor
selesai.

---

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. Sidebar: **3 accordion terpisah**, masing-masing 2-3 baris
2. `/qc/packing` mendarat di tab Packing
3. **Alur kerja** (tidak terbukti dari typecheck): catat satu finishing, pindah
   ke tab Packing → item itu muncul sebagai kandidat. Kalau tidak muncul,
   invalidate query belum mencakup tab sebelah — polanya sama dengan yang
   ditambahkan di `useRework.ts` pada poin 4. Perbaiki sebelum lapor selesai.
4. **Filter role** — login `admin_gudang`:
   - grup "Rework & Karantina" **tidak muncul sama sekali**
   - grup "Finishing & Gudang" muncul, tapi membuka `/qc/finishing` hanya
     menampilkan **tab Packing** (tab Finishing tersembunyi)
   - ketik `?tab=finishing` langsung → jatuh ke tab Packing, tidak kosong dan
     tidak crash
5. **Mobile**: sheet "Menu" di lebar < 850px menampilkan ketiga grup

## Jangan dikerjakan

- **Work Order + Pemeriksaan JANGAN digabung.** Tahap berurutan yang saling
  menyela: WO dibuat dulu, pemeriksaan mengisinya. Kalau jadi tab, user
  bolak-balik saat memeriksa banyak WO.
- **Karantina Reject JANGAN jadi tab.** Butuh approval sebelum berdampak ke
  stok — alur persetujuan perlu layar penuh.
- `/vendor/surat-jalan` — keputusan tertunda dari poin 4, jangan disentuh
- Menambah ikon baru
- `bd close`, `git commit`, `git push` — Abu yang menentukan setelah review

## Laporan akhir (wajib)

- Hasil `npx tsc --noEmit`
- Konfirmasi ketiga grup muncul di sidebar DAN di sheet Menu mobile
- Hasil uji alur: apakah item muncul di tab Packing setelah mencatat finishing
- Hasil uji role gudang: tab mana yang muncul di `/qc/finishing`
- Daftar link internal yang diarahkan ulang (atau "tidak ada")
