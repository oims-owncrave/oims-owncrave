/**
 * Isi tutorial. Gambar ada di public/dokumentasi/<tahap>/<file>.png
 *
 * Menambah langkah cukup menambah baris di sini — halaman membacanya sendiri,
 * tidak perlu menyentuh komponen.
 */

export type Langkah = {
  judul: string;
  teks: string;
  /** nama file di public/dokumentasi/<slug tahap>/ */
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

export const TUTORIAL: Tutorial[] = [T1_PERSEDIAAN, T2_PRODUKSI];
