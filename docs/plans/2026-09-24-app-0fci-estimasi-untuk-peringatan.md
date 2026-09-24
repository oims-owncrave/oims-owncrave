# app-0fci — Estimasi PO: kolom "Untuk" + peringatan varian tanpa bahan

**Lanjutan app-0vqt.** Abu menguji PO HBK: 10 M untuk Hitam, Mocca, Olive →
RJN HITAM 120 m, RJN MOCCA 0, Olive tidak kebagian kain. Hitungan **benar**
(BOM: RJN HITAM = Hitam·M, RJN MOCCA = Mocca·**L**, Olive tak punya baris), tapi
tabel estimasi tidak memperlihatkan alasannya, jadi terasa salah.

## Keputusan

1. Kolom **Untuk** per bahan di tabel estimasi: `Hitam · M`, `Mocca · L`, `Semua`.
2. **Peringatan kuning** di atas tabel: varian ber-target yang tidak cocok dengan baris
   BOM *khusus* (punya filter warna/ukuran) mana pun →
   `⚠ Mocca M, Olive M belum punya bahan khusus di BOM — cek BOM kalau seharusnya ada.`
   Hanya dihitung kalau BOM punya minimal satu baris khusus (BOM tanpa filter = tak ada
   peringatan). Tidak memblokir simpan.
3. Input matrix **tidak** di-disable (yang salah BOM-nya; app tak bisa tahu bahan mana
   wajib per varian).

---

## Task 1 — Helper murni + test (TDD)

`src/lib/bom-ukuran.ts` — tambah:
```ts
type FilterBaris = { berlakuUkuran: string | null; berlakuWarnaIds: string[] | null };

/**
 * Varian ber-target yang tidak cocok dengan baris BOM KHUSUS (punya filter warna/ukuran)
 * mana pun. BOM tanpa baris khusus → [] (tak ada yang bisa "terlewat").
 */
export function varianTanpaBahanKhusus(pcsPerVarian: PcsVarian[], baris: FilterBaris[]): PcsVarian[] {
  const khusus = baris.filter((b) => b.berlakuUkuran?.trim() || b.berlakuWarnaIds?.length);
  if (!khusus.length) return [];
  return pcsPerVarian.filter(
    (v) => v.pcs > 0 && !khusus.some((b) => pcsBerlaku([v], b.berlakuUkuran, b.berlakuWarnaIds) > 0),
  );
}
```

`src/lib/bom-ukuran.test.ts` — assert dulu (FAIL), lalu implement (PASS):
```ts
import { cocokkanUkuranBerlaku, pcsBerlaku, varianTanpaBahanKhusus } from "./bom-ukuran";

// Kasus HBK: Hitam·M, Mocca·L; PO 10 M Hitam/Mocca/Olive
const H = "h", MC = "mc", OL = "ol";
const poHbk = [
  { ukuran: "M", warnaId: H, pcs: 10 },
  { ukuran: "M", warnaId: MC, pcs: 10 },
  { ukuran: "M", warnaId: OL, pcs: 10 },
];
const bomHbk = [
  { berlakuUkuran: "M", berlakuWarnaIds: [H] },
  { berlakuUkuran: "L", berlakuWarnaIds: [MC] },
];
assert.deepEqual(varianTanpaBahanKhusus(poHbk, bomHbk).map((v) => v.warnaId), [MC, OL]);
// BOM tanpa baris khusus → tak ada peringatan
assert.deepEqual(varianTanpaBahanKhusus(poHbk, [{ berlakuUkuran: null, berlakuWarnaIds: null }]), []);
// pcs 0 tidak dilaporkan
assert.deepEqual(varianTanpaBahanKhusus([{ ukuran: "M", warnaId: OL, pcs: 0 }], bomHbk), []);
// baris khusus warna saja menutup semua ukuran warna itu
assert.deepEqual(
  varianTanpaBahanKhusus(poHbk, [{ berlakuUkuran: null, berlakuWarnaIds: [H, MC, OL] }]),
  [],
);
```
Jalankan `npx tsx src/lib/bom-ukuran.test.ts`.

## Task 2 — Estimasi mengembalikan label

`src/lib/produksi/estimasi.ts`:
1. `EstimasiRow` tambah `untuk: string[]; // label filter baris BOM, [] = semua`.
2. `EstimasiResult` sukses tambah `varianTanpaBahan: string[]` (label `"Mocca M"`).
3. `hitungEstimasi` return jadi `Promise<{ rows: EstimasiRow[]; varianTanpaBahan: string[] }>`.
4. Setelah query `bomRows`, ambil nama warna sekali jalan untuk gabungan id warna BOM +
   `pcsPerVarian.warnaId` (import `warna` dari schema, `inArray`):
   ```ts
   const warnaIds = [...new Set([
     ...bomRows.flatMap((r) => r.berlakuWarnaIds ?? []),
     ...pcsPerVarian.map((p) => p.warnaId).filter(Boolean),
   ])];
   const namaWarna = new Map(
     warnaIds.length
       ? (await tx.select({ id: warna.id, nama: warna.nama }).from(warna).where(inArray(warna.id, warnaIds)))
           .map((w) => [w.id, w.nama])
       : [],
   );
   ```
5. Label per baris BOM:
   ```ts
   const labelBaris = (r: (typeof bomRows)[number]) => {
     const w = (r.berlakuWarnaIds ?? []).map((id) => namaWarna.get(id) ?? "?").join("/");
     const u = r.berlakuUkuran?.trim() ?? "";
     return [w, u].filter(Boolean).join(" · ");   // "" = semua
   };
   ```
   Di loop agregasi: saat buat entri baru `untuk: labelBaris(r) ? [labelBaris(r)] : []`;
   saat `prev` ada, push label kalau belum ada. Kalau salah satu baris bahan itu label-nya
   `""` (semua), biarkan `untuk` berisi label lain saja — UI menampilkan `Semua` bila `[]`.
   (Kasus campur jarang; cukup begini.)
6. Akhir fungsi:
   ```ts
   const varianTanpaBahan = varianTanpaBahanKhusus(pcsPerVarian, bomRows)
     .map((v) => `${namaWarna.get(v.warnaId) ?? "?"} ${v.ukuran}`);
   return { rows, varianTanpaBahan };
   ```

`src/services/po-produksi.ts` — dua pemanggil:
```ts
const { rows, varianTanpaBahan } = await hitungEstimasi(db, bomRow.id, pcsPerVarian, lebihanMap);
return { bomNomor: bomRow.nomorDokumen, bomVersi: bomRow.versi, rows, varianTanpaBahan };
```
Cek `grep -rn "hitungEstimasi\|getEstimasiBahan" src` — `permintaan-bahan/baru/page.tsx`
memakai `getEstimasiBahan`; pastikan masih compile (field baru tak wajib dipakai).

## Task 3 — UI

**Satu komponen kecil bersama** `src/app/(with-layout)/produksi/po/_components/PeringatanVarian.tsx`:
```tsx
export function PeringatanVarian({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
      ⚠ <strong>{labels.join(", ")}</strong> belum punya bahan khusus di BOM — cek BOM kalau
      seharusnya ada.
    </div>
  );
}
```

`KebutuhanBahanPreview.tsx` (form PO):
- Render `<PeringatanVarian labels={preview.varianTanpaBahan} />` tepat sebelum `<div className="overflow-x-auto ...">` tabel (dalam blok `preview && !("error" in preview)`; bungkus fragment).
- Kolom baru **Untuk** setelah Bahan: `<th className="px-4 py-2.5 w-36">Untuk</th>`, sel
  `<td className="px-4 py-2.5 text-dark-5 dark:text-dark-6">{r.untuk.length ? r.untuk.join(", ") : "Semua"}</td>`.

`[id]/_components/EstimasiSection.tsx` (detail PO): sama — peringatan di atas tabel
(dalam padding `px-5 pt-4`), kolom Untuk setelah Bahan (`px-5 py-3`).

## Verifikasi

1. `npx tsx src/lib/bom-ukuran.test.ts` PASS, `npx tsc --noEmit` 0 error.
2. Manual (dev): PO HBK 10 M Hitam/Mocca/Olive → peringatan "Mocca M, Olive M", kolom
   Untuk: RJN HITAM `Hitam · M`, RJN MOCCA `Mocca · L`.
3. Produk yang BOM-nya tanpa filter → tak ada peringatan, kolom Untuk `Semua`.

## Commit

```
feat(po): kolom Untuk + peringatan varian tanpa bahan di estimasi

Hitungan per warna/ukuran benar tapi alasannya tak terlihat — bahan
yang 0 dan varian tak kebagian kain terasa seperti bug.

fixes #26
```

## CLAUDE.md Check
- [ ] Pattern baru? Tidak (helper di bom-ukuran.ts, sudah tercatat di konsep-produksi).
