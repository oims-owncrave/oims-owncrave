"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/ui/NumberInput";
import { usePreviewEstimasi } from "@/hooks/usePoProduksi";

interface Props {
  produkId: string;
  details: { varianId: string; jumlahTarget: number }[];
  lebihanBahan: { bahanId: string; lebihan: number }[];
  onLebihanChange: (bahanId: string, val: number | undefined) => void;
  disabled?: boolean;
}

const STATUS_BADGE = {
  tersedia: {
    label: "Tersedia",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  sebagian: {
    label: "Sebagian",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  tidak_tersedia: {
    label: "Tidak Tersedia",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
} as const;

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

export function KebutuhanBahanPreview({
  produkId,
  details,
  lebihanBahan,
  onLebihanChange,
  disabled = false,
}: Props) {
  const activeDetails = useMemo(
    () => details.filter((d) => (Number(d.jumlahTarget) || 0) > 0),
    [details],
  );

  // Lebihan SENGAJA tidak ikut ke server: BOM & stok tak berubah karenanya, dan
  // ikut menanti debounce 500ms bikin angka yang diketik user telat berubah.
  // Server menghitung kebutuhan dari target; lebihan dijumlahkan saat render.
  const previewInput = useMemo(() => {
    if (!produkId || activeDetails.length === 0) return null;
    return {
      produkId,
      details: activeDetails.map((d) => ({
        varianId: d.varianId,
        jumlahTarget: Number(d.jumlahTarget) || 0,
      })),
      lebihanBahan: [],
    };
  }, [produkId, activeDetails]);

  // Debounce 500ms agar query tidak membanjiri server saat user mengetik
  const [debouncedInput, setDebouncedInput] = useState(previewInput);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(previewInput), 500);
    return () => clearTimeout(t);
  }, [previewInput]);

  const { data: previewData, isFetching } = usePreviewEstimasi(debouncedInput);
  const [cachedPreview, setCachedPreview] = useState<typeof previewData>(undefined);

  useEffect(() => {
    if (previewData && !("error" in previewData)) {
      setCachedPreview(previewData);
    }
  }, [previewData]);

  const preview = previewData ?? cachedPreview;
  const isUpdating = isFetching || previewInput !== debouncedInput;

  const lebihanMap = useMemo(
    () => new Map(lebihanBahan.map((l) => [l.bahanId, l.lebihan])),
    [lebihanBahan],
  );

  if (!produkId || activeDetails.length === 0) return null;

  return (
    <div className="border-t border-stroke pt-5 dark:border-dark-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-dark dark:text-white">
              Estimasi Kebutuhan Bahan
            </h4>
            {preview && !("error" in preview) && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                {preview.bomNomor} · v{preview.bomVersi}
              </span>
            )}
            {isUpdating && (
              <span className="text-xs text-primary animate-pulse">
                Memperbarui...
              </span>
            )}
          </div>
          <p className="text-xs text-dark-5 dark:text-dark-6">
            Dihitung otomatis dari BOM aktif + target pcs. Lebihan diisi manual per bahan (cadangan logistik).
          </p>
        </div>
      </div>

      {preview && "error" in preview && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
          {preview.error}
        </div>
      )}

      {preview && !("error" in preview) && (
        <div
          className={cn(
            "overflow-x-auto rounded-lg border border-stroke dark:border-dark-3 transition-opacity duration-300",
            isUpdating && "opacity-75",
          )}
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-1 text-xs uppercase font-semibold text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Bahan
                </th>
                <th scope="col" className="px-4 py-2.5 text-right w-28">
                  Kebutuhan
                </th>
                <th scope="col" className="px-4 py-2.5 text-right w-36">
                  Lebihan
                </th>
                <th scope="col" className="px-4 py-2.5 text-right w-28">
                  Total
                </th>
                <th scope="col" className="px-4 py-2.5 text-right w-28">
                  Stok
                </th>
                <th scope="col" className="px-4 py-2.5 text-center w-32">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3 bg-white dark:bg-gray-dark">
              {preview.rows.map((r) => {
                const isPcs =["pcs", "buah", "biji", "pasang"].includes(
                  (r.satuanSingkatan || "").toLowerCase(),
                );
                const currentLebihan = lebihanMap.get(r.bahanId);
                // Server mengirim total TANPA lebihan (lihat previewInput) — dijumlahkan
                // di sini supaya angkanya ikut ketikan user seketika, tanpa debounce.
                const total = r.totalKebutuhan + (currentLebihan ?? 0);
                const status =
                  r.stokTersedia >= total
                    ? "tersedia"
                    : r.stokTersedia > 0
                      ? "sebagian"
                      : "tidak_tersedia";
                const badgeLive = STATUS_BADGE[status];

                return (
                  <tr key={r.bahanId}>
                    <td className="px-4 py-2.5 font-medium text-dark dark:text-white">
                      {r.bahanKode} — {r.bahanNama}
                      {r.bahanUkuran ? ` · ${r.bahanUkuran}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-right text-dark-5 dark:text-dark-6">
                      {fmtQty(r.kebutuhanStandar)} {r.satuanSingkatan}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <NumberInput
                        decimals={isPcs ? 0 : 3}
                        placeholder="0"
                        value={currentLebihan !== undefined && currentLebihan > 0 ? currentLebihan : undefined}
                        onChange={(val) => onLebihanChange(r.bahanId, val)}
                        disabled={disabled}
                        className="text-right h-9 w-28 ml-auto font-medium"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-dark dark:text-white">
                      {fmtQty(total)} {r.satuanSingkatan}
                    </td>
                    <td className="px-4 py-2.5 text-right text-dark-5 dark:text-dark-6">
                      {fmtQty(r.stokTersedia)} {r.satuanSingkatan}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                          badgeLive.className,
                        )}
                      >
                        {badgeLive.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
