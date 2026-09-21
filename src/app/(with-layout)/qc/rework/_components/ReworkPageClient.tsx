"use client";

import { useState } from "react";
import { cn, formatTanggal, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Wrench, Truck, Play, CheckCircle, Ban } from "lucide-react";
import { BuatReworkModal } from "./BuatReworkModal";
import {
  useBarisSiapRework,
  usePerbaikanInternalList,
  useReturQcVendorList,
  useReworkMutation,
} from "@/hooks/useRework";
import type {
  BarisReworkRow,
  PerbaikanInternalRow,
  ReturQcVendorRow,
} from "@/services/rework";
import type { JenisCacat } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  baris: BarisReworkRow[];
  internalData: PerbaikanInternalRow[];
  returData: ReturQcVendorRow[];
  userOptions: UserOpt[];
  cacatOptions: JenisCacat[];
  hideHeader?: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  dikerjakan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dikirim: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  diterima_kembali: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[status])}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ReworkPageClient({
  baris,
  internalData,
  returData,
  userOptions,
  cacatOptions,
  hideHeader = false,
}: Props) {
  const [tab, setTab] = useState<"antrean" | "internal" | "vendor">("antrean");
  const [modal, setModal] = useState<"internal" | "vendor" | null>(null);

  const { data: barisLive } = useBarisSiapRework();
  const { data: internalLive } = usePerbaikanInternalList();
  const { data: returLive } = useReturQcVendorList();
  const { setStatusInternal, setStatusRetur } = useReworkMutation();

  const antrean = barisLive ?? baris;
  const internal = internalLive ?? internalData;
  const retur = returLive ?? returData;

  const totalSisa = antrean.reduce((n, b) => n + b.sisa, 0);

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          title="Rework"
          breadcrumb={[{ label: "Quality Control" }, { label: "Rework" }]}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["antrean", `Antrean Perbaikan (${totalSisa} pcs)`],
            ["internal", `Perbaikan Internal (${internal.length})`],
            ["vendor", `Retur ke Vendor (${retur.length})`],
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

      {tab === "antrean" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-6 py-4 dark:border-dark-3">
            <h3 className="font-semibold text-dark dark:text-white">
              Barang Menunggu Perbaikan
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setModal("internal")}
                disabled={antrean.length === 0}
              >
                <Wrench size={16} className="mr-1.5" /> Perbaikan Internal
              </Button>
              <Button onClick={() => setModal("vendor")} disabled={antrean.length === 0}>
                <Truck size={16} className="mr-1.5" /> Retur ke Vendor
              </Button>
            </div>
          </div>

          {antrean.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Tidak ada barang menunggu perbaikan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-2">
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Hasil QC</th>
                    <th className="px-4 py-3">PO</th>
                    <th className="px-4 py-3">Produk / SKU</th>
                    <th className="px-4 py-3">Warna / Ukuran</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3 text-right">Perbaikan</th>
                    <th className="px-4 py-3 text-right">Sudah Diproses</th>
                    <th className="px-4 py-3 text-right">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {antrean.map((b) => (
                    <tr
                      key={b.hasilQcDetailId}
                      className="border-t border-stroke dark:border-dark-3"
                    >
                      <td className="px-4 py-3">{b.nomorHasilQc}</td>
                      <td className="px-4 py-3">{b.nomorPo || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-dark dark:text-white">{b.produkNama}</div>
                        <div className="text-xs text-gray-500">{b.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        {b.warnaNama} / {b.ukuran}
                      </td>
                      <td className="px-4 py-3">{b.vendorNama || "Internal"}</td>
                      <td className="px-4 py-3 text-right">{b.perbaikan}</td>
                      <td className="px-4 py-3 text-right">{Number(b.sudah)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">
                        {b.sisa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "internal" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Hasil QC</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3 text-right">Pcs</th>
                  <th className="px-4 py-3 text-right">Estimasi Biaya</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {internal.map((r) => (
                  <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">{r.nomorDokumen}</td>
                    <td className="px-4 py-3">{formatTanggal(r.tanggal)}</td>
                    <td className="px-4 py-3">{r.nomorHasilQc}</td>
                    <td className="px-4 py-3">{r.picNama || "—"}</td>
                    <td className="px-4 py-3 text-right">{Number(r.totalPcs)}</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(r.estimasiBiaya)}</td>
                    <td className="px-4 py-3">{formatTanggal(r.targetSelesai)}</td>
                    <td className="px-4 py-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {r.status === "draft" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() =>
                              setStatusInternal.mutate({ id: r.id, status: "dikerjakan" })
                            }
                          >
                            <Play size={14} />
                          </Button>
                        )}
                        {r.status === "dikerjakan" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() =>
                              setStatusInternal.mutate({ id: r.id, status: "selesai" })
                            }
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                        {(r.status === "draft" || r.status === "dikerjakan") && (
                          <Button
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() =>
                              setStatusInternal.mutate({ id: r.id, status: "dibatalkan" })
                            }
                          >
                            <Ban size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {internal.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Belum ada perbaikan internal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "vendor" && (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Kirim</th>
                  <th className="px-4 py-3">Hasil QC</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Pcs</th>
                  <th className="px-4 py-3 text-right">Potongan</th>
                  <th className="px-4 py-3">Biaya Ditanggung</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {retur.map((r) => (
                  <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">{r.nomorDokumen}</td>
                    <td className="px-4 py-3">{formatTanggal(r.tanggalKirim)}</td>
                    <td className="px-4 py-3">{r.nomorHasilQc}</td>
                    <td className="px-4 py-3">{r.vendorNama || "—"}</td>
                    <td className="px-4 py-3 text-right">{Number(r.totalPcs)}</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(r.totalPotongan)}</td>
                    <td className="px-4 py-3">{r.penanggungBiaya}</td>
                    <td className="px-4 py-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {r.status === "draft" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatusRetur.mutate({ id: r.id, status: "dikirim" })}
                          >
                            <Truck size={14} />
                          </Button>
                        )}
                        {r.status === "dikirim" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() =>
                              setStatusRetur.mutate({ id: r.id, status: "diterima_kembali" })
                            }
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                        {r.status === "diterima_kembali" && (
                          <Button
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatusRetur.mutate({ id: r.id, status: "selesai" })}
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {retur.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Belum ada retur ke vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BuatReworkModal
        jalur={modal}
        onClose={() => setModal(null)}
        baris={antrean}
        userOptions={userOptions}
        cacatOptions={cacatOptions}
      />
    </div>
  );
}
