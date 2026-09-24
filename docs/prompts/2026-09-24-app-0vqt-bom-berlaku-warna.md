# Prompt Antigravity — app-0vqt

CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen (Next.js 16 + React 19 + Drizzle + Supabase).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

> CATATAN: Task 1 (DB migration) SUDAH dieksekusi Claude via MCP ke dev DAN prod.
> Kolom `bom_detail.berlaku_warna_ids uuid[]` sudah ada, `src/db/schema.ts` sudah ter-update
> (`bomDetail.berlakuWarnaIds`), `npx tsc --noEmit` 0 error. **Mulai dari Task 2.**

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-24-app-0vqt-bom-berlaku-warna.md
Ringkas: Baris BOM bisa dibatasi per warna varian (bom_detail.berlaku_warna_ids, null = semua). Estimasi PO menyaring ukuran DAN warna lewat helper pcsBerlaku().

ISSUE: app-0vqt / GH-#24

REQUIREMENTS:
1. Ikuti plan task-by-task berurutan. Baca file sebelum edit.
2. Kalau plan punya test (npx tsx ...), tulis test dulu → FAIL → implement → PASS.
3. Setelah semua task: `npx tsc --noEmit` harus 0 error.
4. JANGAN jalankan migration / ubah DB — tidak ada akses, dan tidak perlu.
5. JANGAN git commit. Tunggu review.
6. Output per task: "✅ Task N complete: [ringkasan]".
7. JANGAN deviate dari plan tanpa approval user. Ragu → berhenti dan tanya.

REFERENCE FILES:
- Plan: @docs/plans/2026-09-24-app-0vqt-bom-berlaku-warna.md
- Rules: @CLAUDE.md
- src/lib/bom-ukuran.ts + src/lib/bom-ukuran.test.ts
- src/lib/produksi/estimasi.ts
- src/services/po-produksi.ts
- src/services/bom.ts
- src/services/produk.ts
- src/services/import.ts
- src/app/(with-layout)/produksi/bom/**
- src/app/(with-layout)/master/data-produk/_components/DataProdukPageClient.tsx
- docs/konsep-produksi.md

Mulai dari Task 2.
