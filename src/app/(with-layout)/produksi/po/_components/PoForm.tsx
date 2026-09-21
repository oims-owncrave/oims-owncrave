"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { poSchema, type PoInput, type PoFormInput, PO_JENIS } from "@/lib/schemas/po-produksi";
import { usePoMutation } from "@/hooks/usePoProduksi";
import { useProdukDetail } from "@/hooks/useVarianProduk";
import type { PicOption } from "@/services/po-produksi";
import { MatrixTargetInput } from "./MatrixTargetInput";
import { KebutuhanBahanPreview } from "./KebutuhanBahanPreview";
import { TAMPILKAN_LEBIHAN_VARIAN } from "@/lib/produksi/konstanta";

type ProdukOption = { id: string; kode: string; nama: string; isActive: boolean };

interface Props {
  produkOptions: ProdukOption[];
  picOptions: PicOption[];
  editId?: string;
  defaultValues?: PoInput;
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

export function PoForm({ produkOptions, picOptions, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = usePoMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PoFormInput, unknown, PoInput>({
    resolver: zodResolver(poSchema),
    defaultValues: defaultValues ?? {
      produkId: "",
      tanggal: todayISO(),
      tanggalMulai: "",
      targetSelesai: "",
      prioritas: "normal",
      jenis: "reguler",
      penanggungJawab: "",
      catatan: "",
      details: [],
      lebihanBahan: [],
    },
  });

  const details = watch("details") || [];
  const lebihanBahan = watch("lebihanBahan") || [];
  const produkId = watch("produkId");

  // Varian dari produk terpilih (fetch client-side saat produk dipilih)
  const { data: produkDetail, isLoading: isLoadingProduk } = useProdukDetail(produkId || "");
  const varianOptions = (produkId && produkDetail?.varian) || [];

  // Di mode edit, varian yang tersimpan di PO tetap ditampilkan walau sudah di-nonaktifkan
  const varianUntukMatrix = useMemo(() => {
    const detailVarianIds = new Set(details.map((d) => d.varianId));
    return varianOptions.filter((v) => v.isActive || detailVarianIds.has(v.id));
  }, [varianOptions, details]);

  const targetMap = useMemo(
    () => Object.fromEntries(details.map((d) => [d.varianId, d.jumlahTarget])),
    [details],
  );

  const handleTargetChange = (varianId: string, val: number | undefined) => {
    const current = watch("details") || [];
    if (val === undefined || val <= 0) {
      const next = current.filter((d) => d.varianId !== varianId);
      setValue("details", next, { shouldValidate: true, shouldDirty: true });
    } else {
      const idx = current.findIndex((d) => d.varianId === varianId);
      if (idx >= 0) {
        const next = current.map((d, i) =>
          i === idx ? { ...d, jumlahTarget: val } : d,
        );
        setValue("details", next, { shouldValidate: true, shouldDirty: true });
      } else {
        const next = [...current, { varianId, jumlahTarget: val, lebihanPcs: 0 }];
        setValue("details", next, { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  const handleLebihanChange = (varianId: string, val: number | undefined) => {
    const current = watch("details") || [];
    const next = current.map((d) =>
      d.varianId === varianId ? { ...d, lebihanPcs: val ?? 0 } : d,
    );
    setValue("details", next, { shouldValidate: true, shouldDirty: true });
  };

  const handleLebihanBahanChange = (bahanId: string, val: number | undefined) => {
    const current = watch("lebihanBahan") || [];
    const numVal = Number(val) || 0;
    const idx = current.findIndex((l) => l.bahanId === bahanId);
    if (numVal <= 0) {
      const next = current.filter((l) => l.bahanId !== bahanId);
      setValue("lebihanBahan", next, { shouldValidate: true, shouldDirty: true });
    } else if (idx >= 0) {
      const next = current.map((l, i) => (i === idx ? { ...l, lebihan: numVal } : l));
      setValue("lebihanBahan", next, { shouldValidate: true, shouldDirty: true });
    } else {
      const next = [...current, { bahanId, lebihan: numVal }];
      setValue("lebihanBahan", next, { shouldValidate: true, shouldDirty: true });
    }
  };

  const produkChoices = produkOptions.filter((p) => p.isActive || p.id === produkId);

  const totalTarget = details.reduce((s, d) => s + (Number(d.jumlahTarget) || 0), 0);
  const totalRencana = details.reduce(
    (s, d) =>
      s + (Number(d.jumlahTarget) || 0) + (Number(d.lebihanPcs) || 0),
    0,
  );

  async function onSubmit(data: PoInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/produksi/po");
  }

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Produk"
            required
            placeholder="Pilih produk"
            options={produkChoices.map((p) => ({ label: `${p.kode} — ${p.nama}`, value: p.id }))}
            value={produkId || null}
            onChange={(v) => {
              setValue("produkId", (v as string) ?? "", { shouldValidate: true });
              // reset baris varian dan lebihan bahan saat ganti produk — terikat produk
              setValue("details", [], { shouldValidate: true });
              setValue("lebihanBahan", [], { shouldValidate: true });
            }}
            error={errors.produkId}
            disabled={isEditing}
          />
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />
          <Input
            type="date"
            label="Tanggal Mulai"
            {...register("tanggalMulai")}
            error={errors.tanggalMulai?.message}
          />
          <Input
            type="date"
            label="Target Selesai"
            {...register("targetSelesai")}
            error={errors.targetSelesai?.message}
          />
          <Select
            label="Jenis Produksi"
            options={PO_JENIS.map((j) => ({ value: j.value, label: j.label }))}
            {...register("jenis")}
            error={errors.jenis?.message}
          />
          <Select
            label="Prioritas"
            options={PRIORITAS_OPTIONS}
            {...register("prioritas")}
            error={errors.prioritas?.message}
          />
          <ComboSelect
            label="Penanggung Jawab"
            placeholder="Pilih user (opsional)"
            options={picOptions.map((u) => ({ label: u.displayName, value: u.id }))}
            value={watch("penanggungJawab") || null}
            onChange={(v) => setValue("penanggungJawab", (v as string) ?? "")}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            {...register("catatan")}
            error={errors.catatan?.message}
          />
        </div>
        {isEditing && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Produk tidak bisa diganti saat edit — buat PO baru untuk produk lain.
          </p>
        )}
      </div>

      {/* Detail per SKU */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4">
          <h3 className="font-semibold text-dark dark:text-white">Target per SKU</h3>
          <p className="text-xs text-dark-5 dark:text-dark-6">
            Isi target produksi (pcs) pada tabel matrix warna dan ukuran di bawah.
          </p>
        </div>

        {!produkId ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Pilih produk terlebih dahulu untuk mengisi target varian.
          </p>
        ) : isLoadingProduk ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat varian produk...
          </p>
        ) : varianUntukMatrix.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Produk ini belum memiliki varian aktif. Tambahkan varian di Master Produk terlebih dahulu.
          </p>
        ) : (
          <div className="space-y-6">
            <MatrixTargetInput
              varian={varianUntukMatrix}
              values={targetMap}
              onChange={handleTargetChange}
              disabled={isPending}
            />

            <KebutuhanBahanPreview
              produkId={produkId}
              details={details}
              lebihanBahan={lebihanBahan}
              onLebihanChange={handleLebihanBahanChange}
              disabled={isPending}
            />

            {/* Lebihan Pcs (Opsional) */}
            {TAMPILKAN_LEBIHAN_VARIAN && details.length > 0 && (
              <div className="border-t border-stroke pt-5 dark:border-dark-3">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-dark dark:text-white">
                    Lebihan Pcs (Opsional)
                  </h4>
                  <p className="text-xs text-dark-5 dark:text-dark-6">
                    Diisi manual untuk cadangan/jaga-jaga pada SKU tertentu (bukan rumus tetap).
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-1 text-xs uppercase font-semibold text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                      <tr>
                        <th scope="col" className="px-4 py-2.5">
                          SKU / Varian
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right w-28">
                          Target
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right w-36">
                          Lebihan (pcs)
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right w-36">
                          Rencana Cutting
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-dark-3 bg-white dark:bg-gray-dark">
                      {details.map((d) => {
                        const varian = varianUntukMatrix.find((v) => v.id === d.varianId);
                        const label = varian
                          ? `${varian.sku} (${varian.warnaNama} / ${varian.ukuran})`
                          : d.varianId;
                        const rencana = (Number(d.jumlahTarget) || 0) + (Number(d.lebihanPcs) || 0);

                        return (
                          <tr key={d.varianId}>
                            <td className="px-4 py-2.5 font-medium text-dark dark:text-white">
                              {label}
                            </td>
                            <td className="px-4 py-2.5 text-right text-dark-5 dark:text-dark-6">
                              {Number(d.jumlahTarget) || 0} pcs
                            </td>
                            <td className="px-4 py-2 text-right">
                              <NumberInput
                                decimals={0}
                                placeholder="0"
                                value={d.lebihanPcs || undefined}
                                onChange={(val) => handleLebihanChange(d.varianId, val)}
                                disabled={isPending}
                                className="text-right h-8 w-28 ml-auto font-medium"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-dark dark:text-white">
                              {rencana} pcs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {(errors.details?.message || errors.details?.root?.message) && (
          <p className="mt-3 text-xs font-medium text-red-500">
            {errors.details?.message || errors.details?.root?.message}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-6 border-t border-stroke pt-4 dark:border-dark-3">
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Total Target</span>
            <p className="text-lg font-bold text-dark dark:text-white">{totalTarget.toLocaleString("id-ID")} pcs</p>
          </div>
          {TAMPILKAN_LEBIHAN_VARIAN && (
            <div className="text-right">
              <span className="text-sm text-dark-5 dark:text-dark-6">Total Rencana Cutting</span>
              <p className="text-lg font-bold text-dark dark:text-white">{totalRencana.toLocaleString("id-ID")} pcs</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/produksi/po"))}
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
