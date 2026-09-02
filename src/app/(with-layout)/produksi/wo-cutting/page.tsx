import { redirect } from "next/navigation";

/** List WO digabung ke /produksi/cutting (tab Work Order). Detail/baru/edit tetap di sini. */
export default function WoCuttingListPage() {
  redirect("/produksi/cutting");
}
