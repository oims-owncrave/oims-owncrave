"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Input } from "./Input";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> & {
  label?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  value: unknown;
  onChange: (v: number | undefined) => void;
  /** Angka di belakang koma yang boleh diketik. 0 = bilangan bulat. */
  decimals?: number;
};

/** 12310.5 -> "12.310,5" (id-ID). Kosong tetap kosong, tidak dijadikan "0". */
function format(v: unknown, decimals: number): string {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return "";
  const [bulat, pecahan] = String(n).split(".");
  const ribuan = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimals > 0 && pecahan ? `${ribuan},${pecahan}` : ribuan;
}

/** Beri pemisah ribuan pada bagian bulat saja, koma yang sedang diketik dibiarkan. */
function formatKetikan(raw: string, decimals: number): string {
  const koma = decimals > 0 ? raw.indexOf(",") : -1;
  const bulat = (koma >= 0 ? raw.slice(0, koma) : raw).replace(/\D/g, "");
  const ribuan = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (koma < 0) return ribuan;
  const pecahan = raw.slice(koma + 1).replace(/\D/g, "").slice(0, decimals);
  return `${ribuan},${pecahan}`; // "1," tetap "1," supaya desimal bisa diketik
}

/** "12.310,5" -> 12310.5. Kosong/tak valid -> undefined. */
function parse(tampil: string): number | undefined {
  const angka = tampil.replace(/\./g, "").replace(",", ".");
  if (angka === "" || angka === ".") return undefined;
  const n = Number(angka);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Input angka dengan pemisah ribuan.
 *
 * Memakai type="text" karena input number bawaan tidak bisa menampilkan titik
 * pemisah. Nilai kosong dibiarkan kosong — kalau diisi 0, mengetik menghasilkan
 * angka berawalan nol seperti "012312".
 *
 * Saat sedang diketik yang ditampilkan adalah ketikan apa adanya (sudah diberi
 * pemisah ribuan), bukan hasil format dari angka. Tanpa itu "1," langsung
 * terpangkas jadi "1" dan desimal mustahil diketik.
 */
export const NumberInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, decimals = 0, onBlur, ...rest }, ref) => {
    const [draft, setDraft] = useState<string | null>(null);

    // Nilai yang TERAKHIR dikirim komponen ini lewat onChange. Dipakai untuk
    // membedakan perubahan value yang berasal dari ketikan user (draft dipertahankan,
    // supaya "1," tidak terpangkas jadi "1") dan yang datang dari luar lewat setValue
    // (draft dibuang, supaya layar tidak menampilkan angka basi).
    const terakhirDikirim = useRef<number | undefined>(undefined);

    useEffect(() => {
      const v = value === "" || value === null ? undefined : Number(value);
      const sama = Number.isNaN(v as number) ? value === undefined : v === terakhirDikirim.current;
      if (!sama) setDraft(null);
    }, [value]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={draft ?? format(value, decimals)}
        onChange={(e) => {
          const tampil = formatKetikan(e.target.value, decimals);
          setDraft(tampil);
          const n = parse(tampil);
          terakhirDikirim.current = n;
          onChange(n);
        }}
        onBlur={(e) => {
          setDraft(null); // kembali ke bentuk terformat dari nilai sebenarnya
          onBlur?.(e);
        }}
        {...rest}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";
