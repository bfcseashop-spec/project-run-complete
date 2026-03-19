import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { SidebarStateProvider, useSidebarState } from "@/hooks/use-sidebar-state";

const LayoutInner = () => {
  const { collapsed } = useSidebarState();
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className={`transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[260px]"}`}>
        <header className="sticky top-0 z-20 h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-card">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients, tests, medicines..."
              className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <SidebarStateProvider>
    <LayoutInner />
  </SidebarStateProvider>
);

export default AppLayout;
