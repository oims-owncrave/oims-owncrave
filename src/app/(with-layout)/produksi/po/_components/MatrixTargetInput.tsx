"use client";

import { useMemo } from "react";
import { NumberInput } from "@/components/ui/NumberInput";
import { urutkanUkuran } from "@/lib/bom-ukuran";
import type { VarianRow } from "@/services/varian-produk";

interface Props {
  varian: VarianRow[];
  values: Record<string, number | undefined>;
  onChange: (varianId: string, value: number | undefined) => void;
  disabled?: boolean;
}

export function MatrixTargetInput({ varian, values, onChange, disabled }: Props) {
  // Sumbu Warna: ambil dari varian yang ada (pertahankan urutan kemunculan)
  const warna = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; kode: string }>();
    for (const v of varian) {
      if (!map.has(v.warnaId)) {
        map.set(v.warnaId, { id: v.warnaId, nama: v.warnaNama, kode: v.warnaKode });
      }
    }
    return Array.from(map.values());
  }, [varian]);

  // Sumbu Ukuran: ambil ukuran unik dan urutkan dengan urutkanUkuran standar
  const ukuran = useMemo(() => {
    const unique = Array.from(new Set(varian.map((v) => v.ukuran)));
    return urutkanUkuran(unique);
  }, [varian]);

  // Lookup map: (warnaId__ukuran) -> VarianRow
  const varianLookup = useMemo(() => {
    const map = new Map<string, VarianRow>();
    for (const v of varian) {
      map.set(`${v.warnaId}__${v.ukuran}`, v);
    }
    return map;
  }, [varian]);

  // Hitung grand total target
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const v of varian) {
      const val = Number(values[v.id]);
      if (val > 0) total += val;
    }
    return total;
  }, [varian, values]);

  return (
    <div className="relative overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-1 text-xs uppercase font-semibold text-dark-5 dark:bg-dark-2 dark:text-dark-6">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 bg-gray-1 px-4 py-3 text-left border-r border-stroke dark:bg-dark-2 dark:border-dark-3 min-w-[130px] sm:min-w-[160px]"
            >
              Warna
            </th>
            {ukuran.map((uk) => (
              <th
                key={uk}
                scope="col"
                className="px-2 py-3 text-center min-w-[85px]"
              >
                {uk}
              </th>
            ))}
            <th
              scope="col"
              className="px-4 py-3 text-right min-w-[100px] border-l border-stroke dark:border-dark-3"
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke dark:divide-dark-3 bg-white dark:bg-gray-dark">
          {warna.map((w) => {
            const rowTotal = ukuran.reduce((sum, uk) => {
              const v = varianLookup.get(`${w.id}__${uk}`);
              return sum + (v ? Number(values[v.id]) || 0 : 0);
            }, 0);

            return (
              <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-2/50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-dark border-r border-stroke dark:bg-gray-dark dark:text-white dark:border-dark-3 whitespace-nowrap">
                  {w.nama}
                </td>
                {ukuran.map((uk) => {
                  const v = varianLookup.get(`${w.id}__${uk}`);
                  return (
                    <td key={uk} className="px-1.5 py-1.5 text-center">
                      {v ? (
                        <NumberInput
                          decimals={0}
                          placeholder="0"
                          value={values[v.id]}
                          onChange={(val) => onChange(v.id, val)}
                          disabled={disabled}
                          className="h-9 w-full min-w-[75px] text-right font-medium"
                        />
                      ) : (
                        <div
                          className="flex h-9 items-center justify-center text-dark-5 dark:text-dark-6 select-none font-medium text-base"
                          title="Varian tidak tersedia"
                        >
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-right font-semibold text-dark dark:text-white border-l border-stroke dark:border-dark-3 whitespace-nowrap">
                  {rowTotal > 0 ? `${rowTotal.toLocaleString("id-ID")} pcs` : "0 pcs"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-1 font-semibold text-dark border-t-2 border-stroke dark:bg-dark-2 dark:text-white dark:border-dark-3">
          <tr>
            <td className="sticky left-0 z-20 bg-gray-1 px-4 py-3 text-left font-bold border-r border-stroke dark:bg-dark-2 dark:border-dark-3 whitespace-nowrap">
              Total Target
            </td>
            {ukuran.map((uk) => {
              const colTotal = warna.reduce((sum, w) => {
                const v = varianLookup.get(`${w.id}__${uk}`);
                return sum + (v ? Number(values[v.id]) || 0 : 0);
              }, 0);
              return (
                <td key={uk} className="px-2 py-3 text-center text-xs font-semibold">
                  {colTotal > 0 ? colTotal.toLocaleString("id-ID") : "0"}
                </td>
              );
            })}
            <td className="px-4 py-3 text-right font-bold text-primary border-l border-stroke dark:border-dark-3 whitespace-nowrap">
              {grandTotal > 0 ? `${grandTotal.toLocaleString("id-ID")} pcs` : "0 pcs"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
