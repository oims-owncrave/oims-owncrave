# Environment: DB klien vs DB dev/demo

Dibuat untuk **app-2fq kerjaan 2b**. Dibaca sebelum menyentuh database mana pun.

## Kenapa dipisah

Klien sudah memakai aplikasi sementara pengembangan masih jalan. Satu DB dipakai dua peran
berarti tiap percobaan fitur menyentuh data asli klien — dan tutorial (M3.2) butuh data dummy
yang tidak boleh tercampur dengan data produksi.

## Pembagian peran

| | DB klien (produksi) | DB dev/demo |
|---|---|---|
| Project Supabase | `aixpakizbxegokrnhhlc` | `fzkszkhjswtcugrqjzgx` |
| Env file | `.env.production` | `.env.local` |
| Isi | data asli Owncrave | dummy, tutorial, percobaan |
| Dipakai oleh | Vercel (deploy) | `npm run dev` di mesin lokal |

**Arah ini disengaja.** DB sekarang tetap milik klien karena seluruh skema sudah teruji jalan
di sana; yang baru justru untuk dev. Data dummy hilang tidak apa-apa, data klien hilang masalah.

## PENTING: `db:push`, bukan `db:migrate`

Folder `drizzle/` hanya berisi **2 migration = 15 tabel**, sedangkan `schema.ts` punya **87 tabel**.
Tahap 2-4 dibangun lewat `drizzle-kit push` yang menyinkronkan langsung tanpa menulis file
migration. Menjalankan `npm run db:migrate` di DB baru hanya menghasilkan 15 tabel dari 87.

Jadi untuk menyiapkan DB baru: **`npm run db:push`** (drizzle membandingkan `schema.ts` dengan
DB lalu membuat yang kurang). Verifikasi hasilnya harus 87 tabel.

## Status: SUDAH DIKERJAKAN (15 Sep 2026)

Pemisahan sudah jalan. Bagian di bawah disimpan sebagai rujukan kalau perlu diulang
(mis. menyiapkan DB dev untuk mesin lain).

| | isi sekarang |
|---|---|
| dev `fzkszkhjswtcugrqjzgx` | 87 tabel, master (11 kategori, 7 satuan, 3 warna, 6 supplier, 32 bahan), nol transaksi |
| klien `aixpakizbxegokrnhhlc` | 87 tabel, data klien utuh — tidak tersentuh |

Login dev: username `owner`, password `owncrave123` (peran owner).

**Catatan login:** form memakai **username**, bukan email. `signInAction`
(`src/services/auth.ts`) memetakannya ke `<username>@owncrave.local` — domain sintetis.
Jadi user Supabase harus dibuat dengan email berdomain `owncrave.local`, dan username
hanya boleh huruf kecil, angka, underscore.

**Dev server perlu di-restart** setelah `.env.local` berganti — Next.js membaca env saat start.

## Langkah membuat DB dev/demo

1. **Buat project baru** di https://supabase.com/dashboard → beri nama yang jelas berbeda,
   mis. `oims-dev`. Region sama (Southeast Asia) supaya latensi mirip.

   **DATABASE_URL wajib memakai pooler, bukan `db.<ref>.supabase.co`.** Host `db.<ref>`
   hanya punya alamat IPv6; tanpa rute IPv6 koneksi gagal `Network is unreachable`.
   Bentuk yang benar — perhatikan username `postgres.<REF>`:
   ```
   postgresql://postgres.<REF>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   Karakter khusus di password harus di-encode (`@` jadi `%40`).

2. **Simpan `.env.local` yang sekarang** — isinya kredensial DB klien, masih dibutuhkan:
   ```bash
   cp .env.local .env.production
   ```
   Sekarang `.env.production` menunjuk DB klien. Cek:
   ```bash
   npm run db:whoami:prod     # ref aixpakizbxegokrnhhlc, 87 tabel, bahan=32
   ```

3. **Isi `.env.local` dengan kredensial project BARU.** Keempat nilai diambil dari
   project baru itu — Settings → API untuk tiga yang pertama, Settings → Database
   (Connection string → Transaction pooler) untuk `DATABASE_URL`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref-baru>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   DATABASE_URL=postgresql://postgres.<ref-baru>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   Keempatnya **satu pasangan** — jangan mencampur URL project A dengan key project B.

4. **Pastikan sudah menunjuk yang benar sebelum push:**
   ```bash
   npm run db:whoami          # ref HARUS yang baru, tabel=0
   ```
   Kalau ref-nya masih `aixpakizbxegokrnhhlc`, berhenti — `.env.local` belum berganti.

5. **Bangun skema:**
   ```bash
   npm run db:push            # jawab konfirmasi drizzle
   npm run db:whoami          # harus 87 tabel
   ```

6. **Salin objek yang tidak ikut `db:push`.** 24 CHECK constraint, 2 FK yang dideklarasi
   manual, dan 2 partial unique ber-COALESCE tidak ada di `schema.ts`, jadi `db:push`
   melewatinya. Tanpa langkah ini **DB dev lebih longgar dari DB klien** — aturan seperti
   `hasil_qc_detail_seimbang` atau `transfer_fg_gudang_beda` tidak berlaku, dan bug yang
   seharusnya tertangkap di dev justru lolos ke klien.
   ```bash
   node scripts/db-sync-manual-constraints.mjs           # lihat yang kurang
   node scripts/db-sync-manual-constraints.mjs --apply
   ```

7. **Isi master data** supaya dev bisa langsung dipakai:
   ```bash
   node scripts/db-seed-dev-from-client.mjs --apply
   ```
   Menyalin kategori, satuan, warna, supplier, bahan. Sengaja **tidak** menyalin stok,
   mutasi, dan seluruh tabel transaksi — dev mulai bersih.

8. **Buat user login.** Dua syarat yang mudah terlewat:
   - Email **harus** `<username>@owncrave.local` — form login memakai username lalu
     memetakannya ke domain sintetis itu (`src/services/auth.ts`). Email berdomain lain
     tidak akan pernah bisa dipakai login.
   - `users.id` harus sama dengan `auth.users.id`, jadi buat lewat Admin API, ambil id
     yang dikembalikan, lalu sisipkan baris `users` dengan id tersebut beserta perannya.

9. **Vercel**: pastikan Environment Variables di project Vercel memakai nilai **DB klien**
   (yang sekarang di `.env.production`), bukan dev. Kalau Vercel selama ini mengambil dari
   `.env.local` yang di-upload manual, perbarui sekarang — kalau tidak, deploy berikutnya
   akan menunjuk DB dev yang kosong.

## Perkakas

| Perintah | Kegunaan |
|---|---|
| `npm run db:whoami` | DB mana yang ditunjuk `.env.local` + jumlah tabel & isi |
| `npm run db:whoami:prod` | sama, untuk `.env.production` |
| `npm run db:push` | sinkronkan skema ke DB dev |
| `npm run db:push:prod` | sinkronkan skema ke **DB klien** — pikir dua kali |
| `npm run db:studio` / `:prod` | buka drizzle studio pada DB terkait |
| `node scripts/db-sync-manual-constraints.mjs` | cek/salin CHECK+FK+unique yang dilewati `db:push` |
| `node scripts/db-seed-dev-from-client.mjs` | salin master data klien ke dev |

`drizzle.config.ts` membaca `ENV_FILE`; tanpa itu selalu `.env.local`.

## Kebiasaan yang menyelamatkan

- Jalankan `db:whoami` **sebelum** tiap operasi DB yang menulis. Dua detik, mencegah kejadian
  yang tidak bisa dibatalkan.
- `mutasi_stok` dan `audit_log` **append-only** — tidak ada UNDO. Salah DB di situ permanen.
- Percobaan fitur, seed dummy, smoke test: **selalu** di dev. Tidak ada pengecualian "sebentar saja".

## Catatan: ini bukan multi-tenant

Multi-tenant (satu aplikasi banyak perusahaan) butuh kolom tenant di 87 tabel + RLS yang
sekarang nol — proyek berbulan dan melawan tujuan HFG 3 yang sedang menutup. Yang dibutuhkan
sekarang hanya dua environment: ganti `DATABASE_URL`, kode tidak berubah.

## Data percobaan yang sekarang ada di DB klien

Dibuat saat verifikasi 15 Sep, semuanya di produk dummy "Smoke Test Jacket":

| Objek | Keterangan |
|---|---|
| produk `SMK` | Smoke Test Jacket + 3 varian |
| `BOM-202609-0001` | 6 bahan, diaktifkan supaya PO bisa disetujui |
| `PO-2026-0002` | 30 pcs, status disetujui |
| `PO-2026-0001` | status menunggu persetujuan |
| `PO-202609-9001` | data lama |
| 32 bahan | sebagian sudah benar, dipakai lagi di no.3 |

Semua ini ikut terhapus saat no.3 membersihkan DB klien untuk data real. 32 bahan yang masih
berguna **sudah disalin** ke dev lewat `db-seed-dev-from-client.mjs`, jadi aman dihapus di klien.
