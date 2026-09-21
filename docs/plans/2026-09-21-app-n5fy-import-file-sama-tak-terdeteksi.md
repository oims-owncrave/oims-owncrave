# app-n5fy — ImportExcelModal: pilih file yang sama dua kali tidak terdeteksi

**Prioritas:** P2 · **Tipe:** bug · **Dampak:** 8 file pemakai
**Urutan:** kerjakan SETELAH `app-egkt` — file yang sama (`ImportExcelModal.tsx`)

## Masalah

`src/components/ui/import/ImportExcelModal.tsx` baris 52-67, `handleFileChange`
tidak pernah mereset `e.target.value`.

`<input type="file">` hanya memicu event `change` kalau nilainya **berubah**. Memilih
file dengan path yang sama persis = nilai tidak berubah = tidak ada event.

### Kenapa ini pasti muncul

Alur import memang iteratif: upload → lihat error → perbaiki → upload lagi. Dan
pesan errornya sendiri menyuruh begitu (baris 80):

> `Terdapat ${res.errors.length} baris yang bermasalah. Perbaiki file dan upload ulang.`

Langkahnya:
1. User upload `bahan.xlsx` → muncul "Baris 12: kode duplikat"
2. Dia perbaiki di Excel, **simpan dengan nama sama** (yang paling wajar dilakukan)
3. Pilih file itu lagi → **tidak terjadi apa-apa**

Dari sisi user: "kenapa file baru saya tidak kebaca?" Harus tutup-buka modal dulu,
dan tidak ada petunjuk apa pun soal itu.

## Fix

Satu baris di akhir `handleFileChange`:

```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;

  // Reset supaya memilih file dengan nama sama memicu change lagi — alur import
  // iteratif (perbaiki di Excel lalu upload ulang) mengandalkan ini.
  e.target.value = "";

  setFile(selectedFile);
  // ... sisanya tidak berubah
};
```

**Taruh reset SEBELUM `await parseXlsx`**, bukan sesudah. React event pooling sudah
tidak berlaku di React 19, tapi `e.target` tetap lebih aman disentuh sebelum titik
`await` — setelah await, elemennya bisa saja sudah tidak ter-mount (user menutup modal
selagi parsing berjalan).

`selectedFile` sudah dipegang di variabel, jadi mengosongkan `value` tidak menghilangkan
file yang sedang diproses.

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. Buka halaman yang punya import (mis. `/master/bahan` → tombol Import).
3. Upload file xlsx apa pun → tunggu preview muncul.
4. **Tanpa menutup modal**, klik pilih file lagi, pilih **file yang sama persis** →
   preview harus dimuat ulang (indikator: parsing jalan lagi, preview muncul kembali).
   Sebelum fix: tidak terjadi apa-apa.
5. Pastikan import normal masih jalan (pilih file → preview → Import → data masuk).

## Yang TIDAK dikerjakan

- Tidak menaikkan jadi aturan konvensi vault. Ini spesifik perilaku
  `<input type="file">`, bukan pola komponen yang akan terulang di proyek lain dengan
  bentuk berbeda. Cukup di beads.
- Tidak menambah tombol "Pilih ulang file" — reset satu baris sudah menyelesaikan
  akarnya.
