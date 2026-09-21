# app-46vb — ComboSelect + MultiSelect: tombol clear & keyboard navigation

**Prioritas:** P2 · **Tipe:** bug · **Dampak:** ComboSelect 34 file, MultiSelect 4 file
**Aturan konvensi:** `ui_conventions.md` §12b (vault)

## Koreksi diagnosis awal (baca ini dulu)

Deskripsi issue yang lama menyebut `handleSelect` single-select "salah karena selalu
mengirim nilai". **Itu keliru.** Kode aslinya (`ComboSelect.tsx:170-182`):

```tsx
const handleSelect = (val: string | number, isDisabled?: boolean) => {
  if (isDisabled) return
  if (multiple) {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val]
    onChange(next)
  } else {
    onChange(val)        // ← replace. BENAR.
    setIsOpen(false)
    setSearch("")
  }
}
```

Cabang single sudah benar — mengganti nilai memang tugasnya. Yang **hilang** adalah
jalan keluarnya: multi-select dapat "kosongkan" gratis lewat toggle, single-select
tidak dapat apa-apa kecuali sengaja dibuatkan tombol clear.

Jadi jangan menyentuh `handleSelect`. Yang dikerjakan: **menambah** tombol clear, dan
menambah keyboard navigation.

## Peta kondisi sekarang

| Aspek | ComboSelect | MultiSelect |
|---|---|---|
| prop `disabled` | ada (L42) | ada (L46) |
| prop `error` | objek `{message?}` (L28) | **tidak ada** |
| `value` boleh null | ya (L15) | tidak (`string[]`) |
| panel | `createPortal` → body (L219-274) | `createPortal` → body (L186-248) |
| tombol clear × | **tidak ada** | ada (L271-282) |
| keyboard nav | **tidak ada** | **tidak ada** |
| Escape menutup | **tidak ada** | **tidak ada** |
| state highlight/activeIndex | tidak ada | tidak ada |
| opsi dirender | `<button onMouseDown>` L192-206 | `<button onMouseDown>` L167-182 |
| trigger | `<button onClick>` L277-283 | `<button onClick>` L252-261 |
| tutup panel | mousedown listener L153-164 | mousedown listener L134-145 |

## Task 1 — Tombol clear di ComboSelect

Prop baru **opt-in**, default `false`:

```tsx
/** Tampilkan tombol × untuk mengosongkan nilai. Hanya untuk field opsional. */
clearable?: boolean;
```

Opt-in, bukan selalu aktif — field yang memang WAJIB tidak boleh ikut bisa dikosongkan.
34 file pemakai, jadi mengubah perilaku serentak berisiko.

Render di dalam trigger (L277-283), muncul **hanya saat ada nilai**:

```tsx
{clearable && !disabled && selectedValues.length > 0 && (
  <span
    role="button"
    tabIndex={0}
    aria-label="Kosongkan"
    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
    onClick={(e) => {
      e.stopPropagation();
      onChange(multiple ? [] : null);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onChange(multiple ? [] : null);
      }
    }}
  >
    <X size={14} />
  </span>
)}
```

`onChange(null)` untuk single — tipe `ComboValue` sudah mengizinkan null (L15), dan
`selectedValues` sudah menormalkan null → `[]` (L63-66). Jangan kirim `""`, itu tidak
konsisten dengan tipe.

`stopPropagation` pada `onMouseDown` wajib — tanpa itu klik × ikut membuka panel.

**Catatan HTML:** MultiSelect menaruh `<span role="button">` di dalam `<button>` trigger
(L271-282) — secara HTML itu tidak valid (interaktif bersarang), tapi jalan karena
stopPropagation. Ikuti pola yang sama di ComboSelect demi konsistensi; perbaikan
strukturnya (ubah trigger jadi `<div role="combobox">`) di luar scope issue ini.

## Task 2 — Pasang `clearable` di field opsional

Yang memicu temuan ini: `BarangKeluarForm.tsx` field "Permintaan Bahan (opsional)"
(baris 94-111). Di situ sudah ada kode defensif yang siap menangani PB dikosongkan
(mengosongkan `poId` juga) tapi belum bisa dipicu — komentarnya menyebut issue ini.

Pasang `clearable` di field itu, lalu **hapus catatan "belum bisa dipicu"** di komentar
baris 105-107 karena sudah tidak berlaku.

Cari field lain berlabel "(opsional)" yang memakai ComboSelect:
```bash
grep -rn "opsional" src/app --include="*.tsx" | grep -i combo
```
Pasang `clearable` hanya di yang labelnya opsional. **Jangan pasang di semua.**

## Task 3 — Keyboard navigation (ComboSelect dulu)

### Jebakan yang harus dipahami sebelum menulis kode

Opsi dirender dengan `onMouseDown` + `preventDefault()` (L193) supaya trigger tidak
ter-blur saat opsi diklik. Efek sampingnya: **opsi tidak pernah bisa menerima fokus
keyboard.** Jadi navigasi TIDAK BOLEH mengandalkan `focus()` DOM — harus pakai state.

```tsx
const [activeIndex, setActiveIndex] = useState(-1);
```

Tambahkan `onKeyDown` di trigger (L277-283):

```tsx
onKeyDown={(e) => {
  if (disabled) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!isOpen) { setIsOpen(true); setActiveIndex(0); return; }
    const arah = e.key === "ArrowDown" ? 1 : -1;
    setActiveIndex((i) => {
      const next = i + arah;
      if (next < 0) return enabledOptions.length - 1;
      if (next >= enabledOptions.length) return 0;
      return next;
    });
  } else if (e.key === "Enter") {
    if (!isOpen) return;              // biarkan submit form kalau panel tertutup
    e.preventDefault();
    const opt = enabledOptions[activeIndex];
    if (opt) handleSelect(opt.value, opt.disabled);
  } else if (e.key === "Escape") {
    if (!isOpen) return;
    e.preventDefault();
    setIsOpen(false);
    setSearch("");
  }
}}
```

**Penting soal Enter:** kalau panel tertutup, JANGAN `preventDefault` — user menekan
Enter untuk submit form, itu harus tetap jalan. Ini komponen form, bukan widget berdiri
sendiri.

`enabledOptions` sudah ada (L86) — pakai itu, jangan hitung ulang. Tapi perhatikan ia
dihitung dari `options`, bukan `filtered` (L68-71). Untuk navigasi yang benar saat user
sedang mencari, navigasi harus mengikuti **daftar yang terlihat**. Pakai daftar hasil
filter yang juga `!disabled`:

```tsx
const navigable = filtered.filter((o) => !o.disabled);
```
dan pakai `navigable` di handler di atas, bukan `enabledOptions`.

Reset `activeIndex` saat panel dibuka/ditutup dan saat `search` berubah:
```tsx
useEffect(() => { setActiveIndex(-1); }, [search, isOpen]);
```

Tandai opsi aktif secara visual di `renderOption` (L188-208) — pakai class yang sama
dengan `hover:` yang sudah ada, supaya konsisten:
```tsx
const isActive = navigable[activeIndex]?.value === opt.value;
// tambahkan ke cn(): isActive && "bg-gray-100 dark:bg-dark-2"
```

Tambahkan ARIA di trigger: `role="combobox"`, `aria-expanded={isOpen}`,
`aria-haspopup="listbox"`. Panel: `role="listbox"`. Opsi: `role="option"` +
`aria-selected`.

**Catatan search input:** panel punya input search (L225-237) yang di-autofocus (L166-168).
Saat search terfokus, `onKeyDown` trigger tidak menerima event. Pasang handler yang sama
di input search itu juga — paling bersih: ekstrak jadi satu fungsi `onKeyNav` lalu pasang
di dua tempat.

## Task 4 — MultiSelect: Escape + keyboard

MultiSelect sudah punya tombol clear (L271-282), jadi hanya perlu keyboard.

Polanya sama dengan Task 3, tapi lebih sederhana: `toggle` (L151-153) tidak menutup
panel, jadi Enter memilih tanpa menutup — itu benar untuk multi-select. Escape menutup.

Tambahkan `onKeyDown` di trigger (L252-261) dan di input search (L193-205).

## Verifikasi

1. `npx tsc --noEmit` — 0 error.
2. **Clear:** buka `/inventory/barang-keluar/baru`. Pilih "Permintaan Bahan (opsional)"
   → tombol × muncul → klik × → field kosong **dan** field "PO Produksi" ikut kosong
   lagi (kode defensif di form itu akhirnya aktif).
3. **Clear tidak muncul di field wajib:** di form yang sama, field "PO Produksi"
   (required) TIDAK boleh punya tombol ×.
4. **Keyboard — tanpa menyentuh mouse sama sekali:** Tab ke ComboSelect mana pun →
   ArrowDown membuka panel → ArrowDown/Up memindah highlight → Enter memilih → panel
   tertutup, nilai terisi. Buka lagi → Escape menutup.
5. **Enter tidak merusak submit:** di form mana pun, saat ComboSelect terfokus tapi
   panel TERTUTUP, tekan Enter → form harus ter-submit seperti biasa.
6. **Search + navigasi:** buka ComboSelect dengan banyak opsi, ketik kata kunci →
   ArrowDown harus menavigasi hasil filter, bukan daftar penuh.
7. **Mouse masih normal:** klik opsi, klik luar untuk menutup — tidak boleh ada regresi.
8. MultiSelect: Escape menutup, Arrow+Enter memilih tanpa menutup panel.

## Yang TIDAK dikerjakan di issue ini

- **`SingleSelect` tidak diperbaiki di sini** — ada issue sendiri (`app-2ttp`), dan
  0 pemakai. Akar masalahnya beda: ia membungkus MultiSelect yang selalu `toggle`, jadi
  memilih ulang opsi yang sedang aktif justru mengosongkan nilai.
- **Tidak menyatukan ComboSelect & MultiSelect** walau ~80% duplikat (portal,
  updatePosition, outside-click, group, search hampir identik). Refactor 34+4 file
  pemakai di tengah perbaikan bug = dua risiko sekaligus. Catat sebagai kandidat
  refactor terpisah kalau nanti ada fitur ketiga yang harus masuk ke dua-duanya.
- Tidak menambah prop `error` ke MultiSelect (tidak ada sekarang) — di luar scope.
- Tidak menambah clamp horizontal ke panel MultiSelect (ComboSelect punya L111-114,
  MultiSelect tidak) — bukan bagian dari issue ini, catat kalau nanti panelnya terpotong.
