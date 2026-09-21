# app-qr6o — Sidebar difilter per role (level item & subitem)

**Prioritas:** P2 · **Tipe:** bug
**Scope:** MENU SAJA (Opsi A) — keputusan Abu 21 Sep 2026: "sementara agar cepat A dulu"

## ⚠️ Batas scope yang harus dipahami

**Menyembunyikan menu BUKAN proteksi akses.** Proyek ini tidak punya `middleware.ts`
(sudah dicek: tidak ada di root maupun `src/`). Guard hanya per-halaman, dan tidak
merata — `inventory/stok/page.tsx` tidak punya guard sama sekali.

Artinya setelah issue ini selesai, user yang menunya disembunyikan **tetap bisa
mengetik URL** dan halamannya terbuka. Itu diterima untuk sekarang, disengaja, dan
sudah dicatat di `CLAUDE.md` bagian "Utang Teknis yang Diketahui".

Jangan menambahkan guard route di issue ini — peta role→route adalah keputusan bisnis
yang belum diambil.

## Kondisi sekarang (bukan "belum difilter")

Filter sudah ada dan jalan, tapi **terlalu kasar**:

`src/components/layouts/sidebar/data/index.ts`:
- `NavSection` (L32-36) punya `ownerOnly?: boolean` — satu-satunya field role
- Dipakai **sekali**: L181, section "SISTEM"
- `NavItem` (L24-30) dan `NavSubItem` (L15-22) **tidak punya field role sama sekali**

Jadi semua section selain SISTEM tampil penuh ke semua role.

### Tiga tempat yang memfilter — harus diubah bersamaan

| File | Baris | Catatan |
|---|---|---|
| `src/components/layouts/sidebar/index.tsx` | 20-23 | desktop |
| `src/components/layouts/bottom-nav/menu-sheet.tsx` | 55-57 | mobile, filter identik |
| `src/components/layouts/bottom-nav/index.tsx` | 116-122, 124-130, 179 | `NAV_SLOTS` + `findNavItem` |

**Kalau hanya sidebar/index.tsx yang diubah, mobile tetap bocor.** `findNavItem`
(bottom-nav L124-130) mengambil NavItem penuh beserta semua subitem-nya untuk
ditampilkan di sheet — itu jalur bocor kedua kalau filter hanya di level section.

### Role yang ada

`src/db/schema.ts:18-24` — `userRoleEnum`: `owner`, `admin_gudang`, `admin_produksi`,
`keuangan`, `viewer`. Kolom `users.role` L431, default `viewer`.

### Plumbing sudah ada

`src/app/(with-layout)/layout.tsx`:
- L12 `const currentUser = await getCurrentUser()`
- L13 `const userRole = currentUser?.role ?? "viewer"`
- L20 `<Sidebar userRole={userRole} />`, L23 `<MainContent userRole={userRole} …>`

Sidebar client component menerima **prop**, bukan context. Tidak perlu diubah.

## Task 1 — Tambah field role di tipe nav

`src/components/layouts/sidebar/data/index.ts`:

```ts
import type { users } from "@/db/schema";

export type UserRole = (typeof users.$inferSelect)["role"];

/** Role yang boleh melihat entri ini. Tidak diisi = semua role. */
type RoleGuard = { roles?: UserRole[] };

export interface NavSubItem extends RoleGuard { /* field lama */ }
export interface NavItem extends RoleGuard { /* field lama */ }
export interface NavSection extends RoleGuard {
  label: string;
  ownerOnly?: boolean;   // dipertahankan, lihat Task 4
  items: NavItem[];
}
```

Ambil tipe dari `schema.ts`, **jangan tulis ulang daftar role**. Daftar 5 role sudah
diduplikasi di 4 tempat (`schema.ts:18`, `lib/schemas/user.ts:11`,
`UserFormModal:20`, `UserTable:22`) — jangan tambah yang kelima.

`roles` tidak diisi = tampil ke semua. Itu membuat sebagian besar entri tidak perlu
disentuh, dan default-nya aman (tidak tiba-tiba menyembunyikan menu yang selama ini
terlihat).

## Task 2 — Helper filter bersama

File baru: `src/components/layouts/sidebar/data/filter.ts`

```ts
import { NAV_DATA, type NavSection, type UserRole } from ".";

const boleh = (roles: UserRole[] | undefined, role: UserRole) =>
  !roles || roles.includes(role);

/**
 * Saring NAV_DATA untuk satu role, sampai level subitem.
 * Section/item yang jadi kosong setelah disaring ikut dibuang — kalau tidak,
 * muncul judul section tanpa isi.
 */
export function navUntukRole(role: UserRole): NavSection[] {
  return NAV_DATA
    .filter((s) => (!s.ownerOnly || role === "owner") && boleh(s.roles, role))
    .map((s) => ({
      ...s,
      items: s.items
        .filter((i) => boleh(i.roles, role))
        .map((i) => ({ ...i, items: i.items.filter((si) => boleh(si.roles, role)) }))
        // item yang PUNYA subitem tapi semuanya tersaring habis = buang.
        // Item tanpa subitem (url langsung) tetap dipertahankan.
        .filter((i) => i.items.length > 0 || !!i.url),
    }))
    .filter((s) => s.items.length > 0);
}
```

Satu helper dipakai tiga tempat. Jangan salin logika filter ke masing-masing file —
itu persis kesalahan yang membuat `ownerOnly` sekarang tersebar di 3 file.

## Task 3 — Pakai helper di tiga tempat

1. `sidebar/index.tsx` L20-23 — ganti filter inline dengan `navUntukRole(userRole)`
2. `bottom-nav/menu-sheet.tsx` L55-57 — sama
3. `bottom-nav/index.tsx` — `findNavItem` (L124-130) harus mencari di hasil
   `navUntukRole(userRole)`, bukan `NAV_DATA` mentah. Perhatikan fungsi ini sekarang
   tidak menerima role; tambahkan parameternya.

**Ketatkan tipe sekalian:** prop-nya sekarang `userRole: string` (longgar) di
`sidebar/index.tsx:14`, `main-content.tsx:10`, bottom-nav, menu-sheet. Ganti jadi
`UserRole`. Dengan begitu salah ketik nama role ketahuan saat compile, bukan saat
menu diam-diam kosong.

## Task 4 — `ownerOnly` dipertahankan, jangan dihapus

Tetap dipakai di section SISTEM (`data/index.ts:181`). Menggantinya dengan
`roles: ["owner"]` memang lebih konsisten, tapi berarti menyentuh `NAV_SLOTS` di
bottom-nav (L105, L113) yang punya tipe `ownerOnly` sendiri — perubahan yang tidak
menambah nilai apa pun untuk issue ini.

Helper di Task 2 sudah menghormati keduanya. Biarkan.

## Task 5 — Isi `roles` untuk menu yang perlu

**Ini bagian yang butuh keputusan, bukan tebakan.** Sumber kebenaran yang paling dekat:
konstanta `READ_ROLES` / `WRITE_ROLES` yang sudah ada di tiap service file (mis.
`src/services/barang-jadi.ts:28-29`, `src/services/permintaan-bahan.ts:29`).

Untuk tiap entri menu yang akan diberi `roles`, buka service yang melayani halaman itu
dan pakai `READ_ROLES`-nya. Kalau menu bilang boleh tapi service menolak, user melihat
halaman error — lebih buruk daripada menu tersembunyi.

Kalau suatu halaman service-nya tidak punya konstanta role, **jangan mengarang** —
biarkan `roles` kosong (tampil ke semua), dan catat di komentar. Itu jujur dan tidak
memecahkan apa pun.

## Task 6 — `getPageTitle` JANGAN ikut difilter

`data/index.ts:196-223`. Fungsi ini mencari judul halaman dari pathname. Ia harus tetap
melihat `NAV_DATA` **penuh** — kalau ikut difilter, user yang membuka URL halaman
tersembunyi akan melihat judul "OIMS" alih-alih nama halamannya.

Jangan ubah fungsi ini. Disebutkan di sini supaya tidak "dirapikan" tanpa sengaja.

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. Ubah role akun uji lewat Sistem → Pengguna (atau langsung di DB dev), lalu muat
   ulang. Untuk tiap role yang diuji, cek **dua tempat**:
   - Desktop: sidebar
   - Mobile (lebar < 850px): bottom nav + sheet "Menu"
   Keduanya harus menampilkan daftar yang **sama**.
3. Role `owner` harus melihat semua, termasuk section SISTEM.
4. Role `viewer` tidak boleh melihat SISTEM.
5. **Tidak ada section kosong** — kalau semua item di suatu section tersaring, judul
   section-nya harus ikut hilang, bukan tampil kosong.
6. Judul halaman tetap benar: buka URL halaman yang tersembunyi untuk role itu dengan
   mengetik langsung → header harus tetap menampilkan nama halaman (bukan "OIMS").
   Halaman tetap terbuka — itu disengaja, lihat batas scope di atas.

## Yang TIDAK dikerjakan

- **Tidak menambah guard route / middleware.** Lihat batas scope. Dicatat di
  `CLAUDE.md` sebagai utang teknis.
- Tidak menyatukan 4 duplikasi daftar role jadi satu konstanta — dicatat, tapi di luar
  scope. Task 1 setidaknya tidak menambah duplikasi kelima.
- Tidak mengubah `ownerOnly` jadi `roles`.
