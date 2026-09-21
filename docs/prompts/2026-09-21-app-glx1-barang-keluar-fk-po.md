CONTEXT:
Saya mengerjakan OIMS Owncrave - ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-21-app-glx1-barang-keluar-fk-po.md

ISSUE: app-glx1 / GH-#20
BRANCH: fix/app-glx1-barang-keluar-fk-po

CATATAN PENTING: Task 1 (DB migration + update src/db/schema.ts) SUDAH DIEKSEKUSI Claude via MCP saat planning. Kolom `tujuan` sudah TIDAK ADA di DB dev maupun di schema.ts, kolom `poId` (notNull) sudah ada. **Mulai dari Task 2.** Jangan jalankan migration apa pun.

BASELINE TYPECHECK: saat ini `npx tsc --noEmit` menghasilkan **13 error** di 6 file — itu WAJAR dan disengaja (kolom lama sudah dihapus dari schema, jadi pemakaian yang tertinggal gagal compile). 4 di antaranya milik issue ini:
- `src/services/barang-keluar.ts` — 3 error (baris 76, 166, 181)
- `src/services/laporan.ts` — 1 error (baris 141)

Sisanya (bundling, penerimaan-hasil-jahit, pengiriman-jahit, penugasan-jahit) milik issue LAIN (app-gtf4.1) — **jangan disentuh**, biarkan error-nya. Kalau dua issue dikerjakan bersamaan, barulah semua 13 harus nol.

REQUIREMENTS:
1. Baca plan file lengkap dulu sebelum menulis kode apa pun.
2. Kerjakan Task 2 → 3 → 4 → 5 berurutan. Tiap task sudah menyebut file + nomor baris + potongan kode.
3. Nomor baris di plan berdasarkan kondisi saat planning — kalau sudah geser, cari berdasarkan isi barisnya, jangan percaya nomor buta.
4. Task 3 ada **guard konsistensi PB↔PO** yang wajib ditambahkan (kalau PB dipilih, poId harus sama dengan permintaanBahan.poId). Jangan dilewat — ini yang mencegah data saling bertentangan.
5. Task 4 butuh sumber data PO untuk dropdown. Cek dulu bagaimana `pbOptions` disediakan sekarang (kemungkinan di `baru/page.tsx`), ikuti pola yang sama persis.
6. Setelah semua task: `npx tsc --noEmit` — **4 error milik issue ini (barang-keluar.ts, laporan.ts) harus hilang**. Error di file milik issue lain boleh tersisa (lihat BASELINE di atas). Kalau kamu juga mengerjakan app-gtf4.1 di sesi yang sama, barulah target 0 error total.
7. Hati-hati saat grep kata "tujuan": ada kolom lain yang namanya mirip di tabel berbeda (`lokasiTujuanId`, `bundling.tujuanPenjahit`, `gudangTujuanId`). JANGAN ikut diubah — di luar scope.
8. JANGAN commit, JANGAN push, JANGAN bd close. Itu ditentukan Abu setelah review.
9. JANGAN deviate dari plan tanpa approval user.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-21-app-glx1-barang-keluar-fk-po.md
- Rules: @CLAUDE.md
- Schema (sudah ter-update): @src/db/schema.ts (cari `barangKeluar`, sekitar baris 563)
- Zod: @src/lib/schemas/barang-keluar.ts
- Service: @src/services/barang-keluar.ts
- Form: @src/app/(with-layout)/inventory/barang-keluar/_components/BarangKeluarForm.tsx
- Tabel: @src/app/(with-layout)/inventory/barang-keluar/_components/BarangKeluarTable.tsx
- Laporan: @src/app/(with-layout)/laporan/barang-keluar/_components/LaporanBarangKeluarTable.tsx

LAPORAN AKHIR (wajib):
- Hasil `npx tsc --noEmit`
- Daftar file yang diubah
- Konfirmasi guard PB↔PO sudah terpasang (Task 3)
- Kalau ada pemakaian `tujuan` yang kamu temukan di luar daftar plan, sebutkan — jangan diam-diam diubah

Mulai dari Task 2.
