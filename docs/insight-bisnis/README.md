# Insight Bisnis — OIMS Owncrave

> Kumpulan catatan **keputusan & konsep bisnis** di balik OIMS — bukan dokumentasi teknis kode. Untuk referensi saat bahas dengan klien, ambil keputusan, atau jawab pertanyaan bisnis.
>
> Bahasa awam. Beda dari `docs/konsep-produksi.md` (spec domain teknis) — folder ini fokus **kenapa** & **dampak keputusan**.

## Daftar Insight

| File | Topik | Kapan dibaca |
|---|---|---|
| [metode-harga-bahan-hpp.md](metode-harga-bahan-hpp.md) | Metode harga bahan (rata-rata/FIFO/terakhir) & dampak ke HPP, laba, pajak, laporan keuangan | Saat bahas harga bahan, HPP, atau keuangan Tahap 5 dengan klien |
| [istilah-vendor-penjahit-konveksi.md](istilah-vendor-penjahit-konveksi.md) | Klien pakai satu istilah "Konveksi" untuk vendor & penjahit; PRD memisah jadi dua master (asumsi, belum dikonfirmasi). Plus: pengirim/penerima = staf internal, dan kamus istilah asli klien | Sebelum menyambungkan field jahit ke master (app-gtf4), atau saat menamai field/label yang menyangkut vendor, penjahit, setoran, upah |
| [audit-kolom-teks-vs-master.md](audit-kolom-teks-vs-master.md) | Putusan 12 kolom teks: mana jadi FK, mana jadi pgEnum, mana sengaja tetap teks bebas (+ alasannya). Penghalang: master users baru 1 baris | Saat mengerjakan app-gtf4.5 atau ragu apakah sebuah kolom teks seharusnya FK |

## Cara nambah insight

1 file per topik. Format bebas tapi jaga: bahasa awam, ada "kenapa penting" + "dampak", contoh konkret. Tambahkan ke tabel di atas.
