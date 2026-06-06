import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, LayoutDashboard, Zap, Globe, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Pipeline", path: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", path: "/dashboard/discover", icon: Search },
  { label: "Outreach", path: "/dashboard/outreach", icon: Zap },
  { label: "Websites", path: "/dashboard/websites", icon: Globe },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link to="/" className="text-xl font-display font-bold text-foreground">PAYTM.</Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent/10 text-accent border-l-2 border-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</div>
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-card/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-display font-semibold text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label ?? "Dashboard"}
          </h2>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
