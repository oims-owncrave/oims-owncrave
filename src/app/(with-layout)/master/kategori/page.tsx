import { listKategori } from '@/services/kategori';
import { KategoriPageClient } from './_components/KategoriPageClient';

export default async function MasterKategoriPage() {
  const data = await listKategori();
  return <KategoriPageClient initialData={data} />;
}
