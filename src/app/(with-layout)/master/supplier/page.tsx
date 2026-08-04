import { listSupplier } from "@/services/supplier";
import { SupplierPageClient } from "./_components/SupplierPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Supplier | OIMS Owncrave",
};

export default async function MasterSupplierPage() {
  const data = await listSupplier();
  return <SupplierPageClient initialData={data} />;
}
