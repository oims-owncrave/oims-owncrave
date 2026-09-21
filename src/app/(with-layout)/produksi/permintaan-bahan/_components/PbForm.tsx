"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { pbSchema, type PbInput } from "@/lib/schemas/permintaan-bahan";
import { usePermintaanMutation } from "@/hooks/usePermintaanBahan";

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  ukuran?: string | null;
  satuanSingkatan: string | null;
  isActive: boolean;
};

interface Props {
  /** Label PO yang dituju — PO terkunci dari halaman PO / saat edit */
  poLabel: string;
  bahanOptions: BahanOption[];
  editId?: string;
  defaultValues: PbInput;
}

const EMPTY_ROW = { bahanId: "", kebutuhan: undefined as unknown as number, jumlahDiminta: undefined as unknown as number };

export function PbForm({ poLabel, bahanOptions, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = usePermintaanMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PbInput>({
    resolver: zodResolver(pbSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "details" });
  const details = watch("details");

  const bahanChoices = (index: number) =>
    bahanOptions.filter(
      (b) =>
        (b.isActive || b.id === details?.[index]?.bahanId) &&
        !details?.some((d, di) => di !== index && d.bahanId === b.id),
    );

  async function onSubmit(data: PbInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/produksi/permintaan-bahan");
  }

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="PO Produksi" value={poLabel} disabled readOnly />
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />
          <Input
            type="date"
            label="Tanggal Dibutuhkan"
            {...register("tanggalDibutuhkan")}
            error={errors.tanggalDibutuhkan?.message}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            {...register("catatan")}
            error={errors.catatan?.message}
          />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Bahan Diminta</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_ROW)}>
            <Plus size={16} className="mr-1.5" />
            Tambah Bahan
          </Button>
        </div>

        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Baris terisi otomatis dari estimasi kebutuhan yang stoknya kurang — sesuaikan bila perlu.
        </p>
        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const row = details?.[index];
            const bahanDipilih = bahanOptions.find((b) => b.id === row?.bahanId);
            const satuan = bahanDipilih?.satuanSingkatan;
            return (
              <div
                key={field.id}
                className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-3 md:last:border-none"
              >
                <div className="mb-3 flex items-center justify-between md:hidden">
                  <span className="text-xs font-semibold text-dark-5 dark:text-dark-6">Bahan #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] md:items-start">
                  <ComboSelect
                    label={index === 0 ? "Bahan" : undefined}
                    placeholder="Pilih bahan"
                    options={bahanChoices(index).map((b) => ({
                      label: `${b.kode} — ${b.nama}${b.ukuran ? " · " + b.ukuran : ""}`,
                      value: b.id,
                    }))}
                    value={row?.bahanId || null}
                    onChange={(v) =>
                      setValue(`details.${index}.bahanId`, (v as string) ?? "", { shouldValidate: true })
                    }
                    error={errors.details?.[index]?.bahanId}
                  />

                  <NumberInput
                    decimals={3}
                    placeholder="0"
                    label={index === 0 ? "Kebutuhan (estimasi)" : undefined}
                    value={watch(`details.${index}.kebutuhan`)}
                    onChange={(v) =>
                      setValue(`details.${index}.kebutuhan`, v as number, { shouldValidate: true })
                    }
                    error={errors.details?.[index]?.kebutuhan?.message}
                  />

                  <NumberInput
                    decimals={3}
                    placeholder="0"
                    label={index === 0 ? "Diminta" : undefined}
                    icon={satuan ? <span className="text-xs">{satuan}</span> : undefined}
                    iconPosition="right"
                    value={watch(`details.${index}.jumlahDiminta`)}
                    onChange={(v) =>
                      setValue(`details.${index}.jumlahDiminta`, v as number, { shouldValidate: true })
                    }
                    error={errors.details?.[index]?.jumlahDiminta?.message}
                  />

                  <div className="hidden md:block">
                    {index === 0 && <div className="mb-2 h-5" aria-hidden />}
                    <div className="flex h-10 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                        className="rounded p-2 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent dark:text-dark-6 dark:hover:bg-red-500/10"
                        title="Hapus baris"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/produksi/permintaan-bahan"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          {isEditing ? "Simpan Perubahan" : "Simpan (Draft)"}
        </Button>
      </div>
    </form>
  );
}
