"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Printer, Send, Ban, Plus, Undo2 } from "lucide-react";
import { bundelSchema, type BundelInput, BUNDEL_STATUS_LABEL } from "@/lib/schemas/bundling";
import { useBundelList, useSisaBundel, useBundelMutation } from "@/hooks/useBundling";
import type { BundelListRow, WoBisaDibundel } from "@/services/bundling";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
  TableActions,
  TableAction,
} from "@/components/ui/table";

interface Props {
  initialData: BundelListRow[];
  woOptions: WoBisaDibundel[];
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  siap_dikirim: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sudah_dikirim: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
};

export function BundelPageClient({ initialData, woOptions }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { data } = useBundelList();
  const { create, setStatus } = useBundelMutation();
  const items = data ?? initialData;

  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BundelInput>({
    resolver: zodResolver(bundelSchema),
    defaultValues: { woId: "", varianId: "", jumlahPcs: undefined, tujuanPenjahit: "", keterangan: "" },
  });

  const woId = watch("woId");
  const varianId = watch("varianId");
  const { data: sisaRows } = useSisaBundel(woId || "");
  const sisaTerpilih = (sisaRows ?? []).find((r) => r.varianId === varianId);

  useEffect(() => {
    if (modalOpen) reset({ woId: "", varianId: "", jumlahPcs: undefined, tujuanPenjahit: "", keterangan: "" });
  }, [modalOpen, reset]);

  const actionsFor = (item: BundelListRow): TableAction<BundelListRow>[] => {
    const label: TableAction<BundelListRow> = {
      icon: <Printer size={16} />,
      title: "Label",
      onClick: () => goRow(item.id, `/produksi/bundling/${item.id}/label`),
      variant: "default",
      loading: (it) => pendingId === it.id,
    };
    if (item.status === "draft") {
      return [
        label,
        {
          icon: <Send size={16} />,
          title: "Tandai Siap Dikirim",
          onClick: () => setStatus.mutate({ id: item.id, status: "siap_dikirim" }),
          variant: "default",
        },
        {
          icon: <Ban size={16} />,
          title: "Batalkan",
          onClick: () => setCancelId(item.id),
          variant: "danger",
        },
      ];
    }
    if (item.status === "siap_dikirim") {
      return [
        label,
        {
          icon: <Undo2 size={16} />,
          title: "Kembalikan ke Draft",
          onClick: () => setStatus.mutate({ id: item.id, status: "draft" }),
          variant: "default",
        },
        {
          icon: <Ban size={16} />,
          title: "Batalkan",
          onClick: () => setCancelId(item.id),
          variant: "danger",
        },
      ];
    }
    return [label];
  };

  const columns: ColumnDef<BundelListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "poNomor", label: "PO" },
    {
      key: "sku",
      label: "SKU",
      renderCell: (item) => (
        <span>
          {item.sku}{" "}
          <span className="text-gray-500 dark:text-gray-400">
            ({item.warnaNama}/{item.ukuran})
          </span>
        </span>
      ),
    },
    { key: "jumlahPcs", label: "Pcs", align: "center" },
    {
      key: "tujuanPenjahit",
      label: "Tujuan",
      renderCell: (item) => item.tujuanPenjahit ?? "—",
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => (
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", STATUS_BADGE[item.status])}>
          {BUNDEL_STATUS_LABEL[item.status] ?? item.status}
        </span>
      ),
    },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} />,
    },
  ];

  const table = useTable({
    data: items,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  const onSubmit = async (input: BundelInput) => {
    const res = await create.mutateAsync(input);
    if (!res.error) setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundle"
        breadcrumb={[{ label: "Produksi" }, { label: "Bundle" }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari bundel..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setModalOpen(true)} className="hidden sm:inline-flex">
              + Buat Bundel
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === pendingId}
          mobileFab={
            <Button
              onClick={() => setModalOpen(true)}
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
            >
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      {/* Modal buat bundel */}
      {modalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!create.isPending ? () => setModalOpen(false) : undefined} />
          <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">Buat Bundel</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <ComboSelect
                label="Work Order"
                required
                placeholder="Pilih WO (punya hasil baik)"
                options={woOptions.map((w) => ({
                  label: `${w.nomorDokumen} · ${w.poNomor} — ${w.produkNama}`,
                  value: w.id,
                }))}
                value={woId || null}
                onChange={(v) => {
                  setValue("woId", (v as string) ?? "", { shouldValidate: true });
                  setValue("varianId", "");
                }}
                error={errors.woId}
              />
              <ComboSelect
                label="Varian (SKU)"
                required
                placeholder="Pilih varian"
                options={(sisaRows ?? [])
                  .filter((r) => r.sisa > 0)
                  .map((r) => ({
                    label: `${r.sku} — sisa ${r.sisa} pcs`,
                    value: r.varianId,
                  }))}
                value={varianId || null}
                onChange={(v) => setValue("varianId", (v as string) ?? "", { shouldValidate: true })}
                error={errors.varianId}
                disabled={!woId}
              />
              <div>
                <NumberInput
                  decimals={0}
                  placeholder="0"
                  label="Jumlah (pcs)"
                  value={watch("jumlahPcs")}
                  onChange={(v) =>
                    setValue("jumlahPcs", v as number, { shouldValidate: true })
                  }
                  error={errors.jumlahPcs?.message}
                />
                {sisaTerpilih && (
                  <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    Hasil baik {sisaTerpilih.totalBaik} · sudah dibundel {sisaTerpilih.dibundel} · sisa {sisaTerpilih.sisa} pcs
                  </p>
                )}
              </div>
              <Input
                label="Tujuan Penjahit"
                placeholder="Misal: Vendor A (opsional — master vendor di Tahap 3)"
                {...register("tujuanPenjahit")}
              />
              <Input label="Keterangan" placeholder="Isi panel/aksesoris (opsional)" {...register("keterangan")} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={create.isPending}>
                  Batal
                </Button>
                <Button type="submit" loading={create.isPending}>Buat Bundel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        title="Batalkan Bundel?"
        message="Pcs bundel ini kembali bisa dibundel ulang dari hasil cutting."
        confirmLabel="Batalkan"
        onConfirm={() => {
          if (cancelId) setStatus.mutate({ id: cancelId, status: "dibatalkan" });
          setCancelId(null);
        }}
        onCancel={() => setCancelId(null)}
        loading={setStatus.isPending}
      />
    </div>
  );
}
