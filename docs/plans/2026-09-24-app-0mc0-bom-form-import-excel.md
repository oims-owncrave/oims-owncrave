# app-0mc0 — Buat BOM: isi baris dari Excel

**Tergantung `app-0vqt`** (kolom Warna di BOM + `BOM_IMPORT_COLUMNS`). Kerjakan setelahnya.

## Masalah (feedback klien 24 Sep 2026)

Di form **Buat BOM** user mau pakai import Excel, tidak repot **Tambah Baris** satu-satu.

## Yang sudah ada

Import BOM **sudah ada** — tombol Import di daftar BOM (`BomPageClient`, dan tab BOM di
`/master/data-produk`). Tapi:
- tidak ada di halaman Buat BOM, tempat klien sebenarnya bekerja → tidak ketemu;
- langsung menyimpan draft tanpa bisa dicek/diedit dulu;
- wajib kolom Produk di tiap baris, padahal di form produk sudah dipilih.

## Solusi

Tombol **Import Excel** di kartu "Kebutuhan Bahan per Pcs" (sebelah Tambah Baris). Pakai
`ImportExcelModal` yang sudah ada. Hasilnya **mengisi baris form**, tidak menyimpan —
user cek, betulkan, lalu Simpan (Draft) seperti biasa. Template tanpa kolom Produk.

Import lama di daftar BOM tetap (untuk banyak produk sekaligus).

---

## Task 1 — Pecah logika baris jadi helper bersama

File: `src/services/import.ts`

Logika validasi per baris di `importBomBatch` (cari bahan, kuantitas, toleransi, warna,
ukuran, kunci duplikat — setelah app-0vqt) dipindah ke fungsi lokal non-export:

```ts
type KonteksBom = {
  bhnMap: Map<string, string>;                         // kode/nama lowercase → bahanId
  warnaProduk: Map<string, Map<string, string>>;       // produkId → (kode/nama lowercase → warnaId)
};
type BarisBom = {
  bahanId: string; kuantitas: number; toleransiPersen: number;
  berlakuUkuran: string | null; berlakuWarnaIds: string[] | null; keterangan: string | null;
};
function parseBarisBom(raw: Record<string, string>, produkId: string, produkKode: string, ctx: KonteksBom):
  { baris: BarisBom } | { error: string } { /* isi dari importBomBatch */ }
```

`importBomBatch` memanggil `parseBarisBom` — perilakunya **tidak berubah** (cek ulang
verifikasi no. 6 app-0vqt setelah refactor).

## Task 2 — Server Action baru: resolve tanpa simpan

File: `src/services/import.ts`

```ts
/**
 * Import ke FORM Buat BOM: validasi + terjemahkan kode ke id, TIDAK menyimpan.
 * Baris dikembalikan untuk mengisi form; simpan tetap lewat createBom.
 */
export async function resolveBomImportRows(
  produkId: string,
  rows: Record<string, string>[],
): Promise<{ error?: string; errors?: RowError[]; details?: BarisBom[] }> {
  await requireRole([...PRODUKSI_IMPORT_ROLES]);
  if (!rows.length) return { error: "Tidak ada data untuk diimport." };
  // muat produk (kode untuk pesan error), bahan aktif, warna varian produk itu → KonteksBom
  // rows.forEach → parseBarisBom; kumpulkan errors (row = i + 1) / details, cek duplikat kunci
  // return errors.length ? { errors } : { details };
}
```
`BarisBom` di-export sebagai type.

## Task 3 — ImportExcelModal: pesan sukses bisa diganti

File: `src/components/ui/import/ImportExcelModal.tsx`

`ImportConfig` tambah opsional:
```ts
successMessage?: (n: number) => string;
```
Di `handleSubmit`:
```ts
toast.success(config.successMessage?.(res.inserted) ?? `${res.inserted} data berhasil diimport`, toastStyles.primary);
```
Pemakai lama tidak berubah.

## Task 4 — Tombol di BomForm

File: `src/app/(with-layout)/produksi/bom/_components/BomForm.tsx`

1. `useFieldArray` ambil juga `replace`.
2. State `const [importOpen, setImportOpen] = useState(false);`
3. Tombol di sebelah **Tambah Baris** (bungkus keduanya `flex gap-2`):
   ```tsx
   <Button type="button" variant="outline" size="sm" disabled={!produkId} onClick={() => setImportOpen(true)}>
     <FileSpreadsheet size={16} className="mr-1.5" />
     Import Excel
   </Button>
   ```
4. Modal (di akhir `<form>`, di luar grid):
   ```tsx
   <ImportExcelModal
     open={importOpen}
     onClose={() => setImportOpen(false)}
     config={{
       title: "Import Bahan BOM",
       templateFilename: "template-bahan-bom",
       columns: BOM_IMPORT_COLUMNS.filter((c) => c.key !== "produk"),
       successMessage: (n) => `${n} baris masuk ke form — cek lalu Simpan`,
       action: async (rows) => {
         const res = await resolveBomImportRows(produkId, rows);
         if (!res.details) return res;
         const baru = res.details.map((d) => ({
           bahanId: d.bahanId,
           kuantitas: d.kuantitas,
           toleransiPersen: d.toleransiPersen,
           berlakuUkuran: d.berlakuUkuran ?? "",
           berlakuWarnaIds: d.berlakuWarnaIds ?? [],
           keterangan: d.keterangan ?? "",
         }));
         // baris form yang masih kosong (bahan belum dipilih) dibuang, sisanya dipertahankan
         const terisi = getValues("details").filter((r) => r.bahanId);
         replace([...terisi, ...baru]);
         return { inserted: baru.length };
       },
       onSuccess: () => setImportOpen(false),
     }}
   />
   ```
   Import `FileSpreadsheet` dari `lucide-react`, `ImportExcelModal`, `BOM_IMPORT_COLUMNS`,
   `resolveBomImportRows`.

   `ImportExcelModal` sudah `fixed` + portal-less; pastikan tidak di dalam elemen yang
   memotong overflow. Tombol di dalam modal harus `type="button"` supaya tidak men-submit
   form BOM — cek `ImportExcelModal`; kalau ada `<button>` tanpa `type`, tambahkan
   `type="button"`. Alternatif lebih aman: render modal **di luar** `<form>` (bungkus
   return dengan fragment).

## Verifikasi (manual, dev)

1. `npx tsc --noEmit` 0 error.
2. Buat BOM → tombol Import Excel disabled sebelum produk dipilih.
3. Pilih MALABAR → Import Excel → Download template: kolom Bahan, Kuantitas, Toleransi,
   Berlaku Warna, Berlaku Ukuran, Keterangan (tanpa Produk).
4. Isi 5 baris MALABAR (termasuk RJN HITAM warna HITAM, RJN PETROL warna PETROL) → upload
   → toast "5 baris masuk ke form — cek lalu Simpan" → 5 baris muncul terisi, baris kosong
   awal hilang. **Belum** ada BOM baru di daftar.
5. Ubah satu kuantitas → Simpan (Draft) → detail BOM sesuai.
6. File dengan bahan tak dikenal / warna bukan milik produk → error per baris di modal,
   form tidak berubah.
7. Import dua kali → baris kedua ditambahkan di bawah yang sudah ada.
8. Import di daftar BOM (lama) tetap jalan dan tetap langsung menyimpan draft.

## Commit

```
feat(bom): import Excel langsung ke form Buat BOM

Baris dari Excel mengisi form (bisa dicek sebelum simpan), bukan
langsung jadi draft. Import lama di daftar BOM tetap.

fixes #25
```

## CLAUDE.md Check
- [ ] Pattern baru: import Excel yang mengisi form (resolve tanpa simpan). Catat di
      `docs/claude/ui-components.md` bagian import kalau ada.
