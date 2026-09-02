"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TarifTable, type TarifRow } from "./TarifTable";
import { TarifFormModal } from "./TarifFormModal";
import { VersiBaruModal } from "./VersiBaruModal";
import { useTarifJasaJahitList } from "@/hooks/useTarifJasaJahit";
import type { Vendor, Produk } from "@/db/schema";
import type { PenjahitRow } from "../../penjahit/_components/PenjahitTable";

interface Props {
  initialData: TarifRow[];
  vendorList: Vendor[];
  penjahitList: PenjahitRow[];
  produkList: Produk[];
}

export function TarifPageClient({ initialData, vendorList, penjahitList, produkList }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TarifRow | null>(null);
  const [versiItem, setVersiItem] = useState<TarifRow | null>(null);
  const { data } = useTarifJasaJahitList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarif Jasa Jahit"
        breadcrumb={[{ label: "Vendor" }, { label: "Tarif Jasa" }]}
      />

      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Tarif berversi — mengubah harga membuat <strong>versi baru</strong>, tarif lama tidak
        ditimpa. Transaksi menyimpan salinan nominal saat penugasan dibuat.
      </div>

      <TarifTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
        onVersiBaru={(item) => setVersiItem(item)}
      />

      <TarifFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        vendorList={vendorList}
        penjahitList={penjahitList}
        produkList={produkList}
      />

      <VersiBaruModal
        item={versiItem}
        onClose={() => setVersiItem(null)}
      />
    </div>
  );
}
