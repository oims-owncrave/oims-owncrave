import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
import { Sidebar } from "@/components/layouts/sidebar";
import { MainContent } from "@/components/layouts/main-content";
import { UserInfo } from "@/components/layouts/header/user-info";
import { getCurrentUser } from "@/lib/auth";

export default async function WithLayoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const userRole = currentUser?.role ?? "viewer";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar userRole={userRole} />
        <MainContent userInfo={<UserInfo />} userRole={userRole}>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
