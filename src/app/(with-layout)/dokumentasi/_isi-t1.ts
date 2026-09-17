import type { Tutorial } from "./_data";

/**
 * Ditulis 17 Sep 2026 sambil menjalankan alurnya sendiri di aplikasi,
 * bukan dari ingatan. Angka pada gambar adalah hasil sungguhan.
 */
export const T1_PERSEDIAAN: Tutorial = {
  slug: "t1-persediaan",
  tahap: 1,
  judul: "Persediaan Bahan",
  ringkas:
    "Mencatat bahan masuk dari supplier, mengeluarkannya untuk produksi, dan membetulkan selisih saat stok opname.",

  gambaranUmum: [
    "Stok tidak pernah diketik langsung. Angkanya berubah sendiri setiap ada barang masuk, barang keluar, atau penyesuaian yang disetujui.",
    "Tiap perubahan stok meninggalkan satu baris di Mutasi Stok, lengkap dengan nomor dokumen asalnya dan siapa yang mencatat.",
    "Harga bahan dihitung rata-rata bergerak. Beli dengan harga berbeda, sistem merata-ratakan sendiri sesuai jumlahnya.",
  ],

  salahKaprah: [
    [
      "Stok bisa diubah langsung kalau salah",
      "Tidak ada tombol untuk mengetik ulang stok. Pembetulan dilakukan lewat Penyesuaian Stok, dan perlu persetujuan owner.",
    ],
    [
      "Harga satuan di barang keluar bisa ditentukan sendiri",
      "Kolomnya abu-abu dan terisi otomatis dari harga rata-rata. Nilai barang keluar mengikuti harga beli yang sudah tercatat.",
    ],
    [
      "Memilih produk akan menghitung jumlah bahan yang dibutuhkan",
      "Yang dimuat hanya daftar bahannya. Kuantitas tetap diisi manual sesuai nota supplier, karena pembelian nyata jarang pas dengan hitungan resep.",
    ],
    [
      "Penyesuaian langsung mengubah stok",
      "Statusnya Menunggu dulu. Stok baru berubah setelah owner menekan setujui, dan sesudah itu tidak bisa dibatalkan.",
    ],
  ],

  bagian: [
    {
      judul: "A. Mencatat bahan masuk",
      pengantar:
        "Dilakukan setiap barang datang dari supplier. Satu dokumen bisa memuat banyak bahan sekaligus.",
      langkah: [
        {
          judul: "Buka Persediaan → Barang Masuk, lalu klik Barang Masuk Baru",
          teks: "Daftar ini memuat semua penerimaan yang pernah dicatat. Nomor dokumen dibuat otomatis, tidak perlu diketik.",
          gambar: "step1-daftar-barang-masuk.jpg",
        },
        {
          judul: "Pilih produk untuk memuat daftar bahannya",
          teks: "Langkah ini opsional tapi menghemat waktu. Memilih Supernova memunculkan seluruh bahan resepnya sekaligus, daripada mencari 20 bahan satu per satu. Pembelian yang tidak terkait produk tertentu boleh melewati ini.",
          gambar: "step2-pilih-produk.jpg",
        },
        {
          judul: "Baris bahan terisi, kuantitas dibiarkan kosong",
          teks: "Perhatikan satuan di tiap baris berbeda — Pcs untuk benang, m untuk kain. Satuan mengikuti bahan masing-masing, bukan judul kolom.",
          gambar: "step3-bahan-terisi.jpg",
        },
        {
          judul: "Isi kuantitas dan harga sesuai nota, hapus baris yang tidak dibeli",
          teks: "Subtotal dan total dihitung sendiri. Baris yang tidak ada di nota dihapus lewat ikon tong sampah di kanan.",
          gambar: "step4-isi-nota.jpg",
        },
        {
          judul: "Setelah disimpan, stok bertambah sendiri",
          teks: "Tidak ada yang mengetik angka ini ke tabel stok. Nilai persediaan ikut naik sebesar total pembelian.",
          gambar: "step5-stok-bertambah.jpg",
        },
      ],
    },
    {
      judul: "B. Mengeluarkan bahan untuk produksi",
      pengantar:
        "Dipakai saat bahan diambil dari gudang, misalnya untuk dipotong.",
      langkah: [
        {
          judul: "Pilih bahan — stoknya terlihat langsung di daftar",
          teks: "Angka dalam kurung menunjukkan sisa stok, jadi tidak perlu membuka halaman lain untuk mengeceknya. Harga rata-rata terisi otomatis dan tidak bisa diubah.",
          gambar: "step6-barang-keluar.jpg",
        },
        {
          judul: "Stok berkurang setelah disimpan",
          teks: "Bilabong yang tadi 25 m menjadi 15 m. Nilai persediaan turun persis sebesar nilai barang keluar.",
          gambar: "step7-stok-berkurang.jpg",
        },
      ],
    },
    {
      judul: "C. Membetulkan selisih stok opname",
      pengantar:
        "Dipakai ketika hitungan fisik di gudang berbeda dari catatan sistem.",
      langkah: [
        {
          judul: "Isi kuantitas fisik hasil hitungan",
          teks: "Selisih dihitung otomatis dari stok tercatat. Alasan wajib diisi — inilah yang nanti dibaca saat menelusuri kenapa stok pernah berubah tanpa transaksi.",
          gambar: "step8-penyesuaian.jpg",
        },
        {
          judul: "Ajukan, lalu tunggu persetujuan owner",
          teks: "Statusnya Menunggu dan stok belum berubah sama sekali. Owner melihat spanduk peringatan di halaman ini sampai penyesuaian ditangani.",
          gambar: "step9-menunggu.jpg",
        },
        {
          judul: "Semua perubahan terekam di Mutasi Stok",
          teks: "Tiga jenis mutasi terlihat di sini: Masuk, Keluar, dan Penyesuaian. Kolom Dokumen Sumber memungkinkan tiap angka dirunut kembali ke asalnya.",
          gambar: "step10-riwayat.jpg",
        },
      ],
    },
  ],

  penting: [
    "Penyesuaian yang sudah disetujui tidak dapat dibatalkan. Periksa angkanya sebelum menekan setujui — pembetulan hanya bisa dilakukan lewat penyesuaian baru.",
    "Jangan menghapus bahan dari master hanya karena stoknya habis. Bahan yang pernah dipakai transaksi masih dirujuk oleh riwayat mutasi.",
  ],

  kalauBermasalah: [
    ["Stok tidak bertambah setelah menyimpan barang masuk", "Dokumen tersimpan tapi halaman stok belum dimuat ulang. Buka ulang halaman Stok Bahan."],
    ["Bahan tidak muncul di daftar barang keluar", "Bahan berstatus nonaktif di master, atau nama yang dicari berbeda dari yang tercatat."],
    ["Penyesuaian sudah diajukan tapi stok tetap sama", "Statusnya masih Menunggu. Stok berubah setelah disetujui, bukan saat diajukan."],
    ["Harga satuan di barang keluar tertulis Rp 0", "Bahan itu belum pernah masuk lewat pembelian, jadi harga rata-ratanya masih nol."],
  ],

  belumTersedia: [
    "Mengubah dokumen barang masuk yang sudah disimpan — koreksi dilakukan lewat penyesuaian stok.",
    "Satu bahan dengan dua satuan berbeda, misalnya membeli per roll tapi memakai per meter.",
    "Pemberitahuan otomatis saat stok menyentuh batas minimum.",
  ],
};
