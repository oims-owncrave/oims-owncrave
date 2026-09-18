CONTEXT:
Saya mengerjakan OIMS Owncrave - ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-18-app-bvre-row-loading-overlay-desktop.md

ISSUE: app-bvre / GH-#18
BRANCH: fix/app-bvre-row-loading-overlay-desktop

REQUIREMENTS:
1. HANYA ubah file @src/components/ui/table/table.tsx. Tidak ada file lain yang perlu disentuh.
2. Baca dulu blok desktop (sekitar baris 469-537, di dalam table.processedData.map) dan blok mobile (sekitar baris 297-330) — pahami bedanya SEBELUM edit. Blok mobile JANGAN diubah sama sekali.
3. Ikuti struktur JSX PERSIS seperti yang ditulis di plan (bagian "Implementasi") — plan sudah menyertakan kode lengkapnya, bukan deskripsi abstrak. Copy strukturnya, sesuaikan hanya kalau nomor baris di file sekarang sudah geser.
4. Reuse rumus colSpan yang SUDAH ADA di file yang sama untuk empty-state (~baris 465) dan expanded-row (~baris 529): `visibleColumns.length + (enableSelection ? 1 : 0) + (showRowNumber ? 1 : 0)`. JANGAN hitung dengan cara lain.
5. Spinner sudah diimport di file ini — jangan tambah import baru.
6. Setelah selesai: jalankan `npx tsc --noEmit` — WAJIB 0 error sebelum lapor selesai.
7. JANGAN commit, JANGAN push, JANGAN bd close. Itu ditentukan Abu setelah review.
8. JANGAN deviate dari plan tanpa approval user.

YANG HARUS DIHASILKAN:
- Saat `getRowLoading(item)` return true: satu `<TableCell colSpan={total}>` MENGGANTIKAN seluruh isi baris (checkbox, nomor urut kolom "No.", dan semua kolom data TIDAK dirender). Isinya cuma `<div className="flex items-center justify-center py-3"><Spinner size={20} /></div>`.
- Saat false: render seperti sekarang (checkbox → No. → kolom data), TIDAK berubah.
- Kolom "No." ikut hilang total saat loading — tidak ada pengecualian mempertahankannya.
- Blok mobile (card view) TIDAK berubah sama sekali.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-18-app-bvre-row-loading-overlay-desktop.md
- Rules: @CLAUDE.md
- File yang diubah: @src/components/ui/table/table.tsx

LAPORAN AKHIR (wajib):
- Konfirmasi hanya 1 file yang diubah
- Hasil `npx tsc --noEmit`
- Ringkasan baris yang diubah (before/after singkat)

Mulai sekarang.
