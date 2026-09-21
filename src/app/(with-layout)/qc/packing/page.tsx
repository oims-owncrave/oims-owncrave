import { redirect } from "next/navigation";

export default function PackingPage() {
  redirect("/qc/finishing?tab=packing");
}
