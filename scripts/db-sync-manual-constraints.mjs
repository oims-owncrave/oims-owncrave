// Menyalin objek DB yang TIDAK ada di schema.ts sehingga tidak ikut `drizzle-kit push`:
// CHECK constraint, partial unique index ber-COALESCE, dan FK yang dideklarasi manual
// (circular reference). Tanpa ini DB dev lebih longgar dari DB klien — bug lolos di dev.
//
//   node scripts/db-sync-manual-constraints.mjs            # lihat apa yang kurang
//   node scripts/db-sync-manual-constraints.mjs --apply    # terapkan ke .env.local
//
// Sumber kebenaran: DB di .env.production. Target: DB di .env.local.
import { config } from "dotenv";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const conn = (file) => {
  const e = {};
  config({ path: file, processEnv: e, quiet: true });
  if (!e.DATABASE_URL) throw new Error(`${file}: DATABASE_URL kosong`);
  return postgres(e.DATABASE_URL, { max: 1 });
};

const Q_CHECK = `select conname name, 'ALTER TABLE public."'||rel.relname||'" ADD CONSTRAINT "'||conname||'" '||pg_get_constraintdef(c.oid) ddl
  from pg_constraint c join pg_class rel on rel.oid=c.conrelid
  where c.connamespace='public'::regnamespace and c.contype='c' order by conname`;

const Q_FK = `select conname name, 'ALTER TABLE public."'||rel.relname||'" ADD CONSTRAINT "'||conname||'" '||pg_get_constraintdef(c.oid) ddl
  from pg_constraint c join pg_class rel on rel.oid=c.conrelid
  where c.connamespace='public'::regnamespace and c.contype='f' order by conname`;

const Q_IDX = `select indexname name, indexdef ddl from pg_indexes
  where schemaname='public' and indexdef ilike '%unique%' order by indexname`;

// FK & unique index dibandingkan lewat STRUKTUR, bukan nama: drizzle memakai sufiks
// _fk/_unique sedangkan yang dibuat manual memakai _fkey/_key. Nama beda, isi sama.
const sig = (ddl) => ddl.replace(/CONSTRAINT "[^"]+"/, "").replace(/INDEX "?[\w]+"? ON/, "INDEX ON")
  .replace(/\s+/g, " ").trim().toLowerCase();

const src = conn(".env.production");
const dst = conn(".env.local");
try {
  let pending = [];
  for (const [label, q, byName] of [["CHECK", Q_CHECK, true], ["FK", Q_FK, false], ["UNIQUE INDEX", Q_IDX, false]]) {
    const a = await src.unsafe(q);
    const b = await dst.unsafe(q);
    const have = new Set(byName ? b.map((r) => r.name) : b.map((r) => sig(r.ddl)));
    const missing = a.filter((r) => !have.has(byName ? r.name : sig(r.ddl)));
    console.log(`${label.padEnd(13)} klien=${String(a.length).padStart(3)} dev=${String(b.length).padStart(3)} kurang=${missing.length}`);
    missing.forEach((m) => console.log(`    - ${m.name}`));
    pending.push(...missing);
  }
  if (!pending.length) { console.log("\n✓ dev sudah selaras dengan klien"); }
  else if (!APPLY) { console.log(`\n${pending.length} objek belum ada. Jalankan ulang dengan --apply untuk menerapkan.`); }
  else {
    console.log(`\nmenerapkan ${pending.length} objek ke .env.local ...`);
    let ok = 0;
    for (const p of pending) {
      try { await dst.unsafe(p.ddl); ok++; }
      catch (e) { console.log(`  ✗ ${p.name}: ${e.message.split("\n")[0]}`); }
    }
    console.log(`✓ berhasil ${ok}/${pending.length}`);
  }
} finally { await src.end(); await dst.end(); }
