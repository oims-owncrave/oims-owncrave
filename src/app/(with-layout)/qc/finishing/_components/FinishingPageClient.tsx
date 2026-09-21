"use client";

import { useState } from "react";
import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import { Play, CheckCircle, Ban, Sparkles } from "lucide-react";
import { PROSES_FINISHING } from "@/lib/qc/proses-finishing";
import { useBarisSiapFinishing, useFinishingList, useFinishingMutation } from "@/hooks/useFinishing";
import type { BarisFinishingRow, FinishingRow } from "@/services/finishing";

type UserOpt = { id: string; displayName: string; isActive: boolean };
type BahanOpt = { id: string; kode: string; nama: string; isActive: boolean };

interface Props {
  baris: BarisFinishingRow[];
  listData: FinishingRow[];
  userOptions: UserOpt[];
  bahanOptions: BahanOpt[];
  hideHeader?: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  berjalan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function FinishingPageClient({
  baris,
  listData,
  userOptions,
  bahanOptions,
  hideHeader = false,
}: Props) {
  const { data: barisLive } = useBarisSiapFinishing();
  const { data: listLive } = useFinishingList();
  const { create, pakaiBahan, setStatus } = useFinishingMutation();

  const antrean = barisLive ?? baris;
  const list = listLive ?? listData;

  const [jumlah, setJumlah] = useState<Record<string, number>>({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [target, setTarget] = useState("");
  const [picId, setPicId] = useState<string | null>(null);

  // form pemakaian label/hangtag
  const [pakaiFor, setPakaiFor] = useState<string | null>(null);
  const [bahanId, setBahanId] = useState<string | null>(null);
  const [jumlahBahan, setJumlahBahan] = useState(0);

  const details = antrean
    .map((b) => ({
      hasilQcDetailId: b.sumber === "hasil_qc" ? b.sumberId : null,
      reQcDetailId: b.sumber === "re_qc" ? b.sumberId : null,
      varianId: b.varianId,
      grade: b.grade,
      jumlah: jumlah[b.sumberId] ?? 0,
    }))
    .filter((d) => d.jumlah > 0);

  const totalPcs = details.reduce((n, d) => n + d.jumlah, 0);

  const userChoices = userOptions
    .filter((u) => u.isActive || u.id === picId)
    .map((u) => ({ value: u.id, label: u.displayName }));

  const bahanChoices = bahanOptions
    .filter((b) => b.isActive || b.id === bahanId)
    .map((b) => ({ value: b.id, label: `${b.kode} — ${b.nama}` }));

  async function simpan() {
    if (details.length === 0) return;
    const res = await create.mutateAsync({
      tanggalMasuk: tanggal,
      targetSelesai: target || null,
      picId,
      lokasiId: null,
      catatan: null,
      details,
    });
    if (!res.error) setJumlah({});
  }

  async function simpanPemakaian() {
    if (!pakaiFor || !bahanId || jumlahBahan <= 0) return;
    const res = await pakaiBahan.mutateAsync({
      finishingId: pakaiFor,
      bahanId,
      jumlah: jumlahBahan,
      catatan: null,
    });
    if (!res.error) {
      setPakaiFor(null);
      setBahanId(null);
      setJumlahBahan(0);
    }
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          title="Finishing"
          breadcrumb={[{ label: "Quality Control" }, { label: "Finishing" }]}
        />
      )}

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-1 font-semibold text-dark dark:text-white">
          Barang Lolos QC Siap Finishing
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Proses: {PROSES_FINISHING.map((p) => p.label).join(" · ")}
        </p>

        {antrean.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada barang siap finishing.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Tanggal Masuk"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={create.isPending}
              />
              <Input
                label="Target Selesai"
                type="date"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={create.isPending}
              />
              <ComboSelect
                label="PIC"
                options={userChoices}
                value={picId}
                onChange={(v) => setPicId((v as string) || null)}
                placeholder="Pilih PIC"
                disabled={create.isPending}
              />
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-2">
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Sumber</th>
                    <th className="px-3 py-2">Produk / SKU</th>
                    <th className="px-3 py-2">Warna / Ukuran</th>
                    <th className="px-3 py-2">Grade</th>
                    <th className="px-3 py-2 text-right">Sisa</th>
                    <th className="px-3 py-2 text-right w-24">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {antrean.map((b) => (
                    <tr key={b.sumberId} className="border-t border-stroke dark:border-dark-3">
                      <td className="px-3 py-2">{b.nomorSumber}</td>
                      <td className="px-3 py-2">
                        <div className="text-dark dark:text-white">{b.produkNama}</div>
                        <div className="text-xs text-gray-500">{b.sku}</div>
                      </td>
                      <td className="px-3 py-2">
                        {b.warnaNama} / {b.ukuran}
                      </td>
                      <td className="px-3 py-2 uppercase">{b.grade}</td>
                      <td className="px-3 py-2 text-right">{b.sisa}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={b.sisa}
                          placeholder="0"
                          value={(jumlah[b.sumberId] ?? 0) || ""}
                          onChange={(e) =>
                            setJumlah((p) => ({
                              ...p,
                              [b.sumberId]: Math.max(
                                0,
                                Math.min(b.sisa, Number(e.target.value) || 0),
                              ),
                            }))
                          }
                          disabled={create.isPending}
                          className="w-full rounded-md border border-stroke bg-transparent px-2 py-1 text-right outline-hidden focus:border-primary dark:border-dark-3 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: <strong>{totalPcs} pcs</strong>
              </span>
              <Button loading={create.isPending} onClick={simpan} disabled={totalPcs === 0}>
                <Sparkles size={16} className="mr-1.5" /> Buat Finishing
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Dokumen Finishing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Masuk</th>
                <th className="px-4 py-3">PIC</th>
                <th className="px-4 py-3 text-right">Pcs</th>
                <th className="px-4 py-3 text-right">Sudah Dipacking</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{f.nomorDokumen}</td>
                  <td className="px-4 py-3">{formatTanggal(f.tanggalMasuk)}</td>
                  <td className="px-4 py-3">{f.picNama || "—"}</td>
                  <td className="px-4 py-3 text-right">{Number(f.totalPcs)}</td>
                  <td className="px-4 py-3 text-right">{Number(f.sudahDipacking)}</td>
                  <td className="px-4 py-3">{formatTanggal(f.targetSelesai)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        STATUS_CLASS[f.status],
                      )}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {f.status === "draft" && (
                        <Button
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => setStatus.mutate({ id: f.id, status: "berjalan" })}
                        >
                          <Play size={14} />
                        </Button>
                      )}
                      {f.status === "berjalan" && (
                        <>
                          <Button
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => setPakaiFor(f.id)}
                          >
                            Label
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatus.mutate({ id: f.id, status: "selesai" })}
                          >
                            <CheckCircle size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() => setStatus.mutate({ id: f.id, status: "dibatalkan" })}
                          >
                            <Ban size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada dokumen finishing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pakaiFor && (
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-1 font-semibold text-dark dark:text-white">
            Pemakaian Label / Hangtag
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Bahan yang dipakai akan mengurangi stok lewat mutasi stok bahan.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64">
              <ComboSelect
                label="Bahan"
                options={bahanChoices}
                value={bahanId}
                onChange={(v) => setBahanId((v as string) || null)}
                placeholder="Pilih label / hangtag"
                disabled={pakaiBahan.isPending}
              />
            </div>
            <div className="w-32">
              <NumberInput
                label="Jumlah"
                decimals={3}
                placeholder="0"
                value={jumlahBahan}
                onChange={(v) => setJumlahBahan(v ?? 0)}
                disabled={pakaiBahan.isPending}
              />
            </div>
            <Button
              loading={pakaiBahan.isPending}
              onClick={simpanPemakaian}
              disabled={!bahanId || jumlahBahan <= 0}
            >
              Catat Pemakaian
            </Button>
            <Button variant="outline" onClick={() => setPakaiFor(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
