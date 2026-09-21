CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules sebelum mulai.

TASK:
Eksekusi @docs/plans/2026-09-21-app-jroq-matrix-input-po.md

ISSUE: app-jroq — matrix input Target per SKU di form PO Produksi.

---

## Masalahnya

`/produksi/po/baru` mengisi varian satu per satu: klik "Tambah Baris" → pilih
varian dari dropdown → isi Target → ulangi. Untuk Nordic (8 warna × 5 ukuran =
**40 SKU**) itu 40 kali klik-pilih-ketik.

Klien terbiasa matrix Excel: warna sebagai baris, ukuran sebagai kolom, semua
kombinasi terlihat sekaligus.

---

## Empat hal yang paling mudah salah

**1. Susun grid dari varian yang ADA, bukan dari perkalian warna × ukuran.**

Data Nordic kebetulan simetris (40 varian penuh), tapi jangan berasumsi semua
produk begitu. Sel yang tidak punya varian dirender sebagai `—` yang **tidak
bisa diklik** — bukan input kosong.

Kalau dibuat input, user mengisi angka untuk SKU yang tidak ada, dan datanya
mustahil disimpan.

**2. Varian dengan target kosong JANGAN dikirim.**

Isi 3 sel dari 40 → `details` berisi **3 baris**, bukan 40 baris dengan 37
bernilai nol. Baris nol akan membuat WO Cutting untuk SKU yang tidak dipesan.

Mengosongkan sel yang tadinya terisi harus **menghapus** barisnya.

**3. Pakai `NumberInput`, bukan `<input>` mentah.**

`@/components/ui/NumberInput` sudah menangani pemisah ribuan dan sinkronisasi
draft saat nilai diubah dari luar (diperbaiki di `app-823x`). Input mentah akan
mengulang bug itu.

**4. Bentuk data ke server TIDAK berubah.**

Tetap array `details` berisi `{ varianId, jumlahTarget, lebihanPcs }`. Yang
berubah hanya cara mengisinya di layar. Jangan menyentuh Zod schema atau service
`po-produksi.ts`.

---

## Lebihan Pcs — jangan dijadikan matrix kedua

Klien konfirmasi langsung: Lebihan diisi **manual untuk jaga-jaga**, bukan rumus
tetap, dan tidak untuk semua SKU.

Tampilkan sebagai daftar terpisah di bawah matrix, hanya memuat varian yang
targetnya terisi.

⚠️ **Jangan menghapus field ini.** `app-itl4` masih terbuka (deferred) — ada
pertanyaan ke klien apakah Lebihan perlu di level produk.

---

## Task 3 (estimasi bahan) boleh dilewati

Plan punya Task 3: live preview kebutuhan bahan saat mengisi. Itu butuh
mengekstrak rumus dari `getEstimasiBahan` ke `src/lib/produksi/estimasi.ts`
supaya tidak ada dua tempat menghitung hal yang sama.

**Kalau itu terasa terlalu besar untuk satu issue, LEWATI dan laporkan.** Matrix
input sendiri sudah memberi manfaat besar, dan rumus yang disalin ke dua tempat
akan menghasilkan angka berbeda suatu hari.

Jangan menyalin rumusnya. Ekstrak, atau lewati.

---

## Mobile

Matrix 8×5 tidak muat di layar HP. Bungkus `overflow-x-auto`, dan buat kolom
warna `sticky left-0` supaya user tahu sedang mengisi baris warna apa saat
menggeser.

## Verifikasi

`npx tsc --noEmit` → **0 error**.

1. Pilih produk **Nordic** → matrix menampilkan 40 sel sekaligus
2. Isi 3 sel, simpan → PO tersimpan dengan **3 baris detail**, bukan 40
3. Isi lalu **kosongkan** satu sel → barisnya hilang, tidak tersimpan sebagai nol
4. Produk yang variannya tidak simetris → sel kosong tampil `—`, tidak bisa diisi
5. Ganti produk di tengah pengisian → matrix ter-reset, tidak menyisakan varian
   produk lama
6. **Mobile** (< 850px): matrix bisa digeser, kolom warna tetap terlihat
7. Edit PO lama → nilai lama muncul di sel yang benar

## Jangan dikerjakan

- Mengubah bentuk data yang dikirim ke server
- Menghapus field Lebihan Pcs
- Mengubah `getEstimasiBahan` yang dipakai halaman detail PO
- Menyalin rumus estimasi ke frontend (ekstrak atau lewati)
- `bd close`, `git commit`, `git push`

## Laporan akhir (wajib)

- Hasil `npx tsc --noEmit`
- Berapa baris `details` yang tersimpan saat mengisi 3 dari 40 sel
- Apakah Task 3 dikerjakan atau dilewati, dan alasannya
- Bagaimana sel untuk varian yang tidak ada dirender
