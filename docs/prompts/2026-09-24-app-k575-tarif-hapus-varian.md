# Prompt Antigravity — app-k575

CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen (Next.js 16 + React 19 + Drizzle + Supabase).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-24-app-k575-tarif-hapus-varian.md
Ringkas: Buang pilihan Varian dari form & tabel Tarif Jasa Jahit. HANYA UI — kolom DB, zod schema, dan service tetap (varianId dikirim null).

ISSUE: app-k575 / GH-#23

REQUIREMENTS:
1. Ikuti plan task-by-task berurutan. Baca file sebelum edit.
2. Kalau plan punya test (npx tsx ...), tulis test dulu → FAIL → implement → PASS.
3. Setelah semua task: `npx tsc --noEmit` harus 0 error.
4. JANGAN jalankan migration / ubah DB — tidak ada akses, dan tidak perlu.
5. JANGAN git commit. Tunggu review.
6. Output per task: "✅ Task N complete: [ringkasan]".
7. JANGAN deviate dari plan tanpa approval user. Ragu → berhenti dan tanya.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-24-app-k575-tarif-hapus-varian.md
- Rules: @CLAUDE.md
- src/app/(with-layout)/vendor/tarif/_components/TarifFormModal.tsx
- src/app/(with-layout)/vendor/tarif/_components/TarifTable.tsx

Mulai dari Task 1.
