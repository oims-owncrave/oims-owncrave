/**
 * Pemeriksa untuk pisahNomor — dipakai saat satu transaksi butuh beberapa nomor
 * berurutan (app-qh4u). Jalankan: npx tsx src/lib/document-number.test.ts
 */
import assert from "node:assert/strict";
import { pisahNomor } from "./document-number";

// prefix berisi tanda hubung (SLS-JHT) — hanya urutan terakhir yang dipisah
assert.deepEqual(pisahNomor("SLS-JHT-202609-0003"), ["SLS-JHT-202609", 3]);

// prefix tanpa tanda hubung
assert.deepEqual(pisahNomor("BM-202609-0001"), ["BM-202609", 1]);

// urutan besar tetap terbaca, tidak terpotong padStart
assert.deepEqual(pisahNomor("QC-202612-1234"), ["QC-202612", 1234]);

// dipakai bersama padStart: 3 kasus berurutan dari nomor awal
{
  const [awalan, urut] = pisahNomor("SLS-JHT-202609-0009");
  const hasil = [0, 1, 2].map((i) => `${awalan}-${String(urut + i).padStart(4, "0")}`);
  assert.deepEqual(hasil, [
    "SLS-JHT-202609-0009",
    "SLS-JHT-202609-0010",
    "SLS-JHT-202609-0011",
  ]);
}

// nomor rusak ditolak, bukan diam-diam jadi NaN
assert.throws(() => pisahNomor("SLS-JHT-202609-abcd"), /tidak dikenali/);
assert.throws(() => pisahNomor("tanpatandahubung"), /tidak dikenali/);

console.log("document-number: semua pemeriksa lolos");
