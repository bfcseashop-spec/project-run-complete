import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search, Receipt, Palette, Clock, Sun, Moon, Monitor, Check, Languages, FileText } from "lucide-react";
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
  const { collapsed } = useSidebarState();
  const navigate = useNavigate();
  const now = useDateTime();
  const [currentTheme, setCurrentTheme] = useState(() => getStoredSettings().colorTheme || "teal");
  const [currentMode, setCurrentMode] = useState(() => getStoredSettings().mode || "light");

  const { settings, update: updateAppSettings } = useSettings();
  const currentLang = availableLanguages.find(l => l.id === settings.language) || availableLanguages[0];

  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

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
          <div className="flex items-center gap-1">
            {/* Billing Shortcut */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-primary"
              onClick={() => navigate("/billing")}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-medium">Billing</span>
            </Button>

            {/* Drafts Shortcut */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-primary"
              onClick={() => navigate("/billing/drafts")}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-medium">Drafts</span>
            </Button>

            {/* Language Shortcut */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
                  <Languages className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-medium">{currentLang.flag} {currentLang.id}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Language</DropdownMenuLabel>
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.id}
                    className="gap-2 cursor-pointer"
                    onClick={() => updateAppSettings({ language: lang.id })}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                    {settings.language === lang.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
                  <Palette className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-medium">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Color Theme</DropdownMenuLabel>
                {colorThemes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    className="gap-2 cursor-pointer"
                    onClick={() => { applyThemeQuick(t.id); setCurrentTheme(t.id); }}
                  >
                    <span className="w-4 h-4 rounded-full border border-border shrink-0" style={{ background: `hsl(${t.primary})` }} />
                    <span className="text-sm">{t.name}</span>
                    {currentTheme === t.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Appearance</DropdownMenuLabel>
                {modes.map((m) => (
                  <DropdownMenuItem
                    key={m.value}
                    className="gap-2 cursor-pointer"
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
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="hidden lg:inline text-xs font-medium tabular-nums">{timeStr}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-4">
                <div className="space-y-2 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{timeStr}</p>
                  <p className="text-sm text-muted-foreground">{dateStr}</p>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border mx-1" />

            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3 ml-2">
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
