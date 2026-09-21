CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Drizzle + Supabase.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules sebelum mulai.

TASK:
Eksekusi @docs/plans/2026-09-21-app-z4wp4-qc-operasional-dan-surat-jalan.md
**BAGIAN A SAJA.** Bagian B (Surat Jalan) sengaja dilewati — alasannya di bawah.

ISSUE: app-z4wp poin 4 — QC 10 menu jadi 8.

---

## Kerjakan ini SETELAH poin 3 selesai

Poin 4 paling berisiko dari seluruh checklist. Kalau poin 3 belum selesai,
kerjakan itu dulu.

---

## Hanya DUA pasang yang digabung. Jangan tambah.

| Halaman | Tab |
|---|---|
| `/qc/penerimaan` | Penerimaan QC · Antrean QC |
| `/qc/rework` | Rework · Re-QC |

**QC 10 entri → 8.**

Delapan menu QC lain **SENGAJA tidak digabung**, dan ini bukan kelalaian:

QC operasional adalah **rantai kerja berurutan** — Penerimaan → Antrean → Work
Order → Pemeriksaan → Rework/Re-QC → Karantina → Finishing → Packing → Stok
Jadi. Tiap tahap menghasilkan input untuk tahap berikutnya.

Menggabungkan dua tahap yang **saling menyela** membuat user bolak-balik tab di
tengah satu pekerjaan — lebih buruk daripada pindah halaman.

Dua pasang di atas aman karena bukan tahap berurutan:
- **Antrean** adalah *turunan* Penerimaan (jumlah baik dikurangi yang sudah
  masuk QC), bukan tahap terpisah. User melihat keduanya bergantian.
- **Re-QC** adalah pemeriksaan ulang hasil Rework. Satu orang mengerjakan
  keduanya dalam satu sesi.

Jangan "merapikan" dengan menggabungkan lebih banyak. Batas ini disengaja.

---

## Yang lebih mudah dari poin 2: TIDAK perlu filter tab

Sudah diperiksa 21 Sep — keempat menu ini rolenya **sama persis**
(`owner`, `admin_produksi`):

```
Penerimaan QC   owner, admin_produksi
Antrean QC      owner, admin_produksi
Rework          owner, admin_produksi
Re-QC           owner, admin_produksi
```

Jadi **tidak perlu** pola penyaringan tab per role seperti di poin 2, dan
**tidak perlu** `opsional()`. Semua tab tampil untuk siapa pun yang bisa membuka
halamannya.

Guard halaman: pakai pola yang sudah ada di halaman QC sekarang. Kalau halaman
lama memakai `requireRole`, **ganti** jadi:
```tsx
if (!(await bolehAkses(["owner", "admin_produksi"]))) return <AksesDitolak />;
```
`requireRole` di halaman melempar dan membuat halaman crash dengan overlay
Runtime Error (diperbaiki di app-qdqu).

---

## Pola tab: tiru poin 1 & 2

`src/app/(with-layout)/master/data-bahan/` atau `data-produk/` — keduanya sudah
selesai dan terverifikasi. Baca salah satunya dulu.

1. **Cek dulu di mana `PageHeader` berada.** Di Master Data ia ada di komponen
   (jadi harus reuse Table, bukan PageClient). Di Laporan ia ada di `page.tsx`
   (jadi Client boleh di-reuse langsung). **Periksa keempat halaman QC ini
   sendiri** sebelum memutuskan — jangan asumsikan.
2. Satu `PageHeader` di halaman gabungan.
3. State modal per tab, jangan satu state global.
4. Tab sinkron URL (`?tab=xxx`), route lama `redirect()`.

## Redirect

| Lama | Baru |
|---|---|
| `/qc/antrean` | `/qc/penerimaan?tab=antrean` |
| `/qc/re-qc` | `/qc/rework?tab=re-qc` |

`/qc/penerimaan` dan `/qc/rework` **tetap ada** — keduanya jadi tuan rumah,
bukan yang diredirect.

## Link internal

```bash
grep -rn 'href="/qc/antrean"\|href="/qc/re-qc"' src/
grep -rn 'push("/qc/antrean")\|push("/qc/re-qc")' src/
```

Termasuk tombol lanjut/kembali antar tahap QC — mis. setelah mencatat rework,
kalau ada tombol yang mengarah ke `/qc/re-qc`, arahkan ke
`/qc/rework?tab=re-qc`.

---

## Verifikasi — alur kerja lebih penting daripada tampilan

`npx tsc --noEmit` → **0 error**.

1. Sidebar QC: **10 entri → 8**
2. Satu PageHeader per halaman gabungan, tab berpindah, URL ikut
3. Route lama mendarat di tab yang benar
4. **Alur kerja tidak rusak** — ini yang tidak terbukti dari typecheck:
   - Penerimaan QC: catat satu penerimaan, lalu pindah ke tab Antrean →
     angka antreannya **ikut berubah**
   - Rework: catat satu rework, pindah ke tab Re-QC → item itu **muncul**
     sebagai kandidat
   Kalau angka tidak ikut berubah, kemungkinan cache query tidak ter-invalidate
   saat pindah tab — perbaiki sebelum lapor selesai.

## Jangan dikerjakan

- **Bagian B (Surat Jalan) — DILEWATI.** Sudah diverifikasi 21 Sep: Surat Jalan
  dirujuk dari **dua alur** (pengiriman jahit DAN dekorasi, 4 file). Menaruhnya
  sebagai tab di Pengiriman membuat alur dekorasi janggal — user dekorasi harus
  membuka menu "Pengiriman Vendor" untuk mencetak surat jalan sablon. Keputusan
  ditunda; jangan sentuh `/vendor/surat-jalan`.
- Delapan menu QC lain — batas di atas disengaja
- `bd close`, `git commit`, `git push`
- Mengubah logika QC apa pun; hanya cara membuka daftarnya
- Approval Karantina Reject

## Laporan akhir (wajib)

- Konfirmasi PageHeader muncul sekali, dan **di mana ia berada** di keempat
  halaman asli (komponen atau page.tsx)
- Hasil `npx tsc --noEmit`
- Hasil uji alur: apakah angka Antrean ikut berubah setelah mencatat penerimaan,
  dan apakah item muncul di Re-QC setelah mencatat rework
- Daftar link internal yang diarahkan ulang (atau "tidak ada")
- Konfirmasi `/vendor/surat-jalan` tidak disentuh
