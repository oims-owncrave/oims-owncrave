CONTEXT:
Saya mengerjakan OIMS Owncrave - ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-18-app-7u06-row-highlight-loading.md

ISSUE: app-7u06 / GH-#17
BRANCH: feat/app-7u06-row-highlight-loading

REQUIREMENTS:
1. Baca dulu file referensi wajib: @src/app/(with-layout)/produksi/bom/_components/BomTable.tsx — ini pola yang HARUS diikuti persis (state loadingRowId + useEffect lepas kuncian + getRowLoading di DataTable). JANGAN improvisasi pola baru.
2. Plan membagi 18 file jadi 2 grup dengan cara kerja BEDA — baca bagian "Dua grup file" di plan sebelum mulai:
   - Grup A (13 file): SUDAH punya state `pendingId` dari pekerjaan sebelumnya (app-9bkl). Cukup tambah 1 baris prop `getRowLoading={(item) => item.id === pendingId}` di `<DataTable>` yang sudah ada. JANGAN bikin state baru untuk file-file ini.
   - Grup B (5 file): BELUM punya pola apa pun. Terapkan pola LENGKAP dari BomTable (state baru + useEffect + getRowLoading).
3. Untuk Grup A: baca isi tiap file dulu, pastikan nama variable pending yang dipakai untuk ROW ACTION (biasanya `pendingId`) — bukan variable untuk tombol tunggal seperti `isPendingNew`/`isPendingTemplate`. Beberapa file (PoTable, DekorasiTable) punya lebih dari satu useTransition, pilih yang benar.
4. Kerjakan SATU FILE PENUH dulu dari tiap grup (misal: 1 dari Grup A, 1 dari Grup B), jalankan `npx tsc --noEmit` untuk pastikan pola benar, BARU lanjut ke sisa file dengan pola yang sudah tervalidasi. Jangan ubah 18 file sekaligus lalu baru cek — kalau pola salah, semua kena.
5. Cek temuan khusus PoTable (klik icon mata kadang tidak menavigasi saat dev server sibuk compile, dicatat 17 Sep) — lihat bagian "Temuan yang HARUS dicek" di plan. JANGAN diam-diam "fix" ini — cuma catat sebagai temuan terpisah di laporan akhir.
6. Setelah SEMUA 18 file selesai: jalankan `npx tsc --noEmit` — WAJIB 0 error sebelum lapor selesai.
7. Output per file: "✅ [nama file] selesai — Grup [A/B]"
8. JANGAN commit, JANGAN push, JANGAN bd close. Itu ditentukan Abu setelah review.
9. JANGAN deviate dari plan tanpa approval user.

18 FILE TARGET (path lengkap ada di plan, ini ringkasan):

Grup A (13, reuse pendingId):
- inventory/barang-keluar/BarangKeluarTable.tsx
- inventory/barang-masuk/BarangMasukTable.tsx
- produksi/wo-cutting/WoTable.tsx
- produksi/penerimaan-cutting/PenerimaanTable.tsx
- produksi/po/PoTable.tsx
- produksi/permintaan-bahan/PbTable.tsx
- vendor/penerimaan/PenerimaanTable.tsx
- vendor/surat-jalan/SuratJalanTable.tsx
- vendor/penugasan/PenugasanTable.tsx
- vendor/dekorasi/DekorasiTable.tsx
- vendor/retur/ReturTable.tsx
- vendor/pengiriman/PengirimanTable.tsx
- vendor/wip/WipJahitClient.tsx

Grup B (5, pola penuh BomTable):
- sistem/log/AuditLogTable.tsx
- qc/pemeriksaan/HasilQcTable.tsx
- qc/reject/KarantinaPageClient.tsx
- qc/standar/StandarQcTable.tsx
- qc/wo/WoQcTable.tsx

REFERENCE FILES:
- Plan: @docs/plans/2026-09-18-app-7u06-row-highlight-loading.md
- Rules: @CLAUDE.md
- Pola wajib: @src/app/(with-layout)/produksi/bom/_components/BomTable.tsx
- Definisi prop: @src/components/ui/table/table.tsx (baris ~49, `getRowLoading`)

LAPORAN AKHIR (wajib, sebelum selesai):
- Tabel: file | grup (A/B) | status
- Hasil `npx tsc --noEmit`
- Temuan PoTable (sesuai poin 5) — laporkan meski hasilnya "cuma dev-server-lambat, bukan bug"
- File yang benar-benar diubah

Mulai dari file pertama Grup A.
