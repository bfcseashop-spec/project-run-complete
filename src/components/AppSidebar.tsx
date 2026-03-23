import { NavLink, useLocation } from "react-router-dom";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import {
  LayoutDashboard, Pill, Users, FileText, TestTube, Scan,
  MonitorSpeaker, Heart, UserCog, Stethoscope, ClipboardList, Syringe,
  Receipt, CreditCard, TrendingUp, Pipette, DollarSign, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Activity, Plus, List, SlidersHorizontal,
  RotateCcw, Package, LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { t, TranslationKey } from "@/lib/i18n";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";

interface SubItem {
  icon: React.ElementType;
  labelKey: TranslationKey;
  path: string;
}

interface MenuItem {
  icon: React.ElementType;
  labelKey: TranslationKey;
  path: string;
  module?: string;
  subItems?: SubItem[];
  color?: string;
}

interface MenuSection {
  labelKey: TranslationKey;
  items: MenuItem[];
  color?: string;
}

const menuSections: MenuSection[] = [
  {
    labelKey: "overview",
    color: "hsl(168, 80%, 35%)",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", path: "/", module: "Dashboard", color: "hsl(168, 80%, 35%)" },
      { icon: Receipt, labelKey: "billing", path: "/billing", module: "Billing", color: "hsl(200, 80%, 45%)" },
    ],
  },
  {
    labelKey: "patientCare",
    color: "hsl(340, 70%, 50%)",
    items: [
      { icon: ClipboardList, labelKey: "opdSection", path: "/opd", module: "OPD Section", color: "hsl(160, 60%, 38%)" },
      { icon: FileText, labelKey: "prescriptions", path: "/prescriptions", module: "Prescriptions", color: "hsl(270, 60%, 50%)" },
      { icon: Heart, labelKey: "healthServices", path: "/health-services", module: "Health Services", color: "hsl(340, 70%, 50%)",
        subItems: [
          { icon: Plus, labelKey: "addService", path: "/health-services" },
          { icon: Package, labelKey: "healthPackages", path: "/health-services/packages" },
        ],
      },
      { icon: Syringe, labelKey: "injections", path: "/injections", module: "Injections", color: "hsl(15, 85%, 50%)" },
    ],
  },
  {
    labelKey: "diagnostics",
    color: "hsl(200, 80%, 45%)",
    items: [
      {
        icon: TestTube, labelKey: "labTests", path: "/lab-tests", module: "Lab Tests", color: "hsl(200, 80%, 45%)",
        subItems: [
          { icon: Plus, labelKey: "add", path: "/lab-tests/add" },
          { icon: Pipette, labelKey: "sampleCollection", path: "/sample-collection" },
          { icon: TestTube, labelKey: "name", path: "/lab-tests/names" },
        ],
      },
      { icon: FileText, labelKey: "labReports", path: "/lab-reports", module: "Lab Reports", color: "hsl(217, 80%, 50%)" },
      { icon: Scan, labelKey: "xray", path: "/xray", module: "X-Ray", color: "hsl(38, 92%, 48%)" },
      { icon: MonitorSpeaker, labelKey: "ultrasound", path: "/ultrasound", module: "Ultrasound", color: "hsl(280, 65%, 50%)" },
    ],
  },
  {
    labelKey: "management",
    color: "hsl(270, 60%, 50%)",
    items: [
      { icon: Stethoscope, labelKey: "doctors", path: "/doctors", module: "Doctors", color: "hsl(160, 50%, 38%)" },
      { icon: Pill, labelKey: "medicine", path: "/medicine", module: "Medicine", color: "hsl(270, 60%, 50%)" },
    ],
  },
  {
    labelKey: "finance",
    color: "hsl(142, 71%, 40%)",
    items: [
      { icon: RotateCcw, labelKey: "refund", path: "/refund", module: "Refund", color: "hsl(38, 80%, 48%)" },
      { icon: Receipt, labelKey: "dueManagement", path: "/dues", module: "Due Management", color: "hsl(350, 65%, 50%)" },
      { icon: DollarSign, labelKey: "expenses", path: "/expenses", module: "Expenses", color: "hsl(15, 85%, 48%)" },
      { icon: CreditCard, labelKey: "bankTransactions", path: "/bank", module: "Bank Transactions", color: "hsl(217, 91%, 50%)" },
      { icon: TrendingUp, labelKey: "investments", path: "/investments", module: "Investments", color: "hsl(142, 71%, 40%)" },
    ],
  },
  {
    labelKey: "system",
    color: "hsl(215, 60%, 50%)",
    items: [
      { icon: SlidersHorizontal, labelKey: "systemManage", path: "/system-manage", module: "System Manage", color: "hsl(200, 50%, 45%)" },
      { icon: Settings, labelKey: "settings", path: "/settings", module: "Settings", color: "hsl(215, 60%, 50%)" },
      { icon: Users, labelKey: "usersAccess", path: "/users-access", module: "Users & Access", color: "hsl(168, 80%, 35%)" },
    ],
  },
];

const AppSidebar = () => {
  const { collapsed, toggle } = useSidebarState();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/lab-tests", "/health-services", "/medicine"]);
  const { settings } = useSettings();
  const lang = settings.language;
  const { can, isAdmin } = usePermissions();
  const { signOut, profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) =>
    item.subItems?.some((sub) => isActive(sub.path)) || isActive(item.path);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const canViewModule = (module?: string) => {
    if (!module) return true;
    return isAdmin || can(module, "view");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-30 transition-all duration-300 border-r border-sidebar-border shadow-sm ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{ background: "linear-gradient(135deg, hsl(168, 80%, 35%), hsl(200, 80%, 40%))" }}
        >
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-sidebar-accent-foreground font-heading tracking-tight">
              ClinicPOS
            </h1>
            <p className="text-[10px] text-sidebar-muted leading-none">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5 scrollbar-thin">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => canViewModule(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.labelKey}>
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 mb-2">
                  <div className="w-1 h-3 rounded-full" style={{ background: section.color }} />
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: section.color }}>
                    {t(section.labelKey, lang)}
                  </p>
                </div>
              )}
              {collapsed && <div className="w-6 h-px mx-auto mb-2 rounded-full bg-sidebar-border" />}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const hasChildren = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedItems.includes(item.path);
                  const parentActive = isParentActive(item);
                  const iconColor = item.color || "hsl(168, 80%, 35%)";

                  if (hasChildren && !collapsed) {
                    return (
                      <div key={item.path}>
                        <button
                          onClick={() => toggleExpand(item.path)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 w-full group ${
                            parentActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px]"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60 border-l-[3px] border-transparent"
                          }`}
                          style={parentActive ? { borderLeftColor: iconColor } : undefined}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              parentActive ? "shadow-md" : "group-hover:scale-105"
                            }`}
                            style={{
                              background: parentActive ? iconColor : `${iconColor}15`,
                            }}
                          >
                            <item.icon className="w-4 h-4" style={{ color: parentActive ? "white" : iconColor }} />
                          </div>
                          <span className="flex-1 text-left">{t(item.labelKey, lang)}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-sidebar-muted transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-[22px] pl-4 border-l border-sidebar-border space-y-0.5 mt-1">
                            {item.subItems!.map((sub) => (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                end
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 ${
                                  isActive(sub.path)
                                    ? "text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-muted hover:text-sidebar-foreground"
                                }`}
                              >
                                {isActive(sub.path) && (
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: iconColor, boxShadow: `0 0 6px ${iconColor}` }} />
                                )}
                                {!isActive(sub.path) && <div className="w-1.5 h-1.5 rounded-full bg-sidebar-border flex-shrink-0" />}
                                <span>{t(sub.labelKey, lang)}</span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group ${
                        parentActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px]"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 border-l-[3px] border-transparent"
                      } ${collapsed ? "justify-center px-0 border-l-0" : ""}`}
                      style={parentActive && !collapsed ? { borderLeftColor: iconColor } : undefined}
                      } ${collapsed ? "justify-center px-0" : ""}`}
                      title={collapsed ? t(item.labelKey, lang) : undefined}
                    >
                      <div
                        className={`${collapsed ? "w-10 h-10" : "w-8 h-8"} rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          parentActive ? "shadow-md" : "group-hover:scale-105"
                        }`}
                        style={{
                          background: parentActive ? iconColor : `${iconColor}15`,
                        }}
                      >
                        <item.icon className={`${collapsed ? "w-[18px] h-[18px]" : "w-4 h-4"}`} style={{ color: parentActive ? "white" : iconColor }} />
                      </div>
                      {!collapsed && <span>{t(item.labelKey, lang)}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User info + Sign out */}
      {!collapsed && profile && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-sidebar-accent/50">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, hsl(168, 80%, 35%), hsl(200, 80%, 45%))" }}
            >
              <span className="text-white">
                {profile.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{profile.full_name || "User"}</p>
              <p className="text-[10px] text-sidebar-muted truncate">{profile.role_name || "No role"}</p>
            </div>
            <button
              onClick={signOut}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-11 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
