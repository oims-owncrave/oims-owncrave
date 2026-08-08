CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Tambah background abu-abu di bagian highlight card mobile — warna sama dengan header tabel.

ISSUE: oims-y5k (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-y5k-card-highlight-bg

REQUIREMENTS:

**Tujuan:** Di card mobile, nilai di pojok kanan atas (role "highlight" — biasanya kuantitas, subtotal, nilai) diberi background pill abu-abu `bg-gray-1 dark:bg-dark-2`. Warna ini sama persis dengan `bg-gray-1 dark:bg-dark-2` yang dipakai di header tabel (`<TableRow className="border-none bg-gray-1 dark:bg-dark-2">`).

**File target:** `src/components/ui/table/table.tsx`

**Task 1 — Wrap highlight dengan background:**

Baca `src/components/ui/table/table.tsx` dulu. Cari bagian render highlights di card view — sekitar:

```tsx
{highlights.map((h) => (
  <div key={h.col.key}>
    {renderVal(h.col, item, rowIndex, isExpanded, isSelected)}
  </div>
))}
```

Ubah menjadi:

```tsx
{highlights.map((h) => (
  <div
    key={h.col.key}
    className="rounded-md bg-gray-1 dark:bg-dark-2 px-2 py-1 text-sm font-medium text-dark dark:text-white"
  >
    {renderVal(h.col, item, rowIndex, isExpanded, isSelected)}
  </div>
))}
```

- `rounded-md` — pill shape ringan
- `bg-gray-1 dark:bg-dark-2` — abu-abu terang (light) / dark-2 (dark), sama dengan header tabel
- `px-2 py-1` — padding compact
- `text-sm font-medium` — konsisten dengan ukuran teks card
- `text-dark dark:text-white` — warna teks utama (override warna dari renderCell jika ada)

**PERHATIAN:** Jika `renderVal` mengembalikan elemen yang sudah punya warna teks sendiri (misal `text-green-600`), wrapper ini TIDAK override karena `text-dark` kalah prioritas. Itu oke — warna spesifik (merah/hijau kuantitas) tetap terbaca.

**Task 2 — Jangan sentuh kebab menu:**
- Action/kebab (`actions.length > 0` → `<CardKebabDropdown>`) TIDAK diberi background
- Pastikan urutan render: highlights dulu → kebab menu
- Cek visual di barang masuk (highlights: subtotal/harga) + mutasi stok (highlights: kuantitas +/-)

CONSTRAINTS:
- Perubahan HANYA di `table.tsx` — tidak ada file lain
- Gunakan Tailwind canonical: `bg-gray-1` bukan arbitrary `bg-[#f9fafb]`
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
