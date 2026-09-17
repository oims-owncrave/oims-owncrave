"use client";

import { useState } from "react";
import { cn, formatTanggal, formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { PackageX, Eye, Check, X } from "lucide-react";
import {
  useRejectBelumKarantina,
  useKarantinaRejectList,
  useKarantinaRejectDetail,
  useKarantinaRejectMutation,
} from "@/hooks/useKarantinaReject";
import { rejectPenyebabValues, rejectTindakanValues } from "@/lib/schemas/karantina-reject";
import type { RejectBelumKarantinaRow, KarantinaRejectRow } from "@/services/karantina-reject";
import type { JenisCacat } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  belum: RejectBelumKarantinaRow[];
  karantinaData: KarantinaRejectRow[];
  userOptions: UserOpt[];
  cacatOptions: JenisCacat[];
}

const label = (v: string) => v.replace(/_/g, " ");

const PENYEBAB_OPTIONS = rejectPenyebabValues.map((v) => ({ value: v, label: label(v) }));
const TINDAKAN_OPTIONS = rejectTindakanValues.map((v) => ({ value: v, label: label(v) }));

const STATUS_CLASS: Record<string, string> = {
  dikarantina: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ditindaklanjuti: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function KarantinaPageClient({
  belum,
  karantinaData,
  userOptions,
  cacatOptions,
}: Props) {
  const [buka, setBuka] = useState<string | null>(null);
  const [pilih, setPilih] = useState<Record<string, number>>({});
  const [penyebab, setPenyebab] = useState<Record<string, string>>({});
  const [nilai, setNilai] = useState<Record<string, number>>({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [lokasi, setLokasi] = useState("");
  const [picId, setPicId] = useState<string | null>(null);

  // form tindakan
  const [tDetailId, setTDetailId] = useState<string | null>(null);
  const [tJenis, setTJenis] = useState<string>("musnahkan");
  const [tJumlah, setTJumlah] = useState(0);

  const { data: belumLive } = useRejectBelumKarantina();
  const { data: listLive } = useKarantinaRejectList();
  const { data: detail } = useKarantinaRejectDetail(buka);
  const { create, buatTindakan, approve } = useKarantinaRejectMutation(buka);

  const antrean = belumLive ?? belum;
  const list = listLive ?? karantinaData;

  const userChoices = userOptions
    .filter((u) => u.isActive || u.id === picId)
    .map((u) => ({ value: u.id, label: u.displayName }));

  const details = antrean
    .map((b) => ({
      hasilQcDetailId: b.hasilQcDetailId,
      varianId: b.varianId,
      jumlah: pilih[b.hasilQcDetailId] ?? 0,
      penyebab: (penyebab[b.hasilQcDetailId] ??
        "kerusakan_permanen") as (typeof rejectPenyebabValues)[number],
      jenisCacatId: null,
      nilaiPerPcs: nilai[b.hasilQcDetailId] ?? 0,
      fotoUrl: null,
    }))
    .filter((d) => d.jumlah > 0);

  const totalPcs = details.reduce((n, d) => n + d.jumlah, 0);

  async function simpanKarantina() {
    if (details.length === 0) return;
    const hasilQcId = antrean.find(
      (b) => b.hasilQcDetailId === details[0].hasilQcDetailId,
    )?.hasilQcId;
    if (!hasilQcId) return;

    const res = await create.mutateAsync({
      hasilQcId,
      reQcId: null,
      tanggal,
      lokasiSimpan: lokasi || null,
      picId,
      catatan: null,
      details,
    });

    if (!res.error) {
      setPilih({});
      setNilai({});
    }
  }

  async function simpanTindakan() {
    if (!tDetailId || tJumlah <= 0) return;
    const res = await buatTindakan.mutateAsync({
      karantinaRejectDetailId: tDetailId,
      tindakan: tJenis as (typeof rejectTindakanValues)[number],
      jumlah: tJumlah,
      tanggal: new Date().toISOString().slice(0, 10),
      catatan: null,
      buktiUrl: null,
    });
    if (!res.error) {
      setTDetailId(null);
      setTJumlah(0);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Karantina Reject"
        breadcrumb={[{ label: "Quality Control" }, { label: "Karantina Reject" }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-1 font-semibold text-dark dark:text-white">
          Reject Menunggu Dikarantina
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Barang reject wajib masuk karantina supaya tidak menguap dari catatan.
        </p>

        {antrean.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada reject menunggu dikarantina.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={create.isPending}
              />
              <Input
                label="Lokasi Simpan"
                placeholder="Misal: Rak karantina A"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
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
                    <th className="px-3 py-2">Hasil QC</th>
                    <th className="px-3 py-2">Produk / SKU</th>
                    <th className="px-3 py-2 text-right">Sisa Reject</th>
                    <th className="px-3 py-2 w-48">Penyebab</th>
                    <th className="px-3 py-2 text-right w-28">Nilai/pcs</th>
                    <th className="px-3 py-2 text-right w-24">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {antrean.map((b) => (
                    <tr
                      key={b.hasilQcDetailId}
                      className="border-t border-stroke dark:border-dark-3"
                    >
                      <td className="px-3 py-2">{b.nomorSumber}</td>
                      <td className="px-3 py-2">
                        <div className="text-dark dark:text-white">{b.produkNama}</div>
                        <div className="text-xs text-gray-500">
                          {b.sku} · {b.warnaNama}/{b.ukuran}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">
                        {b.sisa}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          options={PENYEBAB_OPTIONS}
                          value={penyebab[b.hasilQcDetailId] ?? "kerusakan_permanen"}
                          onChange={(e) =>
                            setPenyebab((p) => ({
                              ...p,
                              [b.hasilQcDetailId]: e.target.value,
                            }))
                          }
                          disabled={create.isPending}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={nilai[b.hasilQcDetailId] ?? 0}
                          onChange={(e) =>
                            setNilai((p) => ({
                              ...p,
                              [b.hasilQcDetailId]: Number(e.target.value) || 0,
                            }))
                          }
                          disabled={create.isPending}
                          className="w-full rounded-md border border-stroke bg-transparent px-2 py-1 text-right outline-hidden focus:border-primary dark:border-dark-3 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={b.sisa}
                          value={pilih[b.hasilQcDetailId] ?? 0}
                          onChange={(e) =>
                            setPilih((p) => ({
                              ...p,
                              [b.hasilQcDetailId]: Math.max(
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
              <Button
                loading={create.isPending}
                onClick={simpanKarantina}
                disabled={totalPcs === 0}
              >
                <PackageX size={16} className="mr-1.5" /> Karantina
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Daftar Karantina</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3 text-right">Pcs</th>
                <th className="px-4 py-3 text-right">Ditindak</th>
                <th className="px-4 py-3 text-right">Nilai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((k) => (
                <tr key={k.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{k.nomorDokumen}</td>
                  <td className="px-4 py-3">{formatTanggal(k.tanggal)}</td>
                  <td className="px-4 py-3">{k.nomorHasilQc || k.nomorReQc || "—"}</td>
                  <td className="px-4 py-3">{k.lokasiSimpan || "—"}</td>
                  <td className="px-4 py-3 text-right">{Number(k.totalPcs)}</td>
                  <td className="px-4 py-3 text-right">{Number(k.sudahDitindak)}</td>
                  <td className="px-4 py-3 text-right">{formatRupiah(k.nilaiTotal)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        STATUS_CLASS[k.status],
                      )}
                    >
                      {label(k.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => setBuka(buka === k.id ? null : k.id)}
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada karantina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {buka && detail && (
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-1 font-semibold text-dark dark:text-white">Tindakan Reject</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Tindakan baru berdampak setelah disetujui owner — sebelum itu stok tidak berubah.
          </p>

          <div className="overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Produk / SKU</th>
                  <th className="px-3 py-2">Penyebab</th>
                  <th className="px-3 py-2 text-right">Jumlah</th>
                  <th className="px-3 py-2 text-right">Sisa Belum Ditindak</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {detail.details.map((d) => (
                  <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-3 py-2">
                      <div className="text-dark dark:text-white">{d.produkNama}</div>
                      <div className="text-xs text-gray-500">
                        {d.sku} · {d.warnaNama}/{d.ukuran}
                      </div>
                    </td>
                    <td className="px-3 py-2">{label(d.penyebab)}</td>
                    <td className="px-3 py-2 text-right">{d.jumlah}</td>
                    <td className="px-3 py-2 text-right font-medium">{d.sisa}</td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setTDetailId(d.id);
                          setTJumlah(d.sisa);
                        }}
                        disabled={d.sisa <= 0}
                      >
                        Tindak
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tDetailId && (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-stroke p-4 dark:border-dark-3">
              <div className="min-w-52">
                <Select
                  label="Tindakan"
                  options={TINDAKAN_OPTIONS}
                  value={tJenis}
                  onChange={(e) => setTJenis(e.target.value)}
                  disabled={buatTindakan.isPending}
                />
              </div>
              <div className="w-28">
                <NumberInput
                  label="Jumlah"
                  placeholder="0"
                  value={tJumlah}
                  onChange={(v) => setTJumlah(v ?? 0)}
                  disabled={buatTindakan.isPending}
                />
              </div>
              <Button loading={buatTindakan.isPending} onClick={simpanTindakan}>
                Ajukan
              </Button>
              <Button variant="outline" onClick={() => setTDetailId(null)}>
                Batal
              </Button>
            </div>
          )}

          {detail.tindakan.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-2">
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Tindakan</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2">Tanggal</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-center">Persetujuan</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.tindakan.map((t) => (
                    <tr key={t.id} className="border-t border-stroke dark:border-dark-3">
                      <td className="px-3 py-2">{t.sku}</td>
                      <td className="px-3 py-2">{label(t.tindakan)}</td>
                      <td className="px-3 py-2 text-right">{t.jumlah}</td>
                      <td className="px-3 py-2">{formatTanggal(t.tanggal)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            STATUS_CLASS[t.status],
                          )}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {t.status === "pending" ? (
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-green-600"
                              onClick={() => approve.mutate({ id: t.id, setuju: true })}
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-red-600"
                              onClick={() => approve.mutate({ id: t.id, setuju: false })}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <span className="block text-center text-xs text-gray-500">
                            {formatTanggal(t.approvedAt)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
