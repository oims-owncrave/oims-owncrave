"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  penerimaanQcSchema,
  type PenerimaanQcInput,
  type PenerimaanQcFormValues,
} from "@/lib/schemas/penerimaan-qc";
import { QC_PRIORITAS_OPTIONS } from "@/lib/qc/prioritas";
import { listLokasiProduksi } from "@/services/lokasi-produksi";
import type { AntreanQcRow } from "@/services/penerimaan-qc";
import { usePenerimaanQcMutation } from "@/hooks/usePenerimaanQc";

interface Props {
  open: boolean;
  onClose: () => void;
  penerimaanHasilId: string | null;
  baris: AntreanQcRow[];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function KirimQcModal({ open, onClose, penerimaanHasilId, baris }: Props) {
  const { create } = usePenerimaanQcMutation();
  const isPending = create.isPending;

  // jumlah per baris antrean, default = sisa penuh
  const [jumlah, setJumlah] = useState<Record<string, number>>({});

  const { data: lokasiList } = useQuery({
    queryKey: ["lokasi-produksi"],
    queryFn: () => listLokasiProduksi(),
  });

  const lokasiOptions = useMemo(
    () => [
      { value: "", label: "— Tanpa lokasi —" },
      ...(lokasiList ?? [])
        .filter((l) => l.isActive)
        .map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` })),
    ],
    [lokasiList],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PenerimaanQcFormValues, unknown, PenerimaanQcInput>({
    resolver: zodResolver(penerimaanQcSchema),
  });

  useEffect(() => {
    if (!open || !penerimaanHasilId) return;
    reset({
      penerimaanHasilJahitId: penerimaanHasilId,
      tanggal: today(),
      lokasiId: null,
      penerima: "",
      prioritas: "normal",
      targetSelesai: "",
      catatan: "",
      details: [],
    });
    setJumlah(
      Object.fromEntries(baris.map((b) => [b.penerimaanHasilDetailId, b.sisa])),
    );
    // baris sengaja tidak jadi dependency: isinya array baru tiap render induk,
    // kalau dimasukkan akan reset input user terus-menerus (bug render loop T3).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, penerimaanHasilId, reset]);

  const totalPcs = baris.reduce(
    (n, b) => n + (jumlah[b.penerimaanHasilDetailId] ?? 0),
    0,
  );

  const onSubmit = async (data: PenerimaanQcInput) => {
    const details = baris
      .map((b) => ({
        penerimaanHasilDetailId: b.penerimaanHasilDetailId,
        varianId: b.varianId,
        jumlahPcs: jumlah[b.penerimaanHasilDetailId] ?? 0,
        catatan: null,
      }))
      .filter((d) => d.jumlahPcs > 0);

    if (details.length === 0) return;

    const res = await create.mutateAsync({ ...data, details });
    if (!res.error) onClose();
  };

  if (!open || !penerimaanHasilId) return null;

  const sumber = baris[0];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Kirim ke QC</h2>
        {sumber && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Dari {sumber.nomorPenerimaan} · PO {sumber.nomorPo} · {sumber.pihakNama}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tanggal"
              type="date"
              error={errors.tanggal?.message}
              {...register("tanggal")}
              disabled={isPending}
            />
            <Input
              label="Penerima QC"
              placeholder="Nama petugas penerima"
              error={errors.penerima?.message}
              {...register("penerima")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Prioritas"
              options={QC_PRIORITAS_OPTIONS}
              error={errors.prioritas?.message}
              {...register("prioritas")}
              disabled={isPending}
            />
            <Input
              label="Target Selesai QC"
              type="date"
              error={errors.targetSelesai?.message}
              {...register("targetSelesai")}
              disabled={isPending}
            />
          </div>

          <Select
            label="Lokasi QC"
            options={lokasiOptions}
            error={errors.lokasiId?.message}
            {...register("lokasiId")}
            disabled={isPending}
          />

          <div className="rounded-lg border border-stroke dark:border-dark-3 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Bundel</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Warna / Ukuran</th>
                  <th className="px-3 py-2 text-right">Sisa</th>
                  <th className="px-3 py-2 text-right w-32">Kirim (pcs)</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr
                    key={b.penerimaanHasilDetailId}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-3 py-2">{b.bundelNomor}</td>
                    <td className="px-3 py-2">{b.sku}</td>
                    <td className="px-3 py-2">
                      {b.warnaNama} / {b.ukuran}
                    </td>
                    <td className="px-3 py-2 text-right">{b.sisa}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={b.sisa}
                        value={jumlah[b.penerimaanHasilDetailId] ?? 0}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(b.sisa, Number(e.target.value) || 0),
                          );
                          setJumlah((prev) => ({
                            ...prev,
                            [b.penerimaanHasilDetailId]: v,
                          }));
                        }}
                        disabled={isPending}
                        className="w-full rounded-md border border-stroke bg-transparent px-2 py-1 text-right outline-hidden focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-dark-2">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-medium">
                    Total dikirim
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-dark dark:text-white">
                    {totalPcs} pcs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Input
            label="Catatan"
            placeholder="Opsional"
            error={errors.catatan?.message}
            {...register("catatan")}
            disabled={isPending}
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending} disabled={totalPcs === 0}>
              {isPending ? "Menyimpan..." : "Kirim ke QC"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
