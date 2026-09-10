import { listBarisSiapWo } from "@/services/wo-qc";
import { listStandarQc } from "@/services/standar-qc";
import { listUsers } from "@/services/user";
import { WoQcForm } from "../_components/WoQcForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function WoQcBaruPage() {
  const [baris, standarList, userList] = await Promise.all([
    listBarisSiapWo(),
    listStandarQc(),
    listUsers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Work Order QC"
        breadcrumb={[
          { label: "Quality Control" },
          { label: "Work Order QC", href: "/qc/wo" },
          { label: "Baru" },
        ]}
      />
      <WoQcForm baris={baris} standarOptions={standarList} userOptions={userList} />
    </div>
  );
}
