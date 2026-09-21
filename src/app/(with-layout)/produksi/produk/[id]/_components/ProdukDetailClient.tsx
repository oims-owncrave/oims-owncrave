"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VarianTable } from "./VarianTable";
import { VarianGenerateModal } from "./VarianGenerateModal";
import { VarianEditModal } from "./VarianEditModal";
import { useProdukDetail } from "@/hooks/useVarianProduk";
import type { ProdukDetail, VarianRow } from "@/services/varian-produk";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { importVarianBatch } from "@/services/import";

interface Props {
  produkId: string;
  initialData: ProdukDetail;
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function ProdukDetailClient({ produkId, initialData }: Props) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editItem, setEditItem] = useState<VarianRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useProdukDetail(produkId);

  const detail = data ?? initialData;
  const { produk, varian } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        title={produk.nama}
        breadcrumb={[
          { label: "Produksi" },
          { label: "Produk", href: "/produksi/produk" },
          { label: produk.kode },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoItem label="Kode" value={produk.kode} />
          <InfoItem label="Status" value={produk.isActive ? "Aktif" : "Nonaktif"} />
          <InfoItem label="Jumlah Varian" value={String(varian.length)} />
        </div>
        {produk.deskripsi && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{produk.deskripsi}</p>
        )}
      </div>

      <VarianTable
        data={varian}
        produkId={produkId}
        onAdd={() => setGenerateOpen(true)}
        onEdit={(item) => setEditItem(item)}
        onImport={() => setImportOpen(true)}
      />

      <VarianGenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        produkId={produkId}
      />

      <VarianEditModal
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        produkId={produkId}
        initialData={editItem}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import Varian Produk",
          templateFilename: "template-varian",
          columns: [
            { key: "produk", header: "Produk (kode/nama)", example: "NJK", required: true },
            { key: "warna", header: "Warna (kode/nama)", example: "Hitam", required: true },
            { key: "ukuran", header: "Ukuran", example: "M", required: true },
            { key: "jenisKelamin", header: "Jenis Kelamin", example: "Unisex", required: false },
          ],
          action: importVarianBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["produk", produkId] });
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
