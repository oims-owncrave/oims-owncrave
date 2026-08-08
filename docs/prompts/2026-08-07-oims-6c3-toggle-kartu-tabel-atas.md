CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Pindahkan toggle Kartu/Tabel ke atas search/filter toolbar di semua halaman DataTable mobile.

ISSUE: oims-6c3 (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-6c3-toggle-atas

REQUIREMENTS:

**Tujuan:** Di mobile, toggle "Kartu | Tabel" harus muncul di paling atas — sebelum search input dan filter lainnya. Saat ini toggle ada di bawah toolbar children (di dalam DataTable setelah `{children}`).

**File target:** `src/components/ui/table/table.tsx`

**Task 1 — Pindah urutan render toggle:**

Baca `src/components/ui/table/table.tsx` dulu. Struktur saat ini di dalam `DataTable` component:

```tsx
<div className="rounded-xl border ...">
  {children}           ← TableToolbar (search, filter, button)
  <div className="sm:hidden">
    <div className="flex items-center gap-1 p-3 pb-0">
      {/* Toggle Kartu/Tabel */}
    </div>
    {/* Sort Dropdown (di-comment) */}
  </div>
  {/* Mobile Card View */}
  {/* Desktop Table View */}
</div>
```

Target — pindah `<div className="sm:hidden">` (yang berisi toggle) ke SEBELUM `{children}`:

```tsx
<div className="rounded-xl border ...">
  <div className="sm:hidden">
    <div className="flex items-center gap-1 p-3 pb-3">  ← pb-3 bukan pb-0
      {/* Toggle Kartu/Tabel */}
    </div>
  </div>
  {children}           ← sekarang di bawah toggle
  {/* Mobile Card View */}
  {/* Desktop Table View */}
</div>
```

- Ganti `pb-0` → `pb-3` supaya ada jarak antara toggle dan search di bawahnya
- Tidak ada perubahan lain selain urutan dan padding

**Task 2 — Verifikasi visual tidak regresi:**
- Toggle hanya muncul di mobile (`sm:hidden`) — desktop tidak terpengaruh
- Desktop toolbar (TableToolbar dengan search + button) tidak berubah sama sekali
- Pastikan card view dan table view masih toggle dengan benar
- Cek halaman: supplier (ada toolbar lengkap), barang masuk (punya button tambah)

CONSTRAINTS:
- Perubahan HANYA di `table.tsx` — tidak ada file lain yang perlu diubah
- Jangan ubah logika toggle, state, atau visual style tombol
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
