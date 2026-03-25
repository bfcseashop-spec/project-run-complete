import { useRef, useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Building2, Palette, Receipt, Printer, Globe, Save, Upload, X, KeyRound, Eye, EyeOff,
  FileText, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/use-settings";
import { saveSettingsNow } from "@/data/settingsStore";
import { currencies, getCurrencySymbol } from "@/lib/currency";
import { invoiceThemes } from "@/lib/invoiceThemes";
import { generateInvoiceHtml } from "@/lib/invoiceHtmlGenerator";
import { formatPrice, formatDualPrice } from "@/lib/currency";
import { barcodeSVG } from "@/lib/barcode";
import { getSettings } from "@/data/settingsStore";

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
        <Button onClick={async () => { await saveSettingsNow(); toast.success("Clinic profile saved"); }}>
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
        <Button onClick={async () => { await saveSettingsNow(); toast.success("Preferences saved"); }}>
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
        <Button onClick={async () => { await saveSettingsNow(); toast.success("Billing settings saved"); }}>
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
        <Button onClick={async () => { await saveSettingsNow(); toast.success("Currency & language settings saved"); }}>
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
};

/* ─── Security / Change Password ─── */
const SecurityTab = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    // Verify current password by re-signing in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("Unable to verify current user");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      toast.error("Current password is incorrect");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Change Password</h3>
        <p className="text-xs text-muted-foreground">Update your account password. You'll need your current password to make changes.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Current Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1.5 block">New Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10"
              minLength={6}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Confirm New Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleChangePassword} disabled={loading}>
        <Save className="w-4 h-4 mr-2" /> {loading ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );
};

/* Invoice themes imported from @/lib/invoiceThemes */
const InvoiceThemeTab = () => {
  const { settings, update } = useSettings();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const previewHtml = useMemo(() => {
    const s = getSettings();
    return generateInvoiceHtml(settings.invoiceTheme || "classic", {
      clinicName: s.clinicName || "Prime Poly Clinic",
      clinicTagline: s.clinicTagline || "Healthcare & Wellness",
      clinicAddress: s.clinicAddress || "123 Medical Lane, Health City",
      clinicPhone: s.clinicPhone || "000 12345 6149",
      clinicWebsite: s.clinicWebsite || "www.clinic.com",
      clinicEmail: s.clinicEmail || "info@primeclinic.com",
      clinicLogo: s.clinicLogo || "",
      invoiceId: `${s.invoicePrefix || "BL"}-01`,
      invoiceLabel: "Invoice",
      dateTimeStr: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" }),
      patient: "John Smith",
      patientAge: "32",
      patientGender: "Male",
      patientPhone: "012 345 6789",
      doctor: "Dr. Sarah Johnson",
      doctorDegree: "MBBS, MD (Internal Medicine)",
      paymentMethod: "Cash",
      barcodeStr: barcodeSVG(`${s.invoicePrefix || "BL"}-01`, 220, 50),
      rows: [
        { name: "Services", description: "2 item(s)", qty: 2, price: 25, total: 25, subItems: [{ name: "Consultation", price: 10, qty: 1, total: 10 }, { name: "Lab Test", price: 15, qty: 1, total: 15 }] },
        { name: "Medication", description: "1 item(s)", qty: 3, price: 36, total: 36, subItems: [{ name: "Amoxicillin 500mg", price: 12, qty: 3, total: 36 }] },
        { name: "Injections", description: "1 item(s)", qty: 1, price: 8, total: 8, subItems: [{ name: "Vitamin B12", price: 8, qty: 1, total: 8 }] },
      ],
      subtotal: 69,
      discountAmount: 5,
      taxRate: s.taxEnabled ? Number(s.taxRate) || 5 : 0,
      taxAmount: s.taxEnabled ? Math.round((69 - 5) * (Number(s.taxRate) || 5) / 100 * 100) / 100 : 0,
      grandTotal: formatDualPrice(s.taxEnabled ? 64 + Math.round((64) * (Number(s.taxRate) || 5) / 100 * 100) / 100 : 64),
      formatPrice,
      paidFormatted: formatPrice(s.taxEnabled ? 64 + Math.round((64) * (Number(s.taxRate) || 5) / 100 * 100) / 100 : 64),
      dueFormatted: formatPrice(0),
      dueAmount: 0,
    });
  }, [settings.invoiceTheme]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Invoice Theme Template</h3>
        <p className="text-xs text-muted-foreground">Choose a theme for your printed invoices. The selected theme will be applied to all new invoices.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoiceThemes.map((theme) => {
          const isSelected = settings.invoiceTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => update({ invoiceTheme: theme.id })}
              className={cn(
                "relative text-left rounded-xl border-2 p-0 overflow-hidden transition-all duration-200 hover:shadow-lg",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
              )}
            >
              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}

              {/* Mini invoice preview */}
              <div className="p-3">
                {theme.id === "classic" ? (
                  /* Classic: Centered header with double border lines */
                  <>
                    <div className="border-t-[3px] border-b-2 py-2 text-center mb-1.5" style={{ borderColor: theme.headerBg }}>
                      <div className="w-20 h-1.5 rounded-full mx-auto mb-1" style={{ background: theme.headerBg }} />
                      <div className="w-12 h-1 rounded-full mx-auto" style={{ background: theme.headerBg, opacity: 0.4 }} />
                    </div>
                    <div className="flex gap-2 mb-1.5">
                      <div className="flex-1 pl-2" style={{ borderLeft: `3px solid ${theme.headerBg}` }}>
                        <div className="w-8 h-1 rounded-full bg-muted-foreground/25 mb-0.5" />
                        <div className="w-12 h-1 rounded-full bg-muted-foreground/15" />
                      </div>
                      <div className="flex-1 pl-2" style={{ borderLeft: `3px solid ${theme.headerBg}`, opacity: 0.6 }}>
                        <div className="w-8 h-1 rounded-full bg-muted-foreground/25 mb-0.5" />
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/15" />
                      </div>
                    </div>
                    <div style={{ border: `1px solid ${theme.tableBorder}` }}>
                      <div className="flex gap-1 p-1.5" style={{ background: theme.headerBg }}>
                        <div className="w-3 h-1 rounded-full bg-white/50" />
                        <div className="flex-1 h-1 rounded-full bg-white/50" />
                        <div className="w-5 h-1 rounded-full bg-white/50" />
                      </div>
                      {[1,2,3].map(i => <div key={i} className="flex gap-1 p-1.5" style={{ borderTop: `1px solid ${theme.tableBorder}` }}><div className="w-3 h-1 rounded-full bg-muted-foreground/15" /><div className="flex-1 h-1 rounded-full bg-muted-foreground/15" /><div className="w-5 h-1 rounded-full bg-muted-foreground/15" /></div>)}
                    </div>
                  </>
                ) : theme.id === "royal-blue" ? (
                  /* Royal Blue: Centered crest-style, serif feel */
                  <>
                    <div className="text-center mb-1.5 pb-1.5" style={{ borderBottom: `2px double ${theme.headerBg}` }}>
                      <div className="inline-block rounded px-4 py-1.5 mb-1" style={{ background: theme.headerBg }}>
                        <div className="w-16 h-1.5 rounded-full bg-white/70 mx-auto" />
                      </div>
                      <div className="w-14 h-1 rounded-full mx-auto mt-1" style={{ background: theme.headerBg, opacity: 0.3 }} />
                    </div>
                    <div className="text-center mb-2">
                      <div className="w-10 h-1 rounded-full mx-auto" style={{ background: theme.headerBg, opacity: 0.5 }} />
                      <div className="w-16 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: theme.headerBg, opacity: 0.7 }} />
                    </div>
                    <div className="flex gap-1.5 mb-1.5">
                      <div className="flex-1 rounded-none p-1.5" style={{ background: theme.tableHeader, borderTop: `3px solid ${theme.headerBg}`, border: `1px solid ${theme.tableBorder}` }}>
                        <div className="w-8 h-1 rounded-full mb-1" style={{ background: theme.headerBg, opacity: 0.3 }} />
                        <div className="w-12 h-1 rounded-full bg-muted-foreground/15" />
                      </div>
                      <div className="flex-1 rounded-none p-1.5" style={{ background: theme.tableHeader, borderTop: `3px solid ${theme.headerBg}`, border: `1px solid ${theme.tableBorder}`, opacity: 0.85 }}>
                        <div className="w-8 h-1 rounded-full mb-1" style={{ background: theme.headerBg, opacity: 0.3 }} />
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/15" />
                      </div>
                    </div>
                    <div style={{ border: `2px solid ${theme.headerBg}` }}>
                      <div className="flex gap-1 p-1.5" style={{ background: theme.headerBg }}>
                        <div className="w-3 h-1 rounded-full bg-white/50" />
                        <div className="flex-1 h-1 rounded-full bg-white/50" />
                        <div className="w-5 h-1 rounded-full bg-white/50" />
                      </div>
                      {[1,2,3].map(i => <div key={i} className="flex gap-1 p-1.5" style={{ borderTop: `1px solid ${theme.tableBorder}`, background: i % 2 === 1 ? theme.tableHeader : '#fff' }}><div className="w-3 h-1 rounded-full bg-muted-foreground/15" /><div className="flex-1 h-1 rounded-full bg-muted-foreground/15" /><div className="w-5 h-1 rounded-full bg-muted-foreground/15" /></div>)}
                    </div>
                  </>
                ) : theme.id === "minimal-gray" ? (
                  /* Minimal Gray: Ultra-clean, no borders, whitespace */
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="w-20 h-1.5 rounded-full mb-1" style={{ background: theme.headerBg, opacity: 0.4 }} />
                        <div className="w-14 h-1 rounded-full bg-muted-foreground/15" />
                      </div>
                      <div className="text-right">
                        <div className="w-14 h-2 rounded-full mb-1 ml-auto" style={{ background: '#e2e8f0' }} />
                        <div className="w-10 h-1 rounded-full ml-auto" style={{ background: theme.headerBg, opacity: 0.5 }} />
                      </div>
                    </div>
                    <div className="flex gap-4 mb-2 pb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <div className="flex-1">
                        <div className="w-6 h-0.5 rounded-full bg-muted-foreground/20 mb-1" />
                        <div className="w-12 h-1 rounded-full bg-muted-foreground/20" />
                      </div>
                      <div className="flex-1">
                        <div className="w-6 h-0.5 rounded-full bg-muted-foreground/20 mb-1" />
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-1 pb-1.5 mb-1" style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <div className="w-3 h-0.5 rounded-full bg-muted-foreground/20" />
                        <div className="flex-1 h-0.5 rounded-full bg-muted-foreground/20" />
                        <div className="w-5 h-0.5 rounded-full bg-muted-foreground/20" />
                      </div>
                      {[1,2,3].map(i => <div key={i} className="flex gap-1 py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}><div className="w-3 h-1 rounded-full bg-muted-foreground/10" /><div className="flex-1 h-1 rounded-full bg-muted-foreground/10" /><div className="w-5 h-1 rounded-full bg-muted-foreground/10" /></div>)}
                    </div>
                  </>
                ) : theme.id === "warm-coral" ? (
                  /* Warm Coral: Bold header, left sidebar accent, colored table */
                  <>
                    <div className="flex">
                      <div className="w-1.5 rounded-l" style={{ background: theme.headerBg }} />
                      <div className="flex-1">
                        <div className="rounded-tr-lg p-2.5" style={{ background: theme.headerBg }}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="w-16 h-1.5 rounded-full bg-white/70 mb-1" />
                              <div className="w-10 h-1 rounded-full bg-white/40" />
                            </div>
                            <div className="rounded px-2 py-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
                              <div className="w-10 h-1.5 rounded-full bg-white/60" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 my-1.5">
                          <div className="flex-1 rounded-r p-1.5" style={{ background: theme.tableHeader, borderLeft: `3px solid ${theme.headerBg}` }}>
                            <div className="w-8 h-1 rounded-full mb-0.5" style={{ background: theme.headerBg, opacity: 0.3 }} />
                            <div className="w-12 h-1 rounded-full bg-muted-foreground/15" />
                          </div>
                          <div className="flex-1 rounded-r p-1.5" style={{ background: theme.tableHeader, borderLeft: `3px solid ${theme.headerBg}`, opacity: 0.7 }}>
                            <div className="w-8 h-1 rounded-full mb-0.5" style={{ background: theme.headerBg, opacity: 0.3 }} />
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/15" />
                          </div>
                        </div>
                        <div className="rounded" style={{ border: `1px solid ${theme.tableBorder}` }}>
                          <div className="flex gap-1 p-1.5" style={{ background: theme.headerBg }}>
                            <div className="w-3 h-1 rounded-full bg-white/50" />
                            <div className="flex-1 h-1 rounded-full bg-white/50" />
                            <div className="w-5 h-1 rounded-full bg-white/50" />
                          </div>
                          {[1,2,3].map(i => <div key={i} className="flex gap-1 p-1.5" style={{ borderTop: `1px solid ${theme.tableBorder}`, background: i % 2 === 1 ? theme.tableHeader : '#fff' }}><div className="w-3 h-1 rounded-full bg-muted-foreground/15" /><div className="flex-1 h-1 rounded-full bg-muted-foreground/15" /><div className="w-5 h-1 rounded-full bg-muted-foreground/15" /></div>)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Modern Teal (default): Card-based, rounded, gradient */
                  <>
                    <div className="rounded-t-lg p-2.5" style={{ background: theme.headerGradient }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="w-16 h-1.5 rounded-full bg-white/70 mb-1" />
                          <div className="w-10 h-1 rounded-full bg-white/40" />
                        </div>
                        <div className="text-right">
                          <div className="w-12 h-1.5 rounded-full bg-white/60 mb-1 ml-auto" />
                          <div className="w-8 h-1 rounded-full bg-white/30 ml-auto" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 my-1.5">
                      <div className="flex-1 rounded p-1.5" style={{ background: theme.tableHeader, border: `1px solid ${theme.tableBorder}` }}>
                        <div className="w-8 h-1 rounded-full mb-1" style={{ background: theme.accent, opacity: 0.4 }} />
                        <div className="w-12 h-1 rounded-full bg-muted-foreground/20" />
                      </div>
                      <div className="flex-1 rounded p-1.5" style={{ background: theme.tableHeader, border: `1px solid ${theme.tableBorder}` }}>
                        <div className="w-8 h-1 rounded-full mb-1" style={{ background: theme.accent, opacity: 0.4 }} />
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                      </div>
                    </div>
                    <div className="rounded" style={{ border: `1px solid ${theme.tableBorder}` }}>
                      <div className="flex gap-1 p-1.5" style={{ background: theme.tableHeader }}>
                        <div className="w-3 h-1 rounded-full bg-muted-foreground/30" />
                        <div className="flex-1 h-1 rounded-full bg-muted-foreground/30" />
                        <div className="w-5 h-1 rounded-full bg-muted-foreground/30" />
                      </div>
                      {[1,2,3].map(i => <div key={i} className="flex gap-1 p-1.5" style={{ borderTop: `1px solid ${theme.tableBorder}` }}><div className="w-3 h-1 rounded-full bg-muted-foreground/15" /><div className="flex-1 h-1 rounded-full bg-muted-foreground/15" /><div className="w-5 h-1 rounded-full bg-muted-foreground/15" /></div>)}
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <div className="w-16 rounded p-1.5" style={{ background: theme.headerBg }}>
                        <div className="w-10 h-1 rounded-full bg-white/60 mb-0.5 ml-auto" />
                        <div className="w-8 h-1.5 rounded-full bg-white/80 ml-auto" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme info */}
              <div className="px-3 pb-3 pt-1 border-l-4" style={{ borderLeftColor: theme.headerBg }}>
                <p className="text-sm font-bold text-card-foreground">{theme.name}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{theme.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={async () => { await saveSettingsNow(); toast.success("Invoice theme saved"); }}>
          <Save className="w-4 h-4 mr-2" /> Save Theme
        </Button>
      </div>

      {/* Live Full-Size Preview */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
          <Badge variant="secondary" className="text-[10px]">
            {invoiceThemes.find(t => t.id === settings.invoiceTheme)?.name || "Classic"}
          </Badge>
        </div>
        <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-white">
          <iframe
            ref={previewRef}
            srcDoc={previewHtml}
            className="w-full border-0"
            style={{ height: "700px", pointerEvents: "none" }}
            title="Invoice Theme Preview"
          />
        </div>
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
          <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs">
            <KeyRound className="w-3.5 h-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="invoice-theme" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Invoice Theme
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <TabsContent value="clinic" className="mt-0"><ClinicProfileTab /></TabsContent>
          
          <TabsContent value="preferences" className="mt-0"><PreferencesTab /></TabsContent>
          <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
          <TabsContent value="printer" className="mt-0"><PrinterTab /></TabsContent>
          <TabsContent value="currency" className="mt-0"><CurrencyLanguageTab /></TabsContent>
          <TabsContent value="security" className="mt-0"><SecurityTab /></TabsContent>
          <TabsContent value="invoice-theme" className="mt-0"><InvoiceThemeTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
