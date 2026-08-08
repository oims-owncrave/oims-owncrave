// Definisi kolom untuk template + validasi 1 entitas import.
export type ImportColumn = {
  key: string;          // nama properti internal (mis. "kode")
  header: string;       // teks header di Excel (mis. "Kode")
  example: string;      // nilai contoh di baris contoh template
  required: boolean;
};

// Satu error baris (baris ke-N, kolom apa, kenapa).
export type RowError = {
  row: number;          // 1-based, baris data
  message: string;
};

// Hasil batch action.
export type ImportResult = {
  inserted?: number;    // jumlah row berhasil (all-or-nothing: 0 atau semua)
  errors?: RowError[];  // kalau ada -> tidak ada yang di-insert
  error?: string;       // error global (mis. file kosong)
};
