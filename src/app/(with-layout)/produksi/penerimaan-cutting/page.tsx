import { redirect } from "next/navigation";

/** List penerimaan digabung ke /produksi/cutting (tab Penerimaan Bahan). Detail/baru tetap di sini. */
export default function PenerimaanCuttingListPage() {
  redirect("/produksi/cutting");
}
