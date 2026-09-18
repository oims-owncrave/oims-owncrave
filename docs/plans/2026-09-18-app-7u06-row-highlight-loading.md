# app-7u06 — Row highlight (getRowLoading) di 18 tabel

**Beads:** app-7u06 (existing, cakupan diperluas dari 7→18 file oleh Abu 18 Sep 2026)
**Parent:** app-2fq (M3.1)

## Konteks

`DataTable` (`src/components/ui/table/table.tsx:49`) sudah punya prop
`getRowLoading?: (item: TData) => boolean` — kalau `true`, baris itu diberi highlight
visual saat sedang dituju navigasi. `BomTable.tsx` sudah pakai ini dengan benar
(referensi wajib, JANGAN menyimpang dari polanya):

```tsx
// src/app/(with-layout)/produksi/bom/_components/BomTable.tsx:38-54
export function BomTable({ data, onImport }: { data: BomListRow[]; onImport: () => void }) {
  const router = useRouter();
  const [isNavigating, startNavigate] = useTransition();
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  ...
  // rowId yang sedang dituju — dipakai DataTable buat tandai baris itu sedang dimuat.
  const go = (path: string, rowId?: string) => {
    if (rowId) setLoadingRowId(rowId);
    startNavigate(() => router.push(path));
  };
  // Transition selesai (navigasi berhasil ATAU dibatalkan) — lepas kuncian baris.
  useEffect(() => {
    if (!isNavigating) setLoadingRowId(null);
  }, [isNavigating]);
```

Lalu di `<DataTable getRowLoading={(item) => item.id === loadingRowId} />` (baris 178).

**JANGAN campur dengan pola `pendingId`/`isPending` dari app-9bkl (17-18 Sep 2026).**
Itu untuk icon action (Eye/Print) berubah jadi Spinner — target berbeda (icon, bukan
baris). Row highlight ini target-nya `<tr>`/`<li>` baris tabel itu sendiri.

## Dua grup file — cara kerja beda

Cek `grep -c pendingId` di 18 file target menunjukkan 2 kondisi:

### Grup A — 13 file SUDAH punya `pendingId` (dari app-9bkl kemarin)

File-file ini sudah punya state `pendingId` yang di-set tiap kali baris diklik untuk
navigasi (dipakai TableAction.loading). **Reuse langsung, JANGAN bikin state baru.**

Perubahan per file: HANYA tambah 1 prop di `<DataTable ... />` yang sudah ada:
```tsx
getRowLoading={(item) => item.id === pendingId}
```
Tidak perlu state baru, tidak perlu `useEffect` baru — `pendingId` sudah di-reset lewat
`useTransition` yang sudah ada (cek pola `[, startNavigate] = useTransition()` di file
masing-masing, sudah menangani reset otomatis saat transisi selesai/dibatalkan).

Daftar 13 file (path + baris kira-kira tempat `<DataTable` dipanggil — cek ulang exact
line saat eksekusi, nomor bisa geser):
1. `src/app/(with-layout)/inventory/barang-keluar/_components/BarangKeluarTable.tsx`
2. `src/app/(with-layout)/inventory/barang-masuk/_components/BarangMasukTable.tsx`
3. `src/app/(with-layout)/produksi/wo-cutting/_components/WoTable.tsx`
4. `src/app/(with-layout)/produksi/penerimaan-cutting/_components/PenerimaanTable.tsx`
5. `src/app/(with-layout)/produksi/po/_components/PoTable.tsx`
6. `src/app/(with-layout)/produksi/permintaan-bahan/_components/PbTable.tsx`
7. `src/app/(with-layout)/vendor/penerimaan/_components/PenerimaanTable.tsx`
8. `src/app/(with-layout)/vendor/surat-jalan/_components/SuratJalanTable.tsx`
9. `src/app/(with-layout)/vendor/penugasan/_components/PenugasanTable.tsx`
10. `src/app/(with-layout)/vendor/dekorasi/_components/DekorasiTable.tsx`
11. `src/app/(with-layout)/vendor/retur/_components/ReturTable.tsx`
12. `src/app/(with-layout)/vendor/pengiriman/_components/PengirimanTable.tsx`
13. `src/app/(with-layout)/vendor/wip/_components/WipJahitClient.tsx`

**PENTING — verifikasi per file sebelum nambah prop:** beberapa file (mis. `PoTable.tsx`,
`DekorasiTable.tsx`) punya BEBERAPA `useTransition` terpisah (mis. `isPendingNew` untuk
tombol "+Buat", `pendingId` untuk row action). Prop `getRowLoading` HARUS bandingkan ke
`pendingId` (state row-level), BUKAN `isPendingNew`/`isPendingTemplate` (state tombol
tunggal) — highlight baris cuma relevan kalau baris ITU yang dituju, bukan saat tombol
"+Buat" lain yang diklik. Baca isi file dulu, cari nama variabel `pendingId` yang persis,
jangan asumsi nama sama persis di semua file (boleh beda kalau ada alasan lokal).

### Grup B — 5 file BELUM punya pola apa pun, ikuti pola BomTable persis

File-file ini tidak tersentuh app-9bkl (tidak punya row-action Eye yang navigasi lewat
`pendingId`, atau strukturnya beda). Terapkan pola LENGKAP dari `BomTable.tsx` di atas:
tambah `useState<string|null>` untuk row id, `useEffect` untuk lepas kuncian, `go()`
helper yang set row id sebelum `startNavigate`, dan `getRowLoading` di `<DataTable>`.

1. `src/app/(with-layout)/sistem/log/_components/AuditLogTable.tsx`
2. `src/app/(with-layout)/qc/pemeriksaan/_components/HasilQcTable.tsx`
3. `src/app/(with-layout)/qc/reject/_components/KarantinaPageClient.tsx`
4. `src/app/(with-layout)/qc/standar/_components/StandarQcTable.tsx`
5. `src/app/(with-layout)/qc/wo/_components/WoQcTable.tsx`

**Sebelum coding tiap file di Grup B:** baca isi file, cek bagaimana icon Eye/Detail-nya
sekarang navigasi (apakah pakai `router.push` langsung tanpa `useTransition` sama sekali,
atau ada pola lain). Kalau BELUM ada `useTransition` sama sekali, tambahkan mengikuti
persis struktur `BomTable.tsx` (import `useTransition, useEffect` dari `"react"`, state
`loadingRowId`, `go()` helper, `useEffect` reset).

## Temuan yang HARUS dicek, JANGAN diam-diam "diperbaiki"

Kartu asli (app-7u06) mencatat: *"klik ikon mata di PoTable pernah tidak menavigasi saat
dev server sibuk compile (17 Sep)."* Saat mengerjakan `PoTable.tsx`:

1. Cek apakah ini murni gejala dev-server-lambat (kompilasi Next.js route pertama kali,
   normal, akan hilang sendiri di production build) — kalau iya, CUKUP catat di laporan,
   jangan ubah apa pun untuk "fix" ini.
2. Kalau ternyata `startNavigate`/`router.push` di `PoTable.tsx` punya bug nyata (mis.
   race condition, path salah, kondisi yang membuat `onClick` tidak terpanggil) — JANGAN
   perbaiki dengan cara ad-hoc. Laporkan sebagai temuan terpisah di akhir (bagian
   "Temuan tambahan"), biar Abu buat issue baru. Tugas plan ini HANYA row highlight.

## Verifikasi

Untuk SETIAP 18 file setelah diubah:
1. Baca ulang file, pastikan `getRowLoading` prop terpasang di pemanggilan `<DataTable>`
   yang benar (kalau ada lebih dari satu `<DataTable>` di file — jarang, tapi cek).
2. Pastikan tidak ada state/`useTransition` yang ditambah dobel (Grup A tidak boleh
   nambah `loadingRowId` baru — itu ciri Grup B).

Setelah SEMUA 18 file selesai:
```bash
npx tsc --noEmit
```
Harus 0 error. Kalau ada error, perbaiki sebelum lapor selesai — jangan lapor "selesai"
dengan error tersisa.

## Yang TIDAK boleh disentuh

- Jangan ubah `src/components/ui/table/table.tsx` (prop `getRowLoading` sudah ada, sudah
  benar, tidak perlu diubah).
- Jangan ubah pola `pendingId`/icon Spinner dari app-9bkl — itu sudah selesai & di-commit.
- Jangan `git commit`/`git push`. Jangan `bd close`. Itu keputusan Abu setelah review.

## CLAUDE.md Check
- [ ] Apakah ada pattern/arsitektur BARU yang diperkenalkan di task ini? (Tidak — reuse
      pola `BomTable` yang sudah ada)
- [ ] Apakah ada tabel database baru? Tidak.
- [ ] Apakah ada route/page baru? Tidak.
- [ ] Apakah ada permission pattern baru? Tidak.
- [ ] Update `CLAUDE.md`/`docs/claude/`? Tidak perlu — pola sudah terdokumentasi di
      `docs/claude/ui-components.md` (cek isinya kalau ada bagian loading — sinkronkan
      kalau perlu, tapi bukan wajib untuk plan ini).
