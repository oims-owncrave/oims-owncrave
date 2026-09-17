// Master vendor, lokasi, penjahit, dan tarif untuk DB dev — bahan tutorial Tahap 3.
// Sengaja dua vendor dengan qcMode berbeda supaya alur QC internal dan QC vendor
// dua-duanya bisa ditunjukkan.
//
//   node scripts/seed-vendor-dev.mjs            # lihat rencana
//   node scripts/seed-vendor-dev.mjs --apply
//
// Idempoten: dijalankan dua kali tidak menggandakan.
import { config } from "dotenv";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const KLIEN_REF = "aixpakizbxegokrnhhlc";

const e = {};
config({ path: ".env.local", processEnv: e, quiet: true });
if (e.NEXT_PUBLIC_SUPABASE_URL?.includes(KLIEN_REF)) {
  console.error("✗ .env.local menunjuk DB KLIEN. Skrip ini hanya untuk dev. Batal.");
  process.exit(1);
}
// transform.column.to: camelCase di skrip -> snake_case di DB
const sql = postgres(e.DATABASE_URL, { max: 1, transform: postgres.camel });

const VENDOR = [
  {
    kode: "VDR-0001", nama: "CV Jahit Cibaduyut", pemilik: "H. Asep Saepudin",
    kontak: "H. Asep", telepon: "0812-2000-1001", kota: "Bandung",
    alamat: "Jl. Cibaduyut Raya No. 118, Bandung",
    kapasitasHarian: 120, jenisPekerjaan: ["jahit_penuh", "obras"],
    kapabilitas: ["jahit"], terminHari: 14, leadTimeHari: 7,
    qcMode: "internal", // hasilnya masuk antrean QC Owncrave
    bankNama: "BCA", bankNomorRekening: "1234567890", bankAtasNama: "Asep Saepudin",
  },
  {
    kode: "VDR-0002", nama: "Konveksi Soreang Jaya", pemilik: "Ibu Nurhayati",
    kontak: "Bu Nur", telepon: "0813-2000-2002", kota: "Bandung",
    alamat: "Jl. Raya Soreang No. 45, Kab. Bandung",
    kapasitasHarian: 80, jenisPekerjaan: ["jahit_penuh", "finishing"],
    kapabilitas: ["jahit"], terminHari: 30, leadTimeHari: 10,
    qcMode: "vendor", // QC dilakukan vendor sendiri
    qcOfficer: "Dedi Suhendar",
    bankNama: "Mandiri", bankNomorRekening: "9876543210", bankAtasNama: "Nurhayati",
  },
];

const LOKASI = [
  { kode: "LOK-0001", nama: "Workshop Owncrave", jenis: "workshop_internal",
    kota: "Bandung", alamat: "Jl. Terusan Buah Batu No. 7", pic: "Rizki", vendorKode: null },
  { kode: "LOK-0002", nama: "Workshop Cibaduyut", jenis: "vendor_eksternal",
    kota: "Bandung", alamat: "Jl. Cibaduyut Raya No. 118", pic: "H. Asep", vendorKode: "VDR-0001" },
  { kode: "LOK-0003", nama: "Konveksi Soreang", jenis: "vendor_eksternal",
    kota: "Bandung", alamat: "Jl. Raya Soreang No. 45", pic: "Bu Nur", vendorKode: "VDR-0002" },
];

const PENJAHIT = [
  { kode: "JHT-INT-0001", nama: "Ujang Supriadi", jenis: "internal",
    telepon: "0821-3000-1001", kapasitasHarian: 15, keahlian: ["jaket", "obras"],
    vendorKode: null, lokasiKode: "LOK-0001" },
  { kode: "JHT-INT-0002", nama: "Siti Aminah", jenis: "sampel",
    telepon: "0821-3000-1002", kapasitasHarian: 8, keahlian: ["sampel", "jaket"],
    vendorKode: null, lokasiKode: "LOK-0001" },
  { kode: "JHT-EXT-0001", nama: "Dadang Kurnia", jenis: "anggota_vendor",
    telepon: "0821-3000-2001", kapasitasHarian: 20, keahlian: ["jaket"],
    vendorKode: "VDR-0001", lokasiKode: "LOK-0002" },
  { kode: "JHT-EXT-0002", nama: "Eko Prasetyo", jenis: "eksternal_individu",
    telepon: "0821-3000-2002", kapasitasHarian: 12, keahlian: ["jaket", "pasang resleting"],
    vendorKode: null, lokasiKode: null },
];

// tarif: per produk, dipakai saat menghitung biaya jasa jahit di Tahap 3
const TARIF = [
  { produkKode: "SPN", jenisPekerjaan: "jahit_penuh", vendorKode: "VDR-0001", nominal: "30000" },
  { produkKode: "SPN", jenisPekerjaan: "jahit_penuh", vendorKode: "VDR-0002", nominal: "32000" },
  { produkKode: "NRD", jenisPekerjaan: "jahit_penuh", vendorKode: "VDR-0001", nominal: "28000" },
];

try {
  const [{ id: uid }] = await sql`select id from users order by created_at limit 1`;
  const log = [];

  for (const v of VENDOR) {
    if (!APPLY) continue;
    await sql`insert into vendor ${sql({
      kode: v.kode, nama: v.nama, pemilik: v.pemilik, kontak: v.kontak, telepon: v.telepon,
      alamat: v.alamat, kota: v.kota, kapasitasHarian: v.kapasitasHarian,
      jenisPekerjaan: v.jenisPekerjaan, kapabilitas: v.kapabilitas,
      bankNama: v.bankNama, bankNomorRekening: v.bankNomorRekening, bankAtasNama: v.bankAtasNama,
      terminHari: v.terminHari, leadTimeHari: v.leadTimeHari,
      qcMode: v.qcMode, qcOfficer: v.qcOfficer ?? null,
    })} on conflict do nothing`;
  }
  const vId = Object.fromEntries((await sql`select kode,id from vendor where deleted_at is null`).map(r => [r.kode, r.id]));
  log.push(`vendor    : ${VENDOR.length} (${Object.keys(vId).length} di DB)`);

  for (const l of LOKASI) {
    if (!APPLY) continue;
    await sql`insert into lokasi_produksi ${sql({
      kode: l.kode, nama: l.nama, jenis: l.jenis, alamat: l.alamat,
      kota: l.kota, pic: l.pic, vendorId: l.vendorKode ? vId[l.vendorKode] : null,
    })} on conflict do nothing`;
  }
  const lId = Object.fromEntries((await sql`select kode,id from lokasi_produksi where deleted_at is null`).map(r => [r.kode, r.id]));
  log.push(`lokasi    : ${LOKASI.length} (${Object.keys(lId).length} di DB)`);

  for (const p of PENJAHIT) {
    if (!APPLY) continue;
    await sql`insert into penjahit ${sql({
      kode: p.kode, nama: p.nama, jenis: p.jenis, telepon: p.telepon,
      kapasitasHarian: p.kapasitasHarian, keahlian: p.keahlian,
      vendorId: p.vendorKode ? vId[p.vendorKode] : null,
      lokasiId: p.lokasiKode ? lId[p.lokasiKode] : null,
    })} on conflict do nothing`;
  }
  const nPenjahit = (await sql`select count(*)::int c from penjahit where deleted_at is null`)[0].c;
  log.push(`penjahit  : ${PENJAHIT.length} (${nPenjahit} di DB)`);

  const pId = Object.fromEntries((await sql`select kode,id from produk where deleted_at is null`).map(r => [r.kode, r.id]));
  for (const t of TARIF) {
    if (!APPLY) continue;
    const [ada] = await sql`select id from tarif_jasa_jahit
      where produk_id=${pId[t.produkKode]} and vendor_id=${vId[t.vendorKode]}
        and jenis_pekerjaan=${t.jenisPekerjaan} and deleted_at is null`;
    if (ada) continue;
    await sql`insert into tarif_jasa_jahit ${sql({
      produkId: pId[t.produkKode], jenisPekerjaan: t.jenisPekerjaan,
      vendorId: vId[t.vendorKode], dasarTarif: "per_pcs", nominal: t.nominal,
      tanggalBerlaku: new Date(), status: "aktif", createdBy: uid,
      approvedBy: uid, approvedAt: new Date(),
    })}`;
  }
  const nTarif = (await sql`select count(*)::int c from tarif_jasa_jahit where deleted_at is null`)[0].c;
  log.push(`tarif     : ${TARIF.length} (${nTarif} di DB)`);

  console.log(log.join("\n"));
  if (!APPLY) console.log("\n(rencana saja — jalankan dengan --apply untuk menulis)");
} finally { await sql.end(); }
