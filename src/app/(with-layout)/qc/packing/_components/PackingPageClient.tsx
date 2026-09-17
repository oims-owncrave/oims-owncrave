"use client";

import { useState } from "react";
import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import { Play, CheckCircle, Ban, Package } from "lucide-react";
import { CHECKLIST_PACKING } from "@/lib/qc/proses-finishing";
import { useBarisSiapPacking, usePackingList, usePackingMutation } from "@/hooks/usePacking";
import type { BarisPackingRow, PackingRow } from "@/services/packing";
import type { KemasanRow } from "@/services/kemasan";
import type { GudangBarangJadi } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  baris: BarisPackingRow[];
  listData: PackingRow[];
  kemasanOptions: KemasanRow[];
  gudangOptions: GudangBarangJadi[];
  userOptions: UserOpt[];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  berjalan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function PackingPageClient({
  baris,
  listData,
  kemasanOptions,
  gudangOptions,
  userOptions,
}: Props) {
  const { data: barisLive } = useBarisSiapPacking();
  const { data: listLive } = usePackingList();
  const { create, setChecklist, setStatus } = usePackingMutation();

  const antrean = barisLive ?? baris;
  const list = listLive ?? listData;

  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState<Record<string, number>>({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [picId, setPicId] = useState<string | null>(null);
  const [kemasanId, setKemasanId] = useState<string | null>(null);
  const [gudangId, setGudangId] = useState<string | null>(
    gudangOptions.find((g) => g.isDefault)?.id ?? null,
  );
  const [batch, setBatch] = useState("");
  const [bukaChecklist, setBukaChecklist] = useState<string | null>(null);

  const finishingChoices = [
    ...new Map(antrean.map((b) => [b.finishingId, b.nomorFinishing])),
  ].map(([value, label]) => ({ value, label }));

  const terpilih = antrean.filter((b) => b.finishingId === finishingId);

  const details = terpilih
    .map((b) => ({
      finishingDetailId: b.finishingDetailId,
      varianId: b.varianId,
      grade: b.grade as "a" | "b" | "c",
      jumlah: jumlah[b.finishingDetailId] ?? 0,
      kemasanId,
      batch: batch || null,
      gudangTujuanId: gudangId,
      barcode: null,
    }))
    .filter((d) => d.jumlah > 0);

  const totalPcs = details.reduce((n, d) => n + d.jumlah, 0);

  async function simpan() {
    if (!finishingId || details.length === 0) return;
    const res = await create.mutateAsync({
      finishingId,
      tanggal,
      picId,
      lokasiId: null,
      catatan: null,
      details,
    });
    if (!res.error) {
      setJumlah({});
      setFinishingId(null);
    }
  }

  const dok = list.find((p) => p.id === bukaChecklist);
  const checklistNow = (dok?.checklist ?? {}) as Record<string, boolean>;
  const kurang = CHECKLIST_PACKING.filter((c) => checklistNow[c.key] !== true).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packing"
        breadcrumb={[{ label: "Quality Control" }, { label: "Packing" }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">
          Hasil Finishing Siap Packing
        </h3>

        {finishingChoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada hasil finishing siap dipacking. Selesaikan dulu dokumen finishing.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <ComboSelect
                label="Dokumen Finishing"
                options={finishingChoices}
                value={finishingId}
                onChange={(v) => {
                  setFinishingId(v as string);
                  setJumlah({});
                }}
                placeholder="Pilih finishing"
                disabled={create.isPending}
              />
              <Input
                label="Tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={create.isPending}
              />
              <ComboSelect
                label="PIC"
                options={userOptions
                  .filter((u) => u.isActive || u.id === picId)
                  .map((u) => ({ value: u.id, label: u.displayName }))}
                value={picId}
                onChange={(v) => setPicId((v as string) || null)}
                placeholder="Pilih PIC"
                disabled={create.isPending}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <ComboSelect
                label="Kemasan"
                options={kemasanOptions
                  .filter((k) => k.isActive || k.id === kemasanId)
                  .map((k) => ({ value: k.id, label: `${k.kode} — ${k.nama}` }))}
                value={kemasanId}
                onChange={(v) => setKemasanId((v as string) || null)}
                placeholder="Pilih kemasan"
                disabled={create.isPending}
              />
              <Input
                label="Batch"
                placeholder="Misal: B-2609-01"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                disabled={create.isPending}
              />
              <ComboSelect
                label="Gudang Tujuan"
                options={gudangOptions
                  .filter((g) => g.isActive || g.id === gudangId)
                  .map((g) => ({ value: g.id, label: g.nama }))}
                value={gudangId}
                onChange={(v) => setGudangId((v as string) || null)}
                placeholder="Pilih gudang"
                disabled={create.isPending}
              />
            </div>

            {terpilih.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-dark-2">
                    <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-2">Produk / SKU</th>
                      <th className="px-3 py-2">Warna / Ukuran</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2 text-right">Sisa</th>
                      <th className="px-3 py-2 text-right w-24">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terpilih.map((b) => (
                      <tr
                        key={b.finishingDetailId}
                        className="border-t border-stroke dark:border-dark-3"
                      >
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
                            value={(jumlah[b.finishingDetailId] ?? 0) || ""}
                            onChange={(e) =>
                              setJumlah((p) => ({
                                ...p,
                                [b.finishingDetailId]: Math.max(
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
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: <strong>{totalPcs} pcs</strong>
              </span>
              <Button loading={create.isPending} onClick={simpan} disabled={totalPcs === 0}>
                <Package size={16} className="mr-1.5" /> Buat Packing
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Dokumen Packing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Finishing</th>
                <th className="px-4 py-3 text-right">Pcs</th>
                <th className="px-4 py-3 text-right">Masuk Gudang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{p.nomorDokumen}</td>
                  <td className="px-4 py-3">{formatTanggal(p.tanggal)}</td>
                  <td className="px-4 py-3">{p.nomorFinishing || "—"}</td>
                  <td className="px-4 py-3 text-right">{Number(p.totalPcs)}</td>
                  <td className="px-4 py-3 text-right">{Number(p.sudahMasukGudang)}</td>
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
                    <div className="flex justify-center gap-1">
                      {p.status === "draft" && (
                        <Button
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => setStatus.mutate({ id: p.id, status: "berjalan" })}
                        >
                          <Play size={14} />
                        </Button>
                      )}
                      {p.status === "berjalan" && (
                        <>
                          <Button
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => setBukaChecklist(bukaChecklist === p.id ? null : p.id)}
                          >
                            Checklist
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatus.mutate({ id: p.id, status: "selesai" })}
                          >
                            <CheckCircle size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() => setStatus.mutate({ id: p.id, status: "dibatalkan" })}
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
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada dokumen packing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dok && (
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-1 font-semibold text-dark dark:text-white">
            Checklist Packing — {dok.nomorDokumen}
          </h3>
          <p
            className={cn(
              "mb-4 text-sm",
              kurang > 0 ? "text-amber-600" : "text-green-600",
            )}
          >
            {kurang > 0
              ? `${kurang} item belum dicentang — status selesai akan ditolak.`
              : "Checklist lengkap — dokumen boleh diselesaikan."}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST_PACKING.map((c) => (
              <Checkbox
                key={c.key}
                checked={checklistNow[c.key] === true}
                onChange={(checked) =>
                  setChecklist.mutate({
                    id: dok.id,
                    checklist: { ...checklistNow, [c.key]: checked },
                  })
                }
                label={c.label}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setBukaChecklist(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
