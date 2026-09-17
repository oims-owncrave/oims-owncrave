"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { useWarnaList } from "@/hooks/useWarna";
import { useVarianMutation } from "@/hooks/useVarianProduk";
import { UKURAN_STANDAR } from "@/lib/bom-ukuran";

interface Props {
  open: boolean;
  onClose: () => void;
  produkId: string;
}

const JENIS_KELAMIN_OPTIONS = [
  { value: "Pria", label: "Pria" },
  { value: "Wanita", label: "Wanita" },
  { value: "Unisex", label: "Unisex" },
];

export function VarianGenerateModal({ open, onClose, produkId }: Props) {
  const { data: warnaData } = useWarnaList();
  const { generate } = useVarianMutation(produkId);

  const [warnaIds, setWarnaIds] = useState<string[]>([]);
  const [ukuran, setUkuran] = useState<string[]>([]);
  const [ukuranCustom, setUkuranCustom] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = generate.isPending;

  useEffect(() => {
    if (open) {
      setWarnaIds([]);
      setUkuran([]);
      setUkuranCustom("");
      setJenisKelamin("");
      setFormError(null);
    }
  }, [open]);

  // FK dropdown: hanya warna aktif (tak ada nilai existing yang perlu di-keep di form generate)
  const warnaOptions = (warnaData ?? [])
    .filter((w) => w.isActive)
    .map((w) => ({ value: w.id, label: `${w.nama} (${w.kode})` }));

  const ukuranOptions = UKURAN_STANDAR.map((u) => ({ value: u, label: u }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const custom = ukuranCustom
      .split(",")
      .map((u) => u.trim().toUpperCase())
      .filter(Boolean);
    const allUkuran = Array.from(new Set([...ukuran, ...custom]));

    if (warnaIds.length === 0) return setFormError("Pilih minimal 1 warna");
    if (allUkuran.length === 0) return setFormError("Pilih minimal 1 ukuran");
    setFormError(null);

    const res = await generate.mutateAsync({
      warnaIds,
      ukuran: allUkuran,
      jenisKelamin: jenisKelamin || undefined,
    });
    if (!res.error) onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Tambah Varian</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Semua kombinasi warna × ukuran dibuat sekaligus. Kombinasi yang sudah ada dilewati.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Warna</label>
            <MultiSelect
              options={warnaOptions}
              value={warnaIds}
              onChange={setWarnaIds}
              placeholder="Pilih warna..."
              searchable
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Ukuran</label>
            <MultiSelect
              options={ukuranOptions}
              value={ukuran}
              onChange={setUkuran}
              placeholder="Pilih ukuran..."
              disabled={isPending}
            />
          </div>

          <Input
            label="Ukuran custom (opsional, pisah koma)"
            placeholder="Misal: 4XL, 5XL"
            value={ukuranCustom}
            onChange={(e) => setUkuranCustom(e.target.value)}
            disabled={isPending}
          />

          <Select
            label="Jenis Kelamin"
            options={JENIS_KELAMIN_OPTIONS}
            placeholder="— Tidak ditentukan —"
            value={jenisKelamin}
            onChange={(e) => setJenisKelamin(e.target.value)}
            disabled={isPending}
          />

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Membuat..." : "Buat Varian"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
