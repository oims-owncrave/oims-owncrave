import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/services/auth";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">OIMS Owncrave</h1>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Keluar
          </Button>
        </form>
      </div>
      <p className="text-gray-500">Dashboard — coming soon</p>
    </main>
  );
}
