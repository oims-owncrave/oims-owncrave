/**
 * Pemeriksa cocokkanUkuranBerlaku — app-uf3d. Jalankan: npx tsx src/lib/bom-ukuran.test.ts
 */
import assert from "node:assert/strict";
import { cocokkanUkuranBerlaku, pcsBerlaku, varianTanpaBahanKhusus } from "./bom-ukuran";

// null/kosong = berlaku semua ukuran
assert.equal(cocokkanUkuranBerlaku(null), null);
assert.equal(cocokkanUkuranBerlaku(""), null);

// satu ukuran (kasus lama, tetap jalan)
assert.deepEqual(cocokkanUkuranBerlaku("XXL"), ["XXL"]);
assert.deepEqual(cocokkanUkuranBerlaku("xxl"), ["XXL"]); // huruf kecil

// multi-ukuran dipisah koma (bug app-uf3d) — dulu jadi 0, harus jadi daftar
assert.deepEqual(cocokkanUkuranBerlaku("S,M"), ["S", "M"]);
assert.deepEqual(cocokkanUkuranBerlaku("L,XL"), ["L", "XL"]);

// spasi setelah koma juga gagal sebelumnya
assert.deepEqual(cocokkanUkuranBerlaku("S, M"), ["S", "M"]);

// koma nyasar tidak menghasilkan entri kosong
assert.deepEqual(cocokkanUkuranBerlaku("S,,M"), ["S", "M"]);
assert.deepEqual(cocokkanUkuranBerlaku("S,"), ["S"]);

// pcsBerlaku — app-0vqt: filter ukuran DAN warna
const HITAM = "h",
  PETROL = "p";
const po = [
  { ukuran: "M", warnaId: HITAM, pcs: 10 },
  { ukuran: "M", warnaId: PETROL, pcs: 10 },
];
assert.equal(pcsBerlaku(po, null, null), 20); // Bilabong: semua
assert.equal(pcsBerlaku(po, null, [HITAM]), 10); // RJN HITAM: warna Hitam saja
assert.equal(pcsBerlaku(po, null, [PETROL]), 10); // RJN PETROL
assert.equal(pcsBerlaku(po, "L", null), 0); // ukuran lain
assert.equal(pcsBerlaku(po, "m", [HITAM]), 10); // ukuran huruf kecil + warna
assert.equal(pcsBerlaku(po, null, []), 20); // array kosong = semua
assert.equal(pcsBerlaku(po, null, [HITAM, PETROL]), 20);

// varianTanpaBahanKhusus — app-0fci: varian ber-target tak cocok baris BOM khusus mana pun
// Kasus HBK: Hitam·M, Mocca·L; PO 10 M Hitam/Mocca/Olive
const H = "h",
  MC = "mc",
  OL = "ol";
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

console.log("bom-ukuran: semua pemeriksa lolos");
