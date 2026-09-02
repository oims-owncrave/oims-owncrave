"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import { hasilSchema, type HasilInput } from "@/lib/schemas/wo-cutting";
import { useHasilList, useRekapHasil, useHasilMutation } from "@/hooks/useWoCutting";
import type { WoDetailData } from "@/services/wo-cutting";

interface Props {
  woId: string;
  woStatus: WoDetailData["status"];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function HasilSection({ woId, woStatus }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: rekap } = useRekapHasil(woId);
  const { data: docs } = useHasilList(woId);
  const { create, remove } = useHasilMutation(woId);

  const bisaCatat = ["sedang_dikerjakan", "selesai_sebagian", "selesai"].includes(woStatus);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<HasilInput>({
    resolver: zodResolver(hasilSchema),
    defaultValues: { tanggal: todayISO(), catatan: "", details: [] },
  });
  const { replace } = useFieldArray({ control, name: "details" });

  useEffect(() => {
    if (modalOpen && rekap) {
      reset({ tanggal: todayISO(), catatan: "", details: [] });
      replace(rekap.map((r) => ({ varianId: r.varianId, jumlahBaik: 0, jumlahRusak: 0 })));
    }
  }, [modalOpen, rekap, reset, replace]);

  const onSubmit = async (data: HasilInput) => {
    const res = await create.mutateAsync(data);
    if (!res.error) setModalOpen(false);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
        <h3 className="font-semibold text-dark dark:text-white">Hasil Cutting</h3>
        <Button size="sm" onClick={() => setModalOpen(true)} disabled={!bisaCatat}>
          + Catat Hasil
        </Button>
      </div>

      {/* Rekap agregat per varian vs target */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium text-right">Target</th>
              <th className="px-5 py-3 font-medium text-right">Baik</th>
              <th className="px-5 py-3 font-medium text-right">Rusak</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium text-right">Kurang/Lebih</th>
            </tr>
          </thead>
          <tbody>
            {(rekap ?? []).map((r) => (
              <tr key={r.varianId} className="border-t border-stroke dark:border-dark-3">
                <td className="px-5 py-3 font-medium text-dark dark:text-white">
                  {r.sku} <span className="font-normal text-gray-500 dark:text-gray-400">({r.warnaNama}/{r.ukuran})</span>
                </td>
                <td className="px-5 py-3 text-right text-dark dark:text-white">{r.target}</td>
                <td className="px-5 py-3 text-right text-dark dark:text-white">{r.baik}</td>
                <td className="px-5 py-3 text-right text-dark dark:text-white">{r.rusak}</td>
                <td className="px-5 py-3 text-right text-dark dark:text-white">{r.total}</td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-medium",
                    r.selisih === 0
                      ? "text-green-700 dark:text-green-300"
                      : r.selisih < 0
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-blue-700 dark:text-blue-300",
                  )}
                >
                  {r.selisih === 0 ? "pas" : r.selisih > 0 ? `+${r.selisih}` : r.selisih}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dokumen hasil */}
      {(docs ?? []).length > 0 && (
        <div className="border-t border-stroke dark:border-dark-3">
          <p className="px-5 pt-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            Dokumen Hasil
          </p>
          <ul className="divide-y divide-stroke dark:divide-dark-3">
            {(docs ?? []).map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-medium text-dark dark:text-white">{doc.nomorDokumen}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {fmtDate(doc.tanggal)} · {doc.totalBaik} baik / {doc.totalRusak} rusak
                    {doc.catatan ? ` · ${doc.catatan}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(doc.id)}
                  className="rounded p-2 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-6 dark:hover:bg-red-500/10"
                  title="Hapus dokumen hasil"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal catat hasil */}
      {modalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!create.isPending ? () => setModalOpen(false) : undefined} />
          <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">Catat Hasil Cutting</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                type="date"
                label="Tanggal"
                required
                {...register("tanggal")}
                error={errors.tanggal?.message}
              />
              <div className="space-y-2">
                {(rekap ?? []).map((r, index) => (
                  <div key={r.varianId} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2">
                    <div className="text-sm text-dark dark:text-white">
                      {index === 0 && (
                        <span className="mb-2 block text-sm font-medium text-gray-700">SKU</span>
                      )}
                      <div className="flex h-10 items-center">{r.sku}</div>
                    </div>
                    <Input
                      type="number"
                      step="1"
                      label={index === 0 ? "Baik" : undefined}
                      {...register(`details.${index}.jumlahBaik`, { valueAsNumber: true })}
                      error={errors.details?.[index]?.jumlahBaik?.message}
                    />
                    <Input
                      type="number"
                      step="1"
                      label={index === 0 ? "Rusak" : undefined}
                      {...register(`details.${index}.jumlahRusak`, { valueAsNumber: true })}
                      error={errors.details?.[index]?.jumlahRusak?.message}
                    />
                  </div>
                ))}
              </div>
              {typeof errors.details?.message === "string" && (
                <p className="text-xs text-red-500">{errors.details.message}</p>
              )}
              {typeof errors.details?.root?.message === "string" && (
                <p className="text-xs text-red-500">{errors.details.root.message}</p>
              )}
              <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
              <div className="mt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={create.isPending}>
                  Batal
                </Button>
                <Button type="submit" loading={create.isPending}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Dokumen Hasil?"
        message="Rekap hasil WO akan berkurang sesuai isi dokumen ini."
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
