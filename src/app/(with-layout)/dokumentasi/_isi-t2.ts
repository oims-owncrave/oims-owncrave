import type { Tutorial } from "./_data";

/**
 * Ditulis 17 Sep 2026 sambil menjalankan alurnya sendiri: PO-2026-0001 Supernova
 * 150 pcs, dipotong, dan dibundel. Angka pada gambar adalah hasil sungguhan.
 */
export const T2_PRODUKSI: Tutorial = {
  slug: "t2-produksi",
  tahap: 2,
  judul: "Produksi & Cutting",
  ringkas:
    "Dari resep produk menjadi PO Produksi, menghitung kebutuhan bahan, memotong kain, sampai bundel siap dikirim ke penjahit.",

  gambaranUmum: [
    "BOM adalah resep: berapa banyak tiap bahan untuk membuat SATU pcs jaket. Semua hitungan kebutuhan berangkat dari sini.",
    "PO Produksi menetapkan berapa yang mau diproduksi — warna apa, ukuran berapa, masing-masing berapa pcs. Sistem mengalikan BOM dengan target, lalu membandingkannya dengan stok yang ada.",
    "Rantainya berurutan dan saling mengunci: BOM → PO Produksi → estimasi bahan → permintaan bahan → Cutting → hasil cutting → bundel.",
  ],

  salahKaprah: [
    [
      "Rencana cutting sama dengan target PO",
      "Selalu lebih banyak. Target 150 pcs dengan lebihan 6 pcs menjadi 156 pcs, karena sebagian pasti cacat saat dipotong.",
    ],
    [
      "BOM boleh diubah kapan saja",
      "Begitu PO disetujui, BOM aktif dikunci ke PO itu. Mengubah resep sesudahnya tidak mengubah estimasi PO yang sudah berjalan.",
    ],
    [
      "Permintaan bahan meminta seluruh kebutuhan",
      "Hanya kekurangannya. Bilabong butuh 195 m tapi diminta 180 m, karena 15 m sudah ada di gudang.",
    ],
    [
      "Hasil cutting bisa dicatat kapan saja",
      "Tombolnya terkunci sampai cutting berstatus Sedang Dikerjakan. Urutannya Draft → Siap Dikerjakan → Sedang Dikerjakan.",
    ],
  ],

  bagian: [
    {
      judul: "A. Resep dan PO Produksi",
      pengantar: "BOM dibuat sekali per produk, lalu dipakai berulang oleh setiap PO.",
      langkah: [
        {
          judul: "Periksa resep produk di menu BOM",
          teks: "Kuantitas dihitung per satu pcs jaket. Kolom Ukuran menandai bahan yang hanya dipakai ukuran tertentu — resleting 30inch untuk L dan XL, 32inch untuk XXL dan 3XL. Bahan tanpa keterangan berlaku untuk semua ukuran.",
          gambar: "step1-bom.jpg",
        },
        {
          judul: "Buat PO Produksi, isi target tiap SKU",
          teks: "Kolom Rencana Cutting terisi sendiri dari target ditambah lebihan. Angka inilah yang dipakai cutting, bukan target aslinya.",
          gambar: "step2-target-po.jpg",
        },
        {
          judul: "Ajukan lalu setujui",
          teks: "PO baru bisa berjalan setelah disetujui, dan saat itu BOM aktif produk dikunci ke PO ini. Penguncian itu yang membuat estimasi tetap stabil walau resepnya kemudian diperbarui.",
          gambar: "step3-setujui.jpg",
        },
      ],
    },
    {
      judul: "B. Menyiapkan bahan",
      pengantar:
        "Setelah PO disetujui, sistem menghitung sendiri bahan apa saja yang perlu disiapkan.",
      langkah: [
        {
          judul: "Buka detail PO untuk melihat estimasi kebutuhan",
          teks: "Tiap bahan diberi status: Tersedia bila stok cukup, Sebagian bila kurang, Tidak Tersedia bila belum ada sama sekali. Mata itik tertulis 1.248 pcs karena resepnya 8 pcs per jaket dikali 156.",
          gambar: "step4-estimasi.jpg",
        },
        {
          judul: "Buat permintaan bahan dari PO",
          teks: "Barisnya terisi sendiri, hanya bahan yang stoknya kurang. Kolom Kebutuhan adalah total yang diperlukan, kolom Diminta adalah kekurangannya setelah dikurangi stok.",
          gambar: "step5-permintaan.jpg",
        },
      ],
    },
    {
      judul: "C. Cutting",
      pengantar:
        "Cutting adalah perintah kerja untuk memotong kain. Statusnya berjenjang supaya hasil tidak dicatat sebelum kerjanya mulai.",
      langkah: [
        {
          judul: "Buat cutting, tekan Isi dari PO",
          teks: "Varian dan jumlahnya diambil dari rencana cutting PO — 62, 42, dan 52 pcs, bukan 60, 40, 50.",
          gambar: "step6-wo-cutting.jpg",
        },
        {
          judul: "Catat pemakaian bahan yang sungguhan",
          teks: "Bahan yang bisa dipilih hanya yang ada di BOM. Isiannya harus berimbang: diterima = digunakan + sisa + limbah. Selisih yang tidak dijelaskan akan terlihat di kolom tersendiri.",
          gambar: "step7-pemakaian.jpg",
        },
        {
          judul: "Catat hasil potongan per SKU",
          teks: "Dipisah antara baik dan rusak. Kolom Kurang/Lebih membandingkan hasil dengan rencana cutting, sementara Varians vs Standar membandingkan pemakaian bahan dengan BOM.",
          gambar: "step8-hasil-cutting.jpg",
        },
      ],
    },
    {
      judul: "D. Bundel untuk penjahit",
      pengantar:
        "Potongan dikelompokkan per SKU sebelum diserahkan ke penjahit pada Tahap 3.",
      langkah: [
        {
          judul: "Buat bundel dari hasil cutting yang baik",
          teks: "Daftar varian menampilkan sisa yang belum dibundel, jadi satu potongan tidak terhitung dua kali. Hanya hasil yang baik yang bisa dibundel.",
          gambar: "step9-bundel.jpg",
        },
        {
          judul: "Bundel siap dikirim",
          teks: "Tiap bundel punya nomor sendiri dan bisa dicetak labelnya. Tujuan penjahit di sini masih teks bebas; mulai Tahap 3 penjahitnya diambil dari master vendor.",
          gambar: "step10-bundel-jadi.jpg",
        },
      ],
    },
  ],

  penting: [
    "Jangan mengubah BOM produk yang PO-nya sedang berjalan. PO yang sudah disetujui memakai salinan resep saat itu, tapi PO berikutnya akan memakai resep yang baru — dan selisihnya sulit ditelusuri kalau tidak disengaja.",
    "Pemakaian bahan dicatat apa adanya, bukan disamakan dengan hitungan BOM. Selisih terhadap standar justru informasi berharga: itu yang menunjukkan pemborosan atau resep yang perlu dikoreksi.",
  ],

  kalauBermasalah: [
    ["Tombol Catat Hasil tidak bisa ditekan", "Status cutting masih Draft atau Siap Dikerjakan. Tekan Mulai Kerjakan dulu."],
    ["PO tidak muncul saat membuat cutting", "PO belum disetujui. Hanya PO berstatus disetujui yang bisa dipotong."],
    ["Estimasi bahan kosong padahal PO sudah disetujui", "Produk belum punya BOM aktif saat PO disetujui. Aktifkan BOM lalu buat PO baru."],
    ["Varian tidak muncul saat membuat bundel", "Hasil cutting yang baik belum dicatat, atau seluruhnya sudah dibundel."],
    ["Permintaan bahan tidak bisa dibuat", "Halaman ini selalu dibuka dari PO. Buka detail PO dan buat permintaan dari sana."],
  ],

  belumTersedia: [
    "Kebutuhan kain berbeda per ukuran — BOM menyimpan satu angka rata-rata, padahal ukuran 3XL memakai kain lebih banyak dari M.",
    "Menggabungkan beberapa PO dalam satu cutting.",
    "Menghitung sisa kain menjadi stok yang bisa dipakai PO berikutnya.",
  ],
};
