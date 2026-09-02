"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BundelLabelData } from "@/services/bundling";

interface Props {
  data: BundelLabelData;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function LabelClient({ data }: Props) {
  const router = useRouter();
  const [isBack, startBack] = useTransition();

  return (
    <div className="space-y-6">
      {/* Kontrol — disembunyikan saat print */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          size="sm"
          loading={isBack}
          onClick={() => startBack(() => router.push("/produksi/bundling"))}
        >
          <ArrowLeft size={16} className="mr-1.5" /> Kembali
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={16} className="mr-1.5" /> Cetak Label
        </Button>
      </div>

      {/* Kartu label — thermal friendly (hitam-putih, border tegas) */}
      <div className="mx-auto w-[80mm] border-2 border-black bg-white p-4 text-black print:border-black">
        <div className="border-b-2 border-black pb-2 text-center">
          <p className="text-lg font-black tracking-wide">OWNCRAVE</p>
          <p className="text-xs uppercase tracking-widest">Label Bundel</p>
        </div>

        <p className="my-3 text-center text-2xl font-black tracking-tight">{data.nomorDokumen}</p>

        <div className="space-y-1.5 border-t-2 border-black pt-3">
          <Row label="PO" value={data.poNomor} />
          <Row label="WO" value={data.woNomor} />
          <Row label="Produk" value={`${data.produkKode} — ${data.produkNama}`} />
          <Row label="SKU" value={data.sku} />
          <Row label="Warna / Ukuran" value={`${data.warnaNama} / ${data.ukuran}`} />
          <Row label="Jumlah" value={`${data.jumlahPcs} pcs`} />
          <Row label="Tujuan" value={data.tujuanPenjahit ?? "—"} />
          <Row label="Tanggal" value={fmtDate(data.createdAt)} />
        </div>

        {data.keterangan && (
          <p className="mt-3 border-t border-dashed border-black pt-2 text-xs">{data.keterangan}</p>
        )}

        {/* Area QR — menyusul setelah package qrcode disetujui */}
        <div className="mt-3 flex h-24 items-center justify-center border-2 border-dashed border-black text-[10px] uppercase tracking-widest text-gray-400">
          QR menyusul
        </div>
      </div>
    </div>
  );
}
