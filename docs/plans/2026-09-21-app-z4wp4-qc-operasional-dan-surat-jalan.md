# app-z4wp poin 4 — QC operasional & Surat Jalan

Menggabungkan poin 4 dan poin 6 checklist lama. **Paling berisiko dari semua
poin** — kerjakan paling akhir, setelah poin 2 dan 3 terbukti.

## Kenapa ini beda dari yang lain

Poin 1–3 menggabungkan **master data**: daftar yang berdiri sendiri, tidak
saling bergantung, dibuka untuk dilihat atau disunting sesekali.

QC operasional berbeda. Sepuluh menunya adalah **rantai kerja berurutan**:

```
Penerimaan QC → Antrean QC → Work Order QC → Pemeriksaan QC
                                    ↓
                    Rework → Re-QC → Karantina Reject
                                    ↓
                         Finishing → Packing → Stok Barang Jadi
```

Tiap tahap menghasilkan input untuk tahap berikutnya, dan sebagian butuh
approval. Menggabungkan dua tahap yang **saling menyela** akan membuat user
bolak-balik tab di tengah satu pekerjaan — lebih buruk daripada pindah halaman.

Itu sebabnya checklist lama hanya menandai **dua pasang** yang aman, bukan
kesepuluhnya.

## Bagian A — Dua pasang QC yang boleh digabung

| Gabungan | Tab | Alasan aman |
|---|---|---|
| `/qc/penerimaan` | Penerimaan QC · Antrean QC | Antrean adalah **turunan** penerimaan (jumlah baik dikurangi yang sudah masuk QC), bukan tahap terpisah. User melihat keduanya bergantian, bukan berurutan. |
| `/qc/rework` | Rework · Re-QC | Re-QC adalah pemeriksaan ulang hasil rework. Satu orang mengerjakan keduanya dalam satu sesi. |

**QC 10 entri → 8.**

### Yang TIDAK digabung, dan alasannya

- **Work Order QC & Pemeriksaan QC** — WO dibuat dulu, pemeriksaan mengisinya.
  Kalau jadi tab, user harus bolak-balik saat memeriksa banyak WO.
- **Karantina Reject** — butuh approval sebelum berdampak ke stok. Alur
  persetujuan perlu layar penuh.
- **Finishing & Packing** — dua tahap berurutan dengan checklist masing-masing.
- **Stok Barang Jadi** — ini hasil akhir, bukan tahap. Dibuka untuk dilihat,
  bukan dikerjakan.

Jangan "merapikan" dengan menggabungkan lebih banyak. Batas ini disengaja.

## Bagian B — Surat Jalan jadi tab di Pengiriman Vendor

`/vendor/surat-jalan` jadi tab di `/vendor/pengiriman`. **Vendor & Gudang 7 → 6.**

⚠️ **Sudah diverifikasi 21 Sep:** Surat Jalan dirujuk dari **dua alur**, bukan
satu:

| File | Alur |
|---|---|
| `vendor/pengiriman/_components/PengirimanTable.tsx` | jahit |
| `vendor/pengiriman/[id]/_components/PengirimanDetailClient.tsx` | jahit |
| `vendor/dekorasi/_components/DekorasiTable.tsx` | **dekorasi** |
| `vendor/dekorasi/[id]/_components/DekorasiDetailClient.tsx` | **dekorasi** |

Jadi menaruhnya sebagai tab di Pengiriman **membuat alur dekorasi terlihat
janggal** — user dekorasi membuka menu "Pengiriman Vendor" untuk mencetak surat
jalan pekerjaan sablon.

**Putuskan dulu sebelum mengerjakan bagian ini.** Tiga kemungkinan:

1. Tetap gabung ke Pengiriman, terima kejanggalan alur dekorasi
2. Biarkan Surat Jalan berdiri sendiri — daftarnya memang mencakup dua alur
3. Surat Jalan jadi tab di **dua** tempat (Pengiriman dan Dekorasi), difilter
   per alur

Kalau ragu, **lewati bagian B** dan kerjakan bagian A saja. Vendor & Gudang
tetap 7, dan tidak ada yang rusak.

## Pola wajib

Sama dengan poin 1–3, tiru `master/data-bahan/`:

1. Reuse `<Nama>Table.tsx` langsung, bukan `PageClient`
2. Satu `PageHeader`
3. State modal per tab
4. Tab sinkron URL, route lama `redirect()`

## Filter role

Kedua pasangan QC rolenya **sama** (`owner`, `admin_produksi`), jadi tidak perlu
menyaring tab seperti di poin 2. Cek lagi di `sidebar/data/index.ts` sebelum
mulai — kalau ternyata berbeda, pakai pola penyaringan tab dari plan poin 2.

## Redirect

| Lama | Baru |
|---|---|
| `/qc/antrean` | `/qc/penerimaan?tab=antrean` |
| `/qc/re-qc` | `/qc/rework?tab=re-qc` |
| `/vendor/surat-jalan` | *(tergantung keputusan bagian B)* |

Route `/qc/penerimaan` dan `/qc/rework` **tetap ada** — keduanya jadi tuan rumah,
bukan yang diredirect.

## Verifikasi

1. `npx tsc --noEmit` → 0 error.
2. Sidebar QC: 10 entri → 8.
3. Satu PageHeader per halaman gabungan, tab berpindah, URL ikut.
4. Route lama mendarat di tab yang benar.
5. **Alur kerja tidak rusak** — ini yang paling penting, dan tidak terbukti dari
   typecheck:
   - Penerimaan QC: catat penerimaan, lalu pindah tab Antrean → angka antreannya
     ikut berubah
   - Rework: catat rework, pindah tab Re-QC → item itu muncul sebagai kandidat
6. Kalau bagian B dikerjakan: cetak surat jalan dari alur **dekorasi**, pastikan
   masih ketemu dan tidak tersesat.

## Yang TIDAK dikerjakan

- Tidak menggabungkan delapan menu QC lainnya. Batas di Bagian A disengaja.
- Tidak mengubah logika QC apa pun — hanya cara membuka daftarnya.
- Tidak menyentuh approval Karantina Reject.
