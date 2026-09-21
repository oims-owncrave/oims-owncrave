# "Konveksi" — klien tidak memisah Vendor dan Penjahit, PRD memisah

> Digali 17 Sep 2026 dari `docs/_PRODUKSI OWNC.xlsx`, `docs/TEMPLET PRODUKSI JAKET.xlsx`,
> PRD, dan `docs/referensi-oims-production.md`. Dicatat supaya tidak digali ulang.

## Temuan inti

Di Excel klien ada **satu kolom `Konveksi`** untuk semua tujuan jahit. Isinya campur
tiga hal berbeda, tanpa kolom penanda jenis:

| Nilai asli di kolom `Konveksi` | Sebenarnya apa |
|---|---|
| `Mas Faizin`, `Pak Bongki` | orang perorangan |
| `Internal, A Jajang`, `Internal (ibu-ibu)` | tim internal Owncrave |
| `Tasik`, `Cipedes`, `Bordir Cicalengka` | tempat/daerah |

Tidak ada satu pun nilai berbentuk `CV ...` atau `PT ...` di seluruh Excel. Klien juga
memakai **"Konveksi"**, **"Vendor"**, dan **"Penjahit"** bergantian untuk peran yang sama
(sheet `TEMP` pakai label `VENDOR :`, blanko surat jalan pakai `PENJAHIT :`).

Sedangkan PRD kita memisah tegas: master **Vendor** (badan usaha, punya pemilik, rekening,
termin) vs master **Penjahit** (orang, 6 jenis: internal / eksternal individu / anggota
vendor / freelance / sampel / spesialis perbaikan).

**Pemisahan dua master itu asumsi PRD, belum pernah dikonfirmasi ke klien.**

## Kenapa penting

Bukan soal penamaan. Dua bentuk ini menghasilkan pengalaman pakai yang berbeda:

- **Dua master (PRD sekarang)** — operator harus memutuskan "ini vendor atau penjahit?"
  setiap kali mengisi. Kalau di kepala mereka tidak ada bedanya, itu pertanyaan yang
  mengganggu dan sering salah diisi.
- **Satu master + kolom jenis (praktik Excel klien)** — operator cukup pilih dari satu
  daftar. Tapi vendor dan perorangan punya kebutuhan data berbeda (rekening & termin vs
  upah harian), jadi satu tabel akan penuh kolom yang separuh selalu kosong.

Dampak nyatanya muncul di **Tahap 5**: vendor dibayar lewat termin + rekening, penjahit
perorangan dibayar upah. Kalau keduanya satu daftar tanpa jenis yang tegas, perhitungan
upah dan hutang dagang tercampur.

Jadi pemisahan PRD kemungkinan **benar** — tapi perlu dikonfirmasi sebelum dijadikan FK,
karena setelah jadi FK, mengubahnya berarti migrasi lagi.

## Pengirim & penerima = staf internal, BUKAN penjahit

Ini sudah terjawab dari sumber klien, tidak perlu ditanya lagi:

- Blanko surat jalan klien: `PIC BARANG :` (staf yang menyiapkan) **terpisah** dari
  `PENJAHIT :` (tujuan kiriman)
- Blanko setoran: `PENYETOR:` (penjahit) terpisah dari `PENERIMA :` (staf) dan `QC :`
- App lama klien punya master **`PIC-`** sendiri, terpisah dari `VDR-`
- PRD §10 melistkan `Vendor/penjahit`, `Pengirim`, `Penerima` sebagai field berbeda

Konsekuensi: data uji di DB dev **salah isi** — `pengiriman_jahit.pengirim` berisi
`"Ujang Supriadi"` (nama penjahit), padahal seharusnya staf. Perlu dibersihkan, bukan
dipetakan ke master penjahit.

## Istilah asli klien (pakai ini di UI, bukan istilah kita)

| Istilah klien | Istilah kita sekarang |
|---|---|
| `SETORAN PRODUK` | penerimaan hasil jahit |
| `PENYETOR` | pengirim vendor |
| `PIC BARANG` | pengirim |
| `Upah Jahit & Finish` | biaya jasa jahit |
| `Konveksi` | vendor / penjahit |
| `Lebihan` | (sudah dipakai — lihat app-gfwy) |
| `Ceklis`, `Ket`, `Kirim` | — |

Status yang dipakai klien di kolom `Kirim`: `Di kirim`, `Sudah Sampai`, `Belum Sampai`,
`Dibayar`, `Belum Bayar`.

## Aturan bisnis lain yang ketemu sekalian

1. **Satu PO dipecah ke beberapa konveksi.** 2026-07-10: `Tasik` dapat Supernova Mocca
   114 pcs, `Cipedes` dapat Supernova Olive 113 pcs. Sebaliknya satu konveksi terima
   beberapa warna sekaligus (`Pak Bongki`: Hitam 18, Olive 19, Petrol 18, Khaki 4).
2. **Tarif beda per konveksi untuk produk sama.** Supernova: `Tasik` Rp32.000, `Cipedes`
   Rp33.000, `Internal, A Jajang` Rp25.000. Internal lebih murah dari eksternal.
3. **Finishing pihak terpisah dari jahit**, dibayar sendiri (`Internal (ibu-ibu)`
   Rp2.000/pcs), bisa per-pekerjaan (`bolong + kancing` Rp1.200, `sudah di bolong` Rp600).
4. **Ongkir dicatat terpisah** dan kadang diantar orang internal (`dianter sama abah`),
   kadang ekspedisi berkarung (`2 Karung`, `3 Karung`).
5. **QC bisa dilakukan di vendor** (`vendor.qcMode = internal | vendor`). Blanko `TEMP`
   mencatat `PENERIMA :` dan `QC :` sebagai dua orang berbeda.

## ✅ Terjawab 21 Sep 2026

Ucup: *"kalo sekarang perorangan bukan perusahaan, jadi tiap setelah beres langsung
bayar atau kadang 1-2 dulu baru bayar, staff produksi mengajukan ke finance dulu
setelah penerimaan proses pekerjaan selesai atau DP di muka."*

**Keputusan: SATU daftar cukup, bukan dua.** Semua tempat jahit yang dipakai sekarang
adalah **perorangan** — tidak ada CV/PT yang aktif. Jawaban Ucup fokus ke mekanisme
bayar (langsung per-selesai, kadang ditumpuk 1-2 kali, staf produksi yang ajukan ke
finance), bukan ke struktur badan usaha — karena badan usahanya memang tidak ada.

Konsekuensi: master `vendor` (badan usaha) TIDAK perlu jadi tujuan utama app-gtf4.1.
Fokus ke master `penjahit` (perorangan) saja. Data `VDR-0001 CV Jahit Cibaduyut` di DB
dev adalah data uji karangan kita sendiri (lihat bagian atas dokumen ini) — BUKAN
representasi kenyataan lapangan, jangan dijadikan acuan skema.

**Kalau nanti Owncrave mulai pakai vendor/CV** (ekspansi kapasitas), keputusan ini
perlu ditinjau ulang — bukan ditutup permanen.
