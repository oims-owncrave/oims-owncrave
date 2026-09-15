// Menunjukkan DB mana yang sedang ditunjuk sebuah env file, tanpa membocorkan kredensial.
// Dipakai sebelum operasi berisiko: `npm run db:whoami` / `npm run db:whoami:prod`.
import { config } from "dotenv";
import postgres from "postgres";

const envFile = process.env.ENV_FILE ?? ".env.local";
config({ path: envFile, quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(`✗ ${envFile}: DATABASE_URL kosong`);
  process.exit(1);
}

const host = new URL(url).host;
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "?";

const sql = postgres(url, { max: 1 });
try {
  const [{ n }] = await sql`
    select count(*)::int n from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'`;
  const rows = {};
  for (const t of ["bahan", "produk", "bom", "po_produksi", "mutasi_stok"]) {
    try {
      const [{ c }] = await sql.unsafe(`select count(*)::int c from ${t}`);
      rows[t] = c;
    } catch {
      rows[t] = "-";
    }
  }
  console.log(`env file   : ${envFile}`);
  console.log(`project ref: ${ref}`);
  console.log(`host       : ${host}`);
  console.log(`tabel      : ${n}`);
  console.log(`isi        : ${Object.entries(rows).map(([k, v]) => `${k}=${v}`).join("  ")}`);
} finally {
  await sql.end();
}
