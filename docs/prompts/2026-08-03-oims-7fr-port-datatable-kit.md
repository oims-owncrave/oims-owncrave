CONTEXT:
Saya mengerjakan OIMS Owncrave — Next.js 16 ERP produksi garmen. Admin shell (sidebar+header+dark mode) sudah ada, di-port dari PMS. Sekarang port DataTable kit dari PMS juga (tabel kaya fitur, bukan plain HTML table).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-03-oims-7fr-port-datatable-kit.md

ISSUE: oims-7fr
BRANCH: feat/oims-7fr-port-datatable-kit

SUMBER PORT (baca dari disk, di luar repo OIMS):
/Applications/XAMPP/xamppfiles/htdocs/aw-miscroservices/portfolio-management-service/apps/frontend/src/components/ui/table/
+ dependency: .../src/components/ui/checkbox.tsx

REQUIREMENTS:
1. Baca plan LENGKAP dulu, terutama section "⚠️ Konflik / adaptasi" (v3→v4 token, Checkbox baru, Tooltip API beda).
2. Baca tiap file PMS sebelum port. JANGAN copy-paste mentah — adaptasi v4.
3. Token dark mode: REUSE @theme di globals.css (sudah ada dari oims-93g). Tambah token baru ke @theme kalau perlu.
4. cn() OIMS sudah twMerge+clsx — reuse (@src/lib/utils.ts).
5. Tooltip OIMS beda API dari PMS (trigger+children, click-based) — sesuaikan headerTooltip.
6. Task 5: refactor UserTable (@src/components/user/UserTable.tsx) pakai DataTable declarative. Pertahankan badge role/status + aksi Edit/Nonaktifkan + ConfirmDialog + guard isSelf.
7. Setelah semua: pnpm run type-check + pnpm run build.
8. Output per task: "✅ Task N complete: [ringkasan]".
9. JANGAN git commit/push. JANGAN ubah src/db/schema.ts.

REFERENCE FILES:
- Plan: @docs/plans/2026-08-03-oims-7fr-port-datatable-kit.md
- Rules: @CLAUDE.md
- cn: @src/lib/utils.ts
- Tooltip OIMS (API beda): @src/components/ui/Tooltip.tsx
- globals.css v4 tokens: @src/app/globals.css
- UserTable (refactor Task 5): @src/components/user/UserTable.tsx

Mulai dari Task 1 (port Checkbox).
