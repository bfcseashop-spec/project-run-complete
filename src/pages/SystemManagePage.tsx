import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paintbrush, Type, Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { toast } from "sonner";

/* ── Font options ── */
const numberFontFamilies = [
  { label: "Same as Body Font", value: "__same__", import: "" },
  { label: "Inter (Default)", value: "'Inter', system-ui, sans-serif", import: "Inter:wght@300;400;500;600;700" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace", import: "JetBrains+Mono:wght@400;500;600;700" },
  { label: "Roboto Mono", value: "'Roboto Mono', monospace", import: "Roboto+Mono:wght@400;500;600;700" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", import: "Space+Grotesk:wght@400;500;600;700" },
  { label: "Outfit", value: "'Outfit', sans-serif", import: "Outfit:wght@400;500;600;700" },
  { label: "DM Sans", value: "'DM Sans', sans-serif", import: "DM+Sans:wght@400;500;700" },
  { label: "Barlow", value: "'Barlow', sans-serif", import: "Barlow:wght@400;500;600;700" },
  { label: "Oswald", value: "'Oswald', sans-serif", import: "Oswald:wght@400;500;600;700" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif", import: "Bebas+Neue" },
  { label: "Orbitron", value: "'Orbitron', sans-serif", import: "Orbitron:wght@400;500;600;700" },
];
const fontFamilies = [
  { label: "Inter (Default)", value: "'Inter', system-ui, sans-serif", import: "Inter:wght@300;400;500;600;700" },
  { label: "Spectral", value: "'Spectral', serif", import: "Spectral:wght@300;400;500;600;700" },
  { label: "Lexend", value: "'Lexend', sans-serif", import: "Lexend:wght@300;400;500;600;700" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif", import: "" },
  { label: "Roboto", value: "'Roboto', sans-serif", import: "Roboto:wght@300;400;500;700" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif", import: "" },
  { label: "Open Sans", value: "'Open Sans', sans-serif", import: "Open+Sans:wght@300;400;600;700" },
  { label: "Noto Sans", value: "'Noto Sans', sans-serif", import: "Noto+Sans:wght@300;400;500;600;700" },
  { label: "Lato", value: "'Lato', sans-serif", import: "Lato:wght@300;400;700" },
  { label: "Source Sans Pro", value: "'Source Sans 3', sans-serif", import: "Source+Sans+3:wght@300;400;600;700" },
  { label: "PT Sans", value: "'PT Sans', sans-serif", import: "PT+Sans:wght@400;700" },
  { label: "Merriweather", value: "'Merriweather', serif", import: "Merriweather:wght@300;400;700" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif", import: "" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif", import: "" },
  { label: "Fira Sans", value: "'Fira Sans', sans-serif", import: "Fira+Sans:wght@300;400;500;600;700" },
  { label: "Poppins", value: "'Poppins', sans-serif", import: "Poppins:wght@300;400;500;600;700" },
  { label: "Nunito", value: "'Nunito', sans-serif", import: "Nunito:wght@300;400;600;700" },
  { label: "DM Sans", value: "'DM Sans', sans-serif", import: "DM+Sans:wght@300;400;500;700" },
];

const headingFamilies = [
  { label: "Playfair Display (Default)", value: "'Playfair Display', Georgia, serif", import: "Playfair+Display:wght@600;700" },
  { label: "Merriweather", value: "'Merriweather', serif", import: "Merriweather:wght@400;700" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", import: "Montserrat:wght@500;600;700;800" },
  { label: "Raleway", value: "'Raleway', sans-serif", import: "Raleway:wght@500;600;700" },
  { label: "Oswald", value: "'Oswald', sans-serif", import: "Oswald:wght@400;500;600;700" },
  { label: "Bitter", value: "'Bitter', serif", import: "Bitter:wght@400;600;700" },
  { label: "Same as Body Font", value: "__same__", import: "" },
];

const fontSizes = [
  { label: "Small (14px)", value: "14px" },
  { label: "Default (16px)", value: "16px" },
  { label: "Large (18px)", value: "18px" },
  { label: "Extra Large (20px)", value: "20px" },
];

/* ── Color themes ── */
const colorThemes = [
  { name: "Teal (Default)", primary: "168 80% 30%", accent: "200 80% 45%", success: "152 60% 40%", id: "teal" },
  { name: "Blue", primary: "220 80% 45%", accent: "240 70% 55%", success: "152 60% 40%", id: "blue" },
  { name: "Purple", primary: "270 70% 45%", accent: "290 65% 50%", success: "152 60% 40%", id: "purple" },
  { name: "Rose", primary: "350 70% 45%", accent: "10 75% 50%", success: "152 60% 40%", id: "rose" },
  { name: "Amber", primary: "30 90% 45%", accent: "45 95% 50%", success: "152 60% 40%", id: "amber" },
  { name: "Emerald", primary: "152 70% 35%", accent: "168 65% 40%", success: "140 60% 40%", id: "emerald" },
  { name: "Slate", primary: "215 25% 35%", accent: "210 30% 45%", success: "152 60% 40%", id: "slate" },
  { name: "Indigo", primary: "240 60% 50%", accent: "225 70% 55%", success: "152 60% 40%", id: "indigo" },
];

const STORAGE_KEY = "clinic-system-manage";

interface SystemSettings {
  bodyFont: string;
  headingFont: string;
  fontSize: string;
  colorTheme: string;
  mode: "light" | "dark" | "system";
  borderRadius: string;
  sidebarTheme: string;
}

const defaults: SystemSettings = {
  bodyFont: "'Inter', system-ui, sans-serif",
  headingFont: "'Playfair Display', Georgia, serif",
  fontSize: "16px",
  colorTheme: "teal",
  mode: "light",
  borderRadius: "0.625rem",
  sidebarTheme: "dark",
};

function loadSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

function saveSystemSettings(s: SystemSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/* ── Apply styles to document ── */
function applyStyles(s: SystemSettings) {
  const root = document.documentElement;

  // Font imports
  const bodyDef = fontFamilies.find(f => f.value === s.bodyFont);
  const headDef = headingFamilies.find(f => f.value === s.headingFont);
  const imports: string[] = [];
  if (bodyDef?.import) imports.push(bodyDef.import);
  if (headDef?.import && s.headingFont !== "__same__") imports.push(headDef.import);

  let linkEl = document.getElementById("system-manage-fonts") as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.id = "system-manage-fonts";
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  }
  if (imports.length) {
    linkEl.href = `https://fonts.googleapis.com/css2?${imports.map(i => `family=${i}`).join("&")}&display=swap`;
  }

  // CSS vars
  root.style.setProperty("--font-body", s.bodyFont);
  root.style.setProperty("--font-heading", s.headingFont === "__same__" ? s.bodyFont : s.headingFont);
  root.style.fontSize = s.fontSize;
  root.style.setProperty("--radius", s.borderRadius);

  // Color theme
  const theme = colorThemes.find(t => t.id === s.colorTheme) || colorThemes[0];
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--sidebar-primary", theme.primary.replace(/(\d+)%$/, (_, p) => `${Math.min(100, parseInt(p) + 15)}%`));
  root.style.setProperty("--sidebar-ring", theme.primary);

  // Light/Dark mode
  if (s.mode === "dark") {
    root.classList.add("dark");
  } else if (s.mode === "light") {
    root.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

const radiusOptions = [
  { label: "None", value: "0" },
  { label: "Small", value: "0.375rem" },
  { label: "Default", value: "0.625rem" },
  { label: "Large", value: "0.875rem" },
  { label: "Full", value: "1.25rem" },
];

const SystemManagePage = () => {
  const [settings, setSettings] = useState<SystemSettings>(loadSystemSettings);

  useEffect(() => {
    applyStyles(settings);
  }, [settings]);

  const update = (partial: Partial<SystemSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSystemSettings(next);
      return next;
    });
  };

  const resetAll = () => {
    setSettings(defaults);
    saveSystemSettings(defaults);
    // remove inline overrides
    const root = document.documentElement;
    root.style.removeProperty("--font-body");
    root.style.removeProperty("--font-heading");
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--success");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-ring");
    root.style.removeProperty("--radius");
    root.style.fontSize = "";
    root.classList.remove("dark");
    toast.success("Reset to default settings");
  };

  const activeTheme = colorThemes.find(t => t.id === settings.colorTheme) || colorThemes[0];

  return (
    <div className="space-y-6">
      <PageHeader title="System Manage" description="Customize fonts, colors, themes, and appearance settings">
        <Button variant="outline" onClick={resetAll}>Reset to Defaults</Button>
      </PageHeader>

      <Tabs defaultValue="fonts" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="fonts" className="gap-1.5"><Type className="w-4 h-4" /> Fonts</TabsTrigger>
          <TabsTrigger value="colors" className="gap-1.5"><Palette className="w-4 h-4" /> Colors & Theme</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Paintbrush className="w-4 h-4" /> Appearance</TabsTrigger>
        </TabsList>

        {/* ── FONTS TAB ── */}
        <TabsContent value="fonts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Body Font</CardTitle>
                <CardDescription>Used for body text, labels, and descriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={settings.bodyFont} onValueChange={v => update({ bodyFont: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-4 rounded-lg bg-muted/50 border border-border" style={{ fontFamily: settings.bodyFont }}>
                  <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-xs text-muted-foreground mt-1">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Heading Font</CardTitle>
                <CardDescription>Used for page titles and section headers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={settings.headingFont} onValueChange={v => update({ headingFont: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {headingFamilies.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value === "__same__" ? settings.bodyFont : f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-4 rounded-lg bg-muted/50 border border-border" style={{ fontFamily: settings.headingFont === "__same__" ? settings.bodyFont : settings.headingFont }}>
                  <p className="text-lg font-bold">Heading Preview Text</p>
                  <p className="text-sm font-semibold mt-1">Subheading example</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Font Size</CardTitle>
              <CardDescription>Base font size for the entire application</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.fontSize} onValueChange={v => update({ fontSize: v })}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fontSizes.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COLORS & THEME TAB ── */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Color Theme</CardTitle>
              <CardDescription>Choose a primary color palette for the interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {colorThemes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => update({ colorTheme: theme.id })}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      settings.colorTheme === theme.id
                        ? "border-primary shadow-elevated ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {settings.colorTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${theme.primary})` }} />
                      <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${theme.accent})` }} />
                      <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${theme.success})` }} />
                    </div>
                    <span className="text-xs font-medium text-card-foreground">{theme.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Preview</CardTitle>
              <CardDescription>See how your selected theme looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-primary" />
                  <span className="text-[10px] text-muted-foreground">Primary</span>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-accent" />
                  <span className="text-[10px] text-muted-foreground">Accent</span>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-destructive" />
                  <span className="text-[10px] text-muted-foreground">Destructive</span>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                  <span className="text-[10px] text-muted-foreground">Muted</span>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-card border border-border" />
                  <span className="text-[10px] text-muted-foreground">Card</span>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="w-16 h-16 rounded-xl bg-secondary" />
                  <span className="text-[10px] text-muted-foreground">Secondary</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
                <Button size="sm" variant="outline">Outline</Button>
                <Button size="sm" variant="destructive">Destructive</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE TAB ── */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Display Mode</CardTitle>
              <CardDescription>Choose between light, dark, or system preference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {([
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                  { value: "system" as const, label: "System", icon: Monitor },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ mode: opt.value })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[100px] ${
                      settings.mode === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <opt.icon className={`w-6 h-6 ${settings.mode === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Border Radius</CardTitle>
              <CardDescription>Control the roundness of UI elements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {radiusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ borderRadius: opt.value })}
                    className={`flex flex-col items-center gap-2 p-3 border-2 transition-all min-w-[80px] ${
                      settings.borderRadius === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    style={{ borderRadius: opt.value }}
                  >
                    <div className="w-8 h-8 bg-primary/20 border-2 border-primary/40" style={{ borderRadius: opt.value }} />
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemManagePage;
