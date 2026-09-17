"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import {
  sisaSchema,
  limbahSchema,
  type SisaInput,
  type LimbahInput,
  SISA_JENIS,
  SISA_STATUS_LABEL,
  LIMBAH_JENIS,
  LIMBAH_PENANGANAN,
} from "@/lib/schemas/sisa-limbah";
import {
  useSisaList,
  useLimbahList,
  useSisaMutation,
  useLimbahMutation,
} from "@/hooks/useSisaLimbah";
import { useEstimasiBahan } from "@/hooks/usePoProduksi";

interface Props {
  woId: string;
  poId: string;
}

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const SISA_BADGE: Record<string, string> = {
  disimpan_cutting: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  menunggu_gudang: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  diterima_gudang: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dialokasikan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  tidak_layak: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
};

function Modal({ title, onClose, children, pending }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!pending ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function SisaLimbahSection({ woId, poId }: Props) {
  const [sisaOpen, setSisaOpen] = useState(false);
  const [limbahOpen, setLimbahOpen] = useState(false);
  const [deleteSisaId, setDeleteSisaId] = useState<string | null>(null);
  const [deleteLimbahId, setDeleteLimbahId] = useState<string | null>(null);
  const [terimaId, setTerimaId] = useState<string | null>(null);

  const { data: sisaRows } = useSisaList(woId);
  const { data: limbahRows } = useLimbahList(woId);
  const { data: estimasi } = useEstimasiBahan(poId);
  const sisaMut = useSisaMutation(woId);
  const limbahMut = useLimbahMutation(woId);

  const bahanChoices = estimasi && !("error" in estimasi) ? estimasi.rows : [];

  const sisaForm = useForm<SisaInput>({
    resolver: zodResolver(sisaSchema),
    defaultValues: { bahanId: "", jumlah: undefined as unknown as number, jenis: "kain_utuh", catatan: "" },
  });
  const limbahForm = useForm<LimbahInput>({
    resolver: zodResolver(limbahSchema),
    defaultValues: { bahanId: "", jumlah: undefined as unknown as number, jenis: "potongan_kecil", penanganan: "dibuang", penyebab: "", catatan: "" },
  });

  useEffect(() => {
    if (sisaOpen) sisaForm.reset({ bahanId: "", jumlah: undefined as unknown as number, jenis: "kain_utuh", catatan: "" });
  }, [sisaOpen, sisaForm]);
  useEffect(() => {
    if (limbahOpen)
      limbahForm.reset({ bahanId: "", jumlah: undefined as unknown as number, jenis: "potongan_kecil", penanganan: "dibuang", penyebab: "", catatan: "" });
  }, [limbahOpen, limbahForm]);

  const totalKerugian = (limbahRows ?? []).reduce(
    (s, r) => s + Number(r.jumlah) * Number(r.hargaRataRata),
    0,
  );

  return (
    <>
      {/* ── Sisa Bahan ── */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Sisa Bahan</h3>
          <Button size="sm" onClick={() => setSisaOpen(true)}>+ Catat Sisa</Button>
        </div>
        {(sisaRows ?? []).length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Belum ada sisa dicatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Bahan</th>
                  <th className="px-5 py-3 font-medium text-right">Jumlah</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(sisaRows ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">{r.bahanKode} — {r.bahanNama}</td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(r.jumlah))} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {SISA_JENIS.find((j) => j.value === r.jenis)?.label ?? r.jenis}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", SISA_BADGE[r.status])}>
                        {SISA_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {r.status === "disimpan_cutting" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => sisaMut.setStatus.mutate({ id: r.id, status: "menunggu_gudang" })}>
                              Ajukan ke Gudang
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => sisaMut.setStatus.mutate({ id: r.id, status: "dialokasikan" })}>
                              Alokasikan
                            </Button>
                          </>
                        )}
                        {r.status === "menunggu_gudang" && (
                          <Button size="sm" onClick={() => setTerimaId(r.id)}>
                            Terima di Gudang
                          </Button>
                        )}
                        {r.status !== "diterima_gudang" && (
                          <button
                            type="button"
                            onClick={() => setDeleteSisaId(r.id)}
                            className="rounded p-1.5 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-6 dark:hover:bg-red-500/10"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Limbah Cutting ── */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Limbah Cutting</h3>
          <div className="flex items-center gap-3">
            {totalKerugian > 0 && (
              <span className="text-xs text-red-600 dark:text-red-300">
                Kerugian: {rupiah(totalKerugian)}
              </span>
            )}
            <Button size="sm" onClick={() => setLimbahOpen(true)}>+ Catat Limbah</Button>
          </div>
        </div>
        {(limbahRows ?? []).length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Belum ada limbah dicatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Bahan</th>
                  <th className="px-5 py-3 font-medium text-right">Jumlah</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Penyebab</th>
                  <th className="px-5 py-3 font-medium">Penanganan</th>
                  <th className="px-5 py-3 font-medium text-right">Nilai Kerugian</th>
                  <th className="px-5 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(limbahRows ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">{r.bahanKode} — {r.bahanNama}</td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(r.jumlah))} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {LIMBAH_JENIS.find((j) => j.value === r.jenis)?.label ?? r.jenis}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.penyebab ?? "—"}</td>
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {LIMBAH_PENANGANAN.find((j) => j.value === r.penanganan)?.label ?? r.penanganan}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 dark:text-red-300">
                      {rupiah(Number(r.jumlah) * Number(r.hargaRataRata))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setDeleteLimbahId(r.id)}
                        className="rounded p-1.5 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-6 dark:hover:bg-red-500/10"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal sisa */}
      {sisaOpen && (
        <Modal title="Catat Sisa Bahan" onClose={() => setSisaOpen(false)} pending={sisaMut.create.isPending}>
          <form
            onSubmit={sisaForm.handleSubmit(async (data) => {
              const res = await sisaMut.create.mutateAsync(data);
              if (!res.error) setSisaOpen(false);
            })}
            className="space-y-4"
          >
            <ComboSelect
              label="Bahan"
              required
              placeholder="Pilih bahan (dari BOM)"
              options={bahanChoices.map((b) => ({ label: `${b.bahanKode} — ${b.bahanNama}`, value: b.bahanId }))}
              value={sisaForm.watch("bahanId") || null}
              onChange={(v) => sisaForm.setValue("bahanId", (v as string) ?? "", { shouldValidate: true })}
              error={sisaForm.formState.errors.bahanId}
            />
            <NumberInput
              decimals={3}
              placeholder="0"
              label="Jumlah"
              value={sisaForm.watch("jumlah")}
              onChange={(v) =>
                sisaForm.setValue("jumlah", v as number, { shouldValidate: true })
              }
              error={sisaForm.formState.errors.jumlah?.message}
            />
            <Select
              label="Jenis"
              options={SISA_JENIS.map((j) => ({ value: j.value, label: j.label }))}
              {...sisaForm.register("jenis")}
            />
            <Input label="Catatan" placeholder="Opsional" {...sisaForm.register("catatan")} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSisaOpen(false)} disabled={sisaMut.create.isPending}>
                Batal
              </Button>
              <Button type="submit" loading={sisaMut.create.isPending}>Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal limbah */}
      {limbahOpen && (
        <Modal title="Catat Limbah" onClose={() => setLimbahOpen(false)} pending={limbahMut.create.isPending}>
          <form
            onSubmit={limbahForm.handleSubmit(async (data) => {
              const res = await limbahMut.create.mutateAsync(data);
              if (!res.error) setLimbahOpen(false);
            })}
            className="space-y-4"
          >
            <ComboSelect
              label="Bahan"
              required
              placeholder="Pilih bahan (dari BOM)"
              options={bahanChoices.map((b) => ({ label: `${b.bahanKode} — ${b.bahanNama}`, value: b.bahanId }))}
              value={limbahForm.watch("bahanId") || null}
              onChange={(v) => limbahForm.setValue("bahanId", (v as string) ?? "", { shouldValidate: true })}
              error={limbahForm.formState.errors.bahanId}
            />
            <NumberInput
              decimals={3}
              placeholder="0"
              label="Jumlah"
              value={limbahForm.watch("jumlah")}
              onChange={(v) =>
                limbahForm.setValue("jumlah", v as number, { shouldValidate: true })
              }
              error={limbahForm.formState.errors.jumlah?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Jenis"
                options={LIMBAH_JENIS.map((j) => ({ value: j.value, label: j.label }))}
                {...limbahForm.register("jenis")}
              />
              <Select
                label="Penanganan"
                options={LIMBAH_PENANGANAN.map((j) => ({ value: j.value, label: j.label }))}
                {...limbahForm.register("penanganan")}
              />
            </div>
            <Input label="Penyebab" placeholder="Misal: salah potong pola" {...limbahForm.register("penyebab")} />
            <Input label="Catatan" placeholder="Opsional" {...limbahForm.register("catatan")} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nilai kerugian = jumlah × harga rata-rata bahan saat dicatat.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setLimbahOpen(false)} disabled={limbahMut.create.isPending}>
                Batal
              </Button>
              <Button type="submit" loading={limbahMut.create.isPending}>Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={terimaId !== null}
        title="Terima Sisa di Gudang?"
        message="Stok bahan akan bertambah lewat mutasi retur masuk (append ledger). Aksi ini tidak bisa dibatalkan."
        confirmLabel="Terima"
        onConfirm={() => {
          if (terimaId) sisaMut.terima.mutate(terimaId);
          setTerimaId(null);
        }}
        onCancel={() => setTerimaId(null)}
        loading={sisaMut.terima.isPending}
      />

      <ConfirmDialog
        open={deleteSisaId !== null}
        title="Hapus Sisa?"
        message="Record sisa bahan ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteSisaId) sisaMut.remove.mutate(deleteSisaId);
          setDeleteSisaId(null);
        }}
        onCancel={() => setDeleteSisaId(null)}
        loading={sisaMut.remove.isPending}
      />

      <ConfirmDialog
        open={deleteLimbahId !== null}
        title="Hapus Limbah?"
        message="Record limbah ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteLimbahId) limbahMut.remove.mutate(deleteLimbahId);
          setDeleteLimbahId(null);
        }}
        onCancel={() => setDeleteLimbahId(null)}
        loading={limbahMut.remove.isPending}
      />
    </>
  );
}
