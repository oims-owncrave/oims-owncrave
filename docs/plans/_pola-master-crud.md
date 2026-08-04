# Pola Master CRUD — Konvensi UI/UX Standar OIMS

> **Single source of truth** untuk semua halaman master data (kategori, satuan, supplier, bahan, dst).
> Plan per-issue cukup **pointer** ke file ini — jangan duplikasi pola di tiap plan.
> Kalau pola berubah, update **file ini saja**.

Referensi implementasi jadi (acuan hidup): **master kategori** (`src/app/(with-layout)/master/kategori/`) + **user management** (`src/app/(with-layout)/sistem/pengguna/`).

---

## 1. Struktur file (colocation)

```
src/app/(with-layout)/<group>/<domain>/
  page.tsx                     ← Server Component, fetch data, render <XxxPageClient>
  _components/
    XxxPageClient.tsx          ← client wrapper, state modal, title H2 tanpa subtitle
    XxxTable.tsx               ← DataTable kit (card wrapper + toolbar + icon actions)
    XxxFormModal.tsx           ← modal z-70, backdrop fixed

src/lib/schemas/<domain>.ts    ← Zod schema (create + update)
src/services/<domain>.ts       ← Server Actions (list/create/update/softDelete)
src/hooks/useXxx.ts            ← TanStack Query hooks (fetcher call Server Action)
```

Prefix `_` = private folder (tak jadi route). Komponen 1-halaman → colocated; reusable lintas-halaman → `src/components/ui/`.

---

## 2. page.tsx (Server Component)

```tsx
import { listXxx } from "@/services/xxx";
import { XxxPageClient } from "./_components/XxxPageClient";

export default async function MasterXxxPage() {
  const data = await listXxx();
  return <XxxPageClient initialData={data} />;
}
```

## 3. XxxPageClient.tsx

- Client state: `modalOpen`, `editItem`.
- Render: `<h2>` **tanpa `<p>` subtitle**, `<XxxTable onAdd onEdit />`, `<XxxFormModal />`.
- `useXxx()` hook untuk data fresh: `data ?? initialData`.

## 4. XxxTable.tsx — DataTable kit (WAJIB)

> **EXECUTOR (Antigravity/junior): COPY struktur JSX dari `KategoriTable.tsx` PERSIS**, cuma ganti nama field/label/entity. JANGAN tulis ulang dari deskripsi di bawah — deskripsi = checklist verifikasi, bukan sumber. Sering meleset: card wrapper hilang, icon `Edit2` (harusnya `Pencil`), pagination conditional (harusnya selalu tampil + `pageSizeOptions={[10,25,50]}`), override CSS `border-none` yang tak perlu.


- Card wrapper: `rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden`
- **Kolom "No."**: `<DataTable table={table} showRowNumber />` — nomor urut otomatis di kiri, lanjut antar halaman (page 2 mulai 11). Built-in kit, jangan bikin kolom nomor manual di `columns`.
- `TableToolbar`: search kiri, `ColumnToggle` + `Button` Add kanan (Add **di toolbar**, bukan di header halaman).
- `TableActions` icon lucide: `Pencil` (edit, variant `default`), `Trash2`/`Ban` (hapus/nonaktif, variant `danger`).
- Kolom Aksi: `align: "center"`, `sortable: false`, `searchable: false`.
- `ConfirmDialog` untuk konfirmasi hapus.
- `ColumnToggle` PIN column: default hidden (`showPin={false}`), aktifkan per-tabel bila perlu.

## 5. XxxFormModal.tsx

- Container: `className="fixed inset-0 z-70 flex items-center justify-center p-4"`
- Backdrop: `className="fixed inset-0 bg-black/50 backdrop-blur-sm"` (**fixed**, bukan absolute — kalau absolute, header/sidebar nembus modal).
- Submit: pakai `mutateAsync` (bukan `mutate` + override onSuccess) → biar toast dari hook jalan + error ke-propagate.
- **Button loading**: submit button pakai `<Button type="submit" loading={mutation.isPending}>` — spinner otomatis + disable (bukan cuma `disabled` + text change). `Button` punya prop `loading`.
- **FK dropdown filter aktif**: dropdown pilih entitas lain (kategori/satuan/supplier/bahan) HARUS filter `isActive` — TAPI keep yang sedang terpilih (biar edit value existing tak hilang walau entitas jadi nonaktif): `options.filter((o) => o.isActive || o.id === watch("fieldId"))`. Jangan tampilkan nonaktif di dropdown pilihan baru.

---

## 6. Toast colors (konsisten)

Helper `toastStyles` di `src/lib/utils.ts`. Di hook (`useXxx.ts`):

| Aksi | Toast | Warna |
|---|---|---|
| Create / Update berhasil | `toast.success(msg, toastStyles.primary)` | biru (primary #2563eb) |
| Delete / Nonaktif berhasil | `toast.error(msg)` | merah (semantik destruktif) |
| Error apapun | `toast.error(res.error)` | merah |

---

## 7. Soft delete + unique = partial index (WAJIB)

Kolom dengan `deleted_at` + unique (kode/nama) **HARUS** partial unique index `WHERE deleted_at IS NULL`, **bukan** `.unique()` flat.

Flat constraint bikin **crash 500** saat user hapus lalu buat ulang value sama (baris soft-deleted masih dihitung).

**Drizzle:**
```ts
kode: text("kode").notNull(), // BUKAN .unique()
// ...
(t) => [uniqueIndex("<tabel>_<kolom>_active_unique").on(t.kode).where(isNull(t.deletedAt))]
```

Guard `isNull` di Server Action **tetap dipakai** (pesan error bagus sebelum hit DB), tapi DB-nya sendiri harus partial. Migration lewat Supabase `apply_migration` — nama constraint aktual bisa beda dari file drizzle, cek `information_schema.table_constraints` dulu.

---

## 8. Checkbox

Pakai UI kit `<Checkbox>` (`src/components/ui/Checkbox.tsx`), **jangan** native `<input type="checkbox">`.

Untuk label klikable + cursor pointer, pakai prop `label`:
```tsx
<Checkbox checked={val} onChange={setVal} label="Status Aktif" />
```
Checkbox controlled — di rhf pakai `watch("field")` + `setValue("field", checked)`, bukan `register`.

---

## 9. Server Action rules (ringkas — detail di CLAUDE.md)

- Query DB **hanya** di Server Action / Server Component.
- Soft delete: set `deleted_at`, jangan hard delete. Query selalu `WHERE deleted_at IS NULL`.
- Audit log tiap CREATE/UPDATE/DELETE/APPROVE (`writeAudit`).
- Guard delete kalau direferensi (mis. kategori dipakai bahan → tolak, saran nonaktifkan).


---

## 10. Client-side vs Server-side table (hemat bandwidth)

Kit tabel dual-mode. Pilih by **pertumbuhan data**, bukan seragam:

| Sumber data | Contoh | Mode | Kenapa |
|---|---|---|---|
| Master (row terbatas) | kategori, satuan, supplier, user | **client-side** (`useTable` default) | Puluhan baris, fetch semua = beberapa KB. Search/sort instan, no roundtrip. Server-side di sini malah nambah beban. |
| Transaksi / ledger / log (tumbuh terus) | mutasi stok, barang masuk/keluar, audit log | **server-side** (`useServerTable`) | Ribuan+ baris. PostgREST cap 1000 → fetch semua diam-diam terpotong. WAJIB paginate di DB. |

**Client-side (default):** pola CRUD di atas — Server Action return semua row, `useTable` filter/sort/slice di browser. Tidak ada yang perlu ditambah.

**Server-side (data transaksi):** infrastruktur SUDAH ADA — `src/components/ui/table/use-server-table.ts`. Pola:

1. **Server Action** terima filter + page, return `PagedResult<T>`:
```ts
// services/mutasi.ts
export async function listMutasi(f: { page: number; limit: number; bahanId?: string }) {
  const offset = (f.page - 1) * f.limit;
  const [items, [{ count }]] = await Promise.all([
    db.select().from(mutasiStok).where(/* filters */).limit(f.limit).offset(offset).orderBy(...),
    db.select({ count: sql<number>`count(*)` }).from(mutasiStok).where(/* filters */),
  ]);
  return { items, meta: { total: count, page: f.page, limit: f.limit, totalPages: Math.ceil(count / f.limit) } };
}
```

2. **Client** pakai `useServerTable` → spread `manualProps` ke `useTable`:
```tsx
const server = useServerTable({
  queryKey: ["mutasi"],
  fetcher: listMutasi,
  initialFilters: { page: 1, limit: 50 },
});
const table = useTable({ data: server.data, columns, ...server.manualProps });
```

`useServerTable` handle: page/filter state, `keepPreviousData` (no flicker saat ganti page), `meta`. `TablePagination` + `TableSearch` tetap dipakai — cukup wire ke `server.setPage`/`server.setFilters`.

JANGAN bikin pagination ad-hoc sendiri — `useServerTable` sudah ada, pakai itu.
