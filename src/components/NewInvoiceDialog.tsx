import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Hash, Calendar, User, Stethoscope, Briefcase, Syringe, Package,
  Tag, DollarSign, Percent, CreditCard, Printer, Receipt, Save, Pill,
  Plus, Barcode, Trash2,
} from "lucide-react";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { opdPatients } from "@/data/opdPatients";
import { toast } from "sonner";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { getSettings } from "@/data/settingsStore";

initPatients(opdPatients);

const serviceOptions = [
  { name: "Consultation", price: 10 },
  { name: "Lab Test", price: 10 },
  { name: "X-Ray", price: 15 },
  { name: "Ultrasound", price: 20 },
  { name: "Health Checkup", price: 25 },
  { name: "Minor Surgery", price: 50 },
  { name: "Dressing", price: 5 },
  { name: "ECG", price: 12 },
  { name: "Vaccination", price: 8 },
  { name: "Physiotherapy", price: 15 },
  { name: "CBC", price: 10 },
  { name: "HBsAb", price: 8 },
  { name: "HBsAg", price: 7 },
  { name: "HIV", price: 7 },
  { name: "2 HABS", price: 4 },
];

const packageOptions = [
  { name: "Basic Health Checkup", price: 50 },
  { name: "Full Body Checkup", price: 120 },
  { name: "Diabetes Panel", price: 35 },
  { name: "Cardiac Panel", price: 80 },
  { name: "Prenatal Package", price: 60 },
];

const medicineOptions = [
  { name: "Amoxicillin 500mg", price: 2.50 },
  { name: "Paracetamol 650mg", price: 0.50 },
  { name: "Metformin 500mg", price: 1.00 },
  { name: "Omeprazole 20mg", price: 1.50 },
  { name: "Cetirizine 10mg", price: 0.75 },
  { name: "Azithromycin 250mg", price: 3.00 },
  { name: "10% GS 500ml", price: 10.00 },
  { name: "Ace", price: 0.25 },
  { name: "Ibuprofen 400mg", price: 1.00 },
];

const paymentMethods = [
  { value: "Cash", label: "Cash Pay", icon: DollarSign },
  { value: "Card", label: "Card Pay", icon: CreditCard },
  { value: "Mobile Pay", label: "Mobile Pay", icon: CreditCard },
  { value: "Bank Transfer", label: "Bank Transfer", icon: CreditCard },
  { value: "Insurance", label: "Insurance", icon: CreditCard },
];

const doctors = [
  "Dr. Sarah Smith", "Dr. Raj Patel", "Dr. Emily Williams",
  "Dr. Mark Brown", "Dr. Lisa Lee",
];

type LineItemType = "SVC" | "MED" | "INJ" | "PKG" | "CUSTOM";

interface LineItem {
  id: string;
  type: LineItemType;
  name: string;
  price: number;
  qty: number;
}

interface CustomItem {
  name: string;
  price: number;
  qty: number;
}

interface MedicineItem {
  name: string;
  qty: number;
}

export interface InvoiceFormData {
  patient: string;
  doctor: string;
  date: string;
  service: string;
  injection: string;
  packageItem: string;
  customItems: CustomItem[];
  medicines: MedicineItem[];
  discount: number;
  discountType: "flat" | "percent";
  paidAmount: number;
  paymentMethod: string;
}

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData, action: "draft" | "print" | "payment") => void;
}

let lineIdCounter = 0;
const nextId = () => `li-${++lineIdCounter}`;

const typeBadgeColors: Record<LineItemType, string> = {
  SVC: "bg-muted text-muted-foreground",
  MED: "bg-muted text-muted-foreground",
  INJ: "bg-muted text-muted-foreground",
  PKG: "bg-muted text-muted-foreground",
  CUSTOM: "bg-muted text-muted-foreground",
};

const NewInvoiceDialog = ({ open, onOpenChange, onSubmit }: NewInvoiceDialogProps) => {
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();

  const [patients, setPatients] = useState(getPatients());
  const [injectionsList, setInjectionsList] = useState(getInjections());

  const today = new Date().toISOString().slice(0, 10);

  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState(today);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [customDraft, setCustomDraft] = useState<CustomItem>({ name: "", price: 0, qty: 1 });
  const [medicineDraft, setMedicineDraft] = useState({ name: "", qty: 1 });

  useEffect(() => { const unsub = subscribe(() => setPatients([...getPatients()])); return () => { unsub(); }; }, []);
  useEffect(() => { const unsub = subscribeInjections(() => setInjectionsList([...getInjections()])); return () => { unsub(); }; }, []);

  useEffect(() => {
    if (open) {
      setPatient(""); setDoctor(""); setDate(today);
      setLineItems([]); setDiscount(0); setDiscountType("flat");
      setPaidAmount(0); setPaymentMethod("Cash");
      setCustomDraft({ name: "", price: 0, qty: 1 });
      setMedicineDraft({ name: "", qty: 1 });
    }
  }, [open]);

  // Add helpers
  const addService = (name: string) => {
    const svc = serviceOptions.find((s) => s.name === name);
    if (!svc) return;
    setLineItems((prev) => [...prev, { id: nextId(), type: "SVC", name: svc.name, price: svc.price, qty: 1 }]);
  };

  const addInjection = (name: string) => {
    const inj = injectionsList.find((i) => i.name === name);
    if (!inj) return;
    setLineItems((prev) => [...prev, { id: nextId(), type: "INJ", name: inj.name, price: inj.price, qty: 1 }]);
  };

  const addPackage = (name: string) => {
    const pkg = packageOptions.find((p) => p.name === name);
    if (!pkg) return;
    setLineItems((prev) => [...prev, { id: nextId(), type: "PKG", name: pkg.name, price: pkg.price, qty: 1 }]);
  };

  const addMedicineByName = (name: string) => {
    const med = medicineOptions.find((m) => m.name === name);
    if (!med) return;
    setLineItems((prev) => [...prev, { id: nextId(), type: "MED", name: med.name, price: med.price, qty: 1 }]);
  };

  const addCustomItem = () => {
    if (!customDraft.name) return;
    setLineItems((prev) => [...prev, { id: nextId(), type: "CUSTOM", name: customDraft.name, price: customDraft.price, qty: customDraft.qty }]);
    setCustomDraft({ name: "", price: 0, qty: 1 });
  };

  const removeItem = (id: string) => setLineItems((prev) => prev.filter((li) => li.id !== id));

  const updateItemQty = (id: string, qty: number) => {
    setLineItems((prev) => prev.map((li) => li.id === id ? { ...li, qty: Math.max(1, qty) } : li));
  };

  // Totals
  const subtotal = lineItems.reduce((s, li) => s + li.price * li.qty, 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + taxAmount;

  const handleAction = (action: "draft" | "print" | "payment") => {
    if (!patient) { toast.error("Please select a patient"); return; }
    // Convert lineItems back to InvoiceFormData shape for backward compat
    const formData: InvoiceFormData = {
      patient, doctor, date,
      service: lineItems.filter((li) => li.type === "SVC").map((li) => li.name).join(", "),
      injection: lineItems.filter((li) => li.type === "INJ").map((li) => li.name).join(", "),
      packageItem: lineItems.filter((li) => li.type === "PKG").map((li) => li.name).join(", "),
      customItems: lineItems.filter((li) => li.type === "CUSTOM").map((li) => ({ name: li.name, price: li.price, qty: li.qty })),
      medicines: lineItems.filter((li) => li.type === "MED").map((li) => ({ name: li.name, qty: li.qty })),
      discount, discountType, paidAmount, paymentMethod,
    };
    onSubmit(formData, action);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-heading text-xl">Create Bill</DialogTitle>
          <p className="text-sm text-muted-foreground">Create and manage patient bills</p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Invoice # + Date row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Invoice</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px] h-9" />
            </div>
          </div>

          {/* Patient + Doctor row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {t("patient", lang)} *
              </Label>
              <Select value={patient} onValueChange={setPatient}>
                <SelectTrigger><SelectValue placeholder={t("selectPatient", lang)} /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                Doctor / Refer Name
              </Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger><SelectValue placeholder="Select or type doctor / refer name..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main 2-column: Left (Services/Injection/Packages/Custom) | Right (Medicines) */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT COLUMN */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Services
                </Label>
                <Select value="" onValueChange={(v) => { addService(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => <SelectItem key={s.name} value={s.name}>{s.name} — {formatDualPrice(s.price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Syringe className="w-3.5 h-3.5 text-primary" /> Injection
                </Label>
                <Select value="" onValueChange={(v) => { addInjection(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select Injection" /></SelectTrigger>
                  <SelectContent>
                    {injectionsList.filter((inj) => inj.status !== "out-of-stock").map((inj) => (
                      <SelectItem key={inj.id} value={inj.name}>
                        {inj.name} {inj.strength} — {formatDualPrice(inj.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" /> Packages
                </Label>
                <Select value="" onValueChange={(v) => { addPackage(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => <SelectItem key={p.name} value={p.name}>{p.name} — {formatDualPrice(p.price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Custom Item
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Item name" value={customDraft.name} onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1" />
                  <Input type="number" placeholder="Price" value={customDraft.price || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className="w-20" />
                  <Input type="number" min={1} value={customDraft.qty} onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-16" />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomItem} className="px-3">Add</Button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Medicines */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-primary" />
                Medicines <span className="text-muted-foreground text-xs">(pieces)</span>
              </Label>

              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/30">
                <Barcode className="w-4 h-4" />
                <span>Scan barcode to add medicine</span>
              </div>

              <Select value="" onValueChange={(v) => { addMedicineByName(v); }}>
                <SelectTrigger><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                <SelectContent>
                  {medicineOptions.map((m) => <SelectItem key={m.name} value={m.name}>{m.name} — {formatDualPrice(m.price)}</SelectItem>)}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">Selling price per piece. Quantity is always in pieces.</p>
            </div>
          </div>

          {/* ===== LINE ITEMS TABLE ===== */}
          {lineItems.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_70px_80px_40px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Item</span>
                <span className="text-right">Price</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
                <span></span>
              </div>
              {/* Table rows */}
              {lineItems.map((li) => (
                <div key={li.id} className="grid grid-cols-[1fr_80px_70px_80px_40px] gap-2 px-4 py-2.5 border-t border-border items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${typeBadgeColors[li.type]}`}>
                      {li.type}
                    </span>
                    <span className="truncate">{li.name}</span>
                  </div>
                  <span className="text-right tabular-nums">{formatDualPrice(li.price)}</span>
                  <div className="flex justify-center">
                    <Input
                      type="number" min={1} value={li.qty}
                      onChange={(e) => updateItemQty(li.id, parseInt(e.target.value) || 1)}
                      className="w-14 h-7 text-center text-sm px-1"
                    />
                  </div>
                  <span className="text-right font-semibold text-primary tabular-nums">
                    {formatDualPrice(li.price * li.qty)}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeItem(li.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Discount + Payment Method row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Discount
              </Label>
              <div className="flex gap-1">
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" className="flex-1" />
                <Button type="button" size="sm" variant={discountType === "flat" ? "default" : "outline"} onClick={() => setDiscountType("flat")} className="px-3">
                  <DollarSign className="w-3.5 h-3.5" />
                </Button>
                <Button type="button" size="sm" variant={discountType === "percent" ? "default" : "outline"} onClick={() => setDiscountType("percent")} className="px-3">
                  <Percent className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2"><m.icon className="w-3.5 h-3.5" /> {m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-3">
                <Label className="text-sm mb-1.5 block">Amount Paid</Label>
                <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </div>

              <Button type="button" variant="outline" className="w-full mt-2 text-sm">Split Bill</Button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatDualPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive tabular-nums">-{formatDualPrice(discountAmount)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="tabular-nums">{formatDualPrice(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span className="text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
            </div>
            {settings.dualCurrencyEnabled && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatDualPrice(grandTotal)}</span>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button variant="outline" onClick={() => handleAction("draft")} className="gap-2">
              <Save className="w-4 h-4" /> Save as Draft
            </Button>
            <Button onClick={() => handleAction("print")} className="gap-2 bg-primary hover:bg-primary/90">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button onClick={() => handleAction("payment")} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              <Receipt className="w-4 h-4" /> Make Payment (POS)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
