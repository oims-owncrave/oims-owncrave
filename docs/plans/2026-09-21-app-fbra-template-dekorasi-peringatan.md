# app-fbra — Template Dekorasi untuk produk yang belum disetel dekorasi

**Prioritas:** P2 · **Tipe:** bug

## Masalah

User bisa membuat Template Dekorasi untuk produk apa pun. Tapi template itu **tidak
akan pernah terpakai** kalau `produk.dekorasiProses` masih `'none'` — karena WO Cutting
produk itu sengaja disembunyikan dari dropdown form Pekerjaan Dekorasi.

Penyebabnya di `src/services/dekorasi.ts`, fungsi `listWoBisaDekorasi` baris 278:

```ts
sql`${produk.dekorasiProses} <> 'none'`,
```

Filter itu **benar** dan bukan yang diperbaiki di sini — produk yang tidak butuh
dekorasi memang tidak boleh muncul. Yang salah: tidak ada yang memberi tahu user saat
ia membuat template yang mustahil terpakai.

Halaman Template Dekorasi sudah punya banner "Setel dulu Proses Dekorasi di master
produk…", tapi itu **teks statis** — tidak ada validasi aktif. User bisa melewatkan
banner, langsung "+ Tambah Template", sistem diam saja menerima.

Kasus nyata: produk **Hidden Black** (DB dev) punya 1 template aktif (Sablon, Dada
Kiri, Rp5.000) tapi `dekorasiProses` masih `'none'`. User bingung kenapa dropdown WO
di form Pekerjaan Dekorasi kosong padahal template sudah ada.

## Keputusan desain

**Peringatan, bukan larangan.** Jangan blokir penyimpanan template.

Alasannya: menyiapkan template dulu lalu menyetel produk belakangan itu urutan kerja
yang sah. Memblokirnya memaksa user bolak-balik antar halaman tanpa alasan kuat. Yang
dibutuhkan user adalah **tahu**, bukan dicegah.

Dua lapis, keduanya dikerjakan:

## Task 1 — Peringatan inline di form tambah/edit template

File: `src/app/(with-layout)/vendor/dekorasi/template/_components/TemplateFormModal.tsx`

Saat user memilih Produk yang `dekorasiProses === 'none'`, tampilkan peringatan di
bawah field Produk:

```tsx
{produkDipilih?.dekorasiProses === "none" && (
  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
    <TriangleAlert size={14} className="mt-px shrink-0" />
    <span>
      Produk ini belum disetel butuh dekorasi, jadi template ini belum bisa dipakai.
      Ubah dulu Proses Dekorasi di Master Produk.
    </span>
  </p>
)}
```

Warna **amber**, bukan merah — ini peringatan, bukan error. Merah menandakan "tidak
bisa lanjut", padahal user tetap boleh menyimpan.

Cek apakah data produk yang di-fetch untuk dropdown sudah memuat `dekorasiProses`.
Kalau belum, tambahkan ke select di server action-nya — jangan fetch terpisah.

## Task 2 — Badge di daftar template

File: `src/app/(with-layout)/vendor/dekorasi/template/_components/TemplatePageClient.tsx`

Baris template yang produknya `dekorasiProses === 'none'` diberi badge peringatan,
supaya template yang mustahil terpakai tidak terlihat sama dengan yang valid.

Kolom "Setelan Produk" yang sekarang menampilkan "Tanpa Dekorasi" — beri badge amber
di situ, jangan tampil polos seperti nilai normal.

Konsisten dengan pola badge yang sudah ada di proyek (lihat `ROLE_COLORS` di
`UserTable.tsx` sebagai contoh bentuk).

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. Buka Vendor → Dekorasi → Template. Produk **Hidden Black** (dev) sudah punya
   template dengan kondisi ini — barisnya harus menampilkan badge peringatan.
3. Klik "+ Tambah Template", pilih produk yang `dekorasiProses = 'none'` → peringatan
   amber muncul di bawah field Produk. Ganti ke produk yang sudah disetel dekorasi →
   peringatan hilang.
4. **Simpan tetap berhasil** saat peringatan muncul — ini peringatan, bukan larangan.
   Kalau tersimpan gagal, implementasinya salah.
5. Setel `dekorasiProses` produk itu ke `sablon` di Master Produk → kembali ke daftar
   template → badge hilang, dan WO produk itu muncul di dropdown form Pekerjaan
   Dekorasi.

## Yang TIDAK dikerjakan

- **Tidak mengubah `listWoBisaDekorasi`** (`dekorasi.ts:278`). Filternya benar.
- Tidak memblokir penyimpanan template — lihat keputusan desain.
- Tidak menambah auto-set `dekorasiProses` saat template dibuat. Terlihat praktis, tapi
  mengubah data master diam-diam dari halaman lain — user tidak akan tahu produknya
  berubah. Biarkan user yang memutuskan.
