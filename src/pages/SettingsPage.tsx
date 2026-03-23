import { useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Building2, Palette, Receipt, Printer, Globe, Save, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/use-settings";
import { currencies, getCurrencySymbol } from "@/lib/currency";

/* ─── Clinic Profile ─── */
const ClinicProfileTab = () => {
  const { settings, update } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Logo must be under 500 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ clinicLogo: reader.result as string });
      toast.success("Logo uploaded");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
          {settings.clinicLogo ? (
            <>
              <img src={settings.clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
              <button
                onClick={() => update({ clinicLogo: "" })}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <span className="text-3xl">🏥</span>
          )}
        </div>
        <div>
          <Label className="text-sm font-semibold">Clinic Logo</Label>
          <p className="text-xs text-muted-foreground mb-2">PNG, JPG or SVG. Max 500 KB. Shows on reports &amp; invoices.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Logo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label>Clinic Name</Label>
          <Input value={settings.clinicName} onChange={(e) => update({ clinicName: e.target.value })} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={settings.clinicTagline} onChange={(e) => update({ clinicTagline: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={settings.clinicPhone} onChange={(e) => update({ clinicPhone: e.target.value })} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={settings.clinicEmail} onChange={(e) => update({ clinicEmail: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Address</Label>
          <Textarea value={settings.clinicAddress} onChange={(e) => update({ clinicAddress: e.target.value })} rows={2} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={settings.clinicWebsite} onChange={(e) => update({ clinicWebsite: e.target.value })} />
        </div>
        <div>
          <Label>Registration Number</Label>
          <Input value={settings.clinicRegNumber} onChange={(e) => update({ clinicRegNumber: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Clinic profile saved")}>
          <Save className="w-4 h-4 mr-2" /> Save Profile
        </Button>
      </div>
    </div>
  );
};




/* ─── General Preferences ─── */
const PreferencesTab = () => {
  const { settings, update } = useSettings();
  const languages = ["English", "Khmer", "Bengali"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Theme</Label>
          <Select value={settings.theme} onValueChange={(v) => update({ theme: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Language</Label>
          <Select value={settings.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date Format</Label>
          <Select value={settings.dateFormat} onValueChange={(v) => update({ dateFormat: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Auto Logout (minutes)</Label>
          <Select value={settings.autoLogout} onValueChange={(v) => update({ autoLogout: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Enable Notifications</p>
          <p className="text-xs text-muted-foreground">Receive alerts for low stock, appointments, etc.</p>
        </div>
        <Switch checked={settings.notifications} onCheckedChange={(v) => update({ notifications: v })} />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Preferences saved")}>
          <Save className="w-4 h-4 mr-2" /> Save Preferences
        </Button>
      </div>
    </div>
  );
};

/* ─── Billing & Invoice ─── */
const BillingTab = () => {
  const { settings, update } = useSettings();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Invoice Prefix</Label>
          <Input value={settings.invoicePrefix} onChange={(e) => update({ invoicePrefix: e.target.value })} />
        </div>
        <div>
          <Label>Next Invoice Number</Label>
          <Input value={settings.nextInvoiceNumber} onChange={(e) => update({ nextInvoiceNumber: e.target.value })} />
        </div>
        <div>
          <Label>Currency</Label>
          <Select value={settings.currency} onValueChange={(v) => update({ currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.name} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tax Rate (%)</Label>
          <Input type="number" value={settings.taxRate} onChange={(e) => update({ taxRate: e.target.value })} disabled={!settings.taxEnabled} />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Enable Tax</p>
          <p className="text-xs text-muted-foreground">Apply tax on invoices automatically</p>
        </div>
        <Switch checked={settings.taxEnabled} onCheckedChange={(v) => update({ taxEnabled: v })} />
      </div>
      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Payment Modes</h4>
        <div className="flex flex-wrap gap-2">
          {["Cash", "Card", "UPI", "Bank Transfer"].map((m) => (
            <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Billing settings saved")}>
          <Save className="w-4 h-4 mr-2" /> Save Billing
        </Button>
      </div>
    </div>
  );
};

/* ─── Printer Management ─── */
const PrinterTab = () => {
  const printers = [
    { id: 1, name: "Reception Printer", type: "Thermal", size: "80mm", default: true, connected: true },
    { id: 2, name: "Lab Printer", type: "A4 Laser", size: "A4", default: false, connected: true },
    { id: 3, name: "Barcode Printer", type: "Label", size: "50mm x 25mm", default: false, connected: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{printers.length} printers configured</p>
        <Button size="sm" onClick={() => toast.info("Printer setup coming soon")}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Add Printer
        </Button>
      </div>
      <div className="space-y-3">
        {printers.map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.connected ? "bg-primary/10" : "bg-muted"}`}>
                <Printer className={`w-5 h-5 ${p.connected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {p.default && <Badge variant="default" className="text-[10px]">Default</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{p.type} · {p.size}</p>
              </div>
            </div>
            <Badge variant={p.connected ? "secondary" : "outline"} className="text-xs">
              {p.connected ? "Connected" : "Offline"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Currency & Language Tab ─── */
const CurrencyLanguageTab = () => {
  const { settings, update } = useSettings();

  const languages = [
    { code: "English", label: "English" },
    { code: "Khmer", label: "ខ្មែរ (Khmer)" },
    { code: "Bengali", label: "বাংলা (Bengali)" },
  ];

  const secondaryCurrencies = currencies.filter((c) => c.code !== settings.currency);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Primary Currency</Label>
          <Select value={settings.currency} onValueChange={(v) => update({ currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Display Language</Label>
          <Select value={settings.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dual Currency */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Enable Dual Currency</p>
            <p className="text-xs text-muted-foreground">Show prices in two currencies side by side (e.g. $100 / ៛410,000)</p>
          </div>
          <Switch checked={settings.dualCurrencyEnabled} onCheckedChange={(v) => update({ dualCurrencyEnabled: v })} />
        </div>

        {settings.dualCurrencyEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <Label>Secondary Currency</Label>
              <Select value={settings.secondaryCurrency} onValueChange={(v) => update({ secondaryCurrency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {secondaryCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exchange Rate (1 {settings.currency} = ? {settings.secondaryCurrency})</Label>
              <Input
                type="number"
                value={settings.exchangeRate}
                onChange={(e) => update({ exchangeRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2 rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="text-sm font-semibold text-foreground">
                {getCurrencySymbol(settings.currency)}100 / {getCurrencySymbol(settings.secondaryCurrency)}{(100 * settings.exchangeRate).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Show Currency Symbol</p>
          <p className="text-xs text-muted-foreground">Display $, ৳, ៛ before amounts</p>
        </div>
        <Switch checked={settings.showCurrencySymbol} onCheckedChange={(v) => update({ showCurrencySymbol: v })} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Supported Currencies</h4>
        <div className="space-y-2">
          {currencies.map((c) => (
            <div key={c.code} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{c.symbol}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
              </div>
              <Badge variant={c.code === settings.currency ? "default" : c.code === settings.secondaryCurrency && settings.dualCurrencyEnabled ? "secondary" : "outline"} className="text-xs">
                {c.code === settings.currency ? "Primary" : c.code === settings.secondaryCurrency && settings.dualCurrencyEnabled ? "Secondary" : "Available"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Currency & language settings saved")}>
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
};

/* ─── Main Settings Page ─── */
const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage clinic configuration, billing, printers, and preferences" />

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="clinic" className="flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" /> Clinic Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs">
            <Palette className="w-3.5 h-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1.5 text-xs">
            <Receipt className="w-3.5 h-3.5" /> Billing & Invoice
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" /> Printers
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1.5 text-xs">
            <Globe className="w-3.5 h-3.5" /> Currency & Language
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <TabsContent value="clinic" className="mt-0"><ClinicProfileTab /></TabsContent>
          
          <TabsContent value="preferences" className="mt-0"><PreferencesTab /></TabsContent>
          <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
          <TabsContent value="printer" className="mt-0"><PrinterTab /></TabsContent>
          <TabsContent value="currency" className="mt-0"><CurrencyLanguageTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
