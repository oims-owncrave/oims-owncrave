"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { woSchema, type WoInput } from "@/lib/schemas/wo-cutting";
import { useWoMutation } from "@/hooks/useWoCutting";
import { usePoDetail } from "@/hooks/usePoProduksi";
import type { PoSiapCutting } from "@/services/wo-cutting";
import type { PicOption } from "@/services/po-produksi";

interface Props {
  poOptions: PoSiapCutting[];
  picOptions: PicOption[];
  editId?: string;
  defaultValues?: WoInput;
}

const PRIORITAS_OPTIONS = [
  { value: "rendah", label: "Rendah" },
  { value: "normal", label: "Normal" },
  { value: "tinggi", label: "Tinggi" },
  { value: "urgent", label: "Urgent" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function WoForm({ poOptions, picOptions, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = useWoMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WoInput>({
    resolver: zodResolver(woSchema),
    defaultValues: defaultValues ?? {
      poId: "",
      tanggal: todayISO(),
      pic: "",
      mejaCutting: "",
      prioritas: "normal",
      nomorPola: "",
      catatan: "",
      details: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const poId = watch("poId");

  // Varian + rencana cutting dari PO terpilih
  const { data: poDetail } = usePoDetail(poId || "");
  const poVarian = (poId && poDetail?.details) || [];

  const varianLabel = (varianId: string) => {
    const v = poVarian.find((d) => d.varianId === varianId);
    return v ? `${v.sku} (${v.warnaNama}/${v.ukuran})` : varianId;
  };

  function prefillFromPo() {
    if (!poDetail) return;
    replace(
      poDetail.details.map((d) => ({
        varianId: d.varianId,
        targetCutting: Math.ceil(d.jumlahTarget * (1 + Number(d.toleransiPersen) / 100)),
      })),
    );
  }

  async function onSubmit(data: WoInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/produksi/wo-cutting");
  }

  const isPending = create.isPending || update.isPending;
  const totalTarget = (details ?? []).reduce((s, d) => s + (Number(d.targetCutting) || 0), 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="PO Produksi"
            required
            placeholder="Pilih PO (disetujui)"
            options={poOptions.map((p) => ({ label: `${p.nomorDokumen} — ${p.produkNama}`, value: p.id }))}
            value={poId || null}
            onChange={(v) => {
              setValue("poId", (v as string) ?? "", { shouldValidate: true });
              replace([]);
            }}
            error={errors.poId}
            disabled={isEditing}
          />
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />
          <ComboSelect
            label="PIC Cutting"
            placeholder="Pilih user (opsional)"
            options={picOptions.map((u) => ({ label: u.displayName, value: u.id }))}
            value={watch("pic") || null}
            onChange={(v) => setValue("pic", (v as string) ?? "")}
          />
          <Input
            label="Meja Cutting"
            placeholder="Misal: Meja 1 (opsional)"
            {...register("mejaCutting")}
          />
          <Select
            label="Prioritas"
            options={PRIORITAS_OPTIONS}
            {...register("prioritas")}
            error={errors.prioritas?.message}
          />
          <Input
            label="Nomor Pola"
            placeholder="Opsional"
            {...register("nomorPola")}
          />
          <NumberInput
            decimals={0}
            label="Jumlah Layer"
            placeholder="Opsional"
            value={watch("jumlahLayer")}
            onChange={(v) =>
              setValue("jumlahLayer", v as number, { shouldValidate: true })
            }
          />
          <NumberInput
            decimals={2}
            label="Panjang Marker (m)"
            placeholder="Opsional"
            value={watch("panjangMarker")}
            onChange={(v) =>
              setValue("panjangMarker", v as number, { shouldValidate: true })
            }
          />
          <NumberInput
            decimals={2}
            label="Lebar Kain (cm)"
            placeholder="Opsional"
            value={watch("lebarKain")}
            onChange={(v) =>
              setValue("lebarKain", v as number, { shouldValidate: true })
            }
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            {...register("catatan")}
          />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Target Cutting per Varian</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={prefillFromPo} disabled={!poId}>
              Isi dari PO
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ varianId: "", targetCutting: undefined as unknown as number })}
              disabled={!poId}
            >
              <Plus size={16} className="mr-1.5" />
              Baris
            </Button>
          </div>
        </div>

        {!poId && <p className="text-sm text-gray-500 dark:text-gray-400">Pilih PO dulu.</p>}
        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const row = details?.[index];
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_2.5rem] md:items-start"
              >
                <ComboSelect
                  label={index === 0 ? "Varian (SKU)" : undefined}
                  placeholder="Pilih varian"
                  options={poVarian
                    .filter(
                      (v) =>
                        v.varianId === row?.varianId ||
                        !details?.some((d, di) => di !== index && d.varianId === v.varianId),
                    )
                    .map((v) => ({ label: varianLabel(v.varianId), value: v.varianId }))}
                  value={row?.varianId || null}
                  onChange={(v) =>
                    setValue(`details.${index}.varianId`, (v as string) ?? "", { shouldValidate: true })
                  }
                  error={errors.details?.[index]?.varianId}
                />
                <NumberInput
                  decimals={0}
                  placeholder="0"
                  label={index === 0 ? "Target (pcs)" : undefined}
                  value={watch(`details.${index}.targetCutting`)}
                  onChange={(v) =>
                    setValue(`details.${index}.targetCutting`, v as number, { shouldValidate: true })
                  }
                  error={errors.details?.[index]?.targetCutting?.message}
                />
                <div className="hidden md:block">
                  {index === 0 && <div className="mb-2 h-5" aria-hidden />}
                  <div className="flex h-10 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded p-2 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-6 dark:hover:bg-red-500/10"
                      title="Hapus baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {fields.length > 0 && (
          <div className="mt-4 flex justify-end border-t border-stroke pt-4 dark:border-dark-3">
            <div className="text-right">
              <span className="text-sm text-dark-5 dark:text-dark-6">Total Target</span>
              <p className="text-lg font-bold text-dark dark:text-white">{totalTarget} pcs</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/produksi/wo-cutting"))}
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
