import { NavLink, useLocation } from "react-router-dom";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import {
  LayoutDashboard, Wallet, FileText, FlaskConical, ScanLine, Search,
  Radio, HeartPulse, UserCog, Stethoscope, ClipboardCheck, Syringe,
  ReceiptText, Landmark, TrendingUp, Beaker, BadgeDollarSign, Settings2,
  ChevronLeft, ChevronRight, ChevronDown, Activity, Plus, Sliders,
  RefreshCcw, PackageOpen, LogOut, X, Microscope, FileBarChart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { t, TranslationKey } from "@/lib/i18n";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";

interface SubItem { icon: React.ElementType; labelKey: TranslationKey; path: string; module?: string; }
interface MenuItem { icon: React.ElementType; labelKey: TranslationKey; path: string; module?: string; subItems?: SubItem[]; color?: string; }
interface MenuSection { labelKey: TranslationKey; items: MenuItem[]; color?: string; }

const menuSections: MenuSection[] = [
  {
    labelKey: "overview", color: "hsl(210, 100%, 68%)",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", path: "/", module: "Dashboard", color: "hsl(210, 100%, 68%)" },
      { icon: Wallet, labelKey: "billing", path: "/billing", module: "Billing", color: "hsl(258, 80%, 68%)" },
    ],
  },
  {
    labelKey: "patientCare", color: "hsl(340, 85%, 62%)",
    items: [
      { icon: ClipboardCheck, labelKey: "opdSection", path: "/opd", module: "OPD Section", color: "hsl(160, 70%, 50%)",
        subItems: [
          { icon: ClipboardCheck, labelKey: "patientList", path: "/opd" },
          { icon: Plus, labelKey: "registerPatient", path: "/opd/register" },
          { icon: Search, labelKey: "patientLookup", path: "/patient-lookup" },
        ],
      },
      { icon: FileBarChart, labelKey: "prescriptions", path: "/prescriptions", module: "Prescriptions", color: "hsl(270, 70%, 65%)" },
      { icon: HeartPulse, labelKey: "healthServices", path: "/health-services", module: "Health Services", color: "hsl(340, 85%, 62%)",
        subItems: [
          { icon: PackageOpen, labelKey: "healthPackages", path: "/health-services/packages" },
        ],
      },
      { icon: Syringe, labelKey: "injections", path: "/injections", module: "Injections", color: "hsl(28, 95%, 58%)" },
    ],
  },
  {
    labelKey: "diagnostics", color: "hsl(190, 90%, 52%)",
    items: [
      {
        icon: FlaskConical, labelKey: "labTests", path: "/lab-tests", module: "Lab Tests", color: "hsl(190, 90%, 52%)",
        subItems: [
          { icon: Plus, labelKey: "add", path: "/lab-tests/add" },
          { icon: Beaker, labelKey: "sampleCollection", path: "/sample-collection", module: "Sample Collection" },
          { icon: Microscope, labelKey: "name", path: "/lab-tests/names", module: "Test Names" },
        ],
      },
      { icon: FileText, labelKey: "labReports", path: "/lab-reports", module: "Lab Reports", color: "hsl(220, 85%, 62%)" },
      { icon: Stethoscope, labelKey: "labTechnologists", path: "/lab-technologists", module: "Lab Technologists", color: "hsl(168, 80%, 42%)" },
      { icon: ScanLine, labelKey: "xray", path: "/xray", module: "X-Ray", color: "hsl(45, 95%, 55%)" },
      { icon: Radio, labelKey: "ultrasound", path: "/ultrasound", module: "Ultrasound", color: "hsl(285, 75%, 62%)" },
    ],
  },
  {
    labelKey: "management", color: "hsl(155, 70%, 48%)",
    items: [
      { icon: Stethoscope, labelKey: "doctors", path: "/doctors", module: "Doctors", color: "hsl(155, 70%, 48%)" },
      { icon: Activity, labelKey: "medicine", path: "/medicine", module: "Medicine", color: "hsl(280, 65%, 60%)" },
    ],
  },
  {
    labelKey: "finance", color: "hsl(140, 72%, 45%)",
    items: [
      { icon: RefreshCcw, labelKey: "refund", path: "/refund", module: "Refund", color: "hsl(45, 90%, 55%)" },
      { icon: ReceiptText, labelKey: "dueManagement", path: "/dues", module: "Due Management", color: "hsl(0, 75%, 58%)" },
      { icon: BadgeDollarSign, labelKey: "expenses", path: "/expenses", module: "Expenses", color: "hsl(22, 90%, 55%)" },
      { icon: Landmark, labelKey: "bankTransactions", path: "/bank", module: "Bank Transactions", color: "hsl(215, 85%, 58%)" },
      { icon: TrendingUp, labelKey: "investments", path: "/investments", module: "Investments", color: "hsl(140, 72%, 45%)" },
    ],
  },
  {
    labelKey: "system", color: "hsl(200, 60%, 55%)",
    items: [
      { icon: Sliders, labelKey: "systemManage", path: "/system-manage", module: "System Manage", color: "hsl(200, 60%, 55%)" },
      { icon: Settings2, labelKey: "settings", path: "/settings", module: "Settings", color: "hsl(210, 55%, 58%)" },
      { icon: UserCog, labelKey: "usersAccess", path: "/users-access", module: "Users & Access", color: "hsl(175, 75%, 45%)" },
    ],
  },
];

const AppSidebar = () => {
  const { collapsed, toggle, isMobile, mobileOpen, setMobileOpen } = useSidebarState();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/opd", "/lab-tests", "/health-services", "/medicine"]);
  const { settings } = useSettings();
  const lang = settings.language;
  const { can, isAdmin } = usePermissions();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname]);

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

  const showSidebar = isMobile ? mobileOpen : true;
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ${
          isMobile
            ? `w-[270px] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
            : isCollapsed ? "w-[62px]" : "w-[230px]"
        }`}
        style={{
          background: "linear-gradient(180deg, hsl(225, 38%, 14%) 0%, hsl(228, 35%, 10%) 100%)",
          borderRight: "1px solid hsl(225, 25%, 22%)",
          boxShadow: "4px 0 24px hsl(225, 40%, 6% / 0.5)",
        }}
      >
        {/* ─── Logo Header ─── */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: settings.clinicLogo ? "transparent" : "linear-gradient(135deg, hsl(168, 80%, 42%), hsl(190, 90%, 52%))",
              boxShadow: "0 4px 14px hsl(168, 80%, 42% / 0.3)",
            }}
          >
            {settings.clinicLogo ? (
              <img src={settings.clinicLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Activity className="w-5 h-5 text-white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-[13px] font-bold tracking-tight truncate" style={{ color: "hsl(0, 0%, 95%)" }}>
                {settings.clinicName || "ClinicPOS"}
              </h1>
              <p className="text-[9px] leading-none truncate mt-0.5" style={{ color: "hsl(220, 15%, 52%)" }}>
                {settings.clinicTagline || "Healthcare & Wellness"}
              </p>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: "hsl(220, 15%, 52%)" }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto py-1.5 px-2.5 space-y-1 scrollbar-thin">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) => canViewModule(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.labelKey} className="mb-1">
                {!isCollapsed && (
                  <div className="px-2 pt-3 pb-1.5">
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] font-bold"
                      style={{ color: `${section.color}` }}
                    >
                      {t(section.labelKey, lang)}
                    </p>
                  </div>
                )}
                {isCollapsed && <div className="w-5 h-px mx-auto my-2 rounded-full" style={{ background: "hsl(225, 25%, 22%)" }} />}

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const hasChildren = item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedItems.includes(item.path);
                    const parentActive = isParentActive(item);
                    const iconColor = item.color || "hsl(168, 80%, 42%)";

                    if (hasChildren && !isCollapsed) {
                      return (
                        <div key={item.path}>
                          <button
                            onClick={() => toggleExpand(item.path)}
                            className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-lg text-[12px] font-medium transition-all duration-200 group relative"
                            style={{
                              color: parentActive ? "hsl(0, 0%, 95%)" : "hsl(220, 15%, 68%)",
                              background: parentActive ? "hsl(225, 30%, 18%)" : "transparent",
                            }}
                          >
                            {parentActive && (
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                style={{ background: iconColor, boxShadow: `0 0 10px ${iconColor}50` }}
                              />
                            )}
                            <div
                              className="w-[28px] h-[28px] rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
                              style={{
                                background: parentActive ? `${iconColor}25` : `${iconColor}12`,
                              }}
                            >
                              <item.icon className="w-[14px] h-[14px]" style={{ color: iconColor }} />
                            </div>
                            <span className="flex-1 text-left">{t(item.labelKey, lang)}</span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              style={{ color: "hsl(220, 15%, 45%)" }}
                            />
                          </button>

                          <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="ml-[26px] pl-3 space-y-0 mt-0.5 mb-0.5" style={{ borderLeft: `1.5px solid hsl(225, 25%, 22%)` }}>
                              {item.subItems!.filter((sub) => canViewModule(sub.module)).map((sub) => (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  end
                                  className="flex items-center gap-2 px-2 py-[5px] rounded-md text-[11px] font-medium transition-all duration-200"
                                  style={{
                                    color: isActive(sub.path) ? "hsl(0, 0%, 95%)" : "hsl(220, 15%, 55%)",
                                    background: isActive(sub.path) ? "hsl(225, 30%, 18%)" : "transparent",
                                  }}
                                >
                                  <div
                                    className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                                    style={{
                                      background: isActive(sub.path) ? iconColor : "hsl(225, 25%, 28%)",
                                      boxShadow: isActive(sub.path) ? `0 0 6px ${iconColor}60` : "none",
                                    }}
                                  />
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
                        className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] font-medium transition-all duration-200 group relative ${
                          isCollapsed ? "justify-center px-0" : ""
                        }`}
                        style={{
                          color: parentActive ? "hsl(0, 0%, 95%)" : "hsl(220, 15%, 68%)",
                          background: parentActive ? "hsl(225, 30%, 18%)" : "transparent",
                        }}
                        title={isCollapsed ? t(item.labelKey, lang) : undefined}
                      >
                        {parentActive && !isCollapsed && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{ background: iconColor, boxShadow: `0 0 10px ${iconColor}50` }}
                          />
                        )}
                        <div
                          className={`${isCollapsed ? "w-9 h-9" : "w-[28px] h-[28px]"} rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200`}
                          style={{
                            background: parentActive ? `${iconColor}25` : `${iconColor}12`,
                          }}
                        >
                          <item.icon
                            className={`${isCollapsed ? "w-4 h-4" : "w-[14px] h-[14px]"}`}
                            style={{ color: iconColor }}
                          />
                        </div>
                        {!isCollapsed && <span>{t(item.labelKey, lang)}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ─── User Profile Card ─── */}
        {!isCollapsed && profile && (
          <div className="px-3 pb-3">
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, hsl(225, 30%, 18%), hsl(225, 28%, 15%))",
                border: "1px solid hsl(225, 25%, 22%)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(168, 80%, 42%), hsl(190, 90%, 52%))",
                  boxShadow: "0 2px 8px hsl(168, 80%, 42% / 0.3)",
                }}
              >
                <span className="text-white">
                  {profile.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: "hsl(0, 0%, 92%)" }}>{profile.full_name || "User"}</p>
                <p className="text-[9px] truncate" style={{ color: "hsl(220, 15%, 50%)" }}>{profile.role_name || "No role"}</p>
              </div>
              <button
                onClick={signOut}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/15"
                style={{ color: "hsl(220, 15%, 48%)" }}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsed user avatar */}
        {isCollapsed && profile && (
          <div className="px-2 pb-3 flex justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold cursor-pointer"
              style={{
                background: "linear-gradient(135deg, hsl(168, 80%, 42%), hsl(190, 90%, 52%))",
                boxShadow: "0 2px 8px hsl(168, 80%, 42% / 0.3)",
              }}
              title={`${profile.full_name} — Click sidebar expand to sign out`}
            >
              <span className="text-white">
                {profile.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
          </div>
        )}

        {/* ─── Collapse Toggle ─── */}
        {!isMobile && (
          <button
            onClick={toggle}
            className="flex items-center justify-center h-10 transition-all"
            style={{
              borderTop: "1px solid hsl(225, 25%, 20%)",
              color: "hsl(220, 15%, 45%)",
            }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
