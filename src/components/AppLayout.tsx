import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search, Receipt, Palette, Clock, Sun, Moon, Monitor, Check, Languages, FileText, Menu } from "lucide-react";
import { SidebarStateProvider, useSidebarState } from "@/hooks/use-sidebar-state";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { getDrafts, subscribeDrafts } from "@/data/draftStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const availableLanguages = [
  { id: "English", label: "English", flag: "🇺🇸" },
  { id: "Khmer", label: "ខ្មែរ", flag: "🇰🇭" },
  { id: "Bengali", label: "বাংলা", flag: "🇧🇩" },
];

const colorThemes = [
  { name: "Teal", primary: "168 80% 30%", id: "teal" },
  { name: "Blue", primary: "220 80% 45%", id: "blue" },
  { name: "Purple", primary: "270 70% 45%", id: "purple" },
  { name: "Rose", primary: "350 70% 45%", id: "rose" },
  { name: "Amber", primary: "30 90% 45%", id: "amber" },
  { name: "Emerald", primary: "152 70% 35%", id: "emerald" },
  { name: "Slate", primary: "215 25% 35%", id: "slate" },
  { name: "Indigo", primary: "240 60% 50%", id: "indigo" },
];

const modes = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Monitor },
] as const;

function useDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem("clinic-system-manage") || "{}");
  } catch { return {}; }
}

function applyThemeQuick(themeId: string) {
  const theme = colorThemes.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  const s = getStoredSettings();
  s.colorTheme = themeId;
  localStorage.setItem("clinic-system-manage", JSON.stringify(s));
}

function applyModeQuick(mode: string) {
  const root = document.documentElement;
  root.classList.remove("dark");
  if (mode === "dark") root.classList.add("dark");
  else if (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
  const s = getStoredSettings();
  s.mode = mode;
  localStorage.setItem("clinic-system-manage", JSON.stringify(s));
}

const LayoutInner = () => {
  const { collapsed, isMobile, setMobileOpen } = useSidebarState();
  const navigate = useNavigate();
  const now = useDateTime();
  const [currentTheme, setCurrentTheme] = useState(() => getStoredSettings().colorTheme || "teal");
  const [currentMode, setCurrentMode] = useState(() => getStoredSettings().mode || "light");

  const [draftCount, setDraftCount] = useState(getDrafts().length);
  useEffect(() => { const unsub = subscribeDrafts(() => setDraftCount(getDrafts().length)); return unsub; }, []);

  const { settings, update: updateAppSettings } = useSettings();
  const currentLang = availableLanguages.find(l => l.id === settings.language) || availableLanguages[0];

  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className={`transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[260px]"}`}>
        <header
          className="sticky top-0 z-20 h-14 flex items-center justify-between px-5 shadow-md"
          style={{ background: "linear-gradient(135deg, hsl(160, 50%, 28%) 0%, hsl(168, 60%, 22%) 50%, hsl(175, 55%, 20%) 100%)" }}
        >
          {/* Search */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex-1 transition-all focus-within:border-white/25 focus-within:bg-white/15">
              <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search patients, tests, medicines..."
                className="bg-transparent text-sm outline-none w-full text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Billing */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => navigate("/billing")}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/15">
                <Receipt className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="hidden md:inline text-xs font-semibold">Billing</span>
            </Button>

            {/* Drafts */}
            <Button
              variant="ghost"
              size="sm"
              className="relative gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => navigate("/billing/drafts")}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(38, 92%, 50%, 0.25)" }}>
                <FileText className="w-3.5 h-3.5" style={{ color: "hsl(45, 100%, 72%)" }} />
              </div>
              <span className="hidden md:inline text-xs font-semibold">Drafts</span>
              {draftCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none shadow-md" style={{ background: "linear-gradient(135deg, hsl(38, 92%, 50%), hsl(25, 90%, 50%))" }}>
                  {draftCount}
                </span>
              )}
            </Button>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(270, 60%, 55%, 0.25)" }}>
                    <Languages className="w-3.5 h-3.5" style={{ color: "hsl(280, 80%, 78%)" }} />
                  </div>
                  <span className="hidden md:inline text-xs font-semibold">{currentLang.flag} {currentLang.id}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-border/50">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Language</DropdownMenuLabel>
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.id}
                    className="gap-2 cursor-pointer rounded-lg"
                    onClick={() => updateAppSettings({ language: lang.id })}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                    {settings.language === lang.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(340, 70%, 55%, 0.25)" }}>
                    <Palette className="w-3.5 h-3.5" style={{ color: "hsl(340, 80%, 75%)" }} />
                  </div>
                  <span className="hidden md:inline text-xs font-semibold">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border/50">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Color Theme</DropdownMenuLabel>
                {colorThemes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    className="gap-2 cursor-pointer rounded-lg"
                    onClick={() => { applyThemeQuick(t.id); setCurrentTheme(t.id); }}
                  >
                    <span className="w-4 h-4 rounded-full border-2 shrink-0 shadow-sm" style={{ background: `hsl(${t.primary})`, borderColor: currentTheme === t.id ? `hsl(${t.primary})` : "transparent" }} />
                    <span className="text-sm">{t.name}</span>
                    {currentTheme === t.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Appearance</DropdownMenuLabel>
                {modes.map((m) => (
                  <DropdownMenuItem
                    key={m.value}
                    className="gap-2 cursor-pointer rounded-lg"
                    onClick={() => { applyModeQuick(m.value); setCurrentMode(m.value); }}
                  >
                    <m.icon className="w-4 h-4" />
                    <span className="text-sm">{m.label}</span>
                    {currentMode === m.value && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date & Time */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/15">
                    <Clock className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="hidden lg:inline text-xs font-semibold tabular-nums">{timeStr}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-4 rounded-xl shadow-lg border-border/50">
                <div className="space-y-2 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{timeStr}</p>
                  <p className="text-sm text-muted-foreground">{dateStr}</p>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-7 bg-white/15 mx-1.5" />

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all">
              <Bell className="w-[18px] h-[18px] text-white/70" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "hsl(160, 50%, 28%)", background: "linear-gradient(135deg, hsl(0, 72%, 50%), hsl(350, 70%, 45%))" }} />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 ml-1.5 pl-1.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-md"
                style={{ background: "linear-gradient(135deg, hsl(45, 100%, 65%), hsl(38, 92%, 50%))", color: "hsl(25, 50%, 15%)" }}
              >
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">Admin</p>
                <p className="text-[10px] text-white/50 font-medium">Super Admin</p>
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
