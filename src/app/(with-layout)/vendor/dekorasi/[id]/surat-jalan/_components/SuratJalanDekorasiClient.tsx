"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { markSuratJalanDicetak } from "@/services/pengiriman-jahit";
import type { PekerjaanDekorasiDetailData } from "@/services/dekorasi";
import { DEKORASI_JENIS_LABEL, DEKORASI_POSISI_LABEL } from "@/lib/schemas/dekorasi";

interface Props {
  data: PekerjaanDekorasiDetailData;
}

/** Surat jalan dekorasi — perpindahan Gudang Cutting → Vendor Sablon/Bordir (referensi §9). */
export function SuratJalanDekorasiClient({ data }: Props) {
  const router = useRouter();
  const [isBack, startBack] = useTransition();
  const [cetakKe, setCetakKe] = useState(data.sjJumlahCetak ?? 0);
  const [printing, setPrinting] = useState(false);

  const dibatalkan = data.status === "dibatalkan";
  const cetakUlang = cetakKe > 1;

  async function cetak() {
    setPrinting(true);
    try {
      const { sebelumnya } = await markSuratJalanDicetak(data.id, "dekorasi");
      setCetakKe(sebelumnya + 1);
      setTimeout(() => window.print(), 50);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" loading={isBack} onClick={() => startBack(() => router.push(`/vendor/dekorasi/${data.id}`))}>
          <ArrowLeft size={16} className="mr-1.5" /> Kembali
        </Button>
        <div className="flex items-center gap-3">
          {cetakKe > 0 && <span className="text-xs text-dark-5 dark:text-dark-6">Sudah dicetak {cetakKe}×</span>}
          <Button size="sm" onClick={cetak} loading={printing}>
            <Printer size={16} className="mr-1.5" /> {cetakKe > 0 ? "Cetak Ulang" : "Cetak"}
          </Button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[210mm] bg-white p-10 text-black shadow-1 print:max-w-none print:p-0 print:shadow-none">
        {(dibatalkan || cetakUlang) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rotate-[-30deg] border-8 border-red-500/40 px-8 py-3 text-6xl font-black uppercase tracking-widest text-red-500/40">
              {dibatalkan ? "Dibatalkan" : `Cetak Ulang ${cetakKe}`}
            </p>
          </div>
        )}

        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <p className="text-2xl font-black tracking-wide">OWNCRAVE</p>
            <p className="text-xs uppercase tracking-widest text-gray-600">Produksi Garmen</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase">Surat Jalan Dekorasi</p>
            <p className="font-mono text-base">{data.sjNomor}</p>
            <p className="text-xs text-gray-600">{formatTanggal(data.tanggalKirim ?? data.tanggal, true)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-gray-500">Dari</p>
            <p className="font-medium">Owncrave — Gudang Cutting</p>
            <p>Pengirim: {data.pengirim ?? "—"}</p>
            <p>Kurir: {data.kurir ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-gray-500">Kepada</p>
            <p className="font-medium">{data.vendorNama}</p>
            <p>{data.lokasiTujuanAlamat ?? data.vendorAlamat ?? "—"}</p>
            <p>Telp: {data.vendorTelepon ?? "—"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4 border-y border-gray-300 py-3 text-sm">
          <div><p className="text-xs text-gray-500">PO</p><p className="font-medium">{data.poNomor}</p></div>
          <div><p className="text-xs text-gray-500">WO Cutting</p><p className="font-medium">{data.woNomor}</p></div>
          <div><p className="text-xs text-gray-500">Pekerjaan</p><p className="font-medium">{data.nomorDokumen}</p></div>
          <div><p className="text-xs text-gray-500">Target Selesai</p><p className="font-medium">{formatTanggal(data.targetSelesai)}</p></div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left text-xs uppercase">
              <th className="py-2 pr-2">Produk</th>
              <th className="py-2 pr-2">Jenis</th>
              <th className="py-2 pr-2">Posisi</th>
              <th className="py-2 pr-2">Spesifikasi</th>
              <th className="py-2 pr-2 text-right">Pcs</th>
              <th className="py-2 text-right">Tarif/pcs</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-1.5 pr-2">{data.produkKode} — {data.produkNama}</td>
              <td className="py-1.5 pr-2">{DEKORASI_JENIS_LABEL[data.jenis]}</td>
              <td className="py-1.5 pr-2">{DEKORASI_POSISI_LABEL[data.posisi]}</td>
              <td className="py-1.5 pr-2">{data.deskripsi ?? "—"}</td>
              <td className="py-1.5 pr-2 text-right">{data.jumlah}</td>
              <td className="py-1.5 text-right">{formatRupiah(data.tarifSnapshot)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold">
              <td colSpan={4} className="py-2 text-right">Total</td>
              <td className="py-2 pr-2 text-right">{data.jumlah}</td>
              <td className="py-2 text-right">{formatRupiah(data.jumlah * Number(data.tarifSnapshot))}</td>
            </tr>
          </tfoot>
        </table>

        {data.catatan && <p className="mt-3 text-xs">Catatan: {data.catatan}</p>}

        <div className="mt-10 grid grid-cols-3 gap-8 text-center text-sm">
          {["Pengirim", "Kurir", "Penerima"].map((t) => (
            <div key={t}>
              <p className="text-xs text-gray-500">{t}</p>
              <div className="mt-14 border-t border-black pt-1">( ................................ )</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-end justify-between">
          <p className="text-[10px] text-gray-500">Dokumen ini dicetak dari OIMS Owncrave · {data.sjNomor} · Pekerjaan {data.nomorDokumen}</p>
          <div className="flex h-20 w-20 items-center justify-center border-2 border-dashed border-gray-400 text-[9px] uppercase tracking-widest text-gray-400">QR menyusul</div>
        </div>
      </div>
    </div>
  );
}
