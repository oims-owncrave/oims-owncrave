import type { Tutorial } from "./_data";

/**
 * KERANGKA — teks ditulis dari alur sungguhan di kode, tapi GAMBAR BELUM DIPOTRET
 * dan alurnya belum pernah dijalankan utuh (Tahap 4 belum smoke test). Saat
 * memotret nanti, sekalian jalankan alurnya sampai barang jadi masuk gudang —
 * itu sekaligus melunasi hutang smoke test. Sesuaikan teks bila kenyataannya beda.
 */
export const T4_QC: Tutorial = {
  slug: "t4-qc",
  tahap: 4,
  judul: "QC, Finishing & Packing",
  ringkas:
    "Memeriksa hasil jahit, memberi grade, memperbaiki yang belum layak, lalu merapikan dan mengemasnya sampai menjadi stok barang jadi.",

  gambaranUmum: [
    "Rantainya: antrean → penerimaan QC → work order → pemeriksaan → (perbaikan bila perlu) → finishing → packing → stok barang jadi.",
    "Pemeriksaan dicatat per varian dalam bentuk jumlah, bukan per helai. Satu baris hasil QC berisi berapa yang A, B, C, perlu perbaikan, dan reject.",
    "Grade B dan C bukan barang gagal — keduanya tetap lanjut ke finishing dan tetap bisa dijual pada gradenya. Yang berhenti hanya reject.",
    "Stok barang jadi memakai aturan yang sama dengan stok bahan: angkanya tidak pernah diketik, hanya bertambah lewat catatan mutasi yang tidak bisa dihapus.",
  ],

  salahKaprah: [
    [
      "Barang yang diterima baik di Tahap 3 berarti sudah lolos QC",
      "Belum diperiksa sama sekali. Baik di Tahap 3 hanya penilaian mata saat serah terima; pemeriksaan resmi beserta gradenya baru terjadi di sini.",
    ],
    [
      "Grade B dan C otomatis masuk perbaikan",
      "Tidak. B dan C langsung lanjut ke finishing dan dijual pada gradenya. Yang masuk perbaikan hanya yang dicatat di kolom Perbaikan — itu kolom tersendiri, bukan grade.",
    ],
    [
      "Setiap barang bisa ditelusuri riwayat QC-nya satu per satu",
      "Hitungannya per varian, bukan per helai. Sistem tahu sepuluh pcs SPN-Htm-L bergrade A, tapi tidak tahu yang mana saja.",
    ],
    [
      "Hasil QC yang salah ketik bisa diperbaiki",
      "Tidak ada tombol ubah. Dokumennya dihapus lalu dibuat ulang — dan begitu diverifikasi, dihapus pun tidak bisa.",
    ],
    [
      "Semua hasil jahit masuk antrean QC",
      "Vendor yang disetel memeriksa sendiri tidak pernah muncul di antrean, karena barangnya sudah diperiksa di tempat mereka.",
    ],
  ],

  bagian: [
    {
      judul: "A. Menyiapkan standar pemeriksaan",
      pengantar:
        "Dibuat sekali per produk, lalu disalin ke tiap work order supaya hasil lama tidak berubah saat standarnya diperbarui.",
      langkah: [
        {
          judul: "Susun standar QC beserta daftar kriterianya",
          teks: "Tiap kriteria diberi tingkat keparahan — critical, major, minor, atau cosmetic. Standar wajib punya minimal satu kriteria dan menempel ke produk atau kategori.",
          gambar: "step1-standar.jpg",
        },
        {
          judul: "Aktifkan standarnya",
          teks: "Hanya satu standar aktif per produk. Standar yang sudah aktif tidak bisa diedit — perubahan dilakukan lewat Buat Versi Baru, sama seperti tarif di Tahap 3.",
          gambar: "step2-aktifkan-standar.jpg",
        },
      ],
    },
    {
      judul: "B. Memasukkan barang ke QC",
      pengantar:
        "Antrean dihitung sendiri dari hasil jahit yang sudah diterima tapi belum dikirim ke QC.",
      langkah: [
        {
          judul: "Kirim barang dari antrean ke QC",
          teks: "Yang muncul hanya sisa yang belum pernah dikirim, jadi satu helai tidak terhitung dua kali. Barang dari vendor yang memeriksa sendiri memang tidak akan tampil di sini.",
          gambar: "step3-antrean.jpg",
        },
        {
          judul: "Buat work order QC",
          teks: "Pilih metode: seluruhnya diperiksa, atau sampling dengan batas terima dan batas tolak. Versi standar QC disalin ke WO saat ini juga, supaya hasilnya tetap dinilai memakai standar yang berlaku hari itu.",
          gambar: "step4-wo-qc.jpg",
        },
        {
          judul: "Tekan Mulai Kerjakan",
          teks: "Hasil pemeriksaan tidak bisa dicatat selama WO masih draf. Urutannya Draf → Berjalan → Selesai, dan WO baru bisa ditutup setelah seluruh pcs selesai diperiksa.",
          gambar: "step5-mulai-wo.jpg",
        },
      ],
    },
    {
      judul: "C. Memeriksa dan menilai",
      pengantar:
        "Inti Tahap 4. Isian di sini yang menentukan barang mengalir ke finishing, perbaikan, atau karantina.",
      langkah: [
        {
          judul: "Isi jumlah per grade",
          teks: "Lima kolom harus berjumlah persis sebanyak yang diperiksa: A, B, C, Perbaikan, dan Reject. Kalau tidak sama, sistem menolak menyimpan dan menyebutkan selisihnya.",
          gambar: "step6-hasil-qc.jpg",
        },
        {
          judul: "Catat temuan cacat",
          teks: "Dicatat di halaman detail hasil QC: jenis cacatnya, keparahan, dan dari tahap mana asalnya — bahan, cutting, jahit, atau finishing. Inilah yang nanti menunjukkan sumber masalah yang berulang.",
          gambar: "step7-temuan-cacat.jpg",
        },
        {
          judul: "Verifikasi hasil QC",
          teks: "Hanya owner dan admin produksi yang bisa. Setelah diverifikasi dokumennya terkunci — tidak bisa diubah, tidak bisa dihapus. Periksa dulu sebelum menekannya.",
          gambar: "step8-verifikasi.jpg",
        },
      ],
    },
    {
      judul: "D. Menangani yang belum layak",
      pengantar:
        "Hanya dijalankan kalau ada pcs di kolom Perbaikan atau Reject.",
      langkah: [
        {
          judul: "Kirim ke perbaikan internal atau retur ke vendor",
          teks: "Dua jalur berbagi jatah yang sama, jadi gabungan keduanya tidak bisa melebihi jumlah di kolom Perbaikan. Retur ke vendor bisa disertai potongan yang nanti mengurangi tagihan jasa jahit di Tahap 3.",
          gambar: "step9-rework.jpg",
        },
        {
          judul: "Periksa ulang lewat Re-QC",
          teks: "Hasilnya empat pilihan: lolos, perbaikan ulang, turun grade, atau reject. Lolos dan turun grade wajib diisi grade akhirnya — tanpa itu barangnya tidak bisa masuk stok. Putaran perbaikan tidak dibatasi, hanya dihitung.",
          gambar: "step10-re-qc.jpg",
        },
        {
          judul: "Karantina yang reject dan usulkan tindakannya",
          teks: "Usulan menunggu persetujuan owner. Selama belum disetujui, stok tidak berubah sama sekali. Reject yang disetujui untuk diperbaiki jadi grade B akan masuk stok pada grade itu.",
          gambar: "step11-reject.jpg",
        },
      ],
    },
    {
      judul: "E. Finishing sampai barang jadi",
      pengantar:
        "Barang bergrade A, B, C dari pemeriksaan dan yang lolos Re-QC berkumpul di sini.",
      langkah: [
        {
          judul: "Kerjakan finishing dan catat pemakaian label",
          teks: "Ada daftar periksa dua belas langkah per baris, dari trimming sampai folding. Label dan hangtag yang dipakai mengurangi stok bahan lewat mutasi — jembatan kembali ke Tahap 1.",
          gambar: "step12-finishing.jpg",
        },
        {
          judul: "Packing: tentukan kemasan, batch, dan gudang tujuan",
          teks: "Hanya finishing berstatus selesai yang bisa dikemas. Di sinilah batch ditetapkan, karena barang baru menjadi satuan jual setelah dikemas. Status selesai mengharuskan sepuluh butir daftar periksa tercentang semua.",
          gambar: "step13-packing.jpg",
        },
        {
          judul: "Terima ke gudang barang jadi",
          teks: "Stok tersimpan per kombinasi varian, grade, gudang, dan batch. Angkanya tidak pernah diketik — hanya bertambah lewat mutasi yang tidak bisa dihapus, persis aturan stok bahan.",
          gambar: "step14-stok-jadi.jpg",
        },
      ],
    },
  ],

  penting: [
    "Jangan menekan Verifikasi sebelum angkanya diperiksa ulang. Hasil QC yang sudah diverifikasi terkunci mati — tidak bisa diubah maupun dihapus, dan satu-satunya jalan keluar adalah mencatat koreksinya di tempat lain.",
    "Reject tidak pernah boleh masuk finishing. Barang reject hanya bisa kembali ke stok lewat tindakan karantina yang disetujui owner, dan gradenya diturunkan — bukan diselundupkan sebagai grade A.",
  ],

  kalauBermasalah: [
    ["Tombol catat hasil QC tidak bisa ditekan", "Work order masih draf. Tekan Mulai Kerjakan dulu."],
    ["Hasil QC ditolak saat disimpan", "Jumlah A + B + C + Perbaikan + Reject belum sama dengan jumlah yang diperiksa."],
    ["Barang vendor tidak pernah muncul di antrean QC", "Vendor itu disetel memeriksa sendiri di tempatnya. Barangnya memang tidak melewati QC internal."],
    ["Work order tidak bisa ditutup", "Masih ada pcs yang belum diperiksa. Pesan errornya menyebutkan sisanya berapa."],
    ["Barang tidak muncul saat membuat packing", "Dokumen finishing-nya belum berstatus selesai."],
    ["Packing tidak bisa diselesaikan", "Sepuluh butir daftar periksa belum tercentang semua. Pesan errornya menyebut butir mana yang kurang."],
    ["Reject yang disetujui tidak menambah stok", "Tindakannya belum disetujui owner, atau tindakan yang dipilih memang tidak mengembalikan barang ke stok."],
  ],

  belumTersedia: [
    "Penelusuran QC per helai dengan barcode. Hitungannya per varian — sistem tahu berapa yang grade A, tidak tahu yang mana.",
    "Mengubah dokumen QC, finishing, atau packing yang sudah tersimpan. Yang ada hanya ubah status dan hapus, dan yang sudah diverifikasi tidak bisa dihapus.",
    "Batas jumlah perbaikan ulang. Putaran Re-QC dihitung tapi tidak pernah dihentikan sistem.",
    "Harga pokok produksi. Nilai per pcs pada karantina masih diketik manual, dan sebagian angka biaya mutu tampil N/A karena sumber datanya menunggu Tahap 5.",
    "Pemindaian barcode. Kolomnya ada di packing tapi diisi manual — belum ada pemindai maupun pembuat barcode.",
    "Laporan kinerja vendor dari data QC.",
  ],
};
