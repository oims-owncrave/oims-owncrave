# Prompt Antigravity — app-0mc0

CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen (Next.js 16 + React 19 + Drizzle + Supabase).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

> SYARAT: app-0vqt harus sudah selesai & di-merge (butuh kolom Warna + `BOM_IMPORT_COLUMNS`). Kalau `src/lib/import/bom-columns.ts` belum ada → STOP, lapor.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-24-app-0mc0-bom-form-import-excel.md
Ringkas: Tombol Import Excel di form Buat BOM yang MENGISI baris form (tidak menyimpan). Reuse ImportExcelModal + logika importBomBatch.

ISSUE: app-0mc0 / GH-#25

REQUIREMENTS:
1. Ikuti plan task-by-task berurutan. Baca file sebelum edit.
2. Kalau plan punya test (npx tsx ...), tulis test dulu → FAIL → implement → PASS.
3. Setelah semua task: `npx tsc --noEmit` harus 0 error.
4. JANGAN jalankan migration / ubah DB — tidak ada akses, dan tidak perlu.
5. JANGAN git commit. Tunggu review.
6. Output per task: "✅ Task N complete: [ringkasan]".
7. JANGAN deviate dari plan tanpa approval user. Ragu → berhenti dan tanya.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-24-app-0mc0-bom-form-import-excel.md
- Rules: @CLAUDE.md
- src/services/import.ts
- src/components/ui/import/ImportExcelModal.tsx
- src/app/(with-layout)/produksi/bom/_components/BomForm.tsx
- src/lib/import/bom-columns.ts

Mulai dari Task 1.
