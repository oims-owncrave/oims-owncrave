# Backup prod pra-reset — 22 Sep 2026 (app-05i4)

Diambil sesaat sebelum reset data transaksi di prod. **Sementara.** Boleh dihapus
begitu klien mulai mengisi data sendiri dan reset dipastikan benar.

## Isi

| Berkas | Isi |
|---|---|
| `batch1-bahan-stok-po-cutting+master.json` | transaksi stok/PO/cutting (77 baris) + snapshot seluruh master (97 baris) |
| `batch2-jahit-qc-finishing-audit.json` | transaksi jahit→QC→finishing→barang jadi + `audit_log` (123 baris) |

Snapshot master disertakan sebagai pengaman walau master TIDAK dihapus saat reset.

## Apa yang dilakukan reset

Dihapus: seluruh tabel transaksi (28 tabel, termasuk `stok`, `audit_log`).
Dipertahankan: seluruh master — `bahan` 32, `kategori` 11, `bagian_produk` 10,
`satuan` 7, `supplier` 6, `bom` 1 (+6 detail), `users` 4, `jenis_cacat` 3,
`varian_produk` 3, `warna` 3, `gudang_barang_jadi` 2, `standar_qc` 2 (+2 detail),
`tarif_jasa_jahit` 2, `kemasan` 1, `produk` 1, `vendor` 1.

`stok` dihapus, bukan dinolkan: baris stok tanpa `mutasi_stok` = saldo tanpa jejak,
melanggar aturan stok immutable. Baris stok terbentuk sendiri saat barang masuk pertama.

## Cara memulihkan (kalau reset ternyata keliru)

Tidak ada skrip restore. Berkas ini JSON per tabel dengan UUID asli — insert kembali
harus urut induk→anak (kebalikan urutan hapus). Master masih utuh di prod, jadi FK
ke master tetap sah.

```python
import json
d = json.load(open('batch1-bahan-stok-po-cutting+master.json'))
d['barang_masuk']        # list of dict, kolom apa adanya
```
