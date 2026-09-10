import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { isNull, sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin_gudang",
  "admin_produksi",
  "keuangan",
  "viewer",
]);

export const stockMutationTypeEnum = pgEnum("stock_mutation_type", [
  "masuk",        // barang masuk dari supplier
  "keluar",       // barang keluar ke produksi
  "penyesuaian",  // adjustment dengan approval
  "retur_masuk",  // retur dari produksi ke gudang
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const bomStatusEnum = pgEnum("bom_status", ["draft", "aktif", "nonaktif"]);

export const poJenisEnum = pgEnum("po_jenis", [
  "reguler",
  "restock",
  "produk_baru",
  "sampel",
  "pre_order",
  "pesanan_khusus",
]);

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "menunggu_persetujuan",
  "disetujui",
  "menunggu_bahan",
  "bahan_disiapkan",
  "sedang_cutting",
  "cutting_selesai",
  "bundling_selesai",
  "siap_jahit",
  "selesai",
  "dibatalkan",
]);

export const pbStatusEnum = pgEnum("pb_status", ["draft", "diajukan", "disetujui", "ditolak"]);

export const kondisiTerimaEnum = pgEnum("kondisi_terima", [
  "baik",
  "kurang",
  "lebih",
  "rusak",
  "warna_tidak_sesuai",
  "spesifikasi_tidak_sesuai",
]);

export const woStatusEnum = pgEnum("wo_status", [
  "draft",
  "siap_dikerjakan",
  "sedang_dikerjakan",
  "ditunda",
  "selesai_sebagian",
  "selesai",
  "diverifikasi",
]);

export const sisaJenisEnum = pgEnum("sisa_jenis", [
  "kain_utuh",
  "potongan_besar",
  "potongan_kecil",
  "aksesoris_tidak_terpakai",
  "bahan_berlebih",
]);

export const sisaStatusEnum = pgEnum("sisa_status", [
  "disimpan_cutting",
  "menunggu_gudang",
  "diterima_gudang",
  "dialokasikan",
  "tidak_layak",
]);

export const limbahJenisEnum = pgEnum("limbah_jenis", [
  "potongan_kecil",
  "kain_cacat",
  "salah_potong",
  "bahan_rusak",
  "noda",
  "sampah_produksi",
]);

export const limbahPenangananEnum = pgEnum("limbah_penanganan", [
  "dibuang",
  "disimpan",
  "dijual",
  "sampel",
  "aksesori",
  "retur_supplier",
]);

export const bundelStatusEnum = pgEnum("bundel_status", [
  "draft",
  "siap_dikirim",
  "sudah_dikirim",
  "dibatalkan",
]);

// ─── Tahap 3 — Penjahitan & Vendor ────────────────────────────────────────────

export const vendorJenisPekerjaanEnum = pgEnum("vendor_jenis_pekerjaan", [
  "jahit_penuh",
  "jahit_sebagian",
  "obras",
  "pasang_resleting",
  "finishing",
  "packing",
  "jahit_qc",
  "jahit_sampai_jadi",
]);

export const vendorKapabilitasEnum = pgEnum("vendor_kapabilitas", [
  "jahit",
  "sablon",
  "bordir",
]);

export const qcModeEnum = pgEnum("qc_mode", ["internal", "vendor"]);

export const penjahitJenisEnum = pgEnum("penjahit_jenis", [
  "internal",
  "eksternal_individu",
  "anggota_vendor",
  "freelance",
  "sampel",
  "spesialis_perbaikan",
]);

export const lokasiJenisEnum = pgEnum("lokasi_jenis", [
  "workshop_internal",
  "rumah_penjahit",
  "vendor_eksternal",
  "gudang_transit",
  "qc_vendor",
  "finishing_vendor",
]);

export const tarifDasarEnum = pgEnum("tarif_dasar", [
  "per_pcs",
  "per_bundel",
  "per_lusin",
  "per_tahap",
  "borongan",
  "per_jam",
]);

export const tarifStatusEnum = pgEnum("tarif_status", ["draft", "aktif", "nonaktif"]);

export const penugasanStatusEnum = pgEnum("penugasan_status", [
  "draft",
  "aktif",
  "selesai",
  "dibatalkan",
]);

export const pengirimanStatusEnum = pgEnum("pengiriman_status", [
  "dikirim",
  "diterima",
  "dibatalkan",
]);

export const selisihKlasifikasiEnum = pgEnum("selisih_klasifikasi", [
  "belum_selesai",
  "tertinggal",
  "hilang",
  "rusak",
  "salah_produk",
  "salah_ukuran",
  "salah_warna",
  "kelebihan",
  "salah_hitung",
  "ditahan_perbaikan",
]);

export const selisihStatusEnum = pgEnum("selisih_status", ["dibuka", "diselidiki", "selesai"]);

export const selisihKeputusanEnum = pgEnum("selisih_keputusan", [
  "ditanggung_vendor",
  "ditanggung_owncrave",
  "ditemukan",
  "dihapusbukukan",
  "diperbaiki",
]);

export const rusakTingkatEnum = pgEnum("rusak_tingkat", [
  "ringan",
  "sedang",
  "berat",
  "tidak_dapat_diperbaiki",
]);

export const rusakPenyebabEnum = pgEnum("rusak_penyebab", [
  "cacat_bahan",
  "kesalahan_cutting",
  "kesalahan_jahit",
  "kesalahan_aksesori",
]);

export const returStatusEnum = pgEnum("retur_status", [
  "draft",
  "dikirim",
  "diterima_kembali",
  "selesai",
  "dibatalkan",
]);

export const penanggungBiayaEnum = pgEnum("penanggung_biaya", ["vendor", "owncrave"]);

export const biayaStatusEnum = pgEnum("biaya_status", [
  "estimasi",
  "menunggu_qc",
  "menunggu_verifikasi",
  "diverifikasi_produksi",
  "diverifikasi_keuangan",
  "siap_dibayar",
  "dibayar",
  "ditahan",
  "disengketakan",
]);

export const dekorasiProsesEnum = pgEnum("dekorasi_proses", ["none", "sablon", "bordir", "keduanya"]);
export const dekorasiJenisEnum = pgEnum("dekorasi_jenis", ["sablon", "bordir"]);
export const dekorasiPosisiEnum = pgEnum("dekorasi_posisi", [
  "dada_kiri",
  "dada_kanan",
  "badan_depan",
  "badan_belakang",
  "lengan_kiri",
  "lengan_kanan",
  "punggung",
  "kerah",
  "lainnya",
]);
export const dekorasiStatusEnum = pgEnum("dekorasi_status", ["draft", "dikirim", "selesai", "dibatalkan"]);

export const kondisiBundelTerimaEnum = pgEnum("kondisi_bundel_terima", [
  "lengkap",
  "bungkus_rusak",
  "panel_kurang",
  "aksesoris_kurang",
  "salah_produk",
  "salah_warna",
  "salah_ukuran",
  "ditolak",
]);

// ─── Tahap 4 — QC, Finishing, Packing ─────────────────────────────────────────

/** Tingkat kepentingan kriteria QC & keparahan cacat — dipakai standar QC + temuan cacat. */
export const qcTingkatEnum = pgEnum("qc_tingkat", ["critical", "major", "minor", "cosmetic"]);

export const cacatKategoriEnum = pgEnum("cacat_kategori", [
  "bahan",
  "cutting",
  "jahit",
  "aksesori",
  "finishing",
  "packing",
  "ukuran",
  "warna",
  "label",
  "kebersihan",
]);

/** Stage asal cacat — dasar analisa kinerja vendor tanpa tabel tambahan. */
export const cacatSumberEnum = pgEnum("cacat_sumber", [
  "supplier",
  "gudang",
  "cutting",
  "bundling",
  "penjahit_internal",
  "vendor",
  "qc",
  "finishing",
  "tidak_diketahui",
]);

export const kemasanJenisEnum = pgEnum("kemasan_jenis", [
  "polybag",
  "ziplock",
  "box",
  "dust_bag",
  "kertas",
  "stiker",
  "thank_you_card",
  "silica_gel",
]);

export const gudangJenisEnum = pgEnum("gudang_jenis", [
  "gudang_utama",
  "gudang_online",
  "toko_offline",
  "studio",
  "lokasi_sample",
  "transit",
]);

export const qcMetodeEnum = pgEnum("qc_metode", ["seratus_persen", "sampling"]);

export const woQcStatusEnum = pgEnum("wo_qc_status", [
  "draft",
  "berjalan",
  "selesai",
  "dibatalkan",
]);

export const hasilQcStatusEnum = pgEnum("hasil_qc_status", ["draft", "selesai", "diverifikasi"]);

/** Grade produk PRD §6 — dipakai hasil QC, Re-QC, finishing, stok barang jadi. */
export const qcGradeEnum = pgEnum("qc_grade", ["a", "b", "c", "reject"]);

export const reworkStatusEnum = pgEnum("rework_status", [
  "draft",
  "dikerjakan",
  "selesai",
  "dibatalkan",
]);

export const reQcHasilEnum = pgEnum("re_qc_hasil", [
  "lolos",
  "perbaikan_ulang",
  "grade_turun",
  "reject",
]);

export const karantinaStatusEnum = pgEnum("karantina_status", [
  "dikarantina",
  "ditindaklanjuti",
  "selesai",
]);

export const rejectPenyebabEnum = pgEnum("reject_penyebab", [
  "cacat_bahan_berat",
  "salah_cutting",
  "salah_ukuran_berat",
  "kerusakan_permanen",
  "noda_permanen",
  "tidak_sesuai_desain",
  "rusak_saat_finishing",
]);

export const finishingStatusEnum = pgEnum("finishing_status", [
  "draft",
  "berjalan",
  "selesai",
  "dibatalkan",
]);

export const packingStatusEnum = pgEnum("packing_status", [
  "draft",
  "berjalan",
  "selesai",
  "dibatalkan",
]);

export const transferFgStatusEnum = pgEnum("transfer_fg_status", [
  "draft",
  "dikirim",
  "diterima",
  "dibatalkan",
]);

/** Jenis mutasi barang jadi PRD §26 — ledger append-only. */
export const mutasiFgJenisEnum = pgEnum("mutasi_fg_jenis", [
  "hasil_produksi",
  "transfer",
  "penyesuaian",
  "barang_rusak",
  "sample",
  "giveaway",
  "penjualan",
  "retur_penjualan",
  "pemusnahan",
  "perubahan_grade",
]);

export const rejectTindakanEnum = pgEnum("reject_tindakan", [
  "perbaiki_jadi_grade_b",
  "jual_minor_defect",
  "sampel",
  "training",
  "bongkar_aksesori",
  "musnahkan",
  "donasi",
  "keputusan_lain",
]);

export const qcPrioritasEnum = pgEnum("qc_prioritas", [
  "normal",
  "tinggi",
  "mendesak",
  "launching",
  "pesanan_khusus",
  "produksi_terlambat",
]);

// ─── Users & Auth ─────────────────────────────────────────────────────────────

// Mirror of Supabase auth.users — diupdate via trigger/webhook
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // = auth.users.id
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Master Data ──────────────────────────────────────────────────────────────

export const kategori = pgTable(
  "kategori",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // e.g. "KTN" — unik hanya untuk baris aktif (partial index)
    nama: text("nama").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  // Soft delete + unique = partial: kode boleh dipakai ulang setelah baris dihapus
  (t) => [uniqueIndex("kategori_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))]
);

export const satuan = pgTable(
  "satuan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nama: text("nama").notNull(), // e.g. "Meter", "Kg", "Pcs" — unik hanya baris aktif
    singkatan: text("singkatan").notNull(), // e.g. "m", "kg", "pcs"
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("satuan_nama_active_unique").on(t.nama).where(isNull(t.deletedAt))]
);

export const supplier = pgTable(
  "supplier",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // unik hanya baris aktif
    nama: text("nama").notNull(),
    kontak: text("kontak"),
    alamat: text("alamat"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("supplier_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))]
);

export const warna = pgTable(
  "warna",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // e.g. "MRH" — unik hanya untuk baris aktif (partial index)
    nama: text("nama").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("warna_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))],
);

export const bahan = pgTable(
  "bahan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // kode otomatis: BH-[KODE_KATEGORI]-[NOMOR] e.g. "BH-KTN-001" — unik hanya baris aktif
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    kategoriId: uuid("kategori_id").notNull().references(() => kategori.id),
    satuanId: uuid("satuan_id").notNull().references(() => satuan.id),
    warnaId: uuid("warna_id").references(() => warna.id), // nullable — bahan lama tidak punya warna
    stokMinimum: numeric("stok_minimum", { precision: 15, scale: 3 }).notNull().default("0"),
    // Harga satuan rata-rata bergerak (weighted average) — di-update tiap barang masuk
    hargaRataRata: numeric("harga_rata_rata", { precision: 15, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("bahan_kategori_idx").on(t.kategoriId),
    uniqueIndex("bahan_kode_active_unique").on(t.kode).where(isNull(t.deletedAt)),
  ]
);

// ─── Stok (immutable — hanya diubah lewat mutasi, tidak pernah di-edit manual) ─

export const stok = pgTable("stok", {
  id: uuid("id").primaryKey().defaultRandom(),
  bahanId: uuid("bahan_id").notNull().unique().references(() => bahan.id),
  // stok aktual = hasil aggregate mutasi_stok, bukan field ini
  // cache: di-update MANUAL dalam transaksi barang masuk/keluar (BELUM ada DB trigger).
  // JANGAN hapus update manual di service — sumber kebenaran = SUM(mutasi_stok).
  kuantitas: numeric("kuantitas", { precision: 15, scale: 3 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Transaksi ────────────────────────────────────────────────────────────────

// Header barang masuk (dari supplier)
export const barangMasuk = pgTable("barang_masuk", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // BM-YYYYMM-NNNN
  supplierId: uuid("supplier_id").references(() => supplier.id),
  nomorInvoice: text("nomor_invoice"),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Detail barang masuk (per bahan)
export const barangMasukDetail = pgTable(
  "barang_masuk_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barangMasukId: uuid("barang_masuk_id").notNull().references(() => barangMasuk.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    kuantitas: numeric("kuantitas", { precision: 15, scale: 3 }).notNull(),
    hargaSatuan: numeric("harga_satuan", { precision: 15, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  },
  (t) => [index("bm_detail_masuk_idx").on(t.barangMasukId)]
);

// Header barang keluar (ke produksi)
export const barangKeluar = pgTable("barang_keluar", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // BK-YYYYMM-NNNN
  tujuan: text("tujuan"), // e.g. "Cutting PO-001"
  permintaanBahanId: uuid("permintaan_bahan_id").references(() => permintaanBahan.id), // link ke PB (Tahap 2)
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const barangKeluarDetail = pgTable(
  "barang_keluar_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barangKeluarId: uuid("barang_keluar_id").notNull().references(() => barangKeluar.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    kuantitas: numeric("kuantitas", { precision: 15, scale: 3 }).notNull(),
    hargaSatuan: numeric("harga_satuan", { precision: 15, scale: 2 }).notNull(), // snapshot harga rata-rata saat keluar
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  },
  (t) => [index("bk_detail_keluar_idx").on(t.barangKeluarId)]
);

// Penyesuaian stok (butuh approval owner)
export const penyesuaianStok = pgTable("penyesuaian_stok", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // PS-YYYYMM-NNNN
  bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
  kuantitasSebelum: numeric("kuantitas_sebelum", { precision: 15, scale: 3 }).notNull(),
  kuantitasSetelah: numeric("kuantitas_setelah", { precision: 15, scale: 3 }).notNull(),
  selisih: numeric("selisih", { precision: 15, scale: 3 }).notNull(), // setelah - sebelum
  alasan: text("alasan").notNull(),
  status: approvalStatusEnum("status").notNull().default("pending"),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Mutasi Stok (append-only ledger — JANGAN pernah UPDATE/DELETE baris ini) ─

export const mutasiStok = pgTable(
  "mutasi_stok",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    tipe: stockMutationTypeEnum("tipe").notNull(),
    kuantitas: numeric("kuantitas", { precision: 15, scale: 3 }).notNull(), // positif = masuk, negatif = keluar
    // Referensi ke transaksi sumber (salah satu non-null tergantung tipe)
    barangMasukId: uuid("barang_masuk_id").references(() => barangMasuk.id),
    barangKeluarId: uuid("barang_keluar_id").references(() => barangKeluar.id),
    penyesuaianId: uuid("penyesuaian_id").references(() => penyesuaianStok.id),
    sisaBahanId: uuid("sisa_bahan_id").references(() => sisaBahan.id), // retur sisa cutting (Tahap 2)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").notNull().references(() => users.id),
  },
  (t) => [index("mutasi_bahan_idx").on(t.bahanId), index("mutasi_created_idx").on(t.createdAt)]
);

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    aksi: text("aksi").notNull(), // e.g. "CREATE", "UPDATE", "DELETE", "APPROVE"
    tabel: text("tabel").notNull(),
    recordId: text("record_id").notNull(),
    dataBefore: text("data_before"), // JSON string
    dataAfter: text("data_after"),   // JSON string
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_tabel_idx").on(t.tabel),
    index("audit_user_idx").on(t.userId),
    index("audit_created_idx").on(t.createdAt),
  ]
);

// ─── App Settings ─────────────────────────────────────────────────────────────

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tahap 2: Produksi ────────────────────────────────────────────────

export const produk = pgTable(
  "produk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // unik hanya baris aktif (partial index)
    nama: text("nama").notNull(),
    kategori: text("kategori"),
    brand: text("brand"),
    jenis: text("jenis"),
    deskripsi: text("deskripsi"),
    fotoUrl: text("foto_url"),
    // butuh dekorasi apa (oims-eba.13) — none = tanpa sablon/bordir
    dekorasiProses: dekorasiProsesEnum("dekorasi_proses").notNull().default("none"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("produk_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))]
);

export const varianProduk = pgTable(
  "varian_produk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produkId: uuid("produk_id").notNull().references(() => produk.id),
    warnaId: uuid("warna_id").notNull().references(() => warna.id),
    ukuran: text("ukuran").notNull(),
    jenisKelamin: text("jenis_kelamin"),
    sku: text("sku").notNull(), // auto [KODE_PRODUK]-[KODE_WARNA]-[UKURAN], unik partial
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("varian_sku_active_unique").on(t.sku).where(isNull(t.deletedAt)),
    uniqueIndex("varian_kombinasi_active_unique").on(t.produkId, t.warnaId, t.ukuran).where(isNull(t.deletedAt)),
    index("varian_produk_idx").on(t.produkId),
  ]
);

export const bom = pgTable(
  "bom",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // BOM-YYYYMM-NNNN
    produkId: uuid("produk_id").notNull().references(() => produk.id),
    versi: integer("versi").notNull().default(1),
    status: bomStatusEnum("status").notNull().default("draft"),
    tanggalBerlaku: timestamp("tanggal_berlaku", { withTimezone: true }),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // hanya satu versi aktif per produk
    uniqueIndex("bom_satu_aktif_per_produk").on(t.produkId).where(sql`status = 'aktif' AND deleted_at IS NULL`),
    uniqueIndex("bom_produk_versi_unique").on(t.produkId, t.versi).where(isNull(t.deletedAt)),
  ]
);

export const bomDetail = pgTable(
  "bom_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bomId: uuid("bom_id").notNull().references(() => bom.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    kuantitas: numeric("kuantitas", { precision: 15, scale: 3 }).notNull(),
    toleransiPersen: numeric("toleransi_persen", { precision: 5, scale: 2 }).notNull().default("0"),
    berlakuUkuran: text("berlaku_ukuran"), // null = semua ukuran
    keterangan: text("keterangan"),
  },
  (t) => [index("bom_detail_bom_idx").on(t.bomId)]
);

export const poProduksi = pgTable("po_produksi", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // PO-YYYY-NNNN (reset per tahun, sesuai PRD)
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  produkId: uuid("produk_id").notNull().references(() => produk.id),
  // snapshot BOM aktif saat approve — estimasi stabil walau BOM ganti versi
  bomId: uuid("bom_id").references(() => bom.id),
  tanggalMulai: timestamp("tanggal_mulai", { withTimezone: true }),
  targetSelesai: timestamp("target_selesai", { withTimezone: true }),
  prioritas: text("prioritas").notNull().default("normal"),
  jenis: poJenisEnum("jenis").notNull().default("reguler"),
  status: poStatusEnum("status").notNull().default("draft"),
  penanggungJawab: uuid("penanggung_jawab").references(() => users.id),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const poProduksiDetail = pgTable(
  "po_produksi_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    poId: uuid("po_id").notNull().references(() => poProduksi.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahTarget: integer("jumlah_target").notNull(), // pcs produk utuh
    toleransiPersen: numeric("toleransi_persen", { precision: 5, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("po_detail_po_idx").on(t.poId)]
);

export const permintaanBahan = pgTable("permintaan_bahan", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // PB-YYYYMM-NNNN
  poId: uuid("po_id").notNull().references(() => poProduksi.id),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  tanggalDibutuhkan: timestamp("tanggal_dibutuhkan", { withTimezone: true }),
  status: pbStatusEnum("status").notNull().default("draft"),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const permintaanBahanDetail = pgTable(
  "permintaan_bahan_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    permintaanId: uuid("permintaan_id").notNull().references(() => permintaanBahan.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    kebutuhan: numeric("kebutuhan", { precision: 15, scale: 3 }).notNull(), // snapshot estimasi
    jumlahDiminta: numeric("jumlah_diminta", { precision: 15, scale: 3 }).notNull(),
    jumlahDisetujui: numeric("jumlah_disetujui", { precision: 15, scale: 3 }),
    // jumlah dikeluarkan TIDAK disimpan — derived dari barang_keluar_detail via barang_keluar.permintaan_bahan_id
  },
  (t) => [index("pb_detail_permintaan_idx").on(t.permintaanId)]
);

export const penerimaanCutting = pgTable(
  "penerimaan_cutting",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // PC-YYYYMM-NNNN
    poId: uuid("po_id").notNull().references(() => poProduksi.id),
    barangKeluarId: uuid("barang_keluar_id").notNull().references(() => barangKeluar.id),
    tanggalSerah: timestamp("tanggal_serah", { withTimezone: true }),
    tanggalTerima: timestamp("tanggal_terima", { withTimezone: true }).notNull(),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  // satu barang keluar hanya bisa diterima sekali
  (t) => [uniqueIndex("penerimaan_bk_unique").on(t.barangKeluarId).where(isNull(t.deletedAt))]
);

export const penerimaanCuttingDetail = pgTable(
  "penerimaan_cutting_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penerimaanId: uuid("penerimaan_id").notNull().references(() => penerimaanCutting.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    jumlahGudang: numeric("jumlah_gudang", { precision: 15, scale: 3 }).notNull(),
    jumlahDiterima: numeric("jumlah_diterima", { precision: 15, scale: 3 }).notNull(),
    kondisi: kondisiTerimaEnum("kondisi").notNull().default("baik"),
    catatan: text("catatan"),
    // selisih TIDAK disimpan — derived (diterima - gudang)
  },
  (t) => [index("pc_detail_penerimaan_idx").on(t.penerimaanId)]
);

export const workOrderCutting = pgTable("work_order_cutting", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // WO-CUT-YYYYMM-NNNN
  poId: uuid("po_id").notNull().references(() => poProduksi.id),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  pic: uuid("pic").references(() => users.id),
  mejaCutting: text("meja_cutting"),
  prioritas: text("prioritas").notNull().default("normal"),
  status: woStatusEnum("status").notNull().default("draft"),
  jumlahLayer: integer("jumlah_layer"),
  panjangMarker: numeric("panjang_marker", { precision: 10, scale: 2 }),
  lebarKain: numeric("lebar_kain", { precision: 10, scale: 2 }),
  nomorPola: text("nomor_pola"),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const workOrderCuttingDetail = pgTable(
  "work_order_cutting_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    targetCutting: integer("target_cutting").notNull(),
  },
  (t) => [index("wo_detail_wo_idx").on(t.woId)]
);

export const pemakaianBahan = pgTable(
  "pemakaian_bahan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    jumlahDiterima: numeric("jumlah_diterima", { precision: 15, scale: 3 }).notNull().default("0"),
    jumlahDigunakan: numeric("jumlah_digunakan", { precision: 15, scale: 3 }).notNull().default("0"),
    jumlahSisa: numeric("jumlah_sisa", { precision: 15, scale: 3 }).notNull().default("0"),
    jumlahLimbah: numeric("jumlah_limbah", { precision: 15, scale: 3 }).notNull().default("0"),
    // snapshot harga rata-rata saat pertama catat — tidak berubah saat koreksi
    hargaRataRata: numeric("harga_rata_rata", { precision: 15, scale: 2 }).notNull().default("0"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("pemakaian_wo_bahan_unique").on(t.woId, t.bahanId).where(isNull(t.deletedAt)),
    index("pemakaian_wo_idx").on(t.woId),
  ]
);

export const hasilCutting = pgTable(
  "hasil_cutting",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // CUT-YYYYMM-NNNN
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("hasil_wo_idx").on(t.woId)]
);

export const hasilCuttingDetail = pgTable(
  "hasil_cutting_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hasilId: uuid("hasil_id").notNull().references(() => hasilCutting.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahBaik: integer("jumlah_baik").notNull().default(0),
    jumlahRusak: integer("jumlah_rusak").notNull().default(0),
  },
  (t) => [index("hasil_detail_hasil_idx").on(t.hasilId)]
);

export const sisaBahan = pgTable(
  "sisa_bahan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    jumlah: numeric("jumlah", { precision: 15, scale: 3 }).notNull(),
    jenis: sisaJenisEnum("jenis").notNull(),
    status: sisaStatusEnum("status").notNull().default("disimpan_cutting"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("sisa_wo_idx").on(t.woId)]
);

export const limbahCutting = pgTable(
  "limbah_cutting",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    jumlah: numeric("jumlah", { precision: 15, scale: 3 }).notNull(),
    jenis: limbahJenisEnum("jenis").notNull(),
    penyebab: text("penyebab"),
    penanganan: limbahPenangananEnum("penanganan").notNull().default("dibuang"),
    // snapshot harga saat catat — nilai kerugian derived = jumlah x harga
    hargaRataRata: numeric("harga_rata_rata", { precision: 15, scale: 2 }).notNull().default("0"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("limbah_wo_idx").on(t.woId)]
);

export const bundling = pgTable(
  "bundling",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // BND-YYYYMM-NNNN
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahPcs: integer("jumlah_pcs").notNull(),
    tujuanPenjahit: text("tujuan_penjahit"), // text dulu — master vendor di Tahap 3
    keterangan: text("keterangan"),
    status: bundelStatusEnum("status").notNull().default("draft"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("bundling_wo_idx").on(t.woId)]
);

// ─── Tahap 3 — Master Vendor, Lokasi, Penjahit, Tarif ─────────────────────────

export const vendor = pgTable(
  "vendor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // VDR-NNNN — unik hanya baris aktif
    nama: text("nama").notNull(),
    pemilik: text("pemilik"),
    kontak: text("kontak"),
    telepon: text("telepon"),
    email: text("email"),
    alamat: text("alamat"),
    kota: text("kota"),
    kapasitasHarian: integer("kapasitas_harian"),
    jenisPekerjaan: vendorJenisPekerjaanEnum("jenis_pekerjaan").array().notNull().default([]),
    // jahit/sablon/bordir — dipakai filter vendor dekorasi (oims-eba.13)
    kapabilitas: vendorKapabilitasEnum("kapabilitas").array().notNull().default([]),
    bankNama: text("bank_nama"),
    bankNomorRekening: text("bank_nomor_rekening"),
    bankAtasNama: text("bank_atas_nama"),
    terminHari: integer("termin_hari"),
    leadTimeHari: integer("lead_time_hari"),
    // "vendor" = QC dilakukan di tempat vendor — dipakai Tahap 4 untuk skip stage kirim QC
    qcMode: qcModeEnum("qc_mode").notNull().default("internal"),
    qcOfficer: text("qc_officer"),
    catatan: text("catatan"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("vendor_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))]
);

export const lokasiProduksi = pgTable(
  "lokasi_produksi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // LOK-NNNN
    nama: text("nama").notNull(),
    jenis: lokasiJenisEnum("jenis").notNull(),
    alamat: text("alamat"),
    kota: text("kota"),
    pic: text("pic"),
    telepon: text("telepon"),
    vendorId: uuid("vendor_id").references(() => vendor.id), // nullable — lokasi milik vendor
    catatan: text("catatan"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("lokasi_kode_active_unique").on(t.kode).where(isNull(t.deletedAt)),
    index("lokasi_vendor_idx").on(t.vendorId),
  ]
);

export const penjahit = pgTable(
  "penjahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(), // JHT-INT-NNNN / JHT-EXT-NNNN — prefix ikut jenis
    nama: text("nama").notNull(),
    jenis: penjahitJenisEnum("jenis").notNull(),
    // DB CHECK: wajib terisi saat jenis="anggota_vendor", wajib kosong untuk jenis lain
    vendorId: uuid("vendor_id").references(() => vendor.id),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    telepon: text("telepon"),
    alamat: text("alamat"),
    kapasitasHarian: integer("kapasitas_harian"),
    keahlian: text("keahlian").array().notNull().default([]),
    catatan: text("catatan"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("penjahit_kode_active_unique").on(t.kode).where(isNull(t.deletedAt)),
    index("penjahit_vendor_idx").on(t.vendorId),
  ]
);

// produk yang biasa dikerjakan penjahit (M2M)
export const penjahitProduk = pgTable(
  "penjahit_produk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penjahitId: uuid("penjahit_id").notNull().references(() => penjahit.id),
    produkId: uuid("produk_id").notNull().references(() => produk.id),
  },
  (t) => [
    uniqueIndex("penjahit_produk_unique").on(t.penjahitId, t.produkId),
    index("penjahit_produk_penjahit_idx").on(t.penjahitId),
  ]
);

/**
 * Tarif jasa jahit BERVERSI — tarif lama tidak pernah ditimpa (PRD T3 §7).
 * Ubah nominal = baris versi baru (versi = MAX+1, pola BOM). Hanya SATU versi
 * aktif per kombinasi (partial unique index di DB, COALESCE untuk kolom nullable).
 * Transaksi simpan SNAPSHOT nominal, bukan FK ke baris tarif.
 */
export const tarifJasaJahit = pgTable(
  "tarif_jasa_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produkId: uuid("produk_id").notNull().references(() => produk.id),
    varianId: uuid("varian_id").references(() => varianProduk.id), // null = berlaku semua varian
    jenisPekerjaan: vendorJenisPekerjaanEnum("jenis_pekerjaan").notNull(),
    // DB CHECK: tepat satu dari vendorId/penjahitId terisi
    vendorId: uuid("vendor_id").references(() => vendor.id),
    penjahitId: uuid("penjahit_id").references(() => penjahit.id),
    dasarTarif: tarifDasarEnum("dasar_tarif").notNull().default("per_pcs"),
    nominal: numeric("nominal", { precision: 15, scale: 2 }).notNull(),
    tanggalBerlaku: timestamp("tanggal_berlaku", { withTimezone: true }).notNull(),
    versi: integer("versi").notNull().default(1),
    status: tarifStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("tarif_produk_idx").on(t.produkId),
    index("tarif_vendor_idx").on(t.vendorId),
    index("tarif_penjahit_idx").on(t.penjahitId),
  ]
);

// ─── Tahap 3B — Penugasan, Pengiriman, Serah Terima, Surat Jalan ──────────────

export const penugasanJahit = pgTable(
  "penugasan_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // ASG-JHT-YYYYMM-NNNN
    poId: uuid("po_id").notNull().references(() => poProduksi.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    // DB CHECK penugasan_pihak_tunggal: tepat satu dari vendorId/penjahitId
    vendorId: uuid("vendor_id").references(() => vendor.id),
    penjahitId: uuid("penjahit_id").references(() => penjahit.id),
    lokasiTujuanId: uuid("lokasi_tujuan_id").references(() => lokasiProduksi.id),
    jenisPekerjaan: vendorJenisPekerjaanEnum("jenis_pekerjaan").notNull(),
    rencanaKirim: timestamp("rencana_kirim", { withTimezone: true }),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }).notNull(),
    prioritas: text("prioritas").notNull().default("normal"),
    status: penugasanStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("penugasan_po_idx").on(t.poId),
    index("penugasan_vendor_idx").on(t.vendorId),
    index("penugasan_penjahit_idx").on(t.penjahitId),
  ]
);

// detail = bundel yang ditugaskan; tarif SNAPSHOT (bukan FK ke tarif aktif)
export const penugasanJahitDetail = pgTable(
  "penugasan_jahit_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penugasanId: uuid("penugasan_id").notNull().references(() => penugasanJahit.id),
    bundlingId: uuid("bundling_id").notNull().references(() => bundling.id),
    jumlahPcs: integer("jumlah_pcs").notNull(), // snapshot bundling.jumlahPcs
    tarifSnapshot: numeric("tarif_snapshot", { precision: 15, scale: 2 }).notNull(),
    dasarTarif: tarifDasarEnum("dasar_tarif").notNull().default("per_pcs"),
    // total = jumlahPcs x tarifSnapshot — derived
  },
  (t) => [
    index("penugasan_detail_penugasan_idx").on(t.penugasanId),
    index("penugasan_detail_bundling_idx").on(t.bundlingId),
  ]
);

/** Pengiriman = perpindahan fisik, tanpa draft. Bundel yang ikut → status sudah_dikirim. */
export const pengirimanJahit = pgTable(
  "pengiriman_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // SHP-JHT-YYYYMM-NNNN
    penugasanId: uuid("penugasan_id").notNull().references(() => penugasanJahit.id),
    tanggalJam: timestamp("tanggal_jam", { withTimezone: true }).notNull(),
    lokasiAsalId: uuid("lokasi_asal_id").references(() => lokasiProduksi.id),
    lokasiTujuanId: uuid("lokasi_tujuan_id").references(() => lokasiProduksi.id),
    pengirim: text("pengirim"),
    penerima: text("penerima"),
    kendaraan: text("kendaraan"),
    kurir: text("kurir"),
    buktiFotoUrl: text("bukti_foto_url"),
    status: pengirimanStatusEnum("status").notNull().default("dikirim"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    cancelledBy: uuid("cancelled_by").references(() => users.id),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    alasanBatal: text("alasan_batal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("pengiriman_penugasan_idx").on(t.penugasanId)]
);

export const pengirimanJahitDetail = pgTable(
  "pengiriman_jahit_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pengirimanId: uuid("pengiriman_id").notNull().references(() => pengirimanJahit.id),
    penugasanDetailId: uuid("penugasan_detail_id")
      .notNull()
      .references(() => penugasanJahitDetail.id),
    kelengkapanPanel: boolean("kelengkapan_panel").notNull().default(true),
    aksesoris: text("aksesoris"),
    catatan: text("catatan"),
  },
  (t) => [
    index("pengiriman_detail_pengiriman_idx").on(t.pengirimanId),
    index("pengiriman_detail_penugasan_detail_idx").on(t.penugasanDetailId),
  ]
);

/** Surat jalan 1:1 pengiriman, dibuat dalam transaksi yang sama. jumlahCetak>0 = cetak ulang. */
export const suratJalanJahit = pgTable("surat_jalan_jahit", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // SJ-JHT-YYYYMM-NNNN
  // DB CHECK surat_jalan_sumber_tunggal: tepat satu dari pengirimanId / pekerjaanDekorasiId
  pengirimanId: uuid("pengiriman_id").unique().references(() => pengirimanJahit.id),
  pekerjaanDekorasiId: uuid("pekerjaan_dekorasi_id").unique(),
  jumlahCetak: integer("jumlah_cetak").notNull().default(0),
  dicetakTerakhirAt: timestamp("dicetak_terakhir_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Serah terima bundel di vendor (PRD §12) — satu pengiriman satu serah terima. */
export const penerimaanBundelVendor = pgTable(
  "penerimaan_bundel_vendor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // STB-JHT-YYYYMM-NNNN
    pengirimanId: uuid("pengiriman_id").notNull().references(() => pengirimanJahit.id),
    tanggalJam: timestamp("tanggal_jam", { withTimezone: true }).notNull(),
    penerima: text("penerima").notNull(),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    fotoUrl: text("foto_url"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("penerimaan_bundel_pengiriman_unique")
      .on(t.pengirimanId)
      .where(isNull(t.deletedAt)),
  ]
);

export const penerimaanBundelVendorDetail = pgTable(
  "penerimaan_bundel_vendor_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penerimaanId: uuid("penerimaan_id").notNull().references(() => penerimaanBundelVendor.id),
    pengirimanDetailId: uuid("pengiriman_detail_id")
      .notNull()
      .references(() => pengirimanJahitDetail.id),
    jumlahDiterima: integer("jumlah_diterima").notNull(),
    kondisi: kondisiBundelTerimaEnum("kondisi").notNull().default("lengkap"),
    catatan: text("catatan"),
  },
  (t) => [index("penerimaan_bundel_detail_penerimaan_idx").on(t.penerimaanId)]
);

// ─── Tahap 3C — Penerimaan Hasil, Selisih, Retur ──────────────────────────────

export const returJahit = pgTable(
  "retur_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RTN-JHT-YYYYMM-NNNN
    penugasanId: uuid("penugasan_id").notNull().references(() => penugasanJahit.id),
    penerimaanAsalId: uuid("penerimaan_asal_id"), // FK ke penerimaan_hasil_jahit (dideklarasi di DB)
    tanggalRetur: timestamp("tanggal_retur", { withTimezone: true }).notNull(),
    targetKembali: timestamp("target_kembali", { withTimezone: true }),
    alasan: text("alasan").notNull(),
    status: returStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("retur_penugasan_idx").on(t.penugasanId)]
);

export const returJahitDetail = pgTable(
  "retur_jahit_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    returId: uuid("retur_id").notNull().references(() => returJahit.id),
    penugasanDetailId: uuid("penugasan_detail_id")
      .notNull()
      .references(() => penugasanJahitDetail.id),
    jumlah: integer("jumlah").notNull(),
    jenisKerusakan: text("jenis_kerusakan"),
    instruksi: text("instruksi"),
    tarifPerbaikan: numeric("tarif_perbaikan", { precision: 15, scale: 2 }).notNull().default("0"),
    penanggungBiaya: penanggungBiayaEnum("penanggung_biaya").notNull().default("vendor"),
    fotoUrl: text("foto_url"),
  },
  (t) => [
    index("retur_detail_retur_idx").on(t.returId),
    index("retur_detail_penugasan_detail_idx").on(t.penugasanDetailId),
  ]
);

/** Penerimaan hasil jahit BERTAHAP — banyak per penugasan. retur_id terisi = hasil perbaikan. */
export const penerimaanHasilJahit = pgTable(
  "penerimaan_hasil_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RCV-JHT-YYYYMM-NNNN
    penugasanId: uuid("penugasan_id").notNull().references(() => penugasanJahit.id),
    returId: uuid("retur_id").references(() => returJahit.id),
    tanggalJam: timestamp("tanggal_jam", { withTimezone: true }).notNull(),
    penerima: text("penerima").notNull(),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    // info pengiriman hasil dari sisi vendor (PRD §17) — kolom, bukan tabel terpisah
    tanggalKirimVendor: timestamp("tanggal_kirim_vendor", { withTimezone: true }),
    pengirimVendor: text("pengirim_vendor"),
    kurirResi: text("kurir_resi"),
    buktiUrl: text("bukti_url"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("penerimaan_hasil_penugasan_idx").on(t.penugasanId),
    index("penerimaan_hasil_retur_idx").on(t.returId),
  ]
);

// baik = baik VISUAL (bukan lolos QC — QC formal Tahap 4). kembali = baik + rusak.
// kurang/sisa TIDAK disimpan — derived dari penugasan_detail.jumlah_pcs (lib/jahit/rekap.ts).
export const penerimaanHasilJahitDetail = pgTable(
  "penerimaan_hasil_jahit_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penerimaanId: uuid("penerimaan_id").notNull().references(() => penerimaanHasilJahit.id),
    penugasanDetailId: uuid("penugasan_detail_id")
      .notNull()
      .references(() => penugasanJahitDetail.id),
    jumlahBaik: integer("jumlah_baik").notNull().default(0),
    jumlahRusak: integer("jumlah_rusak").notNull().default(0),
    catatan: text("catatan"),
  },
  (t) => [
    index("penerimaan_hasil_detail_penerimaan_idx").on(t.penerimaanId),
    index("penerimaan_hasil_detail_penugasan_detail_idx").on(t.penugasanDetailId),
  ]
);

/**
 * Selisih + barang hilang + barang rusak dalam SATU tabel (klasifikasi pembeda).
 * keputusan = approval owner; hilang/rusak yang PUNYA keputusan final mengurangi sisa WIP
 * (pola penyesuaian_stok: approved dulu baru berdampak).
 */
export const selisihJahit = pgTable(
  "selisih_jahit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorKasus: text("nomor_kasus").notNull().unique(), // SLS-JHT-YYYYMM-NNNN
    penugasanDetailId: uuid("penugasan_detail_id")
      .notNull()
      .references(() => penugasanJahitDetail.id),
    penerimaanId: uuid("penerimaan_id").references(() => penerimaanHasilJahit.id),
    klasifikasi: selisihKlasifikasiEnum("klasifikasi").notNull(),
    jumlah: integer("jumlah").notNull(),
    nilaiPerPcs: numeric("nilai_per_pcs", { precision: 15, scale: 2 }).notNull().default("0"),
    kronologi: text("kronologi"),
    penanggungJawab: text("penanggung_jawab"),
    buktiUrl: text("bukti_url"),
    status: selisihStatusEnum("status").notNull().default("dibuka"),
    keputusan: selisihKeputusanEnum("keputusan"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    tingkatRusak: rusakTingkatEnum("tingkat_rusak"),
    penyebabRusak: rusakPenyebabEnum("penyebab_rusak"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("selisih_penugasan_detail_idx").on(t.penugasanDetailId),
    index("selisih_penerimaan_idx").on(t.penerimaanId),
    index("selisih_klasifikasi_idx").on(t.klasifikasi),
  ]
);

// ─── Tahap 3D — Biaya Jasa, Dekorasi ──────────────────────────────────────────

/** Satu baris per penugasan, dibuat saat pertama disentuh. jumlah_diakui & biaya_dasar DERIVED. */
export const biayaJasaJahit = pgTable("biaya_jasa_jahit", {
  id: uuid("id").primaryKey().defaultRandom(),
  penugasanId: uuid("penugasan_id").notNull().unique().references(() => penugasanJahit.id),
  bonus: numeric("bonus", { precision: 15, scale: 2 }).notNull().default("0"),
  biayaTambahan: numeric("biaya_tambahan", { precision: 15, scale: 2 }).notNull().default("0"),
  potongan: numeric("potongan", { precision: 15, scale: 2 }).notNull().default("0"),
  uangMuka: numeric("uang_muka", { precision: 15, scale: 2 }).notNull().default("0"),
  status: biayaStatusEnum("status").notNull().default("estimasi"),
  catatan: text("catatan"),
  verifiedProduksiBy: uuid("verified_produksi_by").references(() => users.id),
  verifiedProduksiAt: timestamp("verified_produksi_at", { withTimezone: true }),
  verifiedKeuanganBy: uuid("verified_keuangan_by").references(() => users.id),
  verifiedKeuanganAt: timestamp("verified_keuangan_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dekorasiTemplate = pgTable(
  "dekorasi_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produkId: uuid("produk_id").notNull().references(() => produk.id),
    jenis: dekorasiJenisEnum("jenis").notNull(),
    posisi: dekorasiPosisiEnum("posisi").notNull(),
    deskripsi: text("deskripsi"),
    tarifDefault: numeric("tarif_default", { precision: 15, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("dekorasi_template_produk_idx").on(t.produkId)]
);

/** Pekerjaan per template per WO cutting — PARALEL dengan bundling, urutan tidak di-enforce. */
export const pekerjaanDekorasi = pgTable(
  "pekerjaan_dekorasi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // DEK-YYYYMM-NNNN
    woId: uuid("wo_id").notNull().references(() => workOrderCutting.id),
    templateId: uuid("template_id").notNull().references(() => dekorasiTemplate.id),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id), // kapabilitas sablon/bordir
    lokasiTujuanId: uuid("lokasi_tujuan_id").references(() => lokasiProduksi.id),
    jumlah: integer("jumlah").notNull(),
    tarifSnapshot: numeric("tarif_snapshot", { precision: 15, scale: 2 }).notNull(),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    tanggalKirim: timestamp("tanggal_kirim", { withTimezone: true }),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }),
    pengirim: text("pengirim"),
    kurir: text("kurir"),
    status: dekorasiStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("pekerjaan_dekorasi_wo_idx").on(t.woId), index("pekerjaan_dekorasi_vendor_idx").on(t.vendorId)]
);

// bertahap; selesai sebagian DERIVED = Σ jumlahSelesai vs pekerjaan.jumlah
export const penerimaanDekorasi = pgTable(
  "penerimaan_dekorasi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RCD-DEK-YYYYMM-NNNN
    pekerjaanId: uuid("pekerjaan_id").notNull().references(() => pekerjaanDekorasi.id),
    tanggalJam: timestamp("tanggal_jam", { withTimezone: true }).notNull(),
    penerima: text("penerima").notNull(),
    jumlahSelesai: integer("jumlah_selesai").notNull().default(0),
    jumlahRusak: integer("jumlah_rusak").notNull().default(0),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("penerimaan_dekorasi_pekerjaan_idx").on(t.pekerjaanId)]
);

// ─── Tahap 4A — Master QC, Kemasan, Gudang Barang Jadi ────────────────────────

export const jenisCacat = pgTable(
  "jenis_cacat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    kategori: cacatKategoriEnum("kategori").notNull(),
    keparahan: qcTingkatEnum("keparahan").notNull(),
    sumber: cacatSumberEnum("sumber").notNull().default("tidak_diketahui"),
    dapatDiperbaiki: boolean("dapat_diperbaiki").notNull().default(true),
    tindakanDefault: text("tindakan_default"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("jenis_cacat_kode_active_unique").on(t.kode).where(isNull(t.deletedAt)),
    index("jenis_cacat_kategori_idx").on(t.kategori),
  ]
);

// bahanKemasan = teks deskriptif (mis. "PE 0.05mm"), BUKAN FK — kemasan bukan bahan produksi.
export const kemasan = pgTable(
  "kemasan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    jenis: kemasanJenisEnum("jenis").notNull(),
    ukuran: text("ukuran"),
    bahanKemasan: text("bahan_kemasan"),
    supplierId: uuid("supplier_id").references(() => supplier.id),
    biaya: numeric("biaya", { precision: 15, scale: 2 }).notNull().default("0"),
    stokMinimum: numeric("stok_minimum", { precision: 15, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("kemasan_kode_active_unique").on(t.kode).where(isNull(t.deletedAt)),
    index("kemasan_supplier_idx").on(t.supplierId),
  ]
);

/**
 * Gudang penyimpanan barang jadi — DIMENSI kunci stok barang jadi
 * (varian, grade, gudang, batch). Beda dari lokasi_produksi (tempat KERJA vendor).
 * Rak = kolom teks di barang_jadi_detail, sengaja bukan tabel.
 */
export const gudangBarangJadi = pgTable(
  "gudang_barang_jadi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    jenis: gudangJenisEnum("jenis").notNull().default("gudang_utama"),
    alamat: text("alamat"),
    picNama: text("pic_nama"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("gudang_bj_kode_active_unique").on(t.kode).where(isNull(t.deletedAt))]
);

// ─── Tahap 4A — Penerimaan ke QC (titik sambung Tahap 3 → 4) ──────────────────

/**
 * Hulu = penerimaan_hasil_jahit_detail.jumlah_baik (baik VISUAL, bukan lolos QC).
 * Antrean QC TIDAK disimpan — derived: jumlah_baik − Σ jumlah_pcs yang sudah ke QC
 * (pola referensi §4, lihat src/lib/qc/rekap.ts).
 */
export const penerimaanQc = pgTable(
  "penerimaan_qc",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // IN-QC-YYYYMM-NNNN
    penerimaanHasilJahitId: uuid("penerimaan_hasil_jahit_id")
      .notNull()
      .references(() => penerimaanHasilJahit.id),
    poId: uuid("po_id").references(() => poProduksi.id),
    vendorId: uuid("vendor_id").references(() => vendor.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    penerima: text("penerima").notNull(),
    prioritas: qcPrioritasEnum("prioritas").notNull().default("normal"),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("penerimaan_qc_hasil_jahit_idx").on(t.penerimaanHasilJahitId),
    index("penerimaan_qc_po_idx").on(t.poId),
  ]
);

export const penerimaanQcDetail = pgTable(
  "penerimaan_qc_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penerimaanQcId: uuid("penerimaan_qc_id").notNull().references(() => penerimaanQc.id),
    // jejak balik ke bundel+varian Tahap 3 — kunci aritmetika sisa antrean
    penerimaanHasilDetailId: uuid("penerimaan_hasil_detail_id")
      .notNull()
      .references(() => penerimaanHasilJahitDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahPcs: integer("jumlah_pcs").notNull(),
    catatan: text("catatan"),
  },
  (t) => [
    index("penerimaan_qc_detail_header_idx").on(t.penerimaanQcId),
    index("penerimaan_qc_detail_hasil_idx").on(t.penerimaanHasilDetailId),
  ]
);

// ─── Tahap 4B — Standar QC, Work Order QC, Hasil QC, Temuan Cacat ─────────────

/**
 * Standar pemeriksaan BERVERSI (pola tarif_jasa_jahit oims-eba.4).
 * Tepat satu aktif per (produk, kategori) — dijaga partial unique index DB
 * standar_qc_aktif_unique, bukan hanya kode.
 */
export const standarQc = pgTable(
  "standar_qc",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // STD-QC-YYYYMM-NNNN
    nama: text("nama").notNull(),
    produkId: uuid("produk_id").references(() => produk.id), // null = semua produk kategori
    kategoriId: uuid("kategori_id").references(() => kategori.id),
    versi: integer("versi").notNull().default(1),
    tanggalBerlaku: timestamp("tanggal_berlaku", { withTimezone: true }).notNull(),
    status: tarifStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("standar_qc_produk_idx").on(t.produkId),
    index("standar_qc_kategori_idx").on(t.kategoriId),
  ]
);

export const standarQcDetail = pgTable(
  "standar_qc_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    standarQcId: uuid("standar_qc_id").notNull().references(() => standarQc.id),
    tahap: text("tahap").notNull(),
    bagianProduk: text("bagian_produk"),
    kriteria: text("kriteria").notNull(),
    metode: text("metode"),
    tingkatKepentingan: qcTingkatEnum("tingkat_kepentingan").notNull().default("minor"),
    toleransi: text("toleransi"),
    jenisCacatId: uuid("jenis_cacat_id").references(() => jenisCacat.id),
    tindakanJikaGagal: text("tindakan_jika_gagal"),
    wajibFoto: boolean("wajib_foto").notNull().default(false),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => [index("standar_qc_detail_header_idx").on(t.standarQcId)]
);

/** standarQcId + standarVersi = SNAPSHOT; hasil QC lama tetap terbaca dengan versi saat itu. */
export const workOrderQc = pgTable(
  "work_order_qc",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // WO-QC-YYYYMM-NNNN
    poId: uuid("po_id").references(() => poProduksi.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }),
    picId: uuid("pic_id").references(() => users.id),
    supervisorId: uuid("supervisor_id").references(() => users.id),
    metode: qcMetodeEnum("metode").notNull().default("seratus_persen"),
    standarQcId: uuid("standar_qc_id").references(() => standarQc.id),
    standarVersi: integer("standar_versi"),
    populasi: integer("populasi"),
    jumlahSampel: integer("jumlah_sampel"),
    batasDiterima: integer("batas_diterima"),
    batasDitolak: integer("batas_ditolak"),
    alasanSampling: text("alasan_sampling"),
    status: woQcStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("wo_qc_po_idx").on(t.poId), index("wo_qc_standar_idx").on(t.standarQcId)]
);

export const workOrderQcDetail = pgTable(
  "work_order_qc_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderQcId: uuid("work_order_qc_id").notNull().references(() => workOrderQc.id),
    penerimaanQcDetailId: uuid("penerimaan_qc_detail_id")
      .notNull()
      .references(() => penerimaanQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahPcs: integer("jumlah_pcs").notNull(),
  },
  (t) => [
    index("wo_qc_detail_header_idx").on(t.workOrderQcId),
    index("wo_qc_detail_sumber_idx").on(t.penerimaanQcDetailId),
  ]
);

export const hasilQc = pgTable(
  "hasil_qc",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // QC-YYYYMM-NNNN
    workOrderQcId: uuid("work_order_qc_id").notNull().references(() => workOrderQc.id),
    poId: uuid("po_id").references(() => poProduksi.id),
    vendorId: uuid("vendor_id").references(() => vendor.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    petugasId: uuid("petugas_id").references(() => users.id),
    status: hasilQcStatusEnum("status").notNull().default("draft"),
    verifikatorId: uuid("verifikator_id").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("hasil_qc_wo_idx").on(t.workOrderQcId), index("hasil_qc_po_idx").on(t.poId)]
);

/**
 * Agregat per varian (keputusan cakupan 2026-09-10), BUKAN per pcs.
 * DB CHECK hasil_qc_detail_seimbang: diperiksa = A+B+C+perbaikan+reject —
 * ini sumber angka yield/COPQ, kalau bocor seluruh laporan T4 salah.
 * defectRate & belum-diperiksa DERIVED di query, bukan kolom.
 */
export const hasilQcDetail = pgTable(
  "hasil_qc_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hasilQcId: uuid("hasil_qc_id").notNull().references(() => hasilQc.id),
    workOrderQcDetailId: uuid("work_order_qc_detail_id")
      .notNull()
      .references(() => workOrderQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlahDiperiksa: integer("jumlah_diperiksa").notNull(),
    gradeA: integer("grade_a").notNull().default(0),
    gradeB: integer("grade_b").notNull().default(0),
    gradeC: integer("grade_c").notNull().default(0),
    perbaikan: integer("perbaikan").notNull().default(0),
    reject: integer("reject").notNull().default(0),
    catatan: text("catatan"),
  },
  (t) => [
    index("hasil_qc_detail_header_idx").on(t.hasilQcId),
    index("hasil_qc_detail_wo_detail_idx").on(t.workOrderQcDetailId),
  ]
);

/** keparahan di-SNAPSHOT (bukan join live) — master bisa berubah klasifikasi. */
export const temuanCacat = pgTable(
  "temuan_cacat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hasilQcDetailId: uuid("hasil_qc_detail_id").notNull().references(() => hasilQcDetail.id),
    jenisCacatId: uuid("jenis_cacat_id").notNull().references(() => jenisCacat.id),
    bagianProduk: text("bagian_produk"),
    keparahan: qcTingkatEnum("keparahan").notNull(),
    sumber: cacatSumberEnum("sumber").notNull().default("tidak_diketahui"),
    jumlah: integer("jumlah").notNull(),
    penyebabAwal: text("penyebab_awal"),
    penanggungJawab: text("penanggung_jawab"),
    fotoUrl: text("foto_url"),
    tindakan: text("tindakan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("temuan_cacat_hasil_detail_idx").on(t.hasilQcDetailId),
    index("temuan_cacat_jenis_idx").on(t.jenisCacatId),
    index("temuan_cacat_sumber_idx").on(t.sumber),
  ]
);

// ─── Tahap 4C — Rework, Re-QC, Karantina Reject ───────────────────────────────

/** Sumber: hasil_qc_detail.perbaikan. Σ (internal + retur vendor) tak boleh melebihinya. */
export const perbaikanInternal = pgTable(
  "perbaikan_internal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RWK-INT-YYYYMM-NNNN
    hasilQcId: uuid("hasil_qc_id").notNull().references(() => hasilQc.id),
    poId: uuid("po_id").references(() => poProduksi.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    picId: uuid("pic_id").references(() => users.id),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }),
    estimasiBiaya: numeric("estimasi_biaya", { precision: 15, scale: 2 }).notNull().default("0"),
    status: reworkStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("rwk_int_hasil_qc_idx").on(t.hasilQcId)]
);

export const perbaikanInternalDetail = pgTable(
  "perbaikan_internal_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    perbaikanInternalId: uuid("perbaikan_internal_id")
      .notNull()
      .references(() => perbaikanInternal.id),
    hasilQcDetailId: uuid("hasil_qc_detail_id").notNull().references(() => hasilQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlah: integer("jumlah").notNull(),
    jenisCacatId: uuid("jenis_cacat_id").references(() => jenisCacat.id),
    instruksi: text("instruksi"),
  },
  (t) => [
    index("rwk_int_detail_header_idx").on(t.perbaikanInternalId),
    index("rwk_int_detail_hasil_idx").on(t.hasilQcDetailId),
  ]
);

/** potongan = potongan biaya jasa ke vendor, menyambung ke biaya_jasa_jahit (T3). */
export const returQcVendor = pgTable(
  "retur_qc_vendor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RTN-QC-YYYYMM-NNNN
    hasilQcId: uuid("hasil_qc_id").notNull().references(() => hasilQc.id),
    penugasanJahitId: uuid("penugasan_jahit_id").references(() => penugasanJahit.id),
    vendorId: uuid("vendor_id").references(() => vendor.id),
    tanggalKirim: timestamp("tanggal_kirim", { withTimezone: true }).notNull(),
    targetKembali: timestamp("target_kembali", { withTimezone: true }),
    penanggungBiaya: penanggungBiayaEnum("penanggung_biaya").notNull().default("vendor"),
    status: returStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("rtn_qc_hasil_idx").on(t.hasilQcId), index("rtn_qc_vendor_idx").on(t.vendorId)]
);

export const returQcVendorDetail = pgTable(
  "retur_qc_vendor_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    returQcVendorId: uuid("retur_qc_vendor_id").notNull().references(() => returQcVendor.id),
    hasilQcDetailId: uuid("hasil_qc_detail_id").notNull().references(() => hasilQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlah: integer("jumlah").notNull(),
    jenisCacatId: uuid("jenis_cacat_id").references(() => jenisCacat.id),
    instruksi: text("instruksi"),
    fotoUrl: text("foto_url"),
    potongan: numeric("potongan", { precision: 15, scale: 2 }).notNull().default("0"),
  },
  (t) => [
    index("rtn_qc_detail_header_idx").on(t.returQcVendorId),
    index("rtn_qc_detail_hasil_idx").on(t.hasilQcDetailId),
  ]
);

/**
 * Penutup loop rework. Satu tabel melayani dua sumber (internal / vendor) lewat
 * FK nullable + DB CHECK re_qc_sumber_ada. putaran = penanda barang sudah
 * diperbaiki berulang (tidak dibatasi keras, hanya sinyal ke operator).
 */
export const reQc = pgTable(
  "re_qc",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RE-QC-YYYYMM-NNNN
    hasilQcAwalId: uuid("hasil_qc_awal_id").notNull().references(() => hasilQc.id),
    perbaikanInternalId: uuid("perbaikan_internal_id").references(() => perbaikanInternal.id),
    returQcVendorId: uuid("retur_qc_vendor_id").references(() => returQcVendor.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    petugasId: uuid("petugas_id").references(() => users.id),
    putaran: integer("putaran").notNull().default(1),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("re_qc_hasil_awal_idx").on(t.hasilQcAwalId),
    index("re_qc_rwk_idx").on(t.perbaikanInternalId),
    index("re_qc_rtn_idx").on(t.returQcVendorId),
  ]
);

export const reQcDetail = pgTable(
  "re_qc_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reQcId: uuid("re_qc_id").notNull().references(() => reQc.id),
    hasilQcDetailId: uuid("hasil_qc_detail_id").notNull().references(() => hasilQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlah: integer("jumlah").notNull(),
    cacatSebelumnyaId: uuid("cacat_sebelumnya_id").references(() => jenisCacat.id),
    hasilPerbaikan: text("hasil_perbaikan"),
    hasilReQc: reQcHasilEnum("hasil_re_qc").notNull(),
    gradeAkhir: qcGradeEnum("grade_akhir"),
    catatan: text("catatan"),
  },
  (t) => [
    index("re_qc_detail_header_idx").on(t.reQcId),
    index("re_qc_detail_hasil_idx").on(t.hasilQcDetailId),
  ]
);

/** Sumber: hasil_qc_detail.reject + re_qc hasil 'reject'. Barang reject tak boleh menguap. */
export const karantinaReject = pgTable(
  "karantina_reject",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // RJT-YYYYMM-NNNN
    hasilQcId: uuid("hasil_qc_id").references(() => hasilQc.id),
    reQcId: uuid("re_qc_id").references(() => reQc.id),
    poId: uuid("po_id").references(() => poProduksi.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    lokasiSimpan: text("lokasi_simpan"),
    picId: uuid("pic_id").references(() => users.id),
    status: karantinaStatusEnum("status").notNull().default("dikarantina"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("karantina_hasil_qc_idx").on(t.hasilQcId),
    index("karantina_re_qc_idx").on(t.reQcId),
  ]
);

export const karantinaRejectDetail = pgTable(
  "karantina_reject_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    karantinaRejectId: uuid("karantina_reject_id").notNull().references(() => karantinaReject.id),
    hasilQcDetailId: uuid("hasil_qc_detail_id").references(() => hasilQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    jumlah: integer("jumlah").notNull(),
    penyebab: rejectPenyebabEnum("penyebab").notNull(),
    jenisCacatId: uuid("jenis_cacat_id").references(() => jenisCacat.id),
    // snapshot nilai untuk COPQ — Tahap 5 (HPP) di-skip, jadi diisi manual
    nilaiPerPcs: numeric("nilai_per_pcs", { precision: 15, scale: 2 }).notNull().default("0"),
    fotoUrl: text("foto_url"),
  },
  (t) => [
    index("karantina_detail_header_idx").on(t.karantinaRejectId),
    index("karantina_detail_hasil_idx").on(t.hasilQcDetailId),
  ]
);

/** Tindakan berdampak HANYA setelah approved (pola penyesuaian_stok Tahap 1). */
export const tindakanReject = pgTable(
  "tindakan_reject",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    karantinaRejectDetailId: uuid("karantina_reject_detail_id")
      .notNull()
      .references(() => karantinaRejectDetail.id),
    tindakan: rejectTindakanEnum("tindakan").notNull(),
    jumlah: integer("jumlah").notNull(),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    status: approvalStatusEnum("status").notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    catatan: text("catatan"),
    buktiUrl: text("bukti_url"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("tindakan_reject_detail_idx").on(t.karantinaRejectDetailId),
    index("tindakan_reject_status_idx").on(t.status),
  ]
);

// ─── Tahap 4D — Finishing, Packing, Barang Jadi, Stok & Mutasi ────────────────

export const finishing = pgTable(
  "finishing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // FIN-YYYYMM-NNNN
    poId: uuid("po_id").references(() => poProduksi.id),
    tanggalMasuk: timestamp("tanggal_masuk", { withTimezone: true }).notNull(),
    targetSelesai: timestamp("target_selesai", { withTimezone: true }),
    picId: uuid("pic_id").references(() => users.id),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    status: finishingStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("finishing_po_idx").on(t.poId)]
);

/** proses = jsonb checklist 12 titik PRD §20, BUKAN tabel per pcs. */
export const finishingDetail = pgTable(
  "finishing_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    finishingId: uuid("finishing_id").notNull().references(() => finishing.id),
    hasilQcDetailId: uuid("hasil_qc_detail_id").references(() => hasilQcDetail.id),
    reQcDetailId: uuid("re_qc_detail_id").references(() => reQcDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull().default("a"),
    jumlah: integer("jumlah").notNull(),
    proses: jsonb("proses").notNull().default({}),
    catatan: text("catatan"),
  },
  (t) => [
    index("finishing_detail_header_idx").on(t.finishingId),
    index("finishing_detail_hasil_idx").on(t.hasilQcDetailId),
    index("finishing_detail_reqc_idx").on(t.reQcDetailId),
  ]
);

/** Label/hangtag yang terdaftar sebagai bahan — pemakaiannya kurangi stok via mutasi_stok. */
export const finishingPemakaian = pgTable(
  "finishing_pemakaian",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    finishingId: uuid("finishing_id").notNull().references(() => finishing.id),
    bahanId: uuid("bahan_id").notNull().references(() => bahan.id),
    jumlah: numeric("jumlah", { precision: 15, scale: 3 }).notNull(),
    hargaSatuan: numeric("harga_satuan", { precision: 15, scale: 2 }).notNull().default("0"),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("finishing_pemakaian_header_idx").on(t.finishingId),
    index("finishing_pemakaian_bahan_idx").on(t.bahanId),
  ]
);

export const packing = pgTable(
  "packing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // PKG-YYYYMM-NNNN
    poId: uuid("po_id").references(() => poProduksi.id),
    finishingId: uuid("finishing_id").references(() => finishing.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    picId: uuid("pic_id").references(() => users.id),
    lokasiId: uuid("lokasi_id").references(() => lokasiProduksi.id),
    // 10 titik checklist PRD §23 — di-guard saat transisi ke 'selesai'
    checklist: jsonb("checklist").notNull().default({}),
    status: packingStatusEnum("status").notNull().default("draft"),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("packing_finishing_idx").on(t.finishingId)]
);

export const packingDetail = pgTable(
  "packing_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packingId: uuid("packing_id").notNull().references(() => packing.id),
    finishingDetailId: uuid("finishing_detail_id").notNull().references(() => finishingDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull().default("a"),
    jumlah: integer("jumlah").notNull(),
    kemasanId: uuid("kemasan_id").references(() => kemasan.id),
    // batch ditentukan di packing — di sinilah barang jadi unit jual
    batch: text("batch"),
    gudangTujuanId: uuid("gudang_tujuan_id").references(() => gudangBarangJadi.id),
    barcode: text("barcode"),
  },
  (t) => [
    index("packing_detail_header_idx").on(t.packingId),
    index("packing_detail_finishing_idx").on(t.finishingDetailId),
  ]
);

export const barangJadi = pgTable(
  "barang_jadi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // FG-YYYYMM-NNNN
    poId: uuid("po_id").references(() => poProduksi.id),
    packingId: uuid("packing_id").references(() => packing.id),
    tanggalMasuk: timestamp("tanggal_masuk", { withTimezone: true }).notNull(),
    gudangTujuanId: uuid("gudang_tujuan_id").notNull().references(() => gudangBarangJadi.id),
    penyerah: text("penyerah"),
    penerimaId: uuid("penerima_id").references(() => users.id),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("barang_jadi_packing_idx").on(t.packingId),
    index("barang_jadi_gudang_idx").on(t.gudangTujuanId),
  ]
);

export const barangJadiDetail = pgTable(
  "barang_jadi_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barangJadiId: uuid("barang_jadi_id").notNull().references(() => barangJadi.id),
    packingDetailId: uuid("packing_detail_id").references(() => packingDetail.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull().default("a"),
    jumlah: integer("jumlah").notNull(),
    // nullable — Tahap 5 (HPP) di-skip, fitur tak boleh tersandera
    hppSementara: numeric("hpp_sementara", { precision: 15, scale: 2 }),
    batch: text("batch"),
    rak: text("rak"),
    barcode: text("barcode"),
  },
  (t) => [index("barang_jadi_detail_header_idx").on(t.barangJadiId)]
);

/**
 * kuantitas = CACHE dari mutasi, di-maintain DALAM Server Action transaction
 * (proyek ini TIDAK pakai DB trigger — pola src/services/barang-masuk.ts).
 * stokSiapJual DERIVED = kuantitas − ditahan − rusak − reservasi, bukan kolom.
 */
export const stokBarangJadi = pgTable(
  "stok_barang_jadi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull(),
    gudangId: uuid("gudang_id").notNull().references(() => gudangBarangJadi.id),
    batch: text("batch").notNull().default(""),
    kuantitas: integer("kuantitas").notNull().default(0),
    stokDitahan: integer("stok_ditahan").notNull().default(0),
    stokRusak: integer("stok_rusak").notNull().default(0),
    stokReservasi: integer("stok_reservasi").notNull().default(0),
    hppRataRata: numeric("hpp_rata_rata", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("stok_fg_kunci_unique").on(t.varianId, t.grade, t.gudangId, t.batch),
    index("stok_fg_gudang_idx").on(t.gudangId),
  ]
);

/** APPEND-ONLY. TIDAK ADA UPDATE/DELETE — aturan proyek kelas satu. */
export const mutasiBarangJadi = pgTable(
  "mutasi_barang_jadi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stokBarangJadiId: uuid("stok_barang_jadi_id").notNull().references(() => stokBarangJadi.id),
    jenis: mutasiFgJenisEnum("jenis").notNull(),
    jumlah: integer("jumlah").notNull(), // + masuk, − keluar
    referensiTipe: text("referensi_tipe"),
    referensiId: uuid("referensi_id"),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull().defaultNow(),
    catatan: text("catatan"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("mutasi_fg_stok_idx").on(t.stokBarangJadiId),
    index("mutasi_fg_jenis_idx").on(t.jenis),
    index("mutasi_fg_referensi_idx").on(t.referensiTipe, t.referensiId),
  ]
);

/** Transfer 2-fase: dikirim mengurangi asal, diterima menambah tujuan. */
export const transferBarangJadi = pgTable("transfer_barang_jadi", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(), // TRF-FG-YYYYMM-NNNN
  gudangAsalId: uuid("gudang_asal_id").notNull().references(() => gudangBarangJadi.id),
  gudangTujuanId: uuid("gudang_tujuan_id").notNull().references(() => gudangBarangJadi.id),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  pengirim: text("pengirim"),
  penerima: text("penerima"),
  status: transferFgStatusEnum("status").notNull().default("draft"),
  catatan: text("catatan"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const transferBarangJadiDetail = pgTable(
  "transfer_barang_jadi_detail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transferId: uuid("transfer_id").notNull().references(() => transferBarangJadi.id),
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull(),
    batch: text("batch").notNull().default(""),
    jumlah: integer("jumlah").notNull(),
  },
  (t) => [index("transfer_fg_detail_header_idx").on(t.transferId)]
);

/** Pola penyesuaian_stok Tahap 1: approved DULU, baru mutasi terbuat. */
export const penyesuaianStokFg = pgTable(
  "penyesuaian_stok_fg",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorDokumen: text("nomor_dokumen").notNull().unique(), // PS-FG-YYYYMM-NNNN
    varianId: uuid("varian_id").notNull().references(() => varianProduk.id),
    grade: qcGradeEnum("grade").notNull(),
    gudangId: uuid("gudang_id").notNull().references(() => gudangBarangJadi.id),
    batch: text("batch").notNull().default(""),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
    stokSistem: integer("stok_sistem").notNull(),
    stokFisik: integer("stok_fisik").notNull(),
    alasan: text("alasan").notNull(),
    buktiUrl: text("bukti_url"),
    status: approvalStatusEnum("status").notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("ps_fg_status_idx").on(t.status)]
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Kategori = typeof kategori.$inferSelect;
export type Satuan = typeof satuan.$inferSelect;
export type Supplier = typeof supplier.$inferSelect;
export type Bahan = typeof bahan.$inferSelect;
export type Stok = typeof stok.$inferSelect;
export type BarangMasuk = typeof barangMasuk.$inferSelect;
export type BarangMasukDetail = typeof barangMasukDetail.$inferSelect;
export type BarangKeluar = typeof barangKeluar.$inferSelect;
export type BarangKeluarDetail = typeof barangKeluarDetail.$inferSelect;
export type PenyesuaianStok = typeof penyesuaianStok.$inferSelect;
export type MutasiStok = typeof mutasiStok.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type Warna = typeof warna.$inferSelect;
export type Produk = typeof produk.$inferSelect;
export type VarianProduk = typeof varianProduk.$inferSelect;
export type Bom = typeof bom.$inferSelect;
export type BomDetail = typeof bomDetail.$inferSelect;
export type PoProduksi = typeof poProduksi.$inferSelect;
export type PoProduksiDetail = typeof poProduksiDetail.$inferSelect;
export type PermintaanBahan = typeof permintaanBahan.$inferSelect;
export type PermintaanBahanDetail = typeof permintaanBahanDetail.$inferSelect;
export type PenerimaanCutting = typeof penerimaanCutting.$inferSelect;
export type PenerimaanCuttingDetail = typeof penerimaanCuttingDetail.$inferSelect;
export type WorkOrderCutting = typeof workOrderCutting.$inferSelect;
export type WorkOrderCuttingDetail = typeof workOrderCuttingDetail.$inferSelect;
export type PemakaianBahan = typeof pemakaianBahan.$inferSelect;
export type HasilCutting = typeof hasilCutting.$inferSelect;
export type HasilCuttingDetail = typeof hasilCuttingDetail.$inferSelect;
export type SisaBahan = typeof sisaBahan.$inferSelect;
export type LimbahCutting = typeof limbahCutting.$inferSelect;
export type Bundling = typeof bundling.$inferSelect;
export type Vendor = typeof vendor.$inferSelect;
export type LokasiProduksi = typeof lokasiProduksi.$inferSelect;
export type Penjahit = typeof penjahit.$inferSelect;
export type PenjahitProduk = typeof penjahitProduk.$inferSelect;
export type TarifJasaJahit = typeof tarifJasaJahit.$inferSelect;
export type PenugasanJahit = typeof penugasanJahit.$inferSelect;
export type PenugasanJahitDetail = typeof penugasanJahitDetail.$inferSelect;
export type PengirimanJahit = typeof pengirimanJahit.$inferSelect;
export type PengirimanJahitDetail = typeof pengirimanJahitDetail.$inferSelect;
export type SuratJalanJahit = typeof suratJalanJahit.$inferSelect;
export type PenerimaanBundelVendor = typeof penerimaanBundelVendor.$inferSelect;
export type PenerimaanBundelVendorDetail = typeof penerimaanBundelVendorDetail.$inferSelect;
export type ReturJahit = typeof returJahit.$inferSelect;
export type ReturJahitDetail = typeof returJahitDetail.$inferSelect;
export type PenerimaanHasilJahit = typeof penerimaanHasilJahit.$inferSelect;
export type PenerimaanHasilJahitDetail = typeof penerimaanHasilJahitDetail.$inferSelect;
export type SelisihJahit = typeof selisihJahit.$inferSelect;
export type BiayaJasaJahit = typeof biayaJasaJahit.$inferSelect;
export type DekorasiTemplate = typeof dekorasiTemplate.$inferSelect;
export type PekerjaanDekorasi = typeof pekerjaanDekorasi.$inferSelect;
export type PenerimaanDekorasi = typeof penerimaanDekorasi.$inferSelect;
export type JenisCacat = typeof jenisCacat.$inferSelect;
export type Kemasan = typeof kemasan.$inferSelect;
export type GudangBarangJadi = typeof gudangBarangJadi.$inferSelect;
export type PenerimaanQc = typeof penerimaanQc.$inferSelect;
export type PenerimaanQcDetail = typeof penerimaanQcDetail.$inferSelect;
export type StandarQc = typeof standarQc.$inferSelect;
export type StandarQcDetail = typeof standarQcDetail.$inferSelect;
export type WorkOrderQc = typeof workOrderQc.$inferSelect;
export type WorkOrderQcDetail = typeof workOrderQcDetail.$inferSelect;
export type HasilQc = typeof hasilQc.$inferSelect;
export type HasilQcDetail = typeof hasilQcDetail.$inferSelect;
export type TemuanCacat = typeof temuanCacat.$inferSelect;
export type PerbaikanInternal = typeof perbaikanInternal.$inferSelect;
export type PerbaikanInternalDetail = typeof perbaikanInternalDetail.$inferSelect;
export type ReturQcVendor = typeof returQcVendor.$inferSelect;
export type ReturQcVendorDetail = typeof returQcVendorDetail.$inferSelect;
export type ReQc = typeof reQc.$inferSelect;
export type ReQcDetail = typeof reQcDetail.$inferSelect;
export type KarantinaReject = typeof karantinaReject.$inferSelect;
export type KarantinaRejectDetail = typeof karantinaRejectDetail.$inferSelect;
export type TindakanReject = typeof tindakanReject.$inferSelect;
export type Finishing = typeof finishing.$inferSelect;
export type FinishingDetail = typeof finishingDetail.$inferSelect;
export type FinishingPemakaian = typeof finishingPemakaian.$inferSelect;
export type Packing = typeof packing.$inferSelect;
export type PackingDetail = typeof packingDetail.$inferSelect;
export type BarangJadi = typeof barangJadi.$inferSelect;
export type BarangJadiDetail = typeof barangJadiDetail.$inferSelect;
export type StokBarangJadi = typeof stokBarangJadi.$inferSelect;
export type MutasiBarangJadi = typeof mutasiBarangJadi.$inferSelect;
export type TransferBarangJadi = typeof transferBarangJadi.$inferSelect;
export type TransferBarangJadiDetail = typeof transferBarangJadiDetail.$inferSelect;
export type PenyesuaianStokFg = typeof penyesuaianStokFg.$inferSelect;
