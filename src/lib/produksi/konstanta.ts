/**
 * Lebihan per varian produk disembunyikan — Excel klien menaruh lebihan di BAHAN,
 * bukan produk, dan klien menolak angka default (app-itl4, klarifikasi 18 Sep 2026).
 *
 * Kolom po_produksi_detail.lebihan_pcs SENGAJA dipertahankan (default 0), bukan dihapus.
 * Kalau klien nanti minta lebihan per produk juga, ubah ke true — tidak ada kode lain
 * yang perlu disentuh.
 *
 * Efek saat false: WoForm targetCutting = jumlahTarget + 0, jadi rencana cutting sama
 * dengan target. Itu sesuai Excel klien, bukan bug.
 */
export const TAMPILKAN_LEBIHAN_VARIAN = false;
