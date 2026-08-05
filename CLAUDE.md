# OIMS Owncrave — Operating Manual for AI

ERP produksi garmen Owncrave, dibangun bertahap (Tahap 1-5). Stack: Next.js 16 + React 19 + TS strict, Tailwind v4, Drizzle + Supabase, TanStack Query, Zustand, rhf+zod, next-themes (dark mode), class-variance-authority, PWA manual.

## Peranmu Di Sini

Bantu build fitur ERP: schema, Server Actions, UI komponen, hooks, form. Deliverable = kode TypeScript yang compile clean, build clean, ikut pola projek ini.

## Protokol Mulai Kerja

1. **Cek skill dulu** — `new-feature-workflow` wajib sebelum coding fitur baru. Lihat `docs/plans/` untuk plan aktif.
2. **Baca file sebelum edit** — selalu Read file dulu.
3. **Baca `docs/konsep-produksi.md`** sebelum coding fitur domain (stok, mutasi, HPP, dll).
4. **Baca `docs/reference-projects.md`** sebelum buat komponen UI baru — ada yang sudah tersedia.

## Aturan Coding (tanpa pengecualian)

### Database / Drizzle

- **Stok immutable**: gak pernah UPDATE `stok.kuantitas` langsung — hanya lewat append ke `mutasi_stok`. `stok.kuantitas` = cache dari DB trigger.
- **Mutasi stok**: append-only. TIDAK ADA UPDATE/DELETE baris di `mutasi_stok`.
- **Soft delete**: semua tabel master pakai `deleted_at`. Query selalu `WHERE deleted_at IS NULL`.
- **Soft delete + unique = partial unique index (WAJIB)**: kalau kolom pakai `deleted_at` DAN punya unique (kode/nama), unique-nya HARUS partial `WHERE deleted_at IS NULL` — bukan `.unique()` flat. Flat constraint bikin crash 500 saat user hapus lalu buat ulang value yang sama (baris soft-deleted masih hitung). Pola Drizzle: `text("kode").notNull()` + `(t) => [uniqueIndex("<tabel>_<kolom>_active_unique").on(t.kode).where(isNull(t.deletedAt))]`. Guard eksplisit di Server Action (cek `isNull` sebelum insert) tetap dipakai untuk pesan error yang bagus, TAPI DB-nya sendiri harus partial.
- **Audit log**: tiap CREATE/UPDATE/APPROVE tulis ke `audit_log` (aksi, tabel, record_id, data_before JSON, data_after JSON).
- **Nomor dokumen**: format `[TIPE]-YYYYMM-NNNN`. Auto-generate di Server Action, bukan di client. Unique constraint di DB.
- **Satuan**: gak ada konversi implicit antar satuan. Satu bahan = satu satuan, konsisten dari masuk sampai keluar.
- **Harga rata-rata bergerak**: update `bahan.harga_rata_rata` tiap barang masuk (weighted average). Snapshot harga di `barang_keluar_detail.harga_satuan` saat transaksi terjadi.
- **Approval flow**: `penyesuaian_stok` harus status `approved` sebelum mutasi stok terbuat.
- `numeric` untuk semua angka uang dan kuantitas bahan (bukan `integer`) — garmen pakai desimal (0.5 meter, dsb).

### Server Actions

- Query DB di Server Actions / Server Components — BUKAN di client hooks langsung.
- Pakai `db` dari `src/db/index.ts`.
- TanStack Query (`useQuery`/`useMutation`) di client untuk cache + refetch, tapi fetcher-nya call Server Action.
- Pattern dari bf-v2 `src/services/`.

### Komponen UI

- **Tailwind v4** — `bg-linear-to-*` (bukan `bg-gradient-to-*`). **Dark mode AKTIF** (next-themes, class strategy `attribute="class"`). Gunakan `dark:*` classes — token via `@theme` di `globals.css`.
- **Tailwind v4 canonical classes** — JANGAN pakai arbitrary values kalau ada canonical equivalent. Contoh: `z-70` bukan `z-[70]`, `w-72.5` bukan `w-[290px]`, `text-xs` bukan `text-[12px]`, `min-w-70` bukan `min-w-[17.5rem]`. Arbitrary BOLEH hanya jika tidak ada canonical (mis. `w-[100.5px]`, `grid-cols-[1fr_4rem]`, breakpoint custom `min-[850px]`).
- `cn()` dari `src/lib/utils.ts` untuk conditional classes.
- UI kit tersedia di `src/components/ui/`: Button, Input, Select, MultiSelect, ComboSelect, ConfirmDialog, Tooltip. **Cek dulu sebelum buat baru.**
- **Konvensi UI/halaman (WAJIB baca sebelum bikin halaman)**: READ `docs/claude/ui-components.md` — PageHeader (judul+breadcrumb, bukan h2 manual), header mobile otomatis, card grid 2-kolom mobile, bottom nav.
- **Colocation komponen halaman**: komponen yang cuma dipakai 1 halaman taruh di `_components/` DALAM folder route halaman itu (mis. `src/app/(with-layout)/sistem/pengguna/_components/UserTable.tsx`), BUKAN di `src/components/[feature]/`. Prefix `_` = private folder (tak jadi route). Pola PMS. Komponen reusable lintas-halaman → `src/components/ui/`.
- Form: `react-hook-form` + `@hookform/resolvers/zod`. Zod schema di `src/lib/schemas/`.
- Toast: `sonner` (sudah di layout). Import `toast` dari `sonner`.
- Jangan install dependency baru tanpa diskusi — reuse yang sudah ada.

### TypeScript

- Strict mode. Semua tipe dari `src/db/schema.ts` (`$inferSelect` / `$inferInsert`).
- Gak ada `any` kecuali interop eksternal yang benar-benar gak bisa dihindari.

## Struktur Folder

```
src/
  app/           # Next.js App Router
    (auth)/      # signin — tanpa sidebar
    (with-layout)/  # semua halaman dengan sidebar
      dashboard/ # halaman utama
      master/    # kategori, satuan, supplier, bahan
      inventory/ # barang masuk, keluar, stok, mutasi, penyesuaian
      sistem/    # pengguna, log, pengaturan
      # tiap halaman: page.tsx + _components/ (komponen khusus halaman itu)
      ...
  assets/        # SVG logos, icons
  components/
    ui/          # UI kit (Button, Input, Select, MultiSelect, ComboSelect, ...)
    layouts/     # app shell: sidebar/, header/, main-content.tsx
    providers/   # theme-provider.tsx (next-themes)
    PWA/         # PWA components (index.tsx = main, debug, settings)
    # komponen per-halaman → colocated di app/**/_components/ (bukan di sini)
  db/
    index.ts     # Drizzle client
    schema.ts    # semua tabel (Tahap 1 aktif)
  hooks/         # TanStack Query hooks per domain + use-mobile.ts
  lib/
    utils.ts     # cn(), isMobile(), isIOS()
    pwaUtils.ts  # isInStandaloneMode(), canInstallPWA()
    supabase/    # 3-tier: client.ts, server.ts, middleware.ts
    schemas/     # Zod schemas per domain
  services/      # Server Actions per domain
  stores/        # Zustand (ui state: theme, filter aktif)
  types/         # Shared TypeScript types
docs/
  plans/         # plan file per issue (YYYY-MM-DD-[id]-[feature].md)
  prompts/       # prompt file per issue
  reference-projects.md
  konsep-produksi.md
  roadmap.md
```

## Beads Issue Tracker

Prefix: `oims-` (init setelah projek ini berdiri di folder sendiri).
Workflow: `bd create` SEBELUM coding, `bd close` SETELAH Abu approve hasil.

## PWA

Manual, zero-dependency. `public/sw.js` pakai `BUILD_VERSION` — **update BUILD_VERSION tiap meaningful deploy** (format `YYYY-MM-DD`) supaya cache lama di-purge otomatis. Gak perlu ubah `next.config.ts` untuk PWA.

## Kesalahan yang Pasti Kamu Buat Kalau Gak Baca Ini

| # | Nama | Gejala | Aturan |
|---|---|---|---|
| 1 | **Direct Stock Edit** | Update `stok.kuantitas` langsung di Server Action | Selalu lewat append `mutasi_stok` |
| 2 | **Integer Money** | Pakai `integer` untuk harga/kuantitas | Pakai `numeric` — garmen butuh desimal |
| 3 | **Hard Delete** | `DELETE FROM bahan WHERE id = ?` | Set `deleted_at = NOW()`, filter query |
| 4 | **No Audit** | Aksi penting tanpa tulis `audit_log` | Tiap CREATE/UPDATE/APPROVE → log |
| 5 | **Client-side DB** | `import { db } from "@/db"` di komponen client | DB hanya di Server Action/Server Component |
| 6 | **Dark Mode Token Salah** | Pakai warna arbitrary `dark:bg-[#xxx]` tanpa token | Gunakan token @theme: `dark:bg-gray-dark`, `dark:text-white`, `dark:border-stroke-dark` — lihat globals.css |
| 7 | **Gradient v3** | `bg-gradient-to-r` | Ganti `bg-linear-to-r` (Tailwind v4) |
| 8 | **Phantom Committer** | `git commit` tanpa diminta | Tunggu Abu minta eksplisit |


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
