import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
import { Sidebar } from "@/components/layouts/sidebar";
import { MainContent } from "@/components/layouts/main-content";
import { UserInfo } from "@/components/layouts/header/user-info";

export default function WithLayoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MainContent userInfo={<UserInfo />}>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}

