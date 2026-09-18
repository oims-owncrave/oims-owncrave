CONTEXT:
Saya mengerjakan OIMS Owncrave - ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-18-app-z4wp1-gabung-data-bahan-tab.md

ISSUE: app-z4wp (poin 1 dari checklist) / GH-#19
BRANCH: feat/app-z4wp1-gabung-data-bahan-tab

REQUIREMENTS:
1. Baca dulu pola wajib: @src/app/(with-layout)/produksi/cutting/_components/CuttingPageClient.tsx — ini struktur tab yang harus ditiru (useState<Tab>, array tabs dengan count, tombol border-bottom aktif).
2. Baca SEMUA 5 PageClient lama sebelum mulai: KategoriPageClient.tsx, SatuanPageClient.tsx, WarnaPageClient.tsx, BahanPageClient.tsx, SupplierPageClient.tsx — pahami state dan config ImportExcelModal masing-masing sebelum dipindah.
3. PENTING: reuse komponen `<Nama>Table.tsx` LANGSUNG (bukan PageClient) — baca bagian "PERHATIAN" di plan untuk alasannya. Kalau ini diabaikan, hasilnya 5 PageHeader numpuk.
4. Tiap tab punya state modal sendiri (jangan 1 state global untuk 5 tab beda tipe data).
5. Buat 1 file baru: src/app/(with-layout)/master/data-bahan/page.tsx + _components/DataBahanPageClient.tsx
6. Redirect 5 route lama (jangan hapus foldernya, cukup ganti page.tsx jadi redirect()).
7. Update sidebar: src/components/layouts/sidebar/data/index.ts — 5 entry "Data Bahan" jadi 1 entry.
8. Grep link internal (href="/master/kategori" dkk) di seluruh src/ sebelum lapor selesai — arahkan ke /master/data-bahan?tab=x kalau ketemu.
9. Setelah selesai: `npx tsc --noEmit` — WAJIB 0 error.
10. JANGAN commit, JANGAN push, JANGAN bd close. Itu ditentukan Abu setelah review.
11. JANGAN deviate dari plan tanpa approval user.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-18-app-z4wp1-gabung-data-bahan-tab.md
- Rules: @CLAUDE.md
- Pola tab wajib: @src/app/(with-layout)/produksi/cutting/_components/CuttingPageClient.tsx
- 5 PageClient lama (baca semua): @src/app/(with-layout)/master/kategori/_components/KategoriPageClient.tsx, @src/app/(with-layout)/master/satuan/_components/SatuanPageClient.tsx, @src/app/(with-layout)/master/warna/_components/WarnaPageClient.tsx, @src/app/(with-layout)/master/bahan/_components/BahanPageClient.tsx, @src/app/(with-layout)/master/supplier/_components/SupplierPageClient.tsx
- Sidebar: @src/components/layouts/sidebar/data/index.ts

LAPORAN AKHIR (wajib):
- Konfirmasi PageHeader cuma muncul 1x (bukan numpuk per tab)
- Hasil npx tsc --noEmit
- Daftar link internal yang ditemukan & diarahkan ulang (atau "tidak ada" kalau nol hasil)
- File yang dibuat/diubah

Mulai dari Task 1 (baca 5 PageClient dulu sebelum tulis kode apa pun).
