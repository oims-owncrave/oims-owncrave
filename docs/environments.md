# Environment: DB klien vs DB dev/demo

Dibuat untuk **app-2fq kerjaan 2b**. Dibaca sebelum menyentuh database mana pun.

## Kenapa dipisah

Klien sudah memakai aplikasi sementara pengembangan masih jalan. Satu DB dipakai dua peran
berarti tiap percobaan fitur menyentuh data asli klien — dan tutorial (M3.2) butuh data dummy
yang tidak boleh tercampur dengan data produksi.

## Pembagian peran

| | DB klien (produksi) | DB dev/demo |
|---|---|---|
| Project Supabase | `aixpakizbxegokrnhhlc` — **yang sekarang** | project **baru** |
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

## Langkah membuat DB dev/demo

Dikerjakan Abu — pembuatan project Supabase butuh login dashboard.

1. **Buat project baru** di https://supabase.com/dashboard → beri nama yang jelas berbeda,
   mis. `oims-dev`. Region sama (Southeast Asia) supaya latensi mirip.

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

6. **Buat user login** untuk dev/demo. DB baru belum punya siapa-siapa, jadi Supabase Auth
   perlu user baru — daftarkan lewat dashboard project baru (Authentication → Users), lalu
   pastikan barisnya ada juga di tabel `users` (aplikasi memakai tabel sendiri untuk peran).

7. **Vercel**: pastikan Environment Variables di project Vercel memakai nilai **DB klien**
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

Semua ini ikut terhapus saat no.3 membersihkan DB klien untuk data real. Yang masih berguna
(32 bahan) dipindahkan dulu ke dev/demo, atau cukup dibuat ulang di sana lewat `db:push` + seed.
