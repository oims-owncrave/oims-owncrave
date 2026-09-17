/**
 * Pemeriksa cocokkanUkuranBerlaku — app-uf3d. Jalankan: npx tsx src/lib/bom-ukuran.test.ts
 */
import assert from "node:assert/strict";
import { cocokkanUkuranBerlaku } from "./bom-ukuran";

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

console.log("bom-ukuran: semua pemeriksa lolos");
