"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ClipboardCheck } from "lucide-react";
import type { WoQcRow } from "@/services/wo-qc";

interface Props {
  data: WoQcRow[];
}

export function PilihWoQc({ data }: Props) {
  const router = useRouter();
  const [isNav, startNav] = useTransition();

  if (data.length === 0) {
    return (
      <div className="rounded-[10px] border border-stroke bg-white p-8 text-center shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tidak ada Work Order QC yang sedang berjalan. Buat WO dulu, lalu tekan
          &quot;Mulai kerjakan&quot;.
        </p>
        <Button
          className="mt-4"
          loading={isNav}
          onClick={() => startNav(() => router.push("/qc/wo"))}
        >
          Ke Work Order QC
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((w) => {
        const total = Number(w.totalPcs);
        const sudah = Number(w.sudahDiperiksa);
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => startNav(() => router.push(`/qc/pemeriksaan/baru?wo=${w.id}`))}
            className="rounded-[10px] border border-stroke bg-white p-5 text-left shadow-1 transition hover:border-primary dark:border-dark-3 dark:bg-gray-dark dark:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-dark dark:text-white">{w.nomorDokumen}</span>
              <ClipboardCheck size={18} className="text-primary" />
            </div>
            <dl className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>PO: {w.nomorPo || "—"}</div>
              <div>Tanggal: {formatTanggal(w.tanggal)}</div>
              <div>Metode: {w.metode === "sampling" ? "Sampling" : "100%"}</div>
              <div>
                Progres:{" "}
                <strong className="text-dark dark:text-white">
                  {sudah} / {total} pcs
                </strong>
              </div>
            </dl>
          </button>
        );
      })}
    </div>
  );
}
