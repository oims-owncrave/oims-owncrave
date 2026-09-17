"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import { useReworkMutation } from "@/hooks/useRework";
import type { BarisReworkRow } from "@/services/rework";
import type { JenisCacat } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  /** null = tertutup; "internal" | "vendor" = jalur yang dipilih */
  jalur: "internal" | "vendor" | null;
  onClose: () => void;
  baris: BarisReworkRow[];
  userOptions: UserOpt[];
  cacatOptions: JenisCacat[];
}

const PENANGGUNG_OPTIONS = [
  { value: "vendor", label: "Vendor" },
  { value: "owncrave", label: "Owncrave" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BuatReworkModal({
  jalur,
  onClose,
  baris,
  userOptions,
  cacatOptions,
}: Props) {
  const { createInternal, createRetur } = useReworkMutation();
  const isPending = createInternal.isPending || createRetur.isPending;

  // satu dokumen = satu hasil QC, jadi baris dikelompokkan per hasil QC
  const [hasilQcId, setHasilQcId] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState<Record<string, number>>({});
  const [tanggal, setTanggal] = useState(today());
  const [target, setTarget] = useState("");
  const [picId, setPicId] = useState<string | null>(null);
  const [estimasi, setEstimasi] = useState(0);
  const [penanggung, setPenanggung] = useState<"vendor" | "owncrave">("vendor");
  const [instruksi, setInstruksi] = useState("");
  const [jenisCacatId, setJenisCacatId] = useState<string | null>(null);

  const hasilQcOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of baris) map.set(b.hasilQcId, b.nomorHasilQc);
    return [...map].map(([value, label]) => ({ value, label }));
  }, [baris]);

  const barisTerpilih = baris.filter((b) => b.hasilQcId === hasilQcId);

  useEffect(() => {
    if (!jalur) return;
    const pertama = hasilQcOptions[0]?.value ?? null;
    setHasilQcId(pertama);
    setJumlah({});
    setTanggal(today());
    setTarget("");
    setPicId(null);
    setEstimasi(0);
    setPenanggung("vendor");
    setInstruksi("");
    setJenisCacatId(null);
    // hasilQcOptions sengaja bukan dependency: array baru tiap render induk akan
    // mereset input operator terus-menerus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jalur]);

  const details = barisTerpilih
    .map((b) => ({
      hasilQcDetailId: b.hasilQcDetailId,
      varianId: b.varianId,
      jumlah: jumlah[b.hasilQcDetailId] ?? 0,
      jenisCacatId,
      instruksi: instruksi || null,
    }))
    .filter((d) => d.jumlah > 0);

  const totalPcs = details.reduce((n, d) => n + d.jumlah, 0);
  const adaKelebihan = barisTerpilih.some(
    (b) => (jumlah[b.hasilQcDetailId] ?? 0) > b.sisa,
  );

  const cacatChoices = cacatOptions
    .filter((c) => c.isActive || c.id === jenisCacatId)
    .map((c) => ({ value: c.id, label: `${c.kode} — ${c.nama}` }));

  const userChoices = userOptions
    .filter((u) => u.isActive || u.id === picId)
    .map((u) => ({ value: u.id, label: u.displayName }));

  async function simpan() {
    if (!hasilQcId || details.length === 0) return;

    if (jalur === "internal") {
      const res = await createInternal.mutateAsync({
        hasilQcId,
        tanggal,
        picId,
        targetSelesai: target || null,
        estimasiBiaya: estimasi,
        catatan: null,
        details,
      });
      if (!res.error) onClose();
    } else {
      const vendorId = barisTerpilih[0]?.vendorId ?? null;
      const res = await createRetur.mutateAsync({
        hasilQcId,
        penugasanJahitId: null,
        vendorId,
        tanggalKirim: tanggal,
        targetKembali: target || null,
        penanggungBiaya: penanggung,
        catatan: null,
        details: details.map((d) => ({ ...d, fotoUrl: null, potongan: 0 })),
      });
      if (!res.error) onClose();
    }
  }

  if (!jalur) return null;

  const judul = jalur === "internal" ? "Buat Perbaikan Internal" : "Buat Retur ke Vendor";

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">{judul}</h2>

        <div className="space-y-4">
          <ComboSelect
            label="Hasil QC"
            options={hasilQcOptions}
            value={hasilQcId}
            onChange={(v) => {
              setHasilQcId(v as string);
              setJumlah({});
            }}
            placeholder="Pilih hasil QC"
            disabled={isPending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={jalur === "internal" ? "Tanggal" : "Tanggal Kirim"}
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isPending}
            />
            <Input
              label={jalur === "internal" ? "Target Selesai" : "Target Kembali"}
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isPending}
            />
          </div>

          {jalur === "internal" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ComboSelect
                label="PIC Perbaikan"
                options={userChoices}
                value={picId}
                onChange={(v) => setPicId((v as string) || null)}
                placeholder="Pilih PIC"
                disabled={isPending}
              />
              <NumberInput
                label="Estimasi Biaya"
                placeholder="0"
                value={estimasi}
                onChange={(v) => setEstimasi(v ?? 0)}
                disabled={isPending}
              />
            </div>
          ) : (
            <Select
              label="Biaya Ditanggung"
              options={PENANGGUNG_OPTIONS}
              value={penanggung}
              onChange={(e) => setPenanggung(e.target.value as "vendor" | "owncrave")}
              disabled={isPending}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <ComboSelect
              label="Jenis Cacat"
              options={cacatChoices}
              value={jenisCacatId}
              onChange={(v) => setJenisCacatId((v as string) || null)}
              placeholder="Opsional"
              disabled={isPending}
            />
            <Input
              label="Instruksi"
              placeholder="Misal: jahit ulang bagian kerah"
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="rounded-lg border border-stroke dark:border-dark-3 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Produk / SKU</th>
                  <th className="px-3 py-2">Warna / Ukuran</th>
                  <th className="px-3 py-2 text-right">Sisa</th>
                  <th className="px-3 py-2 text-right w-28">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {barisTerpilih.map((b) => (
                  <tr
                    key={b.hasilQcDetailId}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-3 py-2">
                      <div className="text-dark dark:text-white">{b.produkNama}</div>
                      <div className="text-xs text-gray-500">{b.sku}</div>
                    </td>
                    <td className="px-3 py-2">
                      {b.warnaNama} / {b.ukuran}
                    </td>
                    <td className="px-3 py-2 text-right">{b.sisa}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={b.sisa}
                        placeholder="0"
                        value={(jumlah[b.hasilQcDetailId] ?? 0) || ""}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(b.sisa, Number(e.target.value) || 0));
                          setJumlah((prev) => ({ ...prev, [b.hasilQcDetailId]: v }));
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
                  <td colSpan={3} className="px-3 py-2 text-right font-medium">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-dark dark:text-white">
                    {totalPcs} pcs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="button"
              loading={isPending}
              onClick={simpan}
              disabled={totalPcs === 0 || adaKelebihan}
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
