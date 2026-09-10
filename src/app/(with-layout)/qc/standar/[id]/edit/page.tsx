import { notFound } from "next/navigation";
import { getStandarQcDetail } from "@/services/standar-qc";
import { listProduk } from "@/services/produk";
import { listKategori } from "@/services/kategori";
import { listJenisCacat } from "@/services/jenis-cacat";
import { StandarQcForm } from "../../_components/StandarQcForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function StandarQcEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, produkList, kategoriList, cacatList] = await Promise.all([
    getStandarQcDetail(id),
    listProduk(),
    listKategori(),
    listJenisCacat(),
  ]);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${data.header.nomorDokumen}`}
        breadcrumb={[
          { label: "Master" },
          { label: "Standar QC", href: "/qc/standar" },
          { label: "Edit" },
        ]}
      />
      <StandarQcForm
        produkOptions={produkList}
        kategoriOptions={kategoriList}
        cacatOptions={cacatList}
        editId={id}
        defaultValues={{
          nama: data.header.nama,
          produkId: data.header.produkId,
          kategoriId: data.header.kategoriId,
          tanggalBerlaku: new Date(data.header.tanggalBerlaku).toISOString().slice(0, 10),
          catatan: data.header.catatan ?? "",
          details: data.details.map((d) => ({
            tahap: d.tahap,
            bagianProduk: d.bagianProduk ?? "",
            kriteria: d.kriteria,
            metode: d.metode ?? "",
            tingkatKepentingan: d.tingkatKepentingan,
            toleransi: d.toleransi ?? "",
            jenisCacatId: d.jenisCacatId,
            tindakanJikaGagal: d.tindakanJikaGagal ?? "",
            wajibFoto: d.wajibFoto,
            urutan: d.urutan,
          })),
        }}
      />
    </div>
  );
}
