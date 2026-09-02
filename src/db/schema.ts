import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uuid,
  pgEnum,
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
  pengirimanId: uuid("pengiriman_id").notNull().unique().references(() => pengirimanJahit.id),
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
