# app-1u2w — Lebihan pindah ke level bahan + estimasi live di form PO

**Tanggal:** 2026-09-21
**Beads:** `app-1u2w` (P2) — melipat `app-itl4` (closed, `[DILIPAT app-1u2w]`)
**Roadmap:** Gelombang K

---

## Kenapa ini dikerjakan

Pertanyaan Abu saat review `app-jroq`:

> *"kenapa tidak ada langsung muncul bahan yang dibutuhkan yah? lalu untuk mengisi
> data lebihan bahan nya dimana dong?"*

Dua masalah terpisah di balik satu pertanyaan:

1. **Estimasi bahan baru muncul SETELAH PO disimpan** (halaman detail). Saat mengisi,
   user tidak tahu bahannya cukup atau tidak.
2. **Lebihan ada di level yang salah.** Kita menaruhnya per varian jaket
   (`poProduksiDetail.lebihanPcs`); klien menaruhnya per bahan.

### Bukti dari Excel klien

`docs/_PRODUKSI OWNC.xlsx`, lembar "SURAT JALAN KEBUTUHAN AKSESORIS" di tiap sheet PO.
Lebihan tercatat **per baris bahan**, bukan per varian:

| Bahan | Lebihan | Muncul di |
|---|---|---|
| Kepala Resleting Depan Lock | 1 | NORDIC, SUPERNOVA, HIDDEN |
| Kepala Resleting Cebol cnda 5 | 2 | NORDIC, SUPERNOVA, HIDDEN |
| Stopper Botol Bening | 5 | NORDIC, SUPERNOVA, HIDDEN |
| Tali Resleting / Puller Rope | 5 | NORDIC, SUPERNOVA, HIDDEN |
| Tali Hantag | 5 | NORDIC, SUPERNOVA, HIDDEN |
| Plastik Bening 35x40 (07) | 2 | NORDIC, SUPERNOVA, HIDDEN |

Diperiksa di 24 sheet PO lintas 3 produk selama 4 bulan (Juni–Agustus 2026). Angkanya
identik semua. Kain/parasut tidak pernah punya Lebihan — hanya aksesoris kecil.

### Kenapa BUKAN kolom default di master bahan

Keteraturan di atas menggoda untuk dijadikan default. **Jangan.** `app-itl4` sudah
merekam klarifikasi LANGSUNG dari klien (18 Sep 2026):

> Rasio yang konsisten di Excel **BUKAN rumus yang klien pegang sadar** — itu kebetulan
> dari kebiasaan manual mereka. Jangan bikin auto-suggest — klien mau isi manual sesuai
> judgment mereka sendiri **per situasi**.

Tujuannya jaga-jaga barang **hilang/kurang** (logistik), bukan reject kualitas. Rencana
"kolom `bahan.lebihanDefaultPcs`" sempat disusun 21 Sep malam lalu **dibatalkan** karena
bertentangan dengan ini. Jangan diusulkan ulang.

### Aplikasi klien tidak bisa jadi pembanding

`3_resources/oims/oims-production` diperiksa: **tidak ada BOM, tidak ada bahan, tidak ada
lebihan sama sekali.** Seluruh state satu JSON blob di `app_state.payload`; PO cuma
`{color, size, qty}[]`. Tak ada yang bisa ditiru dari sana.

---

## Keputusan desain (sudah disepakati Abu 21 Sep)

| Hal | Keputusan | Alasan |
|---|---|---|
| Level lebihan | **per bahan, per PO** — tabel baru | ikut Excel klien |
| Cara isi | **manual, kosong default** | klien menolak auto-suggest |
| Lebihan varian | **disembunyikan**, kolom DB dipertahankan | mungkin dipakai lagi; menghapus itu tak bisa dibatalkan |
| Cara sembunyikan | **konstanta**, bukan comment-out | kode terkomentari tak ikut type-check → busuk |
| Preview muncul | **di bawah matrix**, otomatis + debounce 500ms | matrix itu tempat mengisi target, tak bisa diganti |
| Tombol "Hitung" | **TIDAK** | melimpahkan kerja ke user; kalau lupa diklik, angka basi tanpa tanda |
| Rumus | **satu modul server-only**, jangan disalin ke frontend | dua tempat menghitung hal sama → suatu hari beda angka |

### Efek samping yang HARUS disadari

`WoForm.tsx:82` memakai `targetCutting = d.jumlahTarget + d.lebihanPcs` untuk prefill
target potong di WO Cutting. Dengan lebihan varian selalu 0, **rencana cutting jatuh ke
target polos.**

Itu **sesuai** Excel klien — mereka tidak punya konsep "potong 5 jaket ekstra"; Lebihan
di sana hanya menaikkan belanja aksesoris. Jadi ini disengaja, bukan regresi. Tapi jangan
sampai kaget saat melihatnya.

---

## Task

### Task 1 — DB migration ⚡ CLAUDE VIA MCP (bukan Antigravity)

```sql
CREATE TABLE po_produksi_lebihan_bahan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES po_produksi(id),
  bahan_id uuid NOT NULL REFERENCES bahan(id),
  lebihan numeric(15,3) NOT NULL DEFAULT '0'
);
CREATE INDEX po_lebihan_bahan_po_idx ON po_produksi_lebihan_bahan(po_id);
CREATE UNIQUE INDEX po_lebihan_bahan_unik ON po_produksi_lebihan_bahan(po_id, bahan_id);
```

`numeric(15,3)` bukan `integer` — satuan bahan bisa desimal (0,5 meter). Ikut
`bomDetail.kuantitas`. Lihat CLAUDE.md kesalahan #2.

Unique `(po_id, bahan_id)` mencegah satu bahan punya dua baris lebihan di PO yang sama.
Tak perlu partial `WHERE deleted_at IS NULL` — tabel ini tidak punya soft delete, barisnya
ikut hidup-mati bersama PO-nya (pola `poProduksiDetail`).

Lalu tambahkan ke `src/db/schema.ts` setelah `poProduksiDetail` (~baris 774):

```ts
export const poProduksiLebihanBahan = pgTable(
  "po_produksi_lebihan_bahan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    poId: uuid("po_id").notNull().references(() => poProduksi.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    // "Lebihan" bahan — istilah klien, diisi MANUAL per PO, kosong default.
    // Jaga-jaga barang hilang/kurang (logistik), BUKAN reject kualitas.
    // Klien menolak auto-suggest/default (app-itl4, klarifikasi 18 Sep 2026).
    lebihan: numeric("lebihan", { precision: 15, scale: 3 }).notNull().default("0"),
  },
  (t) => [
    index("po_lebihan_bahan_po_idx").on(t.poId),
    uniqueIndex("po_lebihan_bahan_unik").on(t.poId, t.bahanId),
  ]
);
```

⚡ **Dieksekusi Claude saat sesi planning. Antigravity mulai dari Task 2.**

---

### Task 2 — Ekstrak rumus ke `src/lib/produksi/estimasi.ts`

File **baru**. Server-only **TANPA** `"use server"` supaya bisa menerima `tx`. Pola yang
sudah terbukti: `src/lib/jahit/rekap.ts`.

Pindahkan inti perhitungan dari `getEstimasiBahan` (`src/services/po-produksi.ts:386-495`).
Yang dipindah: agregasi BOM × pcs + toleransi + status stok. Yang TETAP di service:
`requireRole`, pencarian PO, pencarian BOM.

Bentuk fungsinya — **terima data, bukan `poId`**, supaya dipakai dua jalur:

```ts
export type EstimasiRow = {
  bahanId: string;
  bahanKode: string;
  bahanNama: string;
  bahanUkuran?: string | null;
  satuanSingkatan: string;
  kebutuhanStandar: number;   // pcs × BOM
  totalKebutuhan: number;     // + toleransi + lebihan bahan
  lebihanBahan: number;       // BARU — manual per PO
  stokTersedia: number;
  kekurangan: number;
  status: "tersedia" | "sebagian" | "tidak_tersedia";
};

export type PcsPerUkuran = { ukuran: string; pcs: number };

export async function hitungEstimasi(
  tx: Tx,
  bomId: string,
  pcsPerUkuran: PcsPerUkuran[],
  lebihanPerBahan: Map<string, number>,
): Promise<EstimasiRow[]>
```

Rumusnya (jangan diubah selain menambah lebihan):

```ts
const standar = pcs * Number(r.kuantitas);
const denganToleransi = standar * (1 + Number(r.toleransiPersen) / 100);
const total = denganToleransi + (lebihanPerBahan.get(r.bahanId) ?? 0);
```

**Urutan penting:** lebihan ditambahkan SETELAH toleransi, bukan sebelum. Toleransi itu
susut per pcs (persen); lebihan itu cadangan tetap (angka). Kalau lebihan ikut dikalikan
persen, angkanya mengembang tanpa alasan.

`cocokkanUkuranBerlaku` sudah ada di `src/lib/bom-ukuran.ts` — **import, jangan tulis ulang.**

`getEstimasiBahan` lama tetap ada dan tetap dipakai halaman detail PO + WO Cutting
(`PemakaianSection`, `SisaLimbahSection`) — isinya sekarang memanggil `hitungEstimasi`.

---

### Task 3 — Service preview (belum ada PO)

Tambah di `src/services/po-produksi.ts`:

```ts
export async function previewEstimasiBahan(input: {
  produkId: string;
  details: { varianId: string; jumlahTarget: number }[];
  lebihanBahan: { bahanId: string; lebihan: number }[];
}): Promise<EstimasiResult>
```

Beda dari `getEstimasiBahan`: tidak butuh PO tersimpan. BOM diambil dari **BOM aktif
produk** (`bom.produkId = input.produkId AND bom.status = 'aktif'`), ukuran varian dari
`varianProduk`.

`requireRole([...READ_ROLES])` tetap wajib — ini query DB, bukan perhitungan lokal.

Kalau produk belum punya BOM aktif: kembalikan `{ error: "Produk belum punya BOM aktif — buat & aktifkan BOM dulu" }`, persis pesan yang sudah dipakai.

---

### Task 4 — Simpan lebihan bahan saat PO disimpan

**Zod** (`src/lib/schemas/po-produksi.ts`) — tambah:

```ts
export const poLebihanBahanSchema = z.object({
  bahanId: z.string().uuid(),
  lebihan: z.number().min(0, "Minimal 0"),
});
```

Lalu di `poSchema`:

```ts
lebihanBahan: z.array(poLebihanBahanSchema).default([]),
```

`.default([])` penting — PO lama / form tanpa lebihan tetap lolos validasi.

**Service** — `createPo` (`po-produksi.ts:206`) dan `updatePo` (`:242`), ikut pola
`poProduksiDetail` yang sudah ada:

```ts
// createPo — setelah insert poProduksiDetail
const lebihanRows = input.lebihanBahan.filter((l) => l.lebihan > 0);
if (lebihanRows.length) {
  await tx.insert(poProduksiLebihanBahan).values(
    lebihanRows.map((l) => ({
      poId: header.id,
      bahanId: l.bahanId,
      lebihan: String(l.lebihan),
    })),
  );
}

// updatePo — delete-then-insert, sama seperti poProduksiDetail
await tx.delete(poProduksiLebihanBahan).where(eq(poProduksiLebihanBahan.poId, id));
// ...insert sama seperti di atas, pakai id bukan header.id
```

**Filter `lebihan > 0`** — jangan simpan baris nol. Tabelnya jadi bersih, dan
"tidak ada baris" = "tidak ada lebihan" tanpa ambiguitas.

Audit log sudah ikut otomatis: `writeAudit` menerima `{ ...header, details: input.details }` —
tambahkan `lebihanBahan: input.lebihanBahan` ke objek itu di kedua fungsi.

`getPoDetail` (`:148-159`) — ikut ambil lebihan bahan supaya form edit bisa memuatnya lagi.

---

### Task 5 — Konstanta penyembunyi lebihan varian

File **baru** `src/lib/produksi/konstanta.ts`:

```ts
/**
 * Lebihan per varian produk disembunyikan — Excel klien menaruh lebihan di BAHAN,
 * bukan produk, dan klien menolak angka default (app-itl4, klarifikasi 18 Sep 2026).
 *
 * Kolom po_produksi_detail.lebihan_pcs SENGAJA dipertahankan (default 0), bukan dihapus.
 * Kalau klien nanti minta lebihan per produk juga, ubah ke true — tidak ada kode lain
 * yang perlu disentuh.
 *
 * Efek saat false: WoForm targetCutting = jumlahTarget + 0, jadi rencana cutting sama
 * dengan target. Itu sesuai Excel klien, bukan bug.
 */
export const TAMPILKAN_LEBIHAN_VARIAN = false;
```

Pakai di `PoForm.tsx:230`:

```tsx
{TAMPILKAN_LEBIHAN_VARIAN && details.length > 0 && (
```

Dan di `PoDetailClient.tsx` — sembunyikan kolom "Lebihan" + "Rencana Cutting" (`:144-146`)
serta total rencana cutting (`:49`) dengan konstanta yang sama.

**JANGAN comment-out blok-nya.** Kode terkomentari tidak ikut `tsc`, jadi saat props
`NumberInput` atau bentuk `details` berubah, blok itu diam-diam rusak dan baru ketahuan
waktu dihidupkan lagi.

---

### Task 6 — Blok "Kebutuhan Bahan" di form PO

Di `PoForm.tsx`, **menggantikan tempat** blok Lebihan Pcs yang kini tersembunyi
(setelah `MatrixTargetInput`, dalam `<div className="space-y-6">` yang sama).

Komponen baru: `src/app/(with-layout)/produksi/po/_components/KebutuhanBahanPreview.tsx`
(colocated — hanya dipakai halaman ini, pola `_components/` proyek).

Kolom tabel:

| SKU/Bahan | Kebutuhan | Lebihan | Total | Stok | Status |
|---|---|---|---|---|---|
| Parasut RJN · 150cm | 4,65 m | `[  0]` | 4,65 m | 12 m | ✓ tersedia |
| Kepala Resleting Depan | 3 pcs | `[  1]` | 4 pcs | 3 pcs | ⚠ kurang 1 |

- Kolom **Lebihan** = `NumberInput`, kosong default, `decimals` ikut satuan bahan.
- Badge status: hijau `tersedia`, kuning `sebagian`, merah `tidak_tersedia` — pakai token
  dark mode (`dark:bg-*`), **bukan** warna arbitrary. Lihat CLAUDE.md kesalahan #6.

**Cara memanggil server — debounce 500ms:**

```ts
const [debouncedInput, setDebouncedInput] = useState(previewInput);
useEffect(() => {
  const t = setTimeout(() => setDebouncedInput(previewInput), 500);
  return () => clearTimeout(t);
}, [previewInput]);

const { data: preview, isFetching } = usePreviewEstimasi(debouncedInput);
```

Hook baru di `src/hooks/usePoProduksi.ts`, pola `useEstimasiBahan` yang sudah ada:

```ts
export function usePreviewEstimasi(input: PreviewInput | null) {
  return useQuery({
    queryKey: [...KEY, "preview", input],
    queryFn: () => previewEstimasiBahan(input!),
    enabled: !!input && input.details.length > 0,
  });
}
```

**`enabled`** mencegah query jalan saat produk belum dipilih atau target masih kosong.

Saat `isFetching`, tampilkan angka lama dengan opacity turun — **jangan kosongkan tabel**,
itu bikin layar berkedip tiap user mengetik.

**Jangan hitung perkalian BOM di frontend.** Rencana awal sempat menyebut "perkalian di
frontend biar instan" — dibatalkan: begitu lebihan bahan ikut masuk rumus, dua tempat
menghitung hal yang sama akan menghasilkan angka berbeda suatu hari. Satu sumber saja.

---

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. **Form PO baru** → pilih produk → isi target di matrix → daftar bahan muncul sendiri
   setelah ±½ detik, tanpa klik apa pun
2. Blok "Lebihan Pcs (Opsional)" **tidak ada lagi** di layar
3. Isi Lebihan `5` di baris Stopper Botol → Total naik 5, badge ikut berubah kalau stok
   jadi kurang
4. **Simpan PO** → buka detail → lebihan bahan tersimpan dan tampil
5. **Edit PO** → lebihan bahan termuat lagi dengan nilai yang sama (bukan kosong)
6. Ubah lebihan saat edit → simpan → nilai baru tersimpan, **tidak ada baris ganda**
   (delete-then-insert bekerja)
7. **Regresi WO Cutting:** buka WO dari PO → "Isi dari PO" → target cutting = target PO
   (tanpa tambahan), tidak error
8. **Regresi halaman detail PO:** estimasi bahan tetap tampil, angkanya sama dengan preview
   di form untuk PO yang sama
9. Produk tanpa BOM aktif → pesan "Produk belum punya BOM aktif", bukan crash
10. **Audit log:** simpan PO → cek `audit_log`, `data_after` memuat `lebihanBahan`

---

## Jangan dikerjakan

- **Kolom default lebihan di master bahan** — ditolak klien, lihat bagian "Kenapa BUKAN"
- **Auto-suggest / rasio otomatis** apa pun untuk angka lebihan
- **Menghapus** `poProduksiDetail.lebihanPcs` atau kolomnya di DB — hanya disembunyikan
- **Menyalin rumus estimasi ke frontend**
- Mengubah `bomDetail.toleransiPersen` — itu susut per bahan, urusan berbeda
- Mengubah `bomDetail.berlakuUkuran`
- Tombol "Hitung kebutuhan bahan" — sudah diputuskan pakai debounce
- `bd close`, `git commit`, `git push`

---

## Laporan akhir (wajib)

- Hasil `npx tsc --noEmit`
- Daftar file yang diubah + yang baru dibuat
- Konfirmasi blok Lebihan Pcs **disembunyikan lewat konstanta**, bukan dihapus/dikomentari
- Konfirmasi `WoForm.tsx` tidak disentuh, dan hasil uji verifikasi #7
- Screenshot / deskripsi tampilan blok Kebutuhan Bahan
