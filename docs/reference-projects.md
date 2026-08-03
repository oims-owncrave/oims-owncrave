# Reference Projects — OIMS Owncrave

Baca file ini sebelum explore ulang projek referensi — hemat token.

---

## portfolio-management-service — BEST components

**Path:** `/Applications/XAMPP/xamppfiles/htdocs/aw-miscroservices/portfolio-management-service/apps/frontend`
**Stack:** Next.js 16, React 19, **Tailwind v3**, CVA, react-hook-form+zod, lucide-react, sonner
**Components:** `src/components/ui/`

| Component | File | Fitur |
|---|---|---|
| Button | `button.tsx` | CVA variants: primary/green/red/dark/outline* |
| Input | `input-group/index.tsx` | Label, error (RHF), icon left/right |
| Textarea | `input-group/text-area.tsx` | Label, error, resize |
| Select (single, native) | `select.tsx` | Variant form/filter, optgroup, chevron |
| **ComboSelect** | `combo-select.tsx` | **Searchable, multi/single, portal dropdown, checkbox, select-all, groups** — sudah diport ke OIMS `src/components/ui/ComboSelect.tsx` |
| Checkbox | `checkbox.tsx` | Indeterminate state |
| Modal | `modal/modal.tsx` | Portal, size sm/md/lg/xl |
| ConfirmModal | `modal/confirm-modal.tsx` | Confirm dialog |
| Dropdown menu | `dropdown.tsx` | Context-based menu, portal |
| Switch | `switch.tsx` | Toggle |
| Tooltip | `tooltip.tsx` | |
| Tabs | `tabs.tsx` | |
| Skeleton | `skeleton.tsx` | |

**⚠️ Tailwind v3 — perlu port ke v4 saat copy:**
- CVA → ganti variant maps + `cn()` (no CVA)
- Hapus semua `dark:*` classes (OIMS belum dark mode)
- Design token custom → lihat mapping di bawah
- `bg-gradient-to-*` → `bg-linear-to-*` (breaking change v4)
- Spacing `4.5`/`5.5`/`12.5` → round ke Tailwind standard (`px-4`, `py-3`, `pl-11`)

---

## prj-better-planner — Tailwind v4, cn(), manual variants

**Path:** `/Users/abuabdirohman/Documents/Programs/Project/prj-better-planner`
**Stack:** **Tailwind v4**, cn(), lucide-react, flatpickr, tiptap, sonner
**Components:** `src/components/ui/`

Primitives: Button, Input, Dropdown, DropdownItem, Modal, ConfirmModal, Spinner, Skeleton, Tooltip, Slider, RichTextEditor

**Cocok untuk:** Drop-in tanpa translate (sudah v4). Referensi pola manual variants.

---

## school-management — PWA TERBAIK + pagination

**Path:** `/Users/abuabdirohman/Documents/Programs/OpenSource/school-management`
**Stack:** **Tailwind v4**, cn(), Ant Design 5.27, recharts, sonner, SWR
**Components:** `src/components/ui/` + Ant untuk tabel/form kompleks

Primitives: Button (+FAB), Input, Dropdown, Modal, ConfirmModal, Spinner, Skeleton, Tooltip, Pagination, RichTextEditor, LanguageToggle

**PWA pattern (TERBAIK — pakai ini, bukan next-pwa):**
- `public/sw.js` — manual service worker, **versioned** pakai `BUILD_VERSION` → purge cache lama otomatis tiap deploy (anti stale-cache bug)
- `public/manifest.json` — web app manifest
- `src/lib/pwaUtils.ts` — `isInStandaloneMode()`, `canInstallPWA()`, `getBrowserInfo()`
- `src/components/PWA/index.tsx` — SW registration + install prompt + offline indicator + deploy-skew guard
- Pattern deploy-skew guard: deteksi `ChunkLoadError` via `unhandledrejection` → reload sekali (guard `sessionStorage` cegah loop)
- **OIMS sudah salin + sesuaikan**: `src/components/PWA/index.tsx` + `pwaUtils.ts` + `manifest.json` + `sw.js`

**Cocok untuk:** FloatingActionButton, pagination, PWA pattern.

---

## prj-better-finance-v2 — cetakan utama OIMS

**Path:** `/Users/abuabdirohman/Documents/Programs/Project/prj-better-finance-v2`
**Stack:** Next.js 16, **Tailwind v4**, Drizzle ORM, Supabase, TanStack Query, Zustand, lucide-react
**UI kit:** `src/components/ui/`

| Component | File | Notes |
|---|---|---|
| Button | `Button.tsx` | variant: primary/outline/ghost/danger; size: sm/md/lg |
| Input | `Input.tsx` | label, error, icon left/right |
| Select | `Select.tsx` | single, native + chevron; variant form/filter; optgroup |
| MultiSelect | `MultiSelect.tsx` | searchable, portal, checkbox, select-all; clear button |
| ConfirmDialog | `ConfirmDialog.tsx` | Confirm modal |
| Tooltip | `Tooltip.tsx` | |

**Utilities:** `cn()` di `src/lib/utils.ts`; supabase 3-tier di `src/lib/supabase/`

**Patterns:**
- `variant="filter"` → styling tipis untuk filter panel inline
- `variant="form"` → label + border + error state penuh
- Supabase SSR 3-tier: `client.ts` (browser), `server.ts` (Server Components/Actions), `middleware.ts`

---

## source klien lama — JANGAN diulang (referensi "anti-pattern")

**Path:** `~/Documents/second-brain/3.Resources/freelance/aplikasi-produksi/aplikasi sederhana produksi/`
**Stack:** Next.js 16 + Drizzle + Cloudflare Worker (vibe-coded)
**Masalah:**
- Schema `transactions` campur semua tipe (masuk/keluar) → tidak bisa audit per tipe
- Tidak ada nomor dokumen, soft delete, approval flow
- `harga` pakai `integer` (Rupiah, bukan `numeric`) → bisa overflow & tidak bisa desimal
- Tidak ada audit log, mutasi stok immutable
- Worker + Drizzle setup kompleks tapi tidak terpakai optimal

**Reuse schema pattern:** gak ada yang layak diambil — schema OIMS dibangun dari nol mengikuti PRD.

---

## Design Token Mapping: PMS (v3) → OIMS (Tailwind v4)

| PMS token | OIMS Tailwind v4 standar |
|---|---|
| `text-primary` / `bg-primary` / `border-primary` | `text-blue-600` / `bg-blue-600` / `border-blue-600` |
| `border-stroke` | `border-gray-300` |
| `text-dark` | `text-gray-900` |
| `text-dark-5` | `text-gray-400` |
| `text-dark-6` | `text-gray-500` |
| `bg-gray-2` | `bg-gray-100` |
| `bg-gray-3` | `bg-gray-50` |
| `text-red` / `bg-red` / `border-red` | `text-red-500` / `bg-red-500` / `border-red-500` |
| `text-green` / `bg-green` | `text-green-600` / `bg-green-600` |
| `bg-gradient-to-*` | `bg-linear-to-*` (**v4 breaking**) |
| `px-4.5` / `py-5.5` | `px-4` / `py-5` (round ke terdekat) |
| `size-4` | `size-4` (v4 support ✅) |
| semua `dark:*` | **hapus** — OIMS belum dark mode |
