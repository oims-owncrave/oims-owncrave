# Row loading overlay desktop — samakan dengan mobile

**Beads:** app-bvre

> **REVISI 18 Sep 2026 setelah lihat hasil nyata:** Opsi A (colSpan menggantikan
> baris) dieksekusi Antigravity sesuai plan awal, tapi Abu screenshot hasilnya
> dan menilai KURANG — data hilang total terasa aneh (baris kosong, bukan
> "loading"), bukan "buram + spinner" yang dia mau. **Diganti ke Opsi B**
> (overlay, ditolak semula karena dikira perlu hitung lebar manual) — ternyata
> solusinya lebih simpel dari dugaan: `<td>` dengan `position: absolute` dan
> `<tr>` (sudah `position: relative`) otomatis jadi containing block-nya, jadi
> overlay `inset-0` melebar menutupi SELURUH row tanpa perlu hitung lebar kolom
> manual sama sekali. Kekhawatiran sticky/pinned column juga jadi tidak relevan
> — dicek ulang, TIDAK ADA satu pun tabel di app ini yang pakai `sticky` column
> secara aktif (`grep sticky: src/app` nol hasil). Bagian di bawah adalah plan
> ASLI (Opsi A) — sudah tidak dipakai, dipertahankan untuk jejak keputusan. Kode
> final ada di "Implementasi (Revisi — Opsi B)" di akhir file ini.

## Konteks

`DataTable` (`src/components/ui/table/table.tsx`) punya prop `getRowLoading` yang
sudah dipakai 16+ tabel (hasil app-7u06 + `BomTable`). Behavior saat
`getRowLoading` return `true` BEDA antara mobile dan desktop:

- **Mobile** (card view, baris 297-330) — SUDAH BENAR: 1 `<div className="absolute inset-0">`
  overlay di tengah card, `bg-white/60 dark:bg-gray-dark/60` + `Spinner size={20}`,
  isi card di belakangnya `opacity-40 pointer-events-none` (masih kelihatan samar).
- **Desktop** (table view, baris 469-537) — YANG DIPERBAIKI: cuma kolom "No."
  (baris 495-502) yang diganti jadi `Spinner size={16}` kecil, sisa kolom lain
  di tabel cuma `opacity-40` tanpa spinner sama sekali (baris 481). Tidak ada
  1 titik fokus visual di tengah baris.

Abu screenshot kondisi desktop dan minta disamakan konsepnya dengan mobile: 1
spinner yang jelas terlihat menutupi baris, bukan cuma spinner kecil di kolom
nomor urut.

## Kenapa tidak bisa langsung copy pola mobile (analisis wajib dibaca)

Mobile pakai `<div>` bebas — bisa nest `<div className="absolute">` sejajar isi
card berapa pun.

Desktop pakai `<table>` HTML asli: `TableRow` = `<tr>` (`table-primitives.tsx:57-70`),
`TableCell` = `<td>` (`table-primitives.tsx:87-100`). **`<tr>` di HTML valid HANYA
boleh berisi `<td>`/`<th>`.** Menaruh `<div className="absolute">` sebagai child
langsung `<tr>` (sejajar dengan `<td>` lain) adalah HTML tidak valid — browser
akan "foster parent" elemen itu keluar dari struktur tabel, merusak layout.

Tabel ini juga punya sticky/pinned columns (`isPinned`, `getStickyClasses`,
`stickyStyle`, baris 505-518) — overlay absolute yang mencoba menutupi seluruh
lebar baris dari dalam satu `<td>` akan sulit menghitung lebar total yang benar
dan rapuh terhadap resize/`ColumnToggle`.

## Keputusan (final, dari sesi plan-mode Abu 18 Sep 2026)

**Opsi A dipilih**: saat `isRowLoading === true`, SATU `<TableCell colSpan={totalKolom}>`
MENGGANTIKAN seluruh isi baris (checkbox, nomor urut, semua `visibleColumns` TIDAK
dirender). Isi cell itu cuma `<div className="flex items-center justify-center py-3"><Spinner size={20} /></div>`.

Konsekuensi yang disadari & diterima: data lama di baris itu HILANG sementara
(diganti spinner penuh), bukan tetap terlihat samar seperti mobile. Ini valid
HTML, murah dieksekusi, dan konsisten dengan pola `colSpan` yang SUDAH ADA di
file yang sama untuk 2 kondisi lain:
- empty-state: baris 465, `colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (showRowNumber ? 1 : 0)}`
- expanded-row: baris 529, rumus identik

**Kolom "No." ikut hilang total** — tidak ada perlakuan khusus mempertahankan
nomor urut saat row loading.

**Opsi B ditolak** (overlay absolute di dalam td pertama dengan perhitungan
lebar manual) — terlalu rapuh karena sticky/pinned columns, kompleksitas tinggi
untuk manfaat kosmetik kecil.

## Implementasi

**File:** HANYA `src/components/ui/table/table.tsx`.

**Lokasi:** blok `table.processedData.map(...)` desktop, baris 469-537 (dalam
`<TableBody>` non-mobile). **JANGAN sentuh blok mobile (baris 297-330).**

**Kondisi sekarang** (baris 475-526): `<TableRow>` SELALU merender
`enableSelection` checkbox cell (486-493) → `showRowNumber` cell — isi nomor
ATAU spinner kecil kalau `isRowLoading` (495-502) → `visibleColumns.map` render
tiap kolom data (504-525).

**Perubahan:** tambahkan percabangan JSX di dalam `<TableRow>`. Struktur baru:

```tsx
<TableRow
  className={cn(
    "relative cursor-pointer",
    enableSelection && isSelected && "bg-primary/5 dark:bg-primary/10",
    isRowLoading && "bg-gray-1 dark:bg-dark-2",
  )}
  aria-busy={isRowLoading}
  onClick={() => !isRowLoading && renderExpandedRow && table.toggleRowExpansion(rowId)}
>
  {isRowLoading ? (
    <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (showRowNumber ? 1 : 0)}>
      <div className="flex items-center justify-center py-3">
        <Spinner size={20} />
      </div>
    </TableCell>
  ) : (
    <>
      {enableSelection && (
        <TableCell className="w-10 px-4" onClick={(e) => { e.stopPropagation(); table.toggleRowSelection(rowId) }}>
          <Checkbox
            checked={isSelected}
            onChange={() => table.toggleRowSelection(rowId)}
            size="sm"
          />
        </TableCell>
      )}
      {showRowNumber && (
        <TableCell className="w-14 px-4 text-center text-dark-5 dark:text-dark-6">
          {table.pageStartIndex + rowIndex}
        </TableCell>
      )}
      {visibleColumns.map((col) => {
        const isPinned = table.isPinned(col.key)
        const isLeft = col.sticky === "left" || isPinned
        const isRight = col.sticky === "right"
        return (
          <TableCell
            key={col.key}
            className={cn(
              col.align === "center" && "text-center",
              col.align === "right" && "text-right",
              col.className,
              getStickyClasses(isLeft, isRight),
              col.key === lastStickyKey && "pinned-boundary",
            )}
            style={stickyStyle(col, isPinned)}
          >
            {col.renderCell
              ? col.renderCell(item, { rowIndex, isExpanded, isSelected })
              : String((item as Record<string, unknown>)[col.key] ?? "")}
          </TableCell>
        )
      })}
    </>
  )}
</TableRow>
```

**Yang dihapus dari kondisi normal:** `[&>td]:pointer-events-none [&>td]:opacity-40`
di className `TableRow` (baris 481 sekarang) — tidak relevan lagi karena saat
loading, cell lama tidak dirender sama sekali (diganti 1 cell colSpan). Ganti
jadi cukup `isRowLoading && "bg-gray-1 dark:bg-dark-2"` untuk warna latar baris.

**Yang TIDAK berubah:**
- Blok mobile (baris 297-330) — sama sekali tidak disentuh.
- Prop `getRowLoading` sendiri (definisi baris 49) — kontrak API tidak berubah.
- Blok empty-state (463-468) dan expanded-row (527-533) — tidak disentuh, tapi
  rumus `colSpan` di kode baru HARUS identik dengan yang mereka pakai (reuse
  pola, jangan tulis ulang dengan cara beda).
- `Spinner` — sudah diimport di file ini (dipakai baris 327 mobile, baris 498
  desktop yang lama), tidak perlu import baru.

**Dampak:** perubahan ini di 1 komponen generik, otomatis berlaku ke SEMUA
tabel yang pakai `getRowLoading` (16 tabel app-7u06 + `BomTable`) tanpa
menyentuh file per-tabel satu-satu.

## Verifikasi

1. `npx tsc --noEmit` — wajib 0 error.
2. Baca ulang hasil edit — pastikan JSX valid (fragment `<>` dipakai benar,
   tidak ada `<TableCell>` yang ketinggalan tag penutup).
3. Cek visual browser (kalau memungkinkan): buka salah satu tabel yang pakai
   `getRowLoading` (mis. `/produksi/permintaan-bahan`), klik row action Eye,
   screenshot SEBELUM navigasi selesai — pastikan seluruh baris (termasuk area
   yang tadinya kolom No.) jadi satu spinner di tengah, bukan cuma kolom No.
   yang berubah.
4. Pastikan mobile (resize browser <850px atau device emulation) TIDAK berubah
   — overlay card tetap seperti semula.
5. Cek row dengan `renderExpandedRow` (kalau ada tabel yang pakai fitur expand)
   — pastikan `isExpanded` state tidak rusak saat row itu loading lalu selesai.

## CLAUDE.md Check
- [ ] Pattern/arsitektur baru? Tidak — pola `colSpan` reuse dari yang sudah ada.
- [ ] Tabel database baru? Tidak.
- [ ] Route/page baru? Tidak.
- [ ] Permission pattern baru? Tidak.
- [ ] Update `docs/claude/ui-components.md`? Opsional — kalau ada bagian
      loading indicator di situ, sinkronkan behavior baru desktop vs mobile.
      Tidak wajib untuk plan ini.

---

## Implementasi (REVISI — Opsi B, dieksekusi Claude 18 Sep 2026)

Ini yang benar-benar dipakai. Semua cell asli TETAP dirender (tidak diganti),
diberi redup lewat `opacity-40` di level `<TableRow>`, PLUS 1 `<TableCell>`
tambahan dengan `position: absolute inset-0` yang jadi overlay spinner. `<tr>`
(TableRow) sudah `position: relative`, jadi jadi containing block otomatis
untuk `<td>` absolute ini — melebar menutupi seluruh row tanpa hitung lebar
kolom manual.

```tsx
<TableRow
  className={cn(
    "relative cursor-pointer",
    enableSelection && isSelected && "bg-primary/5 dark:bg-primary/10",
    isRowLoading && "bg-gray-1 dark:bg-dark-2 [&>td]:pointer-events-none [&>td]:opacity-40",
  )}
  aria-busy={isRowLoading}
  onClick={() => !isRowLoading && renderExpandedRow && table.toggleRowExpansion(rowId)}
>
  {isRowLoading && (
    <TableCell className="absolute inset-0 z-10 flex items-center justify-center border-0 !opacity-100 bg-white/60 dark:bg-gray-dark/60">
      <Spinner size={20} />
    </TableCell>
  )}
  {enableSelection && (
    <TableCell className="w-10 px-4" onClick={(e) => { e.stopPropagation(); table.toggleRowSelection(rowId) }}>
      <Checkbox checked={isSelected} onChange={() => table.toggleRowSelection(rowId)} size="sm" />
    </TableCell>
  )}
  {showRowNumber && (
    <TableCell className="w-14 px-4 text-center text-dark-5 dark:text-dark-6">
      {table.pageStartIndex + rowIndex}
    </TableCell>
  )}
  {visibleColumns.map((col) => {
    /* ...sama persis kondisi normal sebelumnya, tidak diganti apa pun... */
  })}
</TableRow>
```

**Poin penting:**
- Cell overlay diberi `!opacity-100` supaya TIDAK ikut terkena aturan
  `[&>td]:opacity-40` dari `TableRow` (yang menarget semua `<td>` langsung,
  termasuk overlay itu sendiri).
- `border-0` menghindari garis border ganda pada overlay.
- Kolom "No." TETAP tampil (redup), bukan hilang — beda dari keputusan awal.
  Ini konsekuensi alami dari "semua cell tetap dirender", bukan keputusan
  terpisah yang diambil ulang.
- Kekhawatiran sticky/pinned column TIDAK relevan karena `inset-0` melebar ke
  seluruh `<tr>`, bukan menghitung dari posisi kolom tertentu.

**Verifikasi:** dicek visual di `/produksi/permintaan-bahan`, klik icon mata,
screenshot menangkap kondisi loading: data (`Supernova`, `PO-2026-0001`, dll)
tetap terbaca samar, spinner besar (`size=20`) muncul di tengah baris. Sesuai
maksud Abu. `npx tsc --noEmit` — 0 error.
