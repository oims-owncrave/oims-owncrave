// Menyalin data MASTER (bukan transaksi) dari DB klien ke DB dev/demo, supaya dev punya
// bahan untuk dipakai tanpa menyentuh data asli. Aman diulang: pakai ON CONFLICT DO NOTHING.
//
//   node scripts/db-seed-dev-from-client.mjs            # lihat rencana
//   node scripts/db-seed-dev-from-client.mjs --apply
//
// Sengaja TIDAK menyalin: stok, mutasi_stok, audit_log, po_*, wo_*, bom* dan seluruh
// tabel transaksi — dev harus mulai bersih. users juga tidak, id-nya terikat auth project lain.
import { config } from "dotenv";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const TABEL = ["kategori", "satuan", "warna", "supplier", "bahan"]; // urut: FK parent dulu

const conn = (f) => {
  const e = {};
  config({ path: f, processEnv: e, quiet: true });
  return postgres(e.DATABASE_URL, { max: 1 });
};
const src = conn(".env.production");
const dst = conn(".env.local");

try {
  for (const t of TABEL) {
    const rows = await src.unsafe(`select * from ${t}`);
    const [{ n: sudah }] = await dst.unsafe(`select count(*)::int n from ${t}`);
    console.log(`${t.padEnd(10)} klien=${String(rows.length).padStart(3)}  dev(sebelum)=${sudah}`);
    if (!APPLY || !rows.length) continue;
    let ok = 0;
    for (const r of rows) {
      const cols = Object.keys(r);
      const vals = cols.map((c) => r[c]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(",");
      try {
        await dst.unsafe(
          `insert into ${t} (${cols.map((c) => `"${c}"`).join(",")}) values (${ph}) on conflict do nothing`,
          vals,
        );
        ok++;
      } catch (e) {
        console.log(`   ✗ ${t}: ${e.message.split("\n")[0]}`);
        break;
      }
    }
    const [{ n: kini }] = await dst.unsafe(`select count(*)::int n from ${t}`);
    console.log(`   → dev sekarang=${kini} (dikirim ${ok})`);
  }
  if (!APPLY) console.log("\nJalankan ulang dengan --apply untuk menyalin.");
} finally {
  await src.end();
  await dst.end();
}
