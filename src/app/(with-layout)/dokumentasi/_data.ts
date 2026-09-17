/**
 * Isi tutorial. Gambar ada di public/img-panduan/<slug tahap>/<file>.jpg
 *
 * Menambah langkah cukup menambah baris di sini — halaman membacanya sendiri,
 * tidak perlu menyentuh komponen.
 */

export type Langkah = {
  judul: string;
  teks: string;
  /** nama file di public/img-panduan/<slug tahap>/ */
  gambar?: string;
};

export type Bagian = {
  judul: string;
  /** dibaca sebelum langkah — menjelaskan apa yang sebenarnya terjadi */
  pengantar?: string;
  langkah: Langkah[];
};

export type Tutorial = {
  slug: string;
  tahap: 1 | 2 | 3 | 4;
  judul: string;
  ringkas: string;
  /** peta besar: rantai sistemnya, dibaca sebelum langkah */
  gambaranUmum?: string[];
  /** hal yang sering disalahpahami: [yang dikira, yang sebenarnya] */
  salahKaprah?: [string, string][];
  bagian: Bagian[];
  /** aturan yang kalau dilanggar merusak data */
  penting?: string[];
  /** gejala -> kemungkinan penyebab */
  kalauBermasalah?: [string, string][];
  belumTersedia?: string[];
  /** true = teks sudah jadi tapi gambarnya belum dipotret; nama file di tiap
   *  langkah diabaikan supaya tidak muncul gambar rusak */
  gambarMenyusul?: boolean;
};

export const TAHAP_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Tahap 1 — Persediaan",
  2: "Tahap 2 — Produksi",
  3: "Tahap 3 — Vendor & Jahit",
  4: "Tahap 4 — Quality Control",
};

import { T1_PERSEDIAAN } from "./_isi-t1";
import { T2_PRODUKSI } from "./_isi-t2";
import { T3_VENDOR } from "./_isi-t3";
import { T4_QC } from "./_isi-t4";

/**
 * T3 tayang dengan `gambarMenyusul` — teksnya sudah ditulis dari alur sungguhan
 * dan berguna dibaca, gambarnya menyusul. T4 belum tayang karena alurnya belum
 * pernah dijalankan utuh (Tahap 4 belum smoke test), jadi teksnya belum terbukti.
 *
 * Setelah dipotret: buang `gambarMenyusul` dari tutorial yang bersangkutan.
 */
export const TUTORIAL: Tutorial[] = [T1_PERSEDIAAN, T2_PRODUKSI, T3_VENDOR];

export const TUTORIAL_DRAF: Tutorial[] = [T4_QC];
