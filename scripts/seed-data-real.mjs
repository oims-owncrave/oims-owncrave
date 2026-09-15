// Input data real klien (5 produk, warna, bahan, varian, BOM) dari hasil pembacaan Excel.
// Sumber: docs/seed/data-real-klien.json — lihat docs/seed/pemetaan-excel-klien.md.
//
//   node scripts/seed-data-real.mjs            # rencana saja, tidak menulis
//   node scripts/seed-data-real.mjs --apply
//
// Idempoten: dijalankan dua kali tidak menggandakan (pakai lookup + ON CONFLICT DO NOTHING).
// Target selalu .env.local. Menolak jalan kalau tertuju ke DB klien.
import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");
const DATA = JSON.parse(readFileSync("docs/seed/data-real-klien.json", "utf8"));
const KLIEN_REF = "aixpakizbxegokrnhhlc";

const e = {};
config({ path: ".env.local", processEnv: e, quiet: true });
if (e.NEXT_PUBLIC_SUPABASE_URL?.includes(KLIEN_REF)) {
  console.error("✗ .env.local menunjuk DB KLIEN. Skrip ini hanya untuk dev. Batal.");
  process.exit(1);
}
const sql = postgres(e.DATABASE_URL, { max: 1 });

// Kain utama disimpan PER WARNA (keputusan Abu 15 Sep): stok kain dihitung per warna,
// rol hitam tidak bisa dipakai untuk jaket olive.
const KAIN_SATUAN = "Meter";
const log = [];

try {
  const [{ id: uid }] = await sql`select id from users order by created_at limit 1`;
  const kat = Object.fromEntries((await sql`select kode,id from kategori where deleted_at is null`).map(r => [r.kode, r.id]));
  const sat = Object.fromEntries((await sql`select nama,id from satuan where deleted_at is null`).map(r => [r.nama, r.id]));

  // ── 1. warna ────────────────────────────────────────────────
  const warnaButuh = new Set(Object.values(DATA.varian).flat());
  for (const w of warnaButuh) {
    const kode = DATA.warna_kode[w] ?? w.slice(0, 3);
    const nama = w.charAt(0) + w.slice(1).toLowerCase();
    if (APPLY) await sql`insert into warna (kode,nama) select ${kode},${nama}
      where not exists (select 1 from warna where upper(nama)=${w} and deleted_at is null)`;
  }
  const warna = Object.fromEntries((await sql`select upper(nama) n,id from warna where deleted_at is null`).map(r => [r.n, r.id]));
  log.push(`warna      : ${warnaButuh.size} dibutuhkan, ada ${Object.keys(warna).length}`);

  // ── 2. bahan kain utama per warna ───────────────────────────
  const kainButuh = [];
  for (const [prod, jenis] of Object.entries(DATA.kain))
    for (const w of DATA.varian[prod]) kainButuh.push([jenis, w]);
  const uniqKain = [...new Map(kainButuh.map(([j, w]) => [`${j}|${w}`, [j, w]])).values()];
  for (const [jenis, w] of uniqKain) {
    const nama = `${jenis} ${w}`;
    if (!APPLY) continue;
    const [ada] = await sql`select id from bahan where nama=${nama} and deleted_at is null`;
    if (ada) continue;
    const [{ n }] = await sql`select count(*)::int n from bahan where kategori_id=${kat["KN-UTM"]}`;
    await sql`insert into bahan (kode,nama,kategori_id,satuan_id,warna_id)
      values (${"BH-KUT-" + String(n + 1).padStart(3, "0")},${nama},${kat["KN-UTM"]},${sat[KAIN_SATUAN]},${warna[w] ?? null})`;
  }
  log.push(`kain utama : ${uniqKain.length} (jenis x warna)`);

  // ── 3. bahan non-kain yang belum ada ────────────────────────
  const BARU = {
    "Puring Bilabong 45 /120Gsm (Tebal)": ["KN-FRG", "Meter", null, "Bilabong 120Gsm (Tebal)"],
    "Puring BILABONG 120GSM":             ["KN-FRG", "Meter", null, "Bilabong 120Gsm (Tebal)"],
    "Puring Bilabong (Tipis)":            ["KN-FRG", "Meter", null, "Bilabong (Tipis)"],
    "Puring Jala Mesh/Basket":            ["KN-FRG", "Meter", null, "Jala Mesh/Basket"],
    "Puring Peles2 (bagian lengan)":      ["KN-FRG", "Meter", null, "Peles2 (lengan)"],
    "Benang Tambang":                     ["BNNG", "Picis", null, "Benang Tambang"],
    "Benang Tambang (Hitam,Olive,Mocca)": ["BNNG", "Picis", null, "Benang Tambang"],
    "Benang Tambang (Hitam,Petrol, Hijau Army)": ["BNNG", "Picis", null, "Benang Tambang"],
    "Label Size Chart (S,M,L,XL,XXL)":    ["AKSS", "Picis", "HITAM", "Label Size Chart (S,M,L,XL,XXL)"],
    "Resleting Vislon GMC No5, Hitam 30Inch/66cm (S,M)":    ["TR-SLG", "Picis", "HITAM", "Vision GMC No5 30Inch/66cm (S,M)"],
    "Resleting Vislon GMC No5, Hitam 32Inch/66cm (XL,XXL)": ["TR-SLG", "Picis", "HITAM", "Vision GMC No5 32Inch/66cm (L,XL)"],
    "Resleting Vislon GMC No5, Hitam 34Inch/71cm (XXL)":    ["TR-SLG", "Picis", "HITAM", "Vision GMC No5 34Inch/71cm (XXL)"],
    "Resleting Coil 15Inch/40cm (Resleting hoodie)":        ["TR-SLG", "Picis", "HITAM", "Coil 15Inch/40cm (hoodie)"],
    "Resleting jepang 25cm":              ["TR-SLG", "Picis", "HITAM", "Jepang 25cm"],
  };
  const uniqBaru = [...new Map(Object.values(BARU).map(v => [v[3], v])).values()];
  for (const [kk, sn, wn, nama] of uniqBaru) {
    if (!APPLY) continue;
    const [ada] = await sql`select id from bahan where nama=${nama} and deleted_at is null`;
    if (ada) continue;
    const [{ n }] = await sql`select count(*)::int n from bahan where kategori_id=${kat[kk]}`;
    await sql`insert into bahan (kode,nama,kategori_id,satuan_id,warna_id)
      values (${"BH-" + kk + "-" + String(n + 1).padStart(3, "0")},${nama},${kat[kk]},${sat[sn]},${wn ? warna[wn] : null})`;
  }
  log.push(`bahan baru : ${uniqBaru.length}`);

  // pemetaan nama Excel -> bahan.id
  const semua = await sql`select id,nama from bahan where deleted_at is null`;
  // beberapa nama bahan warisan klien punya spasi di ujung — samakan sebelum dicocokkan
  const byNama = Object.fromEntries(semua.map(r => [r.nama.trim(), r.id]));
  const MAP_LAMA = JSON.parse(readFileSync("docs/seed/peta-bahan.json", "utf8"));
  const resolve = (excelNama, produk) => {
    if (BARU[excelNama]) return byNama[BARU[excelNama][3]];
    if (MAP_LAMA[excelNama]) return byNama[MAP_LAMA[excelNama]];
    // kain utama -> pakai warna default (varian pertama) produk
    if (/Parasut|Crinkle/i.test(excelNama)) {
      const jenis = DATA.kain[produk];
      return byNama[`${jenis} ${DATA.varian[produk][0]}`];
    }
    return null;
  };

  // ── 4. produk + varian ──────────────────────────────────────
  for (const [prod, kode] of Object.entries(DATA.kode)) {
    if (!APPLY) continue;
    let [p] = await sql`select id from produk where kode=${kode} and deleted_at is null`;
    if (!p) [p] = await sql`insert into produk (kode,nama,kategori,brand,jenis)
      values (${kode},${prod.charAt(0)+prod.slice(1).toLowerCase()},'Jaket','Owncrave','Outerwear') returning id`;
    for (const w of DATA.varian[prod]) for (const u of DATA.ukuran[prod]) {
      const sku = `${kode}-${DATA.warna_kode[w] ?? w.slice(0,3)}-${u}`;
      await sql`insert into varian_produk (produk_id,warna_id,ukuran,sku)
        select ${p.id},${warna[w]},${u},${sku}
        where not exists (select 1 from varian_produk where sku=${sku} and deleted_at is null)`;
    }
  }
  const nv = APPLY ? (await sql`select count(*)::int n from varian_produk where deleted_at is null`)[0].n : 0;
  log.push(`produk     : ${Object.keys(DATA.kode).length} | varian: ${nv}`);

  // ── 5. BOM + detail ─────────────────────────────────────────
  let bomN = 0, detN = 0, gagal = [];
  for (const [prod, kode] of Object.entries(DATA.kode)) {
    if (!APPLY) { bomN++; detN += DATA.bom[prod].length; continue; }
    const [p] = await sql`select id from produk where kode=${kode} and deleted_at is null`;
    let [b] = await sql`select id from bom where produk_id=${p.id} and deleted_at is null`;
    if (!b) {
      const [{ c }] = await sql`select count(*)::int c from bom`;
      const nomor = `BOM-${new Date().toISOString().slice(0,7).replace("-","")}-${String(c+1).padStart(4,"0")}`;
      [b] = await sql`insert into bom (nomor_dokumen,produk_id,versi,status,created_by,catatan)
        values (${nomor},${p.id},1,'aktif',${uid},'Dari Excel klien _PRODUKSI OWNC.xlsx') returning id`;
      bomN++;
    }
    for (const d of DATA.bom[prod]) {
      const bid = resolve(d.nama, prod);
      if (!bid) { gagal.push(`${prod}: ${d.nama}`); continue; }
      if (d.q == null) { gagal.push(`${prod}: ${d.nama} (kuantitas kosong)`); continue; }
      await sql`insert into bom_detail (bom_id,bahan_id,kuantitas,berlaku_ukuran,keterangan)
        select ${b.id},${bid},${d.q},${d.berlakuUkuran},${d.ket}
        where not exists (select 1 from bom_detail where bom_id=${b.id} and bahan_id=${bid}
                          and coalesce(berlaku_ukuran,'')=coalesce(${d.berlakuUkuran},''))`;
      detN++;
    }
  }
  log.push(`bom        : ${bomN} | bom_detail: ${detN}`);
  if (gagal.length) log.push(`TIDAK TERPETAKAN (${gagal.length}):\n   ` + gagal.join("\n   "));

  console.log(log.join("\n"));
  if (!APPLY) console.log("\n(rencana saja — jalankan dengan --apply untuk menulis)");
} finally { await sql.end(); }
