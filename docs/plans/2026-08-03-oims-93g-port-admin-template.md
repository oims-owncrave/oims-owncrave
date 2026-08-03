# Plan: feat — Port admin dashboard layout (sidebar + header + dark mode)

**Issue:** oims-93g / GH-#<N>
**Date:** 2026-08-03
**Depends:** oims-jpn.4 (Auth — done)
**Blocks:** oims-jpn.3 (user management butuh app shell ini)

---

## Context

OIMS layout masih polos — cuma UI kit primitif, `/dashboard` teks "coming soon". Referensi projek Abu (PMS, school-management, better-planner) semua pakai admin template dashboard. OIMS ikut pola itu: **port admin shell dari PMS** (bukan scaffold dari nol).

**Keputusan final (dari prompt `2026-08-03-oims-port-admin-template-prompt.md`):**
- Sumber port: **PMS** `portfolio-management-service/apps/frontend/src/components/layouts/` (sidebar versi upgrade — collapse desktop 290px↔100px, persist localStorage, mobile drawer+overlay, tooltip saat collapsed, auto-expand submenu aktif).
- **KEEP dark mode** — port `dark:*` + next-themes + theme-toggle. Ini **override CLAUDE.md** yang bilang "belum dark mode, hapus dark:*". CLAUDE.md akan di-update (lihat § CLAUDE.md Check).
- Scope port = **layout shell saja** (sidebar+header+theme). Role guard = jpn.3 (issue lain).

---

## ⚠️ Konflik yang HARUS ditangani (temuan eksplorasi Claude)

Port ini bukan copy-paste mentah. 4 titik konflik:

### 1. Tailwind v3 (PMS/template) vs v4 (OIMS) — RISIKO UTAMA
- OIMS `src/app/globals.css` pakai v4: `@import "tailwindcss"`, tanpa `tailwind.config.js`, tanpa dark tokens.
- PMS/template pakai v3 (`@layer base`, `tailwind.config.ts` dengan custom color tokens).
- Token yang dipakai layout PMS: `bg-gray-2`, `bg-gray-dark`, `text-dark`, `text-dark-4`, `text-dark-6`, `border-stroke`, `border-stroke-dark`, `text-primary`, `bg-dark-2`, `shadow-1`, `text-heading-5`, dll.
- **CARA BENAR:** JANGAN copy `tailwind.config.ts` v3. Definisikan token via **`@theme` block v4** di `globals.css`. Ambil nilai warna dari template `src/css/style.css` (baca `@layer base :root` / `.dark` di sana untuk hex value tiap token), lalu deklarasikan ulang sebagai v4 CSS variables + utility. Dark mode v4: pakai `@custom-variant dark (&:where(.dark, .dark *))` supaya `dark:*` jalan dengan class strategy (next-themes `attribute="class"`).
- **Verifikasi wajib:** setelah port, cek `bg-gray-2`/`dark:bg-gray-dark`/`text-dark-4` benar-benar ter-render (bukan class tak dikenal yang di-drop). Kalau ada token yang tak ke-resolve → tambah ke `@theme`.

### 2. Dark mode strategy
- next-themes `attribute="class"` → toggle class `dark` di `<html>`.
- Root layout (`src/app/layout.tsx`) tambah `suppressHydrationWarning` di `<html>` + bungkus `<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>`.
- Import order: ThemeProvider harus wrap SidebarProvider + konten.

### 3. `cn()` — AMAN
- OIMS `src/lib/utils.ts` sudah `twMerge(clsx(...))` — identik PMS. Pakai apa adanya, JANGAN buat baru.

### 4. Komponen yang TIDAK bisa port apa adanya (ganti/skip)
- **`user-info`**: PMS pakai auth-service microservice (`authService.logout()`, `resolveAuthAppUrl()`, `useUser()`). OIMS TIDAK punya itu. **Ganti**: dropdown user pakai Supabase `auth.getUser()` (server) untuk nama + `signOutAction` dari `src/services/auth.ts` untuk logout. Boleh sederhanakan jadi tombol/inisial + menu logout.
- **`header` search input + `Notification`**: SKIP (belum ada fitur). Header cukup: toggle mobile + judul "OIMS Owncrave" + theme-toggle + user dropdown.
- **`logo`**: PMS pakai Image PNG. **Ganti** teks: expanded "OIMS Owncrave", collapsed "OIMS" (atau logo kalau ada aset). Jangan pakai `@/constants/assets`.
- **`menu-item` Tooltip**: PMS pakai `@/components/ui/tooltip` (hover, `children`-only API). OIMS `Tooltip` beda API (`trigger`+`children`, click-toggle). **Sesuaikan**: wrap tooltip PMS style manual (title on hover saat collapsed) ATAU pakai OIMS Tooltip dengan adaptasi props. Jangan biarkan import error.
- **`permission-guard` / `session-guard`**: SKIP di port ini (RBAC via API 403 backend microservice — tak relevan Supabase). Role guard OIMS = jpn.3.
- Icon imports `@/assets/icons`, `@/assets/logos`: PMS punya folder assets. Salin icon yang dipakai ke `src/components/layouts/**/icons.tsx` (PMS sudah punya `sidebar/icons.tsx`, `header/icons.tsx` — port itu). Icon yang dari `@/assets/*` → ganti pakai `lucide-react` (sudah terpasang, dipakai UI kit OIMS).

---

## Dependencies

```bash
pnpm add next-themes class-variance-authority
```
- `clsx` ✓ sudah ada. `tailwind-merge` ✓ (dipakai cn). `lucide-react` ✓ (dipakai UI kit).

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/hooks/use-mobile.ts` | CREATE — port PMS (breakpoint 850). |
| `src/components/logo.tsx` | CREATE — teks branding OIMS (bukan Image). |
| `src/components/layouts/sidebar/sidebar-context.tsx` | CREATE — port PMS, `STORAGE_KEY = "oims-sidebar-open"`. |
| `src/components/layouts/sidebar/index.tsx` | CREATE — port PMS (versi upgrade, full). |
| `src/components/layouts/sidebar/menu-item.tsx` | CREATE — port PMS, sesuaikan Tooltip. |
| `src/components/layouts/sidebar/icons.tsx` | CREATE — port PMS icons (atau lucide). |
| `src/components/layouts/sidebar/data/index.ts` | CREATE — NAV_DATA OIMS (lihat § NAV_DATA). |
| `src/components/layouts/header/index.tsx` | CREATE — port PMS, skip search+notif, judul OIMS. |
| `src/components/layouts/header/icons.tsx` | CREATE — port PMS. |
| `src/components/layouts/header/theme-toggle/` | CREATE — port PMS (index + icons). |
| `src/components/layouts/header/user-info/index.tsx` | CREATE — Supabase user + signOutAction (bukan auth-service). |
| `src/components/layouts/main-content.tsx` | CREATE — port PMS. |
| `src/components/providers/theme-provider.tsx` | CREATE — next-themes wrapper. |
| `src/app/providers.tsx` | CREATE — QueryClientProvider (pertama kali dipakai; master data juga butuh). |
| `src/app/layout.tsx` | MODIFY — bungkus ThemeProvider + providers, `suppressHydrationWarning`. |
| `src/app/(with-layout)/layout.tsx` | CREATE — `<SidebarProvider><div flex><Sidebar/><MainContent/></div></SidebarProvider>`. |
| `src/app/(with-layout)/dashboard/page.tsx` | MOVE — pindah dari `src/app/dashboard/page.tsx` ke sini (dibungkus sidebar). |
| `src/app/globals.css` | MODIFY — tambah `@theme` token (dark tokens) + `@custom-variant dark`. |

**Signin tetap di `src/app/(auth)/`** — sudah tanpa sidebar, tak perlu group `(without-layout)` terpisah (prompt sebut opsional). `(auth)` group sudah jadi "without-layout".

---

## NAV_DATA OIMS (Tahap 1)

`src/components/layouts/sidebar/data/index.ts` — struktur dari PRD §4 + roadmap. Route yang BELUM ada tetap didaftar (halaman nyusul per issue); yang penting menu tampil.

```
DASHBOARD          → /dashboard
MASTER (submenu)
  ├── Kategori     → /master/kategori
  ├── Satuan       → /master/satuan
  ├── Supplier     → /master/supplier
  └── Bahan        → /master/bahan
INVENTORY (submenu)
  ├── Barang Masuk → /inventory/barang-masuk
  ├── Barang Keluar→ /inventory/barang-keluar
  ├── Stok         → /inventory/stok
  ├── Mutasi       → /inventory/mutasi
  └── Penyesuaian  → /inventory/penyesuaian
LAPORAN (submenu)
  ├── Barang Masuk → /laporan/barang-masuk
  ├── Barang Keluar→ /laporan/barang-keluar
  ├── Stok         → /laporan/stok
  └── Nilai Persediaan → /laporan/nilai-persediaan
SISTEM (submenu)
  ├── Pengguna     → /sistem/pengguna
  ├── Log Aktivitas→ /sistem/log
  └── Pengaturan   → /sistem/pengaturan
```

Icon: pakai `lucide-react` (LayoutDashboard, Boxes, PackageOpen, FileText, Settings, dll) — sudah terpasang. Format NAV_DATA ikut PMS: `[{ label, items: [{ title, url?, icon, items: [{title, url}] }] }]`.

> **Role-based menu hide** = jpn.3, BUKAN di sini. Port ini tampilkan SEMUA menu. jpn.3 tambah filter per role.

---

## Verifikasi (gates)

```bash
pnpm add next-themes class-variance-authority
pnpm run build       # harus clean — perhatikan error token Tailwind / import
```

Manual (`pnpm dev`):
1. `/dashboard` → sidebar muncul kiri + header atas (bukan halaman polos).
2. Klik toggle desktop → sidebar collapse 290px↔100px, label hilang, icon tetap, tooltip saat hover collapsed.
3. Reload → state collapse persist (localStorage `oims-sidebar-open`).
4. Resize < 850px → sidebar jadi drawer + overlay; klik overlay tutup.
5. Theme-toggle → dark/light switch, token (`bg-gray-2`, `bg-gray-dark`) render benar di dua mode.
6. Submenu aktif auto-expand saat route cocok.
7. User dropdown → nama dari Supabase, tombol "Keluar" → `signOutAction` → `/signin`.
8. Signin page (`/signin`) tetap TANPA sidebar.

---

## Commit Template

```
feat(layout): port admin dashboard shell (sidebar + header + dark mode)

- Sidebar (collapse desktop, mobile drawer, persist, tooltip) from PMS
- Header with theme-toggle + user dropdown (Supabase + signOutAction)
- next-themes dark mode, Tailwind v4 @theme tokens
- (with-layout) route group wrapping dashboard
- QueryClientProvider setup (src/app/providers.tsx)

fixes #<N>
```

---

## CLAUDE.md Check
- [x] **Dark mode**: WAJIB update — hapus larangan `dark:*` (baris 39, 103 #6). Catat: dark mode AKTIF (next-themes, class strategy). Update tabel "Kesalahan" #6.
- [x] **Route/struktur baru**: `src/app/(with-layout)/`, `src/components/layouts/`, `src/components/providers/`, `src/app/providers.tsx` → update § Struktur Folder.
- [x] **Pattern baru**: app shell (SidebarProvider + ThemeProvider), NAV_DATA, `cva` untuk variant styling → dokumentasikan.
- [x] **Dependency baru**: `next-themes`, `class-variance-authority` → catat di stack line.
- [ ] Update CLAUDE.md SETELAH port selesai & di-review.
