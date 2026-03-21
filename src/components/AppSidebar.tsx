import { NavLink, useLocation } from "react-router-dom";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import {
  LayoutDashboard, Pill, Users, FileText, TestTube, Scan,
  MonitorSpeaker, Heart, UserCog, Stethoscope, ClipboardList, Syringe,
  Receipt, CreditCard, TrendingUp, Pipette, DollarSign, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Activity, Plus, List, SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { t, TranslationKey } from "@/lib/i18n";

interface SubItem {
  icon: React.ElementType;
  labelKey: TranslationKey;
  path: string;
}

interface MenuItem {
  icon: React.ElementType;
  labelKey: TranslationKey;
  path: string;
  subItems?: SubItem[];
}

interface MenuSection {
  labelKey: TranslationKey;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    labelKey: "overview",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", path: "/" },
      { icon: Receipt, labelKey: "billing", path: "/billing" },
    ],
  },
  {
    labelKey: "patientCare",
    items: [
      { icon: ClipboardList, labelKey: "opdSection", path: "/opd" },
      { icon: FileText, labelKey: "prescriptions", path: "/prescriptions" },
      { icon: Heart, labelKey: "healthServices", path: "/health-services" },
      { icon: Syringe, labelKey: "injections", path: "/injections" },
    ],
  },
  {
    labelKey: "diagnostics",
    items: [
      {
        icon: TestTube, labelKey: "labTests", path: "/lab-tests",
        subItems: [
          { icon: Plus, labelKey: "add", path: "/lab-tests/add" },
          { icon: List, labelKey: "labTests", path: "/lab-tests" },
          { icon: TestTube, labelKey: "name", path: "/lab-tests/names" },
        ],
      },
      { icon: FileText, labelKey: "labReports", path: "/lab-reports" },
      { icon: Scan, labelKey: "xray", path: "/xray" },
      { icon: MonitorSpeaker, labelKey: "ultrasound", path: "/ultrasound" },
      { icon: Pipette, labelKey: "sampleCollection", path: "/sample-collection" },
    ],
  },
  {
    labelKey: "management",
    items: [
      { icon: Stethoscope, labelKey: "doctors", path: "/doctors" },
      { icon: Pill, labelKey: "medicine", path: "/medicine" },
      { icon: Users, labelKey: "hrm", path: "/hrm" },
      { icon: UserCog, labelKey: "roles", path: "/roles" },
    ],
  },
  {
    labelKey: "finance",
    items: [
      { icon: Receipt, labelKey: "dueManagement", path: "/dues" },
      { icon: DollarSign, labelKey: "expenses", path: "/expenses" },
      { icon: CreditCard, labelKey: "bankTransactions", path: "/bank" },
      { icon: TrendingUp, labelKey: "investments", path: "/investments" },
    ],
  },
  {
    labelKey: "system",
    items: [
      { icon: SlidersHorizontal, labelKey: "systemManage", path: "/system-manage" },
      { icon: Settings, labelKey: "settings", path: "/settings" },
    ],
  },
];

const AppSidebar = () => {
  const { collapsed, toggle } = useSidebarState();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/lab-tests"]);
  const { settings } = useSettings();
  const lang = settings.language;

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) =>
    item.subItems?.some((sub) => isActive(sub.path)) || isActive(item.path);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-30 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-sidebar-primary-foreground" />
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
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {menuSections.map((section) => (
          <div key={section.labelKey}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-sidebar-muted px-3 mb-1.5 font-semibold">
                {t(section.labelKey, lang)}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const hasChildren = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems.includes(item.path);
                const parentActive = isParentActive(item);

                if (hasChildren && !collapsed) {
                  return (
                    <div key={item.path}>
                      <button
                        onClick={() => toggleExpand(item.path)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
                          parentActive
                            ? "bg-sidebar-primary/10 text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
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
                        <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 mt-0.5">
                          {item.subItems!.map((sub) => (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              end
                              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                isActive(sub.path)
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              <sub.icon className="w-4 h-4 flex-shrink-0" />
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      parentActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? t(item.labelKey, lang) : undefined}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{t(item.labelKey, lang)}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
