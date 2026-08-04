import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/services/user";
import { UserPageClient } from "./_components/UserPageClient";

export default async function PenggunaPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "owner") {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <UserPageClient initialUsers={users} currentUserId={currentUser.id} />
  );
}
