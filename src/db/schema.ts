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
import { isNull } from "drizzle-orm";

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

export const bahan = pgTable(
  "bahan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // kode otomatis: BH-[KODE_KATEGORI]-[NOMOR] e.g. "BH-KTN-001" — unik hanya baris aktif
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    kategoriId: uuid("kategori_id").notNull().references(() => kategori.id),
    satuanId: uuid("satuan_id").notNull().references(() => satuan.id),
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
  // field ini = cache untuk read cepat, di-update lewat DB trigger
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
