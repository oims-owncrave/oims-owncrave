# app-glx1 — barangKeluar.tujuan jadi FK ke PO

**Beads:** app-glx1 · **GH:** (diisi setelah dibuat)

## Konteks

`barangKeluar.tujuan` (`src/db/schema.ts:566`) itu teks bebas dengan komentar
`// e.g. "Cutting PO-001"` — isinya menyebut PO, tapi cuma sebagai kalimat, tidak
tersambung ke tabel `po_produksi`. Akibatnya biaya bahan tidak bisa dibebankan ke
PO secara otomatis; itu langsung memukul HPP di Tahap 5.

**Klien (Ucup) 21 Sep 2026:** *"untuk PO aja atau pesanan tertentu seperti custom
produksi"* — barang keluar SELALU punya acuan PO/pesanan, tidak ada kasus keluar
tanpa PO sama sekali.

## Temuan penting dari explore — rantai ke PO SUDAH ADA

```
barang_keluar.permintaan_bahan_id  (nullable)  →  permintaan_bahan
permintaan_bahan.po_id             (notNull)   →  po_produksi
```

Jadi kalau barang keluar dibuat lewat PB, PO-nya **sudah bisa ditelusuri** tanpa
kolom baru. Masalahnya `permintaanBahanId` nullable — barang keluar bisa dibuat
tanpa PB sama sekali, dan itu yang terjadi pada satu-satunya baris di dev.

### Kondisi data dev (diverifikasi 21 Sep)

| Nomor | tujuan (teks) | PB | PO |
|---|---|---|---|
| BK-202609-0001 | `Produksi Supernova batch 1` | (tanpa PB) | (tanpa PO) |

Total 1 baris, tanpa PB, tujuan teks bebas. Ada 1 PO di dev: `PO-2026-0001`
(produk **Supernova**, status disetujui) — cocok dengan teks tujuannya.

## Keputusan

Tambah kolom **`poId` FK notNull** ke `barang_keluar`, buang kolom teks `tujuan`.

Kenapa kolom `poId` sendiri, bukan mengandalkan rantai lewat PB:
- PB itu **opsional** dalam alur (barang keluar bisa langsung tanpa PB), tapi PO
  **selalu** ada menurut klien. Menyandarkan PO pada PB berarti barang keluar
  tanpa PB kehilangan acuan PO — bertentangan dengan jawaban klien.
- Query laporan jadi 1 join, bukan 2.

Konsistensi: kalau PB diisi, `poId` harus sama dengan `permintaanBahan.poId` —
dijaga di Server Action (lihat Task 3).

---

## Task 1 — DB Migration ⚡ CLAUDE VIA MCP (bukan Antigravity)

```sql
-- 1. Tambah kolom nullable dulu (supaya baris lama tidak menghalangi)
ALTER TABLE barang_keluar ADD COLUMN po_id uuid REFERENCES po_produksi(id);

-- 2. Isi baris lama: BK-202609-0001 "Produksi Supernova batch 1" → PO Supernova
UPDATE barang_keluar bk
SET po_id = (
  SELECT po.id FROM po_produksi po
  JOIN produk p ON p.id = po.produk_id
  WHERE p.nama = 'Supernova'
  LIMIT 1
)
WHERE bk.po_id IS NULL;

-- 3. Pastikan tidak ada yang tersisa NULL sebelum dikunci
--    (kalau ada, migration BERHENTI di sini — jangan lanjut ke langkah 4)
SELECT count(*) AS sisa_null FROM barang_keluar WHERE po_id IS NULL;

-- 4. Kunci jadi wajib + index
ALTER TABLE barang_keluar ALTER COLUMN po_id SET NOT NULL;
CREATE INDEX bk_po_idx ON barang_keluar (po_id);

-- 5. Buang kolom teks lama
ALTER TABLE barang_keluar DROP COLUMN tujuan;
```

⚡ Dieksekusi Claude langsung saat sesi planning. Antigravity mulai dari Task 2.

**Catatan migrasi:** langkah 2 memetakan berdasarkan nama produk yang kebetulan
muncul di teks tujuan. Ini aman untuk data dev (1 baris, sudah diverifikasi
cocok). **Untuk DB produksi, JANGAN jalankan langkah 2 apa adanya** — data prod
harus dicek dulu satu per satu, pemetaan teks→PO itu keputusan manusia.

Setelah migration: update `src/db/schema.ts` (juga oleh Claude):

```ts
export const barangKeluar = pgTable("barang_keluar", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // BK-YYYYMM-NNNN
  poId: uuid("po_id").notNull().references(() => poProduksi.id),
  permintaanBahanId: uuid("permintaan_bahan_id").references(() => permintaanBahan.id), // link ke PB (Tahap 2)
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("bk_po_idx").on(t.poId)]);
```

(Perhatikan: `tujuan` hilang, `poId` masuk sebelum `permintaanBahanId`, dan tabel
ini sekarang punya argumen ketiga untuk index — sebelumnya tidak ada.)

---

## Task 2 — Zod schema

`src/lib/schemas/barang-keluar.ts` baris 9 — ganti:

```ts
// HAPUS:
tujuan: z.string().max(200).optional().or(z.literal("")),

// GANTI JADI:
poId: z.string().uuid("PO wajib dipilih"),
```

---

## Task 3 — Server Action

`src/services/barang-keluar.ts`:

**Baris 78** — ganti `tujuan: input.tujuan || null,` jadi `poId: input.poId,`

**Baris 166 & 181** (dua query select) — ganti `tujuan: barangKeluar.tujuan,`
jadi kolom PO yang bisa dibaca manusia. Karena tabel list menampilkan teks, ambil
nomor dokumen PO lewat join:

```ts
poId: barangKeluar.poId,
poNomor: poProduksi.nomorDokumen,
```

dan tambahkan `.leftJoin(poProduksi, eq(poProduksi.id, barangKeluar.poId))` pada
kedua query itu (cek dulu apakah `poProduksi` sudah diimport di file ini).

**Guard konsistensi PB↔PO** — di fungsi create (sekitar baris 78), sebelum insert:
kalau `input.permintaanBahanId` terisi, ambil `permintaanBahan.poId` dan pastikan
sama dengan `input.poId`. Kalau beda, kembalikan
`{ error: "PO tidak cocok dengan Permintaan Bahan yang dipilih" }`.
Ini mencegah data yang saling bertentangan.

---

## Task 4 — Form

`src/app/(with-layout)/inventory/barang-keluar/_components/BarangKeluarForm.tsx`:

1. `defaultValues` (baris 62): `tujuan: ""` → `poId: ""`
2. Ganti `<Input label="Tujuan" ...>` (baris 108-113) jadi `<ComboSelect>` PO —
   **wajib**, bukan opsional. Ikuti persis gaya ComboSelect PB yang sudah ada di
   baris 91-107 (label, placeholder, options, value, onChange).
3. Autofill (baris 103-105): sekarang mengisi teks `tujuan` dari PB. Ganti jadi
   mengisi `poId` dari `pb.poId` — PB sudah membawa PO-nya. Kalau PB dipilih,
   set `poId` otomatis dan (disarankan) buat field PO jadi read-only supaya tidak
   bisa dibuat tidak konsisten dari UI.

**Sumber data PO untuk dropdown:** `page.tsx` yang merender form ini perlu
fetch daftar PO. Cek bagaimana `pbOptions` disediakan sekarang, ikuti pola yang
sama (kemungkinan di `src/app/(with-layout)/inventory/barang-keluar/baru/page.tsx`).
Filter PO yang masih relevan (jangan tampilkan yang `dibatalkan`/`selesai` —
cek nilai `poStatusEnum` di schema).

---

## Task 5 — Tabel & detail

1. `inventory/barang-keluar/_components/BarangKeluarTable.tsx`
   - baris 22: tipe `tujuan: string | null` → `poNomor: string | null`
   - baris 50-52: `key: "tujuan"` → `key: "poNomor"`, label kolom jadi `"PO"`
   - baris 92: placeholder search `"Cari nomor / tujuan..."` → `"Cari nomor / PO..."`
2. `inventory/barang-keluar/[id]/page.tsx` baris 54: `header.tujuan` → `header.poNomor`
3. `laporan/barang-keluar/_components/LaporanBarangKeluarTable.tsx`
   - baris 59-61 (kolom tabel), baris 114 (kolom export CSV), baris 158
     (placeholder search) — semua `tujuan` → `poNomor`, label `"Tujuan"` → `"PO"`
4. `src/services/laporan.ts` — cek apakah `getLaporanBarangKeluar` ikut select
   `tujuan`; kalau ya, ganti dengan join PO seperti Task 3.

---

## Verifikasi

1. `npx tsc --noEmit` — WAJIB 0 error. Ini penentu utama: kolom `tujuan` sudah
   tidak ada di schema, jadi setiap pemakaian yang tertinggal akan gagal compile.
2. Grep sisa: `grep -rn "tujuan" src/` di area barang-keluar — pastikan tidak ada
   yang merujuk kolom lama (hati-hati: kata "tujuan" juga dipakai tabel lain
   seperti `lokasiTujuanId`, `tujuanPenjahit` — jangan ikut diubah).
3. Buka `/inventory/barang-keluar/baru`: dropdown PO muncul, wajib diisi, dan
   kalau PB dipilih maka PO ikut terisi otomatis.
4. Simpan satu barang keluar baru → cek di daftar, kolom PO tampil nomor PO.
5. Buka `/laporan/barang-keluar` → kolom PO tampil, export CSV berisi kolom PO.

## Yang TIDAK boleh disentuh

- Tabel lain yang punya kata "tujuan" (`lokasiTujuanId`, `bundling.tujuanPenjahit`,
  `gudangTujuanId`) — di luar scope, itu urusan kartu lain.
- Logika stok/mutasi di `barang-keluar.ts` — kartu ini murni soal kolom tujuan→PO.

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — FK biasa, pola sama seperti `permintaanBahan.poId`.
- [ ] Tabel DB baru? Tidak (kolom baru di tabel existing).
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak.
