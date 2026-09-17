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
 * T3 & T4 teksnya sudah jadi tapi gambarnya belum dipotret, jadi belum
 * ditayangkan — daftar di bawah yang menentukan apa yang terlihat staf.
 * Setelah pemotretan selesai, pindahkan T3_VENDOR dan T4_QC ke TUTORIAL.
 */
export const TUTORIAL: Tutorial[] = [T1_PERSEDIAAN, T2_PRODUKSI];

export const TUTORIAL_DRAF: Tutorial[] = [T3_VENDOR, T4_QC];
