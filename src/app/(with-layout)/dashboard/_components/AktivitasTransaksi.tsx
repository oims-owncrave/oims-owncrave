"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { DateInput } from "@/components/ui/DateInput";
import { useAktivitasTransaksi } from "@/hooks/useDashboard";
import type { AktivitasTransaksiData } from "@/services/dashboard";
import { cn } from "@/lib/utils";

type TimeFrame = "hari" | "minggu" | "bulan" | "custom";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function rangeOf(tf: TimeFrame, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayStr();
  if (tf === "hari") return { from: today, to: today };
  if (tf === "minggu") return { from: offsetDate(-6), to: today };
  if (tf === "bulan") return { from: monthStart(), to: today };
  return { from: customFrom || monthStart(), to: customTo || today };
}

const TABS: { key: TimeFrame; label: string }[] = [
  { key: "hari", label: "Hari Ini" },
  { key: "minggu", label: "7 Hari" },
  { key: "bulan", label: "Bulan Ini" },
  { key: "custom", label: "Custom" },
];

function DeltaBadge({ curr, prev }: { curr: number; prev: number }) {
  const delta = curr - prev;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isFlat = delta === 0;

  const persen =
    prev > 0
      ? Math.round((delta / prev) * 100)
      : curr > 0
        ? 100
        : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors shrink-0",
        isUp && "bg-green-100/90 text-green-700 dark:bg-green-950/60 dark:text-green-400",
        isDown && "bg-red-100/90 text-red-700 dark:bg-red-950/60 dark:text-red-400",
        isFlat && "bg-gray-200/70 text-dark-5 dark:bg-dark-3 dark:text-dark-6"
      )}
      title={`Periode sebelumnya: ${prev} transaksi`}
    >
      {isUp && <TrendingUp size={12} />}
      {isDown && <TrendingDown size={12} />}
      {isFlat && <Minus size={12} />}
      <span>
        {isUp ? "+" : ""}
        {persen}%
      </span>
    </div>
  );
}

interface Props {
  initialData?: AktivitasTransaksiData;
}

export function AktivitasTransaksi({ initialData }: Props) {
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("bulan");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = rangeOf(timeFrame, customFrom, customTo);
  const { data, isFetching } = useAktivitasTransaksi(from, to, initialData);

  const handleNavigate = (href: string) => {
    setActiveHref(href);
    startNavigating(() => {
      router.push(href);
    });
  };

  const masukCount = data?.masukCount ?? 0;
  const masukNilai = data?.masukNilai ?? 0;
  const masukCountPrev = data?.masukCountPrev ?? 0;

  const keluarCount = data?.keluarCount ?? 0;
  const keluarNilai = data?.keluarNilai ?? 0;
  const keluarCountPrev = data?.keluarCountPrev ?? 0;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      {/* Header + Tab */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-dark dark:text-white">
          Aktivitas Transaksi
          {isFetching && (
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          )}
        </p>

        {/* Time frame tabs */}
        <div className="flex w-full items-center gap-1 rounded-lg border border-stroke p-0.5 dark:border-dark-3 sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFrame(tab.key)}
              className={cn(
                "flex-1 sm:flex-none text-center rounded-md px-3 py-1.5 text-xs font-medium transition",
                timeFrame === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date pickers */}
      {timeFrame === "custom" && (
        <div className="mb-4 flex items-center gap-2">
          <DateInput
            value={customFrom}
            onChange={setCustomFrom}
            placeholder="Dari tanggal"
            containerClassName="flex-1"
            className="w-full"
          />
          <span className="text-dark-5 dark:text-dark-6 text-sm">—</span>
          <DateInput
            value={customTo}
            onChange={setCustomTo}
            placeholder="Sampai tanggal"
            containerClassName="flex-1"
            className="w-full"
          />
        </div>
      )}

      {/* Data cards: Masuk & Keluar side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Barang Masuk */}
        <button
          type="button"
          onClick={() => handleNavigate("/inventory/barang-masuk")}
          disabled={isNavigating}
          className="group text-left block rounded-lg bg-teal-50 p-4 transition-all hover:bg-teal-100/70 dark:bg-teal-900/20 dark:hover:bg-teal-900/35 disabled:opacity-80"
        >
          {/* Header title + icon */}
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-full bg-teal-100 p-1.5 transition-transform group-hover:scale-110 dark:bg-teal-800/40 shrink-0">
              {isNavigating && activeHref === "/inventory/barang-masuk" ? (
                <Loader2 size={14} className="animate-spin text-teal-600 dark:text-teal-300" />
              ) : (
                <ArrowDownLeft size={14} className="text-teal-600 dark:text-teal-300" />
              )}
            </div>
            <span className="text-xs font-semibold text-teal-700 transition-colors group-hover:text-teal-900 dark:text-teal-300 dark:group-hover:text-teal-100">
              Barang Masuk
            </span>
          </div>

          {/* Number + Delta Badge */}
          <div className="flex items-start justify-between gap-1">
            <p className="text-2xl font-bold text-dark dark:text-white">
              {masukCount}
              <span className="ml-1 text-sm font-normal text-dark-5 dark:text-dark-6">
                transaksi
              </span>
            </p>
            <DeltaBadge curr={masukCount} prev={masukCountPrev} />
          </div>

          {/* Value + Previous period comparison */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs text-dark-5 dark:text-dark-6">
            <span>{rupiah(masukNilai)}</span>
            <span className="text-[11px] opacity-80" title="Jumlah transaksi periode lalu">
              vs lalu: {masukCountPrev}
            </span>
          </div>
        </button>

        {/* Barang Keluar */}
        <button
          type="button"
          onClick={() => handleNavigate("/inventory/barang-keluar")}
          disabled={isNavigating}
          className="group text-left block rounded-lg bg-purple-50 p-4 transition-all hover:bg-purple-100/70 dark:bg-purple-900/20 dark:hover:bg-purple-900/35 disabled:opacity-80"
        >
          {/* Header title + icon */}
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-full bg-purple-100 p-1.5 transition-transform group-hover:scale-110 dark:bg-purple-800/40 shrink-0">
              {isNavigating && activeHref === "/inventory/barang-keluar" ? (
                <Loader2 size={14} className="animate-spin text-purple-600 dark:text-purple-300" />
              ) : (
                <ArrowUpRight size={14} className="text-purple-600 dark:text-purple-300" />
              )}
            </div>
            <span className="text-xs font-semibold text-purple-700 transition-colors group-hover:text-purple-900 dark:text-purple-300 dark:group-hover:text-purple-100">
              Barang Keluar
            </span>
          </div>

          {/* Number + Delta Badge */}
          <div className="flex items-start justify-between gap-1">
            <p className="text-2xl font-bold text-dark dark:text-white">
              {keluarCount}
              <span className="ml-1 text-sm font-normal text-dark-5 dark:text-dark-6">
                transaksi
              </span>
            </p>
            <DeltaBadge curr={keluarCount} prev={keluarCountPrev} />
          </div>

          {/* Value + Previous period comparison */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs text-dark-5 dark:text-dark-6">
            <span>{rupiah(keluarNilai)}</span>
            <span className="text-[11px] opacity-80" title="Jumlah transaksi periode lalu">
              vs lalu: {keluarCountPrev}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
