import type { Tutorial } from "./_data";

/**
 * KERANGKA — teks ditulis dari alur sungguhan di kode, GAMBAR BELUM DIPOTRET.
 * Master vendor/penjahit/lokasi/tarif sudah siap di DB dev (17 Sep 2026).
 * Potret sekali jalan mulai dari bundling: 91 pcs hasil cutting SPN-Htm belum
 * dibundel (M 41, XL 50), cukup untuk memotret pembuatan bundel dari nol.
 * Pakai VDR-0001 CV Jahit Cibaduyut untuk alur utama — VDR-0002 ber-qcMode
 * vendor, barangnya tidak masuk antrean QC Tahap 4.
 * Angka pada teks di bawah masih perkiraan; sesuaikan setelah pemotretan.
 */
export const T3_VENDOR: Tutorial = {
  slug: "t3-vendor",
  tahap: 3,
  gambarMenyusul: true,
  judul: "Penjahitan Vendor & WIP",
  ringkas:
    "Menugaskan bundel ke penjahit, mengirimnya dengan surat jalan, menerima hasil jahit bertahap, dan menyelesaikan barang rusak atau hilang sampai tagihan siap dibayar.",

  gambaranUmum: [
    "Rantainya: bundel siap dikirim → penugasan (SPK) → pengiriman → surat jalan → serah terima di vendor → penerimaan hasil → retur bila ada yang rusak → tagihan.",
    "Penugasan tidak pernah ditandai selesai dengan tangan. Sistem menutupnya sendiri setelah semua pcs kembali dan tidak ada retur atau kasus yang menggantung.",
    "Tarif disalin ke SPK saat penugasan dibuat. Mengubah tarif master sesudahnya tidak mengubah SPK yang sudah berjalan.",
    "Sablon dan bordir berjalan di jalur terpisah. Pekerjaannya menempel ke WO cutting, bukan ke bundel, jadi tidak ikut terhitung di WIP jahit.",
  ],

  salahKaprah: [
    [
      "Bundel yang sudah dibuat langsung bisa ditugaskan",
      "Bundel lahir berstatus draf. Selama belum ditandai Siap Dikirim, PO-nya tidak akan muncul di form penugasan — dan itu sering disangka datanya hilang.",
    ],
    [
      "Pcs rusak langsung mengurangi sisa di vendor",
      "Belum. Rusak yang dilaporkan hanya membuka kasus di Selisih. Sisa baru berkurang setelah owner memberi keputusan — dan kalau keputusannya Diperbaiki, sisanya tetap ada karena barangnya masih harus kembali.",
    ],
    [
      "Penugasan bisa ditandai selesai kalau pekerjaannya sudah beres",
      "Tidak ada tombolnya. Status selesai muncul sendiri saat semua bundel terkirim, sisa habis, dan tidak ada retur terbuka. Kalau penerimaan dihapus, statusnya balik lagi ke aktif.",
    ],
    [
      "Surat jalan dibuat sendiri lewat menu Surat Jalan",
      "Halaman itu hanya daftar. Surat jalan terbit otomatis begitu pengiriman dibuat, satu surat untuk satu pengiriman.",
    ],
    [
      "Vendor ditagih sebanyak pcs yang dikirim",
      "Ditagih sebanyak pcs yang kembali dalam keadaan baik. Yang hilang atau rusak tidak ikut ditagihkan.",
    ],
    [
      "Jumlah Baik di penerimaan berarti lolos QC",
      "Baik di sini masih penilaian mata: jahitannya utuh, tidak sobek. Pemeriksaan resmi beserta grade A/B/C baru terjadi di Tahap 4.",
    ],
  ],

  bagian: [
    {
      judul: "A. Menyiapkan data induk",
      pengantar:
        "Dikerjakan sekali di awal, lalu dipakai berulang oleh semua penugasan berikutnya.",
      langkah: [
        {
          judul: "Daftarkan vendor beserta kapabilitasnya",
          teks: "Kapabilitas menentukan pekerjaan apa yang boleh diberikan — jahit, sablon, atau bordir, dan satu vendor boleh punya lebih dari satu. Vendor tanpa kapabilitas sablon tidak akan muncul saat membuat pekerjaan sablon.",
          gambar: "step1-vendor.jpg",
        },
        {
          judul: "Daftarkan penjahit",
          teks: "Jenisnya menentukan aturan isiannya. Penjahit berjenis Anggota Vendor wajib dipilihkan vendor induknya; jenis lain justru tidak boleh diisi vendor.",
          gambar: "step2-penjahit.jpg",
        },
        {
          judul: "Tetapkan tarif jasa jahit",
          teks: "Tarif berlaku per produk, boleh dipersempit ke varian tertentu. Tarif yang sudah aktif tidak bisa diedit — perubahan harga dilakukan dengan Buat Versi Baru, dan versi lama otomatis dinonaktifkan saat versi baru diaktifkan.",
          gambar: "step3-tarif.jpg",
        },
      ],
    },
    {
      judul: "B. Menyiapkan bundel",
      pengantar:
        "Jembatan dari Tahap 2. Potongan hasil cutting dikelompokkan jadi bundel, lalu ditandai siap dikirim — tanpa penandaan itu bundel tidak akan muncul di form penugasan.",
      langkah: [
        {
          judul: "Buat bundel dari sisa hasil cutting",
          teks: "Daftar varian menampilkan sisa yang belum dibundel, jadi satu potongan tidak terhitung dua kali. Jumlahnya tidak boleh melebihi hasil cutting yang baik — sistem menghitung ulang sisanya saat menyimpan.",
          gambar: "step4-buat-bundel.jpg",
        },
        {
          judul: "Tandai bundel siap dikirim",
          teks: "Bundel lahir berstatus draf dan belum bisa ditugaskan. Tombol Tandai Siap Dikirim di baris bundel yang mengubahnya. Selama belum dikirim, statusnya masih bisa dikembalikan ke draf.",
          gambar: "step5-siap-dikirim.jpg",
        },
      ],
    },
    {
      judul: "C. Menugaskan dan mengirim",
      pengantar:
        "Bundel berstatus siap dikirim adalah bahan baku bagian ini.",
      langkah: [
        {
          judul: "Buat penugasan, pilih PO lalu pilih bundelnya",
          teks: "Yang muncul hanya bundel siap kirim yang belum terpakai di penugasan lain, jadi satu bundel tidak bisa ditugaskan dua kali. Tarif terisi sendiri dari tarif aktif dan masih boleh diubah per bundel sebelum disimpan.",
          gambar: "step6-penugasan.jpg",
        },
        {
          judul: "Buat pengiriman dari detail penugasan",
          teks: "Satu tombol menjalankan empat hal sekaligus: bundel ditandai sudah dikirim, penugasan berubah dari draf menjadi aktif, surat jalan terbit, dan nomor pengiriman dibuat.",
          gambar: "step7-pengiriman.jpg",
        },
        {
          judul: "Cetak surat jalan untuk dibawa kurir",
          teks: "Isinya daftar bundel, jumlah pcs, dan tujuan. Cetak ulang diberi tanda air supaya lembar lama tidak tertukar dengan yang baru.",
          gambar: "step8-surat-jalan.jpg",
        },
        {
          judul: "Catat serah terima setelah barang sampai",
          teks: "Dicatat lewat tombol di detail pengiriman, bukan halaman tersendiri. Status pengiriman berubah dari Dalam Perjalanan menjadi Diterima Vendor. Catatan ini tidak bisa diperbaiki setelah tersimpan, jadi periksa dulu kondisi bundelnya.",
          gambar: "step9-serah-terima.jpg",
        },
      ],
    },
    {
      judul: "D. Menerima hasil jahit",
      pengantar:
        "Penerimaan boleh dilakukan beberapa kali untuk satu penugasan — vendor jarang menyetorkan semuanya sekaligus.",
      langkah: [
        {
          judul: "Catat jumlah baik dan rusak per bundel",
          teks: "Sistem menolak jumlah yang melebihi sisa di vendor dan menyebutkan sisanya berapa. Setiap baris yang rusak otomatis membuka kasus di halaman Selisih.",
          gambar: "step10-penerimaan.jpg",
        },
        {
          judul: "Buat retur perbaikan untuk pcs yang rusak",
          teks: "Retur lahir sebagai draf, lalu ditekan Kirim ke Vendor. Kalau kerusakannya kesalahan vendor, biaya perbaikan dikosongkan karena vendor menanggung sendiri.",
          gambar: "step11-retur.jpg",
        },
        {
          judul: "Terima hasil perbaikan lewat penerimaan baru",
          teks: "Pilih retur yang bersangkutan di kolom hasil perbaikan. Retur otomatis berubah menjadi diterima kembali, dan jumlah yang bisa diterima dibatasi sebanyak yang diretur.",
          gambar: "step12-terima-perbaikan.jpg",
        },
      ],
    },
    {
      judul: "E. Menutup selisih dan menagih",
      pengantar:
        "Selama masih ada kasus yang belum diputuskan, penugasan tidak akan pernah berstatus selesai dan tagihan tidak bisa diverifikasi.",
      langkah: [
        {
          judul: "Putuskan setiap kasus di halaman Selisih",
          teks: "Kasus rusak sudah dibuat sendiri oleh sistem; kasus hilang, tertinggal, atau salah kirim ditambahkan manual. Keputusan hanya bisa diberikan owner, dan sesudah itu kasusnya langsung ditutup.",
          gambar: "step13-selisih.jpg",
        },
        {
          judul: "Periksa papan WIP",
          teks: "Tujuh label di sini dihitung sendiri dari data, bukan diisi siapa pun. Persen kemajuan berasal dari pcs yang sudah disetorkan, jadi angkanya tidak bisa dikarang vendor.",
          gambar: "step14-wip.jpg",
        },
        {
          judul: "Susun tagihan jasa jahit",
          teks: "Biaya dasar dihitung dari pcs yang kembali baik dikali tarif SPK. Tombol Terapkan Usulan mengisi potongan dari kasus yang ditanggung vendor dan biaya tambahan dari perbaikan yang ditanggung Owncrave.",
          gambar: "step15-biaya.jpg",
        },
      ],
    },
  ],

  penting: [
    "Tarif yang sudah aktif jangan diedit lewat jalan memutar. Versi baru dibuat supaya SPK lama tetap memakai harga saat penugasan dibuat — kalau harga lama ikut berubah, tagihan yang sudah diverifikasi menjadi tidak bisa ditelusuri.",
    "Jumlah Baik pada penerimaan bukan hasil QC. Pemeriksaan resmi terjadi di Tahap 4, dan barang yang di sini terhitung baik masih mungkin turun grade atau ditolak di sana.",
  ],

  kalauBermasalah: [
    ["Tagihan tidak bisa diverifikasi", "Penugasan belum selesai. Biasanya masih ada kasus di Selisih yang belum diputuskan owner, atau retur yang belum ditandai selesai."],
    ["Dropdown PO Produksi kosong di form penugasan", "Belum ada bundel berstatus siap dikirim untuk PO itu. Buka Produksi → Bundling, tekan Tandai Siap Dikirim di bundelnya."],
    ["Bundel tidak muncul saat membuat penugasan", "Bundel belum berstatus siap dikirim, atau sudah terpakai di penugasan lain."],
    ["Tombol serah terima tidak bisa ditekan", "Pengiriman sudah berstatus Diterima Vendor atau sudah dibatalkan."],
    ["Jumlah kembali ditolak padahal terlihat cukup", "Yang dibandingkan adalah sisa di vendor, bukan jumlah awal. Pcs yang sudah disetorkan sebelumnya ikut mengurangi."],
    ["Vendor tidak muncul saat membuat pekerjaan sablon", "Vendor nonaktif, atau kapabilitas sablon/bordir belum dicentang di master vendor."],
    ["Penugasan tetap aktif padahal semua sudah kembali", "Masih ada pcs hilang yang belum diputuskan, atau retur yang berhenti di diterima kembali dan belum ditandai selesai."],
  ],

  belumTersedia: [
    "Pembayaran tagihan. Alurnya berhenti di Siap Dibayar — pencatatan pembayaran menunggu modul keuangan di Tahap 5.",
    "Dokumen tagihan yang bisa dicetak. Biaya jasa hanya tampil di layar, tidak punya nomor dokumen sendiri seperti surat jalan.",
    "Unggah foto bukti. Kolom bukti pengiriman, kerusakan, dan selisih masih diisi alamat tautan, belum ada pemilih berkas.",
    "Penelusuran per pcs dengan barcode. Semua hitungan berbasis bundel, jadi tidak bisa diketahui pcs mana yang hilang.",
    "Laporan kinerja vendor dan standar durasi pengerjaan. Target selesai masih diketik manual, belum diusulkan dari lead time vendor.",
    "Memperbaiki pengiriman, penerimaan, atau serah terima yang sudah tersimpan. Yang tersedia hanya membatalkan atau menghapus.",
  ],
};
