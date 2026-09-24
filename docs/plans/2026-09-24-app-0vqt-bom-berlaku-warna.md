# app-0vqt — BOM: baris bahan berlaku per Warna

## Masalah (feedback klien 24 Sep 2026)

PO Produksi MALABAR: isi **M** untuk HITAM & PETROL → yang naik hanya **RJN HITAM**.
Isi **L** untuk HITAM & PETROL → yang naik hanya **RJN PETROL**. Klien bingung.

## Akar

Bukan bug hitung. BOM MALABAR v1 (aktif) di prod:

| Bahan | warna bahan | berlaku_ukuran | kuantitas |
|---|---|---|---|
| BH-KFR-001 BILABONG | - | semua | 0.36 |
| BH-TR-SLG-001 Coil DSJK no 5 | HITAM | **M** | 1 |
| BH-AKSS-002 Karet Elastis SR Biru | Putih | semua | 0.01 |
| BH-KUT-003 RJN HITAM | HITAM | **M** | 1.7 |
| BH-KUT-006 RJN PETROL | PETROL | **L** | 1.7 |

BOM **cuma bisa menyaring per ukuran**. Kain utama berbeda per **warna** varian
(Hitam pakai RJN HITAM, Petrol pakai RJN PETROL), jadi klien terpaksa memakai kolom
Ukuran untuk membedakannya — dan hitungan mengikuti persis apa yang diisi.

Kenapa tidak diturunkan otomatis dari `bahan.warna_id`: warna bahan ≠ warna varian yang
memakainya. Karet Elastis SR **Biru** tercatat warna **Putih** dan dipakai semua warna
produk. Proxy begitu salah (aturan "derive dari kolom eksplisit, bukan proxy").

## Solusi

Kolom baru `bom_detail.berlaku_warna_ids uuid[]` — `null` = semua warna. Satu baris
bisa berlaku untuk beberapa warna (benang hitam dipakai Hitam + Navy). Baris BOM
berlaku untuk varian kalau **ukuran cocok DAN warna cocok**.

Array uuid (bukan teks nama seperti `berlaku_ukuran`) supaya tahan ganti nama warna.
Konsekuensi: tidak ada FK — validasi di Server Action (id harus warna varian produk itu).

---

## Task 1 — DB migration ⚡ SUDAH DIKERJAKAN CLAUDE VIA MCP (dev + prod)

```sql
ALTER TABLE bom_detail ADD COLUMN IF NOT EXISTS berlaku_warna_ids uuid[];
```

`src/db/schema.ts` sudah di-update (`bomDetail.berlakuWarnaIds: uuid(...).array()`),
`npx tsc --noEmit` 0 error. **Antigravity mulai dari Task 2.**

---

## Task 2 — Helper murni + test (TDD)

File: `src/lib/bom-ukuran.ts` — tambah di akhir:

```ts
export type PcsVarian = { ukuran: string; warnaId: string; pcs: number };

/**
 * Total pcs yang memakai satu baris BOM: ukuran DAN warna harus cocok.
 * berlakuUkuran/berlakuWarnaIds kosong = berlaku semua.
 */
export function pcsBerlaku(
  pcsPerVarian: PcsVarian[],
  berlakuUkuran: string | null,
  berlakuWarnaIds: string[] | null,
): number {
  const ukuran = cocokkanUkuranBerlaku(berlakuUkuran);
  const warna = berlakuWarnaIds?.length ? berlakuWarnaIds : null;
  return pcsPerVarian
    .filter((p) => !ukuran || ukuran.includes(p.ukuran.toUpperCase()))
    .filter((p) => !warna || warna.includes(p.warnaId))
    .reduce((s, p) => s + p.pcs, 0);
}
```

File: `src/lib/bom-ukuran.test.ts` — tambah assert (TULIS DULU, jalankan → FAIL karena
`pcsBerlaku` belum ada, lalu implement → PASS):

```ts
import { cocokkanUkuranBerlaku, pcsBerlaku } from "./bom-ukuran";

// Kasus MALABAR: 10 M Hitam + 10 M Petrol
const HITAM = "h", PETROL = "p";
const po = [
  { ukuran: "M", warnaId: HITAM, pcs: 10 },
  { ukuran: "M", warnaId: PETROL, pcs: 10 },
];
assert.equal(pcsBerlaku(po, null, null), 20);          // Bilabong: semua
assert.equal(pcsBerlaku(po, null, [HITAM]), 10);       // RJN HITAM: warna Hitam saja
assert.equal(pcsBerlaku(po, null, [PETROL]), 10);      // RJN PETROL
assert.equal(pcsBerlaku(po, "L", null), 0);            // ukuran lain
assert.equal(pcsBerlaku(po, "m", [HITAM]), 10);        // ukuran huruf kecil + warna
assert.equal(pcsBerlaku(po, null, []), 20);            // array kosong = semua
assert.equal(pcsBerlaku(po, null, [HITAM, PETROL]), 20);
```

Jalankan: `npx tsx src/lib/bom-ukuran.test.ts` → tanpa output = PASS.

## Task 3 — Estimasi pakai warna

File: `src/lib/produksi/estimasi.ts`

1. Ganti tipe:
   ```ts
   export type PcsPerVarian = PcsVarian; // re-export dari bom-ukuran
   ```
   (import `pcsBerlaku, type PcsVarian` dari `@/lib/bom-ukuran`; hapus import
   `cocokkanUkuranBerlaku` kalau tak dipakai lagi). Hapus `PcsPerUkuran`.
2. Signature: `pcsPerVarian: PcsPerVarian[]` (ganti nama param).
3. `select` tambah `berlakuWarnaIds: bomDetail.berlakuWarnaIds,`.
4. Ganti blok `pcsEfektif` + `ukuranBerlaku/applicable/pcs` jadi:
   ```ts
   const pcs = pcsBerlaku(pcsPerVarian, r.berlakuUkuran, r.berlakuWarnaIds);
   ```
5. Update komentar RUMUS: `1. standar = pcs varian yang ukuran & warnanya cocok * kuantitas`.

File: `src/services/po-produksi.ts`

- Import `type PcsPerVarian` (ganti `PcsPerUkuran`).
- `getEstimasiBahan` (~457): select tambah `varianWarnaId: varianProduk.warnaId`; map:
  ```ts
  const pcsPerVarian: PcsPerVarian[] = details.map((d) => ({
    ukuran: d.varianUkuran,
    warnaId: d.varianWarnaId,
    pcs: d.jumlahTarget + d.lebihanPcs,
  }));
  ```
- `previewEstimasiBahan` (~512): select varian tambah `warnaId: varianProduk.warnaId`,
  `varianMap` simpan objek `{ ukuran, warnaId }`; map:
  ```ts
  const pcsPerVarian: PcsPerVarian[] = input.details.map((d) => {
    const v = varianMap.get(d.varianId);
    return { ukuran: v?.ukuran ?? "", warnaId: v?.warnaId ?? "", pcs: Number(d.jumlahTarget) || 0 };
  });
  ```

`grep -rn "PcsPerUkuran" src` harus kosong.

## Task 4 — Schema zod + service BOM

`src/lib/schemas/bom.ts` — di `bomDetailSchema` setelah `berlakuUkuran`:
```ts
berlakuWarnaIds: z.array(z.string().uuid()).optional(), // kosong = semua warna
```

`src/services/bom.ts`:
1. `detailValues`: tambah
   ```ts
   berlakuWarnaIds: d.berlakuWarnaIds?.length ? d.berlakuWarnaIds : null,
   ```
2. `createBom` & `updateBom`: sebelum transaksi, validasi warna milik varian produk:
   ```ts
   const warnaDipakai = [...new Set(input.details.flatMap((d) => d.berlakuWarnaIds ?? []))];
   if (warnaDipakai.length) {
     const sah = await db
       .selectDistinct({ warnaId: varianProduk.warnaId })
       .from(varianProduk)
       .where(and(eq(varianProduk.produkId, input.produkId), isNull(varianProduk.deletedAt)));
     const set = new Set(sah.map((s) => s.warnaId));
     if (warnaDipakai.some((w) => !set.has(w))) return { error: "Warna tidak ada di varian produk ini" };
   }
   ```
   (`updateBom` — pakai `produkId` BOM yang sedang diedit; lihat cara fungsi itu mendapat produkId.)
   Jadikan satu helper lokal `cekWarnaProduk(produkId, details)` dipanggil dua-duanya.
3. `getBomDetail`: select tambah `berlakuWarnaIds: bomDetail.berlakuWarnaIds`. Setelah
   query details, ambil nama warna sekali jalan:
   ```ts
   const ids = [...new Set(details.flatMap((d) => d.berlakuWarnaIds ?? []))];
   const namaWarna = ids.length
     ? new Map((await db.select({ id: warna.id, nama: warna.nama }).from(warna)
         .where(inArray(warna.id, ids))).map((w) => [w.id, w.nama]))
     : new Map<string, string>();
   return {
     ...header,
     details: details.map((d) => ({
       ...d,
       berlakuWarnaNama: (d.berlakuWarnaIds ?? []).map((id) => namaWarna.get(id) ?? "?"),
     })),
   };
   ```
4. `createNewVersion` (~333): salin `berlakuWarnaIds: d.berlakuWarnaIds,`.

## Task 5 — Service: warna per produk

`src/services/produk.ts` — tambah di bawah `listUkuranPerProduk`, pola sama:
```ts
export async function listWarnaPerProduk(): Promise<Record<string, { id: string; nama: string }[]>> {
  await requireRole(["owner", "admin_gudang", "admin_produksi", "keuangan", "viewer"]);
  const rows = await db
    .selectDistinct({ produkId: varianProduk.produkId, id: warna.id, nama: warna.nama })
    .from(varianProduk)
    .innerJoin(warna, eq(varianProduk.warnaId, warna.id))
    .where(isNull(varianProduk.deletedAt))
    .orderBy(warna.nama);
  const map: Record<string, { id: string; nama: string }[]> = {};
  for (const r of rows) (map[r.produkId] ??= []).push({ id: r.id, nama: r.nama });
  return map;
}
```

## Task 6 — Form BOM: kolom Warna

`src/app/(with-layout)/produksi/bom/_components/BomForm.tsx`
1. Prop baru `warnaPerProduk: Record<string, { id: string; nama: string }[]>`.
2. `EMPTY_ROW` tambah `berlakuWarnaIds: [] as string[]`.
3. `const warnaOptions = (warnaPerProduk[produkId] ?? []).map((w) => ({ label: w.nama, value: w.id }));`
4. Effect ganti produk (~69-84): selain ukuran, buang warna yang tak ada di produk baru:
   ```ts
   const warnaSah = new Set((warnaPerProduk[produkId] ?? []).map((w) => w.id));
   // di dalam forEach:
   const w = row.berlakuWarnaIds ?? [];
   const wSisa = w.filter((id) => warnaSah.has(id));
   if (wSisa.length !== w.length) setValue(`details.${i}.berlakuWarnaIds`, wSisa);
   ```
   (Hati-hati: `return` awal `if (!row.berlakuUkuran) return;` sekarang harus tidak
   melewatkan pengecekan warna — pecah jadi dua blok.)
5. Grid desktop: tambah satu kolom sebelum Ukuran →
   `md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_2.5rem]`
6. Blok Warna — salin blok Ukuran, letakkan **sebelum** Ukuran:
   ```tsx
   <div>
     {index === 0 && (
       <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Warna</label>
     )}
     <MultiSelect
       options={warnaOptions}
       disabled={!produkId}
       placeholder={produkId ? "Semua" : "Pilih produk dulu"}
       value={row?.berlakuWarnaIds ?? []}
       onChange={(vals) => setValue(`details.${index}.berlakuWarnaIds`, vals, { shouldValidate: true })}
     />
   </div>
   ```
7. Subjudul kecil di bawah "Kebutuhan Bahan per Pcs" (satu baris, `text-xs text-dark-5 dark:text-dark-6`):
   *"Warna/Ukuran kosong = dipakai semua. Isi Warna untuk kain yang beda per warna produk."*

`baru/page.tsx` & `[id]/edit/page.tsx`: tambah `listWarnaPerProduk()` ke `Promise.all`,
kirim `warnaPerProduk`. Edit `defaultValues.details` tambah
`berlakuWarnaIds: d.berlakuWarnaIds ?? []`. `baru/page.tsx` — objek `awal` tambah
`berlakuWarnaIds: []` jika tsc minta.

## Task 7 — Detail BOM: kolom Warna

`src/app/(with-layout)/produksi/bom/[id]/_components/BomDetailClient.tsx` (~130-150):
header `<th>Warna</th>` sebelum Ukuran; sel:
```tsx
<td className="px-5 py-3 text-dark dark:text-white">
  {d.berlakuWarnaNama.length ? d.berlakuWarnaNama.join(", ") : "Semua"}
</td>
```

## Task 8 — Import Excel BOM: kolom Warna

1. Buat `src/lib/import/bom-columns.ts` — satu sumber kolom (dipakai di 2 tempat sekarang,
   3 setelah app-0mc0):
   ```ts
   import type { ImportColumn } from "@/lib/import/types";
   export const BOM_IMPORT_COLUMNS: ImportColumn[] = [
     { key: "produk", header: "Produk (kode/nama)", example: "MLBR1", required: true },
     { key: "bahan", header: "Bahan (kode/nama)", example: "BH-KUT-003", required: true },
     { key: "kuantitas", header: "Kuantitas per Pcs", example: "1.7", required: true },
     { key: "toleransi", header: "Toleransi (%)", example: "0", required: false },
     { key: "warna", header: "Berlaku Warna", example: "HITAM", required: false },
     { key: "ukuran", header: "Berlaku Ukuran", example: "", required: false },
     { key: "keterangan", header: "Keterangan", example: "Kain utama", required: false },
   ];
   ```
   Ganti array `columns` di `produksi/bom/_components/BomPageClient.tsx` dan
   `master/data-produk/_components/DataProdukPageClient.tsx` dengan `BOM_IMPORT_COLUMNS`.
2. `src/services/import.ts` `importBomBatch` (~654):
   - Ambil juga warna per produk: `db.select({ produkId: varianProduk.produkId, id: warna.id, kode: warna.kode, nama: warna.nama }).from(varianProduk).innerJoin(warna, ...).where(isNull(varianProduk.deletedAt))`.
   - Per baris: `raw.warna` dipisah koma, tiap item dicocokkan (lowercase) ke kode ATAU nama
     warna **milik varian produk itu**. Tidak ketemu → error baris
     `Warna "X" tidak ada di varian produk <kode>`.
   - `Baris` tambah `berlakuWarnaIds: string[] | null`; insert ikut.
   - **Aturan duplikat** (~715): sekarang menolak bahan sama 2x per produk. Itu salah
     sejak ada filter ukuran (bahan sama beda ukuran itu sah, form sudah mengizinkan).
     Ganti kunci jadi `bahanId + ukuran + warna`:
     ```ts
     const kunci = `${bahanId}|${berlakuUkuran ?? ""}|${[...(warnaIds ?? [])].sort().join(",")}`;
     ```

## Verifikasi (manual, dev)

1. `npx tsx src/lib/bom-ukuran.test.ts` PASS; `npx tsc --noEmit` 0 error;
   `grep -rn "PcsPerUkuran" src` kosong.
2. Buat BOM draft MALABAR baru (atau Buat Versi Baru dari v1 lalu edit):
   RJN HITAM → Warna HITAM, Ukuran kosong; RJN PETROL → Warna PETROL, Ukuran kosong.
   Simpan → Aktifkan. Detail BOM menampilkan kolom Warna.
3. Buat PO MALABAR: M Hitam 10 + M Petrol 10 → RJN HITAM **17 m**, RJN PETROL **17 Yrd**,
   Bilabong 7,2 Kg. Ganti ke L → angka sama. Hanya Hitam 10 → RJN PETROL 0.
4. BOM lama tanpa warna (produk lain) → estimasi tidak berubah dibanding sebelum deploy.
5. Ganti produk di form BOM setelah pilih warna → warna yang bukan milik produk baru terhapus.
6. Import Excel di daftar BOM: template ada kolom "Berlaku Warna"; `HITAM` untuk MALABAR
   OK; `MERAH` → error baris; RJN HITAM dua baris beda ukuran → diterima.

## Di luar scope (sudah jadi kartu)

- `app-b444` — grafik WIP (`services/wip.ts` ~320) menghitung standar tanpa filter
  ukuran/warna. Jangan disentuh di sini.
- Data BOM MALABAR prod **tidak** diubah otomatis — klien bikin versi baru sendiri
  setelah deploy (Abu kabari).

## Commit

```
feat(bom): baris bahan bisa berlaku per warna varian

Kain utama beda per warna produk (RJN HITAM vs PETROL), bukan per
ukuran. Kolom bom_detail.berlaku_warna_ids (null = semua warna)
ikut disaring di estimasi PO. Import Excel dapat kolom Berlaku Warna.

fixes #24
```

## CLAUDE.md Check
- [ ] Pattern baru: filter baris BOM = ukuran AND warna lewat `pcsBerlaku()` — sebut di
      `docs/konsep-produksi.md` bagian BOM/estimasi.
- [ ] Tabel baru? Tidak (kolom baru).
