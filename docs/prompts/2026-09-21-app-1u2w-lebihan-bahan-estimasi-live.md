# Prompt Antigravity — app-1u2w

Plan lengkap: `docs/plans/2026-09-21-app-1u2w-lebihan-bahan-estimasi-live.md`
**Baca plan itu dulu.** Prompt ini ringkasan eksekusi, bukan pengganti.

> **CATATAN: Task 1 (DB migration) sudah dieksekusi Claude via MCP** ke dev **dan** prod.
> Tabel `po_produksi_lebihan_bahan` sudah ada, `src/db/schema.ts` sudah ter-update,
> `npx tsc --noEmit` 0 error. **Mulai dari Task 2.**

---

## Konteks singkat

Form PO Produksi sekarang punya blok **"Lebihan Pcs (Opsional)"** per varian jaket, dan
estimasi kebutuhan bahan **baru muncul setelah PO disimpan** (di halaman detail).

Dua-duanya salah menurut cara kerja klien:

- Excel klien menaruh **Lebihan per BAHAN**, bukan per varian jaket. Diperiksa di 24 sheet
  PO lintas 3 produk selama 4 bulan.
- Saat mengisi PO, user perlu tahu bahannya cukup atau tidak — **sekarang buta**.

**Yang dikerjakan:** lebihan pindah ke level bahan (diisi manual per PO), lebihan varian
disembunyikan, dan daftar kebutuhan bahan muncul langsung di form.

---

## Task 2 — Ekstrak rumus ke `src/lib/produksi/estimasi.ts` (file baru)

Server-only, **TANPA** `"use server"` supaya bisa menerima `tx`. Pola terbukti:
`src/lib/jahit/rekap.ts` — baca itu dulu.

Pindahkan inti perhitungan dari `getEstimasiBahan` (`src/services/po-produksi.ts:386-495`).
Yang **pindah**: agregasi BOM × pcs, toleransi, status stok. Yang **tetap** di service:
`requireRole`, cari PO, cari BOM.

Fungsinya menerima data, **bukan `poId`** — supaya dipakai dua jalur (PO tersimpan + preview):

```ts
export async function hitungEstimasi(
  tx: Tx,
  bomId: string,
  pcsPerUkuran: { ukuran: string; pcs: number }[],
  lebihanPerBahan: Map<string, number>,
): Promise<EstimasiRow[]>
```

`EstimasiRow` dapat field baru `lebihanBahan: number`.

**Rumus — perhatikan urutannya:**

```ts
const standar = pcs * Number(r.kuantitas);
const denganToleransi = standar * (1 + Number(r.toleransiPersen) / 100);
const total = denganToleransi + (lebihanPerBahan.get(r.bahanId) ?? 0);
```

Lebihan ditambahkan **SETELAH** toleransi. Toleransi = susut per pcs (persen); lebihan =
cadangan tetap (angka). Kalau lebihan ikut dikalikan persen, angkanya mengembang tanpa alasan.

`cocokkanUkuranBerlaku` sudah ada di `src/lib/bom-ukuran.ts` — **import, jangan tulis ulang.**

`getEstimasiBahan` tetap ada (dipakai halaman detail PO + `PemakaianSection` +
`SisaLimbahSection`), isinya sekarang memanggil `hitungEstimasi`.

---

## Task 3 — `previewEstimasiBahan` (tanpa PO tersimpan)

Tambah di `src/services/po-produksi.ts`:

```ts
export async function previewEstimasiBahan(input: {
  produkId: string;
  details: { varianId: string; jumlahTarget: number }[];
  lebihanBahan: { bahanId: string; lebihan: number }[];
}): Promise<EstimasiResult>
```

BOM diambil dari **BOM aktif produk** (`bom.produkId = input.produkId AND bom.status = 'aktif'`),
ukuran varian dari `varianProduk`.

`requireRole([...READ_ROLES])` **wajib** — ini query DB.

Produk tanpa BOM aktif → `{ error: "Produk belum punya BOM aktif — buat & aktifkan BOM dulu" }`
(pesan yang sudah dipakai, jangan karang baru).

---

## Task 4 — Simpan lebihan bahan

**Zod** `src/lib/schemas/po-produksi.ts`:

```ts
export const poLebihanBahanSchema = z.object({
  bahanId: z.string().uuid(),
  lebihan: z.number().min(0, "Minimal 0"),
});
```

Di `poSchema` tambah: `lebihanBahan: z.array(poLebihanBahanSchema).default([]),`

`.default([])` **penting** — PO lama tetap lolos validasi.

**Service** — `createPo` (`:206`) & `updatePo` (`:242`), ikut pola `poProduksiDetail`:

```ts
// createPo — setelah insert poProduksiDetail
const lebihanRows = input.lebihanBahan.filter((l) => l.lebihan > 0);
if (lebihanRows.length) {
  await tx.insert(poProduksiLebihanBahan).values(
    lebihanRows.map((l) => ({ poId: header.id, bahanId: l.bahanId, lebihan: String(l.lebihan) })),
  );
}

// updatePo — delete-then-insert (sama seperti poProduksiDetail)
await tx.delete(poProduksiLebihanBahan).where(eq(poProduksiLebihanBahan.poId, id));
```

**Filter `lebihan > 0`** — jangan simpan baris nol.

Audit log: tambahkan `lebihanBahan: input.lebihanBahan` ke objek `writeAudit` di **kedua** fungsi.

`getPoDetail` (`:148-159`) — ikut ambil lebihan bahan supaya form edit bisa memuatnya lagi.

---

## Task 5 — Konstanta penyembunyi

File baru `src/lib/produksi/konstanta.ts` (isi lengkap + komentar ada di plan):

```ts
export const TAMPILKAN_LEBIHAN_VARIAN = false;
```

Pakai di:
- `PoForm.tsx:230` → `{TAMPILKAN_LEBIHAN_VARIAN && details.length > 0 && (`
- `PoDetailClient.tsx` → sembunyikan kolom "Lebihan" + "Rencana Cutting" (`:144-146`) dan
  total rencana cutting (`:49`)

**JANGAN comment-out blok-nya.** Kode terkomentari tidak ikut `tsc`, jadi saat props
`NumberInput` atau bentuk `details` berubah nanti, blok itu diam-diam rusak.

---

## Task 6 — Blok "Kebutuhan Bahan" di form PO

Komponen baru: `src/app/(with-layout)/produksi/po/_components/KebutuhanBahanPreview.tsx`
(colocated — hanya dipakai halaman ini).

Ditaruh **menggantikan tempat** blok Lebihan Pcs yang kini tersembunyi (setelah
`MatrixTargetInput`, dalam `<div className="space-y-6">` yang sama).

Kolom: **Bahan | Kebutuhan | Lebihan | Total | Stok | Status**

- Kolom Lebihan = `NumberInput`, kosong default, `decimals` ikut satuan bahan
- Badge status: hijau `tersedia`, kuning `sebagian`, merah `tidak_tersedia` — **pakai token
  dark mode** (`dark:bg-*`), bukan warna arbitrary

**Debounce 500ms** (bukan tiap keystroke, bukan tombol):

```ts
const [debouncedInput, setDebouncedInput] = useState(previewInput);
useEffect(() => {
  const t = setTimeout(() => setDebouncedInput(previewInput), 500);
  return () => clearTimeout(t);
}, [previewInput]);
```

Hook baru di `src/hooks/usePoProduksi.ts`, pola `useEstimasiBahan`:

```ts
export function usePreviewEstimasi(input: PreviewInput | null) {
  return useQuery({
    queryKey: [...KEY, "preview", input],
    queryFn: () => previewEstimasiBahan(input!),
    enabled: !!input && input.details.length > 0,
  });
}
```

`enabled` mencegah query jalan saat produk belum dipilih / target masih kosong.

Saat `isFetching`: tampilkan angka lama dengan opacity turun. **Jangan kosongkan tabel** —
bikin layar berkedip tiap user mengetik.

**Jangan hitung perkalian BOM di frontend.** Satu sumber rumus saja (Task 2).

---

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. Form PO baru → pilih produk → isi target → daftar bahan muncul sendiri setelah ±½ detik,
   tanpa klik apa pun
2. Blok "Lebihan Pcs (Opsional)" **tidak ada lagi** di layar
3. Isi Lebihan `5` di satu baris → Total naik 5, badge ikut berubah kalau stok jadi kurang
4. Simpan PO → buka detail → lebihan bahan tersimpan dan tampil
5. Edit PO → lebihan bahan **termuat lagi** dengan nilai sama (bukan kosong)
6. Ubah lebihan saat edit → simpan → nilai baru tersimpan, **tidak ada baris ganda**
7. **Regresi WO Cutting:** buka WO dari PO → "Isi dari PO" → target cutting = target PO
   (tanpa tambahan), tidak error
8. **Regresi detail PO:** estimasi tetap tampil, angkanya sama dengan preview di form
9. Produk tanpa BOM aktif → pesan yang benar, bukan crash
10. **Audit log:** simpan PO → `data_after` memuat `lebihanBahan`

---

## Jangan dikerjakan

- **Kolom default lebihan di master bahan** — ditolak klien (app-itl4, 18 Sep). Jangan
  diusulkan ulang.
- **Auto-suggest / rasio otomatis** apa pun untuk angka lebihan
- **Menghapus** `poProduksiDetail.lebihanPcs` atau kolomnya di DB — hanya disembunyikan
- **Menyalin rumus estimasi ke frontend**
- Mengubah `bomDetail.toleransiPersen` atau `bomDetail.berlakuUkuran`
- Tombol "Hitung kebutuhan bahan" — sudah diputuskan pakai debounce
- Migration apa pun (Task 1 sudah selesai)
- `bd close`, `git commit`, `git push`

---

## Laporan akhir (wajib)

- Hasil `npx tsc --noEmit`
- Daftar file yang diubah + yang baru dibuat
- Konfirmasi blok Lebihan Pcs **disembunyikan lewat konstanta**, bukan dihapus/dikomentari
- Konfirmasi `WoForm.tsx` **tidak disentuh**, plus hasil uji verifikasi #7
- Deskripsi tampilan blok Kebutuhan Bahan (atau screenshot)
