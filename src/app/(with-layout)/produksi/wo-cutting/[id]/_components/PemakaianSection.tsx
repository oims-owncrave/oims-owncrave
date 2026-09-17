"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2 } from "lucide-react";
import { pemakaianSchema, type PemakaianInput } from "@/lib/schemas/wo-cutting";
import {
  usePemakaianList,
  useDiterimaPerBahan,
  usePemakaianMutation,
} from "@/hooks/useWoCutting";
import { useEstimasiBahan } from "@/hooks/usePoProduksi";
import type { PemakaianRow } from "@/services/wo-cutting";

interface Props {
  woId: string;
  poId: string;
}

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function PemakaianSection({ woId, poId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<PemakaianRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: rows } = usePemakaianList(woId);
  const { data: diterima } = useDiterimaPerBahan(woId);
  const { data: estimasi } = useEstimasiBahan(poId);
  const { upsert, remove } = usePemakaianMutation(woId);

  const estimasiRows = estimasi && !("error" in estimasi) ? estimasi.rows : [];
  const diterimaMap = new Map((diterima ?? []).map((d) => [d.bahanId, Number(d.total)]));
  const standarMap = new Map(estimasiRows.map((r) => [r.bahanId, r.kebutuhanStandar]));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PemakaianInput>({
    resolver: zodResolver(pemakaianSchema),
    defaultValues: {
      bahanId: "",
      jumlahDiterima: undefined,
      jumlahDigunakan: undefined,
      jumlahSisa: undefined,
      jumlahLimbah: undefined,
      catatan: "",
    },
  });

  const bahanId = watch("bahanId");

  useEffect(() => {
    if (modalOpen) {
      if (editRow) {
        reset({
          bahanId: editRow.bahanId,
          jumlahDiterima: Number(editRow.jumlahDiterima),
          jumlahDigunakan: Number(editRow.jumlahDigunakan),
          jumlahSisa: Number(editRow.jumlahSisa),
          jumlahLimbah: Number(editRow.jumlahLimbah),
          catatan: editRow.catatan ?? "",
        });
      } else {
        reset({
          bahanId: "",
          jumlahDiterima: undefined,
          jumlahDigunakan: undefined,
          jumlahSisa: undefined,
          jumlahLimbah: undefined,
          catatan: "",
        });
      }
    }
  }, [modalOpen, editRow, reset]);

  // pilih bahan baru → prefill diterima dari penerimaan cutting PO
  useEffect(() => {
    if (modalOpen && !editRow && bahanId) {
      setValue("jumlahDiterima", diterimaMap.get(bahanId) ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bahanId, modalOpen, editRow]);

  // pilihan bahan modal = bahan BOM (estimasi) yang belum dicatat, atau bahan yang sedang diedit
  const bahanChoices = estimasiRows.filter(
    (r) => r.bahanId === editRow?.bahanId || !(rows ?? []).some((p) => p.bahanId === r.bahanId),
  );

  const onSubmit = async (data: PemakaianInput) => {
    const res = await upsert.mutateAsync(data);
    if (!res.error) {
      setModalOpen(false);
      setEditRow(null);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
        <h3 className="font-semibold text-dark dark:text-white">Pemakaian Bahan Aktual</h3>
        <Button size="sm" onClick={() => { setEditRow(null); setModalOpen(true); }}>
          + Catat Pemakaian
        </Button>
      </div>

      {(rows ?? []).length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Belum ada pemakaian dicatat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">Bahan</th>
                <th className="px-5 py-3 font-medium text-right">Diterima</th>
                <th className="px-5 py-3 font-medium text-right">Digunakan</th>
                <th className="px-5 py-3 font-medium text-right">Sisa</th>
                <th className="px-5 py-3 font-medium text-right">Limbah</th>
                <th className="px-5 py-3 font-medium text-right">Selisih</th>
                <th className="px-5 py-3 font-medium text-right">Varians vs Standar</th>
                <th className="px-5 py-3 font-medium text-right">Nilai Pemakaian</th>
                <th className="px-5 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => {
                const diterimaN = Number(r.jumlahDiterima);
                const digunakan = Number(r.jumlahDigunakan);
                const sisa = Number(r.jumlahSisa);
                const limbah = Number(r.jumlahLimbah);
                const selisih = diterimaN - digunakan - sisa - limbah;
                const standar = standarMap.get(r.bahanId);
                const varians = standar !== undefined ? digunakan - standar : null;
                const nilai = digunakan * Number(r.hargaRataRata);
                return (
                  <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {r.bahanKode} — {r.bahanNama}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(diterimaN)} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(digunakan)} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">{fmtQty(sisa)}</td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">{fmtQty(limbah)}</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right font-medium",
                        Math.abs(selisih) < 0.0005
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-600 dark:text-red-300",
                      )}
                      title="Diterima − digunakan − sisa − limbah (selisih belum dijelaskan)"
                    >
                      {Math.abs(selisih) < 0.0005 ? "0" : fmtQty(selisih)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right",
                        varians !== null && varians > 0
                          ? "text-yellow-700 dark:text-yellow-300"
                          : "text-dark dark:text-white",
                      )}
                    >
                      {varians === null ? "—" : `${varians > 0 ? "+" : ""}${fmtQty(varians)}`}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">{rupiah(nilai)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditRow(r); setModalOpen(true); }}
                          className="rounded p-1.5 text-dark-5 transition-colors hover:bg-gray-1 hover:text-primary dark:text-dark-6 dark:hover:bg-dark-3"
                          title="Koreksi"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(r.id)}
                          className="rounded p-1.5 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-6 dark:hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal catat/koreksi */}
      {modalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!upsert.isPending ? () => { setModalOpen(false); setEditRow(null); } : undefined} />
          <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
              {editRow ? "Koreksi Pemakaian" : "Catat Pemakaian"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <ComboSelect
                label="Bahan"
                required
                placeholder="Pilih bahan (dari BOM)"
                options={bahanChoices.map((b) => ({
                  label: `${b.bahanKode} — ${b.bahanNama}`,
                  value: b.bahanId,
                }))}
                value={bahanId || null}
                onChange={(v) => setValue("bahanId", (v as string) ?? "", { shouldValidate: true })}
                error={errors.bahanId}
                disabled={!!editRow}
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  decimals={3}
                  placeholder="0"
                  label="Diterima"
                  value={watch("jumlahDiterima")}
                  onChange={(v) =>
                    setValue("jumlahDiterima", v as number, { shouldValidate: true })
                  }
                  error={errors.jumlahDiterima?.message}
                />
                <NumberInput
                  decimals={3}
                  placeholder="0"
                  label="Digunakan"
                  value={watch("jumlahDigunakan")}
                  onChange={(v) =>
                    setValue("jumlahDigunakan", v as number, { shouldValidate: true })
                  }
                  error={errors.jumlahDigunakan?.message}
                />
                <NumberInput
                  decimals={3}
                  placeholder="0"
                  label="Sisa"
                  value={watch("jumlahSisa")}
                  onChange={(v) =>
                    setValue("jumlahSisa", v as number, { shouldValidate: true })
                  }
                  error={errors.jumlahSisa?.message}
                />
                <NumberInput
                  decimals={3}
                  placeholder="0"
                  label="Limbah"
                  value={watch("jumlahLimbah")}
                  onChange={(v) =>
                    setValue("jumlahLimbah", v as number, { shouldValidate: true })
                  }
                  error={errors.jumlahLimbah?.message}
                />
              </div>
              <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rekonsiliasi: diterima = digunakan + sisa + limbah + selisih belum dijelaskan.
                Harga rata-rata di-snapshot saat pertama catat.
              </p>
              <div className="mt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditRow(null); }} disabled={upsert.isPending}>
                  Batal
                </Button>
                <Button type="submit" loading={upsert.isPending}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Pemakaian?"
        message="Baris pemakaian bahan ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </div>
  );
}
