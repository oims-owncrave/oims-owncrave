# Prompt Antigravity — app-2ar3

CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen (Next.js 16 + React 19 + Drizzle + Supabase).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-24-app-2ar3-stok-kolom-warna.md
Ringkas: Tabel Stok Bahan dapat kolom Warna (join bahan.warna_id → warna.nama). 2 file, tanpa migration.

ISSUE: app-2ar3 / GH-#22

REQUIREMENTS:
1. Ikuti plan task-by-task berurutan. Baca file sebelum edit.
2. Kalau plan punya test (npx tsx ...), tulis test dulu → FAIL → implement → PASS.
3. Setelah semua task: `npx tsc --noEmit` harus 0 error.
4. JANGAN jalankan migration / ubah DB — tidak ada akses, dan tidak perlu.
5. JANGAN git commit. Tunggu review.
6. Output per task: "✅ Task N complete: [ringkasan]".
7. JANGAN deviate dari plan tanpa approval user. Ragu → berhenti dan tanya.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-24-app-2ar3-stok-kolom-warna.md
- Rules: @CLAUDE.md
- src/services/stok.ts
- src/app/(with-layout)/inventory/stok/_components/StokTable.tsx
- src/services/bahan.ts (contoh join warna, baris ~77)

Mulai dari Task 1.
