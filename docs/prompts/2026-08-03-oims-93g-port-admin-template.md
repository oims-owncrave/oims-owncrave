CONTEXT:
Saya mengerjakan OIMS Owncrave — Next.js 16 + React 19 + TS strict + Tailwind v4 + Drizzle + Supabase, pnpm. Layout masih polos (cuma UI kit primitif), /dashboard teks "coming soon". Perlu port admin dashboard shell dari projek referensi PMS.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, constraints. CATATAN: task ini SENGAJA override aturan "belum dark mode" di CLAUDE.md — dark mode WAJIB di-port (lihat plan).

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-03-oims-93g-port-admin-template.md

ISSUE: oims-93g
BRANCH: feat/oims-93g-port-admin-template

SUMBER PORT (baca langsung dari disk, ini di luar repo OIMS):
- Sidebar/header PMS (versi upgrade — PAKAI INI):
  /Applications/XAMPP/xamppfiles/htdocs/aw-miscroservices/portfolio-management-service/apps/frontend/src/components/layouts/
- Template dasar (untuk token warna dark mode — baca src/css/style.css):
  /Users/abuabdirohman/Documents/Programs/Offline/next-js-template/next-admin-dashboard/

REQUIREMENTS:
1. Baca plan LENGKAP dulu, terutama section "⚠️ Konflik yang HARUS ditangani" — ada 4 titik konflik (Tailwind v3→v4 token, dark strategy, user-info microservice→Supabase, Tooltip API beda). JANGAN copy-paste mentah.
2. Baca file sebelum edit. Baca file sumber PMS sebelum port tiap komponen.
3. Install deps: pnpm add next-themes class-variance-authority (clsx/tailwind-merge/lucide-react sudah ada).
4. Tailwind v4: token dark mode via @theme + @custom-variant dark di globals.css — BUKAN copy tailwind.config.ts v3. Ambil hex value dari template src/css/style.css.
5. user-info: pakai Supabase auth.getUser() + signOutAction (@/services/auth.ts). JANGAN pakai authService/resolveAuthAppUrl PMS (microservice, tak ada di OIMS).
6. NAV_DATA: menu OIMS Tahap 1 (Dashboard/Master/Inventory/Laporan/Sistem) — lihat plan § NAV_DATA. Icon pakai lucide-react. Tampilkan SEMUA menu (role hide = issue lain).
7. Skip: permission-guard, session-guard, header search, Notification.
8. QueryClientProvider (src/app/providers.tsx) — buat, master data juga butuh.
9. Pindah dashboard ke src/app/(with-layout)/dashboard/page.tsx. Signin tetap di (auth) tanpa sidebar.
10. Verifikasi gates (lihat plan § Verifikasi): pnpm run build clean, lalu pnpm dev cek collapse/drawer/persist/theme-toggle/submenu-autoexpand.
11. Output per task: "✅ Task N complete: [ringkasan]".
12. JANGAN git commit/push — tunggu Abu.

REFERENCE FILES:
- Plan: @docs/plans/2026-08-03-oims-93g-port-admin-template.md
- Rules: @CLAUDE.md
- Roadmap (menu): @docs/roadmap.md
- UI kit OIMS: @src/components/ui/ (Tooltip API beda dari PMS — cek)
- Auth service: @src/services/auth.ts (signOutAction)
- Supabase server: @src/lib/supabase/server.ts
- cn(): @src/lib/utils.ts (sudah twMerge+clsx, pakai apa adanya)
- globals.css v4: @src/app/globals.css

Mulai dari Task 1 (install deps + use-mobile hook).
