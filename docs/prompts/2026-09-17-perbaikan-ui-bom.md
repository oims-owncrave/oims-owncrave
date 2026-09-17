# Prompt sesi baru — 5 perbaikan UI & BOM (17 Sep 2026)

Lahir dari sesi M3.2 (dokumentasi). Abu membaca tutorial, menemukan lima hal.
Tempel isi di bawah garis ke sesi `claude` baru di folder proyek ini.

Saran nama sesi: `perbaikan ui-bom · 5 issue`

---

Kerjakan 5 issue OIMS berikut. Beads ada di hub (`cd ~/Documents/applications`),
bukan di repo ini. Kode di `~/Documents/applications/1_projects/oims-owncrave`.

Baca dulu `bd show <id>` tiap issue — deskripsinya sudah memuat file, baris, bukti
pengujian, dan jebakan yang sudah saya temukan. Jangan mulai dari nol.

## Urutan yang disarankan

**Dua P1 dulu** — keduanya menyentuh BOM dan estimasi PO, dan hasilnya salah tanpa
peringatan apa pun:

1. `app-uf3d` — ukuran BOM multi (`"S,M"`) tidak cocok, estimasi diam-diam jadi 0.
   Perbaikan satu blok di `src/services/po-produksi.ts:431`. Sudah ada kode usulan
   di issue. Berdiri sendiri, tidak menunggu yang lain.

2. `app-ut7f` — kolom Ukuran di form BOM jadi MultiSelect (komponen sudah ada di
   `src/components/ui/`), pilihannya dari ukuran varian produk yang dipilih di
   header BOM. Perhatikan kasus produk diganti setelah baris terisi — itu ditulis
   di issue, jangan dilewat.

   Catatan: (1) memperbaiki sisi hitung, (2) memperbaiki sisi input. Dua-duanya
   perlu — memperbaiki input saja tidak menyembuhkan data BOM lama.

**Lalu tiga P2:**

3. `app-orfm` — spinner pindah ke tengah baris + baris berwarna saat dimuat.
   Spinner SUDAH ADA di `src/components/ui/table/table-actions.tsx:60`, tapi
   menggantikan ikon di kolom Aksi sehingga nyempil di kanan. Kerjakan di komponen
   tabel bersama, bukan per halaman. Termasuk: kunci klik kedua, warna hover baris,
   dan periksa tampilan kartu di mobile.

4. `app-liin` — dropdown ComboSelect menjulur keluar layar. `updatePosition()` di
   `src/components/ui/ComboSelect.tsx` selalu membuka ke bawah tanpa mengukur sisa
   ruang. Periksa sumbu mendatar juga (panel memakai `w-max`).

5. `app-gfwy` — "Toleransi (%)" jadi "Lebihan (pcs)". **Paling berisiko, kerjakan
   terakhir.** Bukan sekadar ganti label: satuannya berubah dari persen ke pcs,
   jadi rumus rencana cutting ikut berubah, dan sudah ada data PO memakai persen
   di dev DAN di DB klien.

   Dua hal yang wajib diputuskan sebelum menyentuh kode:
   - `bom_detail.toleransi_persen` kemungkinan besar TIDAK ikut berubah — itu susut
     bahan per pcs, konsepnya beda dari lebihan jahit. Periksa dulu, jangan
     disamakan otomatis.
   - Aturan konversi data lama supaya angka yang sudah ada tidak berubah arti.

   Kalau ragu, berhenti dan tanya Abu. Lebih baik tertunda daripada mengubah arti
   data produksi yang sudah berjalan.

## Aturan proyek yang mudah terlewat

- `CLAUDE.md` proyek ini wajib dibaca — ada tabel "Kesalahan yang Pasti Kamu Buat".
- Tailwind v4: pakai kelas kanonik (`z-70`, bukan `z-[70]`). Dark mode aktif, pakai
  token `@theme` di `globals.css`, jangan warna arbitrary.
- Jangan commit tanpa Abu minta. Tunjukkan diff dulu.
- Jangan `bd close` sendiri — tunggu Abu menyetujui hasilnya.
- Jangan jalankan build/test berat sendiri; serahkan ke Abu.

## Setelah selesai

Dua P1 mengubah form BOM dan tabel estimasi PO — dua-duanya sudah difoto di
tutorial T2 (`step1-bom.jpg`, `step4-estimasi.jpg`). Foto itu jadi basi setelah
perbaikan, perlu dipotret ulang. Sampaikan ke Abu, jangan dipotret sendiri tanpa
diminta.

Di `src/app/(with-layout)/dokumentasi/_isi-t2.ts` baris 23 dan 51 masih tertulis
"toleransi 3% menjadi 156 pcs" — ini ikut berubah kalau `app-gfwy` dikerjakan.
