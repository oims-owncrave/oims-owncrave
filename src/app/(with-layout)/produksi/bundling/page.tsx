import { opsional } from "@/lib/auth";
import { listBundel, listWoBisaDibundel } from "@/services/bundling";
import { listVendor } from "@/services/vendor";
import { listPenjahit } from "@/services/penjahit";
import { BundelPageClient } from "./_components/BundelPageClient";

export default async function BundlingPage() {
  // Halaman DAFTAR: semua role yang boleh membaca harus bisa membukanya.
  // listWoBisaDibundel/listVendor/listPenjahit hanya mengisi dropdown modal
  // "Tambah Bundel" dan dijaga WRITE_ROLES — kalau dipanggil tanpa syarat,
  // role baca (mis. admin_gudang) mendapat "Akses ditolak" dan halaman crash.
  const data = await listBundel();
  const [woOptions, vendorOptions, penjahitOptions] = await Promise.all([
    opsional(listWoBisaDibundel(), []),
    opsional(listVendor(), []),
    opsional(listPenjahit(), []),
  ]);
  return (
    <BundelPageClient
      initialData={data}
      woOptions={woOptions}
      vendorOptions={vendorOptions}
      penjahitOptions={penjahitOptions}
    />
  );
}
