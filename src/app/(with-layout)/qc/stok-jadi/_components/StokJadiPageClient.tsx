"use client";

import { useState } from "react";
import { cn, formatTanggal, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Warehouse, Check, X, ArrowRightLeft, Truck } from "lucide-react";
import {
  usePackingSiapGudang,
  useBarangJadiList,
  useStokBarangJadi,
  useMutasiBarangJadi,
  useBarangJadiMutation,
} from "@/hooks/useBarangJadi";
import {
  useTransferFgList,
  usePenyesuaianFgList,
  useTransferFgMutation,
} from "@/hooks/useTransferFg";
import type {
  PackingSiapGudangRow,
  BarangJadiRow,
  StokBarangJadiRow,
  MutasiBarangJadiRow,
} from "@/services/barang-jadi";
import type { TransferFgRow, PenyesuaianFgRow } from "@/services/transfer-fg";
import type { GudangBarangJadi } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  siapMasuk: PackingSiapGudangRow[];
  fgData: BarangJadiRow[];
  stokData: StokBarangJadiRow[];
  mutasiData: MutasiBarangJadiRow[];
  transferData: TransferFgRow[];
  penyesuaianData: PenyesuaianFgRow[];
  gudangOptions: GudangBarangJadi[];
  userOptions: UserOpt[];
}

const GRADE_LABEL: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  reject: "Reject",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  dikirim: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  diterima: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function StokJadiPageClient({
  siapMasuk,
  fgData,
  stokData,
  mutasiData,
  transferData,
  penyesuaianData,
  gudangOptions,
  userOptions,
}: Props) {
  const [tab, setTab] = useState<"stok" | "masuk" | "mutasi" | "transfer">("stok");

  const { data: siapLive } = usePackingSiapGudang();
  const { data: fgLive } = useBarangJadiList();
  const { data: stokLive } = useStokBarangJadi();
  const { data: mutasiLive } = useMutasiBarangJadi();
  const { data: trfLive } = useTransferFgList();
  const { data: psLive } = usePenyesuaianFgList();
  const { terima } = useBarangJadiMutation();
  const { setStatus, approve } = useTransferFgMutation();

  const siap = siapLive ?? siapMasuk;
  const fg = fgLive ?? fgData;
  const stok = stokLive ?? stokData;
  const mutasi = mutasiLive ?? mutasiData;
  const transfer = trfLive ?? transferData;
  const penyesuaian = psLive ?? penyesuaianData;

  const [packingId, setPackingId] = useState<string | null>(null);
  const [gudangId, setGudangId] = useState<string | null>(
    gudangOptions.find((g) => g.isDefault)?.id ?? null,
  );
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [penerimaId, setPenerimaId] = useState<string | null>(null);

  const totalSiapJual = stok.reduce((n, s) => n + Number(s.siapJual), 0);
  const totalNilai = stok.reduce((n, s) => n + s.kuantitas * Number(s.hppRataRata), 0);

  async function terimaBarang() {
    if (!packingId || !gudangId) return;
    const res = await terima.mutateAsync({
      packingId,
      tanggalMasuk: tanggal,
      gudangTujuanId: gudangId,
      penyerah: null,
      penerimaId,
      catatan: null,
    });
    if (!res.error) setPackingId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Barang Jadi"
        breadcrumb={[{ label: "Quality Control" }, { label: "Stok Barang Jadi" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Stok Siap Jual</p>
          <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
            {totalSiapJual} <span className="text-sm font-normal">pcs</span>
          </p>
        </div>
        <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Nilai Persediaan</p>
          <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
            {formatRupiah(totalNilai)}
          </p>
        </div>
        <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Menunggu Masuk</p>
          <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
            {siap.reduce((n, s) => n + s.sisa, 0)} <span className="text-sm font-normal">pcs</span>
          </p>
        </div>
      </div>

      {siap.length > 0 && (
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-4 font-semibold text-dark dark:text-white">
            Terima Barang Jadi ke Gudang
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <ComboSelect
              label="Dokumen Packing"
              options={siap.map((s) => ({
                value: s.packingId,
                label: `${s.nomorPacking} (${s.sisa} pcs)`,
              }))}
              value={packingId}
              onChange={(v) => setPackingId((v as string) || null)}
              placeholder="Pilih packing"
              disabled={terima.isPending}
            />
            <Input
              label="Tanggal Masuk"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={terima.isPending}
            />
            <ComboSelect
              label="Gudang"
              options={gudangOptions
                .filter((g) => g.isActive || g.id === gudangId)
                .map((g) => ({ value: g.id, label: g.nama }))}
              value={gudangId}
              onChange={(v) => setGudangId((v as string) || null)}
              placeholder="Pilih gudang"
              disabled={terima.isPending}
            />
            <ComboSelect
              label="Penerima"
              options={userOptions
                .filter((u) => u.isActive || u.id === penerimaId)
                .map((u) => ({ value: u.id, label: u.displayName }))}
              value={penerimaId}
              onChange={(v) => setPenerimaId((v as string) || null)}
              placeholder="Pilih penerima"
              disabled={terima.isPending}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              loading={terima.isPending}
              onClick={terimaBarang}
              disabled={!packingId || !gudangId}
            >
              <Warehouse size={16} className="mr-1.5" /> Terima ke Gudang
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["stok", `Stok (${stok.length})`],
            ["masuk", `Penerimaan (${fg.length})`],
            ["mutasi", `Mutasi (${mutasi.length})`],
            ["transfer", `Transfer & Penyesuaian (${transfer.length + penyesuaian.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-2 dark:text-gray-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stok" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Produk / SKU</th>
                <th className="px-4 py-3">Warna / Ukuran</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3 text-right">Kuantitas</th>
                <th className="px-4 py-3 text-right">Ditahan</th>
                <th className="px-4 py-3 text-right">Rusak</th>
                <th className="px-4 py-3 text-right">Siap Jual</th>
              </tr>
            </thead>
            <tbody>
              {stok.map((s) => (
                <tr key={s.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">
                    <div className="text-dark dark:text-white">{s.produkNama}</div>
                    <div className="text-xs text-gray-500">{s.sku}</div>
                  </td>
                  <td className="px-4 py-3">
                    {s.warnaNama} / {s.ukuran}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                      {GRADE_LABEL[s.grade] ?? s.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.gudangNama}</td>
                  <td className="px-4 py-3">{s.batch || "—"}</td>
                  <td className="px-4 py-3 text-right">{s.kuantitas}</td>
                  <td className="px-4 py-3 text-right">{s.stokDitahan}</td>
                  <td className="px-4 py-3 text-right">{s.stokRusak}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {Number(s.siapJual)}
                  </td>
                </tr>
              ))}
              {stok.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada stok barang jadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "masuk" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Packing</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3 text-right">Pcs</th>
              </tr>
            </thead>
            <tbody>
              {fg.map((r) => (
                <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{r.nomorDokumen}</td>
                  <td className="px-4 py-3">{formatTanggal(r.tanggalMasuk)}</td>
                  <td className="px-4 py-3">{r.nomorPacking || "—"}</td>
                  <td className="px-4 py-3">{r.gudangNama}</td>
                  <td className="px-4 py-3">{r.penerimaNama || "—"}</td>
                  <td className="px-4 py-3 text-right">{Number(r.totalPcs)}</td>
                </tr>
              ))}
              {fg.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada penerimaan barang jadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "mutasi" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-x-auto">
          <div className="border-b border-stroke px-6 py-3 text-sm text-gray-500 dark:border-dark-3 dark:text-gray-400">
            Ledger append-only — tidak ada baris yang diubah atau dihapus.
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Produk / SKU</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                <th className="px-4 py-3">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {mutasi.map((m) => (
                <tr key={m.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{formatTanggal(m.tanggal, true)}</td>
                  <td className="px-4 py-3">
                    <div className="text-dark dark:text-white">{m.produkNama}</div>
                    <div className="text-xs text-gray-500">{m.sku}</div>
                  </td>
                  <td className="px-4 py-3">{GRADE_LABEL[m.grade] ?? m.grade}</td>
                  <td className="px-4 py-3">{m.gudangNama}</td>
                  <td className="px-4 py-3">{m.jenis.replace(/_/g, " ")}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      m.jumlah > 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {m.jumlah > 0 ? "+" : ""}
                    {m.jumlah}
                  </td>
                  <td className="px-4 py-3">{m.olehNama || "—"}</td>
                </tr>
              ))}
              {mutasi.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada mutasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "transfer" && (
        <div className="space-y-4">
          <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-x-auto">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h3 className="font-semibold text-dark dark:text-white">
                <ArrowRightLeft size={16} className="mr-1.5 inline" /> Transfer Antar Gudang
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Asal</th>
                  <th className="px-4 py-3 text-right">Pcs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transfer.map((t) => (
                  <tr key={t.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">{t.nomorDokumen}</td>
                    <td className="px-4 py-3">{formatTanggal(t.tanggal)}</td>
                    <td className="px-4 py-3">{t.gudangAsalNama}</td>
                    <td className="px-4 py-3 text-right">{Number(t.totalPcs)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          STATUS_CLASS[t.status],
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {t.status === "draft" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatus.mutate({ id: t.id, status: "dikirim" })}
                          >
                            <Truck size={14} />
                          </Button>
                        )}
                        {t.status === "dikirim" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatus.mutate({ id: t.id, status: "diterima" })}
                          >
                            <Check size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {transfer.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Belum ada transfer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-x-auto">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h3 className="font-semibold text-dark dark:text-white">
                Penyesuaian Stok (butuh persetujuan owner)
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Produk / SKU</th>
                  <th className="px-4 py-3">Gudang</th>
                  <th className="px-4 py-3 text-right">Sistem</th>
                  <th className="px-4 py-3 text-right">Fisik</th>
                  <th className="px-4 py-3 text-right">Selisih</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Persetujuan</th>
                </tr>
              </thead>
              <tbody>
                {penyesuaian.map((p) => {
                  const selisih = p.stokFisik - p.stokSistem;
                  return (
                    <tr key={p.id} className="border-t border-stroke dark:border-dark-3">
                      <td className="px-4 py-3">{p.nomorDokumen}</td>
                      <td className="px-4 py-3">
                        <div className="text-dark dark:text-white">{p.produkNama}</div>
                        <div className="text-xs text-gray-500">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3">{p.gudangNama}</td>
                      <td className="px-4 py-3 text-right">{p.stokSistem}</td>
                      <td className="px-4 py-3 text-right">{p.stokFisik}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold",
                          selisih > 0
                            ? "text-green-600"
                            : selisih < 0
                              ? "text-red-600"
                              : "text-gray-500",
                        )}
                      >
                        {selisih > 0 ? "+" : ""}
                        {selisih}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            STATUS_CLASS[p.status],
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "pending" ? (
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-green-600"
                              onClick={() => approve.mutate({ id: p.id, setuju: true })}
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-red-600"
                              onClick={() => approve.mutate({ id: p.id, setuju: false })}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <span className="block text-center text-xs text-gray-500">
                            {formatTanggal(p.approvedAt)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {penyesuaian.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Belum ada penyesuaian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
