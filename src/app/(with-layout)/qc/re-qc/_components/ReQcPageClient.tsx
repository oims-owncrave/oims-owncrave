"use client";

import { useMemo, useState } from "react";
import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Input } from "@/components/ui/Input";
import { useSumberReQc, useReQcList, useReQcMutation } from "@/hooks/useReQc";
import type { SumberReQcRow, ReQcRow } from "@/services/re-qc";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  sumber: SumberReQcRow[];
  riwayat: ReQcRow[];
  userOptions: UserOpt[];
}

const HASIL_OPTIONS = [
  { value: "lolos", label: "Lolos" },
  { value: "perbaikan_ulang", label: "Perbaikan Ulang" },
  { value: "grade_turun", label: "Grade Turun" },
  { value: "reject", label: "Reject" },
];

const GRADE_OPTIONS = [
  { value: "", label: "—" },
  { value: "a", label: "Grade A" },
  { value: "b", label: "Grade B" },
  { value: "c", label: "Grade C" },
];

const HASIL_CLASS: Record<string, string> = {
  lolos: "text-green-600",
  perbaikan_ulang: "text-amber-600",
  grade_turun: "text-blue-600",
  reject: "text-red-600",
};

type Baris = {
  hasil: "lolos" | "perbaikan_ulang" | "grade_turun" | "reject";
  grade: string;
  jumlah: number;
};

export function ReQcPageClient({ sumber, riwayat, userOptions }: Props) {
  const { data: sumberLive } = useSumberReQc();
  const { data: riwayatLive } = useReQcList();
  const { create } = useReQcMutation();

  const antrean = sumberLive ?? sumber;
  const list = riwayatLive ?? riwayat;

  const [sumberKey, setSumberKey] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [petugasId, setPetugasId] = useState<string | null>(null);
  const [baris, setBaris] = useState<Record<string, Baris>>({});

  // satu dokumen Re-QC = satu sumber rework
  const sumberOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of antrean) {
      map.set(`${s.jalur}:${s.sumberId}`, `${s.nomorSumber} (${s.jalur})`);
    }
    return [...map].map(([value, label]) => ({ value, label }));
  }, [antrean]);

  const terpilih = sumberKey
    ? antrean.filter((s) => `${s.jalur}:${s.sumberId}` === sumberKey)
    : [];

  function nilai(id: string): Baris {
    return baris[id] ?? { hasil: "lolos", grade: "a", jumlah: 0 };
  }

  function set(id: string, patch: Partial<Baris>) {
    setBaris((prev) => ({ ...prev, [id]: { ...nilai(id), ...patch } }));
  }

  const details = terpilih
    .map((s) => {
      const v = nilai(s.hasilQcDetailId);
      return {
        hasilQcDetailId: s.hasilQcDetailId,
        varianId: s.varianId,
        jumlah: v.jumlah,
        cacatSebelumnyaId: s.jenisCacatId,
        hasilPerbaikan: null,
        hasilReQc: v.hasil,
        gradeAkhir: v.grade ? (v.grade as "a" | "b" | "c") : null,
        catatan: null,
      };
    })
    .filter((d) => d.jumlah > 0);

  const adaKelebihan = terpilih.some((s) => nilai(s.hasilQcDetailId).jumlah > s.sisa);
  const totalPcs = details.reduce((n, d) => n + d.jumlah, 0);

  async function simpan() {
    if (!sumberKey || details.length === 0) return;
    const [jalur, sumberId] = sumberKey.split(":");
    const awal = terpilih[0];

    const res = await create.mutateAsync({
      hasilQcAwalId: awal.hasilQcAwalId,
      perbaikanInternalId: jalur === "internal" ? sumberId : null,
      returQcVendorId: jalur === "vendor" ? sumberId : null,
      tanggal,
      petugasId,
      catatan: null,
      details,
    });

    if (!res.error) {
      setBaris({});
      setSumberKey(null);
    }
  }

  const userChoices = userOptions
    .filter((u) => u.isActive || u.id === petugasId)
    .map((u) => ({ value: u.id, label: u.displayName }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Re-QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Re-QC" }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">
          Periksa Ulang Hasil Perbaikan
        </h3>

        {sumberOptions.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada hasil perbaikan yang siap di-Re-QC. Selesaikan dulu perbaikan internal,
            atau terima kembali retur vendor.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <ComboSelect
                label="Sumber Perbaikan"
                options={sumberOptions}
                value={sumberKey}
                onChange={(v) => {
                  setSumberKey(v as string);
                  setBaris({});
                }}
                placeholder="Pilih dokumen rework"
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
                label="Petugas"
                options={userChoices}
                value={petugasId}
                onChange={(v) => setPetugasId((v as string) || null)}
                placeholder="Pilih petugas"
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
                      <th className="px-3 py-2 text-right">Sisa</th>
                      <th className="px-3 py-2 w-40">Hasil Re-QC</th>
                      <th className="px-3 py-2 w-32">Grade Akhir</th>
                      <th className="px-3 py-2 text-right w-24">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terpilih.map((s) => {
                      const v = nilai(s.hasilQcDetailId);
                      const butuhGrade = v.hasil === "lolos" || v.hasil === "grade_turun";
                      return (
                        <tr
                          key={s.hasilQcDetailId}
                          className="border-t border-stroke dark:border-dark-3"
                        >
                          <td className="px-3 py-2">
                            <div className="text-dark dark:text-white">{s.produkNama}</div>
                            <div className="text-xs text-gray-500">{s.sku}</div>
                          </td>
                          <td className="px-3 py-2">
                            {s.warnaNama} / {s.ukuran}
                          </td>
                          <td className="px-3 py-2 text-right">{s.sisa}</td>
                          <td className="px-3 py-2">
                            <Select
                              options={HASIL_OPTIONS}
                              value={v.hasil}
                              onChange={(e) =>
                                set(s.hasilQcDetailId, {
                                  hasil: e.target.value as Baris["hasil"],
                                  grade:
                                    e.target.value === "lolos"
                                      ? "a"
                                      : e.target.value === "grade_turun"
                                        ? "b"
                                        : "",
                                })
                              }
                              disabled={create.isPending}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              options={GRADE_OPTIONS}
                              value={v.grade}
                              onChange={(e) => set(s.hasilQcDetailId, { grade: e.target.value })}
                              disabled={create.isPending || !butuhGrade}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              max={s.sisa}
                              placeholder="0"
                              value={v.jumlah || ""}
                              onChange={(e) =>
                                set(s.hasilQcDetailId, {
                                  jumlah: Math.max(
                                    0,
                                    Math.min(s.sisa, Number(e.target.value) || 0),
                                  ),
                                })
                              }
                              disabled={create.isPending}
                              className="w-full rounded-md border border-stroke bg-transparent px-2 py-1 text-right outline-hidden focus:border-primary dark:border-dark-3 dark:text-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: <strong>{totalPcs} pcs</strong>
              </span>
              <Button
                loading={create.isPending}
                onClick={simpan}
                disabled={totalPcs === 0 || adaKelebihan}
              >
                Simpan Re-QC
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Riwayat Re-QC</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Hasil QC Awal</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3 text-right">Putaran</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Lolos</th>
                <th className="px-4 py-3 text-right">Ulang</th>
                <th className="px-4 py-3 text-right">Turun</th>
                <th className="px-4 py-3 text-right">Reject</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{r.nomorDokumen}</td>
                  <td className="px-4 py-3">{formatTanggal(r.tanggal)}</td>
                  <td className="px-4 py-3">{r.nomorHasilQcAwal}</td>
                  <td className="px-4 py-3">{r.nomorPerbaikan || r.nomorRetur || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        r.putaran > 1
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      ke-{r.putaran}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{Number(r.totalPcs)}</td>
                  <td className={cn("px-4 py-3 text-right", HASIL_CLASS.lolos)}>
                    {Number(r.lolos)}
                  </td>
                  <td className={cn("px-4 py-3 text-right", HASIL_CLASS.perbaikan_ulang)}>
                    {Number(r.ulang)}
                  </td>
                  <td className={cn("px-4 py-3 text-right", HASIL_CLASS.grade_turun)}>
                    {Number(r.turun)}
                  </td>
                  <td className={cn("px-4 py-3 text-right", HASIL_CLASS.reject)}>
                    {Number(r.reject)}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Belum ada Re-QC dicatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
