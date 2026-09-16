# Smoke Test Tahap 4 — OIMS Owncrave

> Sesi: `oims-ckp smoke-test-tahap4` · Tipe: **Bugfix/Verifikasi** (bukan plan, bukan execute)
> Eksekutor: **Claude sendiri** (browser + SQL), bukan Antigravity.

---

## PROMPT (copy mulai dari sini)

CONTEXT:
OIMS Owncrave — ERP produksi garmen. Tahap 4 (QC, Finishing, Packing, Barang Jadi) baru
selesai ditulis: 15 issue closed, 20 tabel baru, 10 route `/qc/*`, tsc + build clean.

**Yang BELUM dilakukan: smoke test end-to-end lewat browser.** Tiap gelombang memang sudah
diverifikasi lewat SQL per-potong, tapi rantai lengkapnya belum pernah dijalankan sekali
jalan oleh manusia/browser.

CRITICAL: baca @CLAUDE.md untuk coding rules.
CRITICAL: baca @docs/claude/orchestrator-workflow.md langkah 5 — **build clean BUKAN
verifikasi**. Pelajaran Tahap 3: dua bug lolos tsc+build tapi bikin halaman tak terpakai
(infinite render loop di form penerimaan `735bcee`, objek Date di raw sql bikin /vendor/wip
500 `24dcb1a`). Bug kelas itu HANYA ketahuan lewat browser.

TASK:
Jalankan smoke test Tahap 4 end-to-end lewat browser, verifikasi tiap langkah dengan query DB.
Fix bug yang ketemu. JANGAN commit tanpa persetujuan Abu.

BRANCH: `phase-4` (sudah aktif, working tree bersih)

### Prasyarat data — SUDAH ADA, jangan seed ulang

Rantai Tahap 2-3 masih utuh di DB (diverifikasi 2026-09-10):
- 1 produk, 3 varian, 1 PO, 3 bundel, 1 vendor (`VDR-0001`, `qc_mode = internal`)
- 1 penerimaan hasil jahit dengan **`jumlah_baik` total 30 pcs** → inilah hulu QC
- 32 bahan (untuk uji pemakaian label), 2 user

Master Tahap 4 masih KOSONG (jenis cacat, kemasan, gudang barang jadi, standar QC) — bikin
lewat UI sebagai bagian dari smoke test, jangan lewat SQL. Justru itu yang diuji.

### Urutan uji (12 langkah)

Tiap langkah: lakukan lewat **browser**, lalu buktikan dengan **query DB**.

| # | Langkah | Route | Bukti yang dicari |
|---|---|---|---|
| 1 | Buat 2 jenis cacat + 1 kemasan + 1 gudang (jadikan default) | `/master/{jenis-cacat,kemasan,gudang-jadi}` | baris tersimpan; hapus lalu buat ulang kode sama BERHASIL (partial unique) |
| 2 | Buat standar QC v1, aktifkan; buat versi baru v2, aktifkan | `/qc/standar` | v1 otomatis `nonaktif`, tepat 1 `aktif` |
| 3 | Kirim 25 dari 30 pcs ke QC | `/qc/antrean` | `IN-QC-…` terbuat, antrean sisa 5 |
| 4 | Coba kirim 10 lagi (sisa cuma 5) | `/qc/antrean` | **DITOLAK** dengan pesan jelas, bukan stack trace |
| 5 | Buat WO QC metode 100%, mulai kerjakan | `/qc/wo` | baris hilang dari kandidat WO; `standar_versi` ter-snapshot |
| 6 | Catat hasil QC: 17 A + 3 B + 3 perbaikan + 2 reject | `/qc/pemeriksaan/baru` | tersimpan; defect rate tampil 32%; **coba juga input timpang → harus ditolak** |
| 7 | Catat temuan cacat 5 pcs, lalu coba 10 pcs lagi | `/qc/pemeriksaan/[id]` | yang ke-2 **DITOLAK** (bermasalah cuma 8) |
| 8 | Buat perbaikan internal 2 + retur vendor 1, lalu coba 1 lagi | `/qc/rework` | yang terakhir **DITOLAK** (total > 3) |
| 9 | Selesaikan perbaikan internal → catat Re-QC (lolos 2, grade A) | `/qc/re-qc` | putaran ke-1; baris masuk antrean finishing |
| 10 | Karantina 2 reject → ajukan tindakan musnahkan → approve | `/qc/reject` | **sebelum approve stok/dampak 0**, sesudah approve baru berdampak |
| 11 | Finishing 17 pcs → pakai label (bahan) → selesaikan → packing | `/qc/finishing`, `/qc/packing` | stok bahan label BERKURANG lewat `mutasi_stok`; set packing `selesai` dengan checklist belum lengkap **DITOLAK** |
| 12 | Terima barang jadi ke gudang | `/qc/stok-jadi` | stok jadi bertambah; **cache `kuantitas` = Σ `mutasi_barang_jadi`** |

### Query verifikasi kunci (jalankan di akhir)

```sql
-- INVARIAN PALING PENTING: cache stok = Σ mutasi (kalau meleset, ada jalur UPDATE liar)
SELECT s.id, s.kuantitas AS cache,
       COALESCE(SUM(m.jumlah), 0)::int AS sigma_mutasi,
       (s.kuantitas = COALESCE(SUM(m.jumlah), 0)::int) AS konsisten
FROM stok_barang_jadi s
LEFT JOIN mutasi_barang_jadi m ON m.stok_barang_jadi_id = s.id
GROUP BY s.id, s.kuantitas;
-- semua baris HARUS konsisten = true

-- Rantai lengkap: berapa pcs sampai di tiap stage
SELECT
  (SELECT COALESCE(SUM(jumlah_baik),0) FROM penerimaan_hasil_jahit_detail) AS baik_visual_t3,
  (SELECT COALESCE(SUM(jumlah_pcs),0) FROM penerimaan_qc_detail) AS masuk_qc,
  (SELECT COALESCE(SUM(jumlah_diperiksa),0) FROM hasil_qc_detail) AS diperiksa,
  (SELECT COALESCE(SUM(grade_a+grade_b+grade_c),0) FROM hasil_qc_detail) AS lolos,
  (SELECT COALESCE(SUM(jumlah),0) FROM finishing_detail) AS finishing,
  (SELECT COALESCE(SUM(jumlah),0) FROM packing_detail) AS packing,
  (SELECT COALESCE(SUM(kuantitas),0) FROM stok_barang_jadi) AS stok_jadi;

-- Audit log terisi untuk tabel Tahap 4
SELECT tabel, aksi, COUNT(*) FROM audit_log
WHERE tabel LIKE '%qc%' OR tabel IN ('finishing','packing','barang_jadi','stok_barang_jadi',
      'jenis_cacat','kemasan','gudang_barang_jadi','tindakan_reject')
GROUP BY tabel, aksi ORDER BY tabel;
```

### Yang paling mungkin bermasalah (curigai duluan)

Ini kode yang belum pernah dijalankan sama sekali:

1. **Form dengan state lokal + `useEffect`** — `HasilQcForm`, `KirimQcModal`, `BuatReworkModal`,
   `ReQcPageClient`, `KarantinaPageClient`. Pola render-loop Tahap 3 persis di sini: array
   baru tiap render induk yang jadi dependency. **Dua tempat sengaja pakai
   `eslint-disable-next-line react-hooks/exhaustive-deps`** — `KirimQcModal.tsx:79` dan
   `BuatReworkModal.tsx:75` — alasannya array `baris`/`hasilQcOptions` dibuat ulang tiap
   render induk sehingga akan mereset input operator. **Periksa apakah alasan itu masih
   benar, dan apakah reset form tetap jalan saat modal dibuka untuk sumber berbeda.**
2. **`jsonb` checklist** — `finishing_detail.proses` dan `packing.checklist`. Baca-tulis jsonb
   lewat Drizzle belum pernah diuji runtime.
3. **`Select` dengan `{...register()}` di dalam `.map()`** — dipakai di `ReQcPageClient` dan
   `StandarQcForm`. Kalau nilainya tak ke-bind, hasil Re-QC bisa salah simpan.
4. **`getStandarQcAktif`** — ada `sql\`true\`` sebagai placeholder kondisi; cek tidak
   mengembalikan standar milik produk lain.
5. **Query agregat `dashboard-qc.ts`** — banyak `FILTER (WHERE …)` dan subquery `NOT EXISTS`
   yang belum pernah dieksekusi dengan data nyata. Cek angkanya masuk akal, terutama
   First Pass Yield (dihitung dari baris tanpa rework) dan COPQ (komponen tanpa sumber
   HARUS `null` → tampil N/A, bukan `0`).
   Catatan: file ini sudah diperiksa tidak memakai objek `Date` mentah di raw `sql`
   (penyebab bug `24dcb1a` di Tahap 3), jadi bukan itu yang dicurigai di sini.

### Aturan proyek yang WAJIB dicek saat menemukan bug

- Stok barang jadi immutable — append `mutasi_barang_jadi`, tak pernah UPDATE `kuantitas`
  di luar `catatMutasiFg` (`src/lib/qc/stok-fg.ts`)
- Pemakaian label/kemasan kurangi stok bahan lewat `mutasi_stok`, bukan UPDATE langsung
- Approval gate: tindakan reject & penyesuaian stok FG tak berdampak sebelum `approved`
- Audit log tiap CREATE/UPDATE/APPROVE
- `numeric` untuk uang/kuantitas

### REQUIREMENTS

1. Fix bug yang ketemu — sekecil mungkin, jangan refactor.
2. `pnpm exec tsc --noEmit` + `pnpm run build` clean setelah tiap fix.
3. **JANGAN commit tanpa persetujuan Abu.** Tunjukkan diff + ringkasan dulu.
4. **Hapus data uji** setelah selesai (seri `9001`/`UJI-` gampang dicari), ATAU laporkan
   apa yang sengaja ditinggal.
5. Laporkan jujur: langkah mana lolos, mana gagal, apa yang belum sempat diuji.

### Setelah selesai

- Update `docs/dashboard.md`: tambah bagian hasil smoke test (pola Tahap 3 — tabel 6 langkah
  + daftar bug yang ketemu + commit fix-nya)
- Dashboard: dibangkitkan dari meta-dashboard vault, tidak perlu regenerate di repo ini
- Kalau ada temuan yang layak jadi aturan, simpan lewat `bd remember`
