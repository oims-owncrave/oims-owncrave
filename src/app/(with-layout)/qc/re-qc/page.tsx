import { redirect } from "next/navigation";

export default function ReQcPage() {
  redirect("/qc/rework?tab=re-qc");
}
