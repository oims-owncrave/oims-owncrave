CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif.
Tabel menggunakan DataTable kit buatan di `src/components/ui/table/` (`table.tsx`, `use-table.ts`, `table-toolbar.tsx`).

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Perbaiki perilaku scroll posisi saat toggle tampilan "Kartu | Tabel" di mobile (DataTable) agar selalu kembali ke paling atas.

ISSUE: oims-scroll-reset (bug, P2) — Mobile View Toggle Scroll Position.
BRANCH: fix/mobile-view-scroll-reset

DESKRIPSI MASALAH:
Di layar mobile (`sm:hidden`), terdapat tombol toggle tampilan "Kartu | Tabel" di bagian atas `DataTable`.
Saat pengguna sedang berada di tampilan "Tabel" dan telah me-scroll halaman/tabel ke bawah, lalu menekan tombol "Kartu", tampilan memang beralih ke mode Kartu tetapi posisi scroll layar MASIH tertahan di bagian bawah (bukan di paling atas).

PERILAKU YANG DIHARAPKAN:
Setiap kali pengguna berpindah mode tampilan (misal dari Tabel → Kartu atau Kartu → Tabel), posisi gulungan layar / kontainer tabel HARUS otomatis dan 100% andal di-reset kembali ke bagian paling atas (`scrollTop = 0` / top of `DataTable` container).

FILE-FILE TERKAIT:
1. `src/components/ui/table/table.tsx` — Komponen DataTable (menampung toggle button, Card View, dan Table View)
2. `src/components/ui/table/use-table.ts` — Hook state tabel (menyimpan state `mobileView: "card" | "table"`)
3. `src/components/layouts/main-content.tsx` — Container layout utama (`<main>`)

POIN INVESTIGASI & PETUNJUK UNTUK OPUS:
1. **Container Scroll Real:** Periksa apakah scrollbar berada di level `window`, `document.documentElement`, `document.body`, atau elemen wrapper layout (`<main>` / `<div className="...">` di `main-content.tsx`).
2. **Timing DOM Render React 19:** Saat `table.setMobileView("card")` dipanggil, React 19 memperbarui DOM secara eksplisit. Pemanggilan scroll yang dilakukan terlalu dini atau secara eksplisit sebelum/saat layout berubah bisa gagal/diabaikan oleh browser mobile.
3. **Browser Scroll Restoration & Focus:** Mobile browser (Chrome Android & Safari iOS) memiliki fitur bawaan *scroll restoration* dan menjaga *element focus/touch position*.
4. **Pendekatan Solusi:** 
   - Cari tahu elemen mana yang sebenarnya menyimpan scroll offset di mobile.
   - Pastikan metode reset scroll (misal `element.scrollTop = 0` atau `scrollIntoView`) berjalan setelah DOM selesai melayout ulang sepenuhnya (misal via `useLayoutEffect`, `requestAnimationFrame`, atau penanganan ref kontainer yang tepat).

REQUIREMENTS:
1. Baca file `src/components/ui/table/table.tsx`, `src/components/ui/table/use-table.ts`, dan `src/components/layouts/main-content.tsx`.
2. Implementasikan solusi yang 100% dipastikan bekerja di mobile (Android & iOS).
3. Setelah edit: jalankan `pnpm exec tsc --noEmit` dan `pnpm run build` untuk verifikasi.
4. JANGAN commit (tunggu Abu review).
