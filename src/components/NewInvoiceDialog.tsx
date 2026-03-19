import { useState, useEffect, useMemo } from "react";
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
  Barcode, Trash2, ShoppingCart, FileText, Eye,
} from "lucide-react";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { opdPatients } from "@/data/opdPatients";
import { toast } from "sonner";
import { formatDualPrice, formatPrice, getCurrencySymbol } from "@/lib/currency";
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

interface CustomItem { name: string; price: number; qty: number; }
interface MedicineItem { name: string; qty: number; }

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
  lineItems: LineItem[];
  medicationTotal: number;
}

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData, action: "draft" | "print" | "payment") => void;
  editData?: InvoiceFormData | null;
}

let lineIdCounter = 0;
const nextId = () => `li-${++lineIdCounter}`;

const typeBadgeStyles: Record<LineItemType, string> = {
  SVC: "bg-primary/10 text-primary",
  MED: "bg-emerald-500/10 text-emerald-600",
  INJ: "bg-amber-500/10 text-amber-600",
  PKG: "bg-violet-500/10 text-violet-600",
  CUSTOM: "bg-muted text-muted-foreground",
};

const typeLabels: Record<LineItemType, string> = {
  SVC: "Service",
  MED: "Medicine",
  INJ: "Injection",
  PKG: "Package",
  CUSTOM: "Custom",
};

const NewInvoiceDialog = ({ open, onOpenChange, onSubmit }: NewInvoiceDialogProps) => {
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();

  const [patients, setPatients] = useState(getPatients());
  const [injectionsList, setInjectionsList] = useState(getInjections());
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => { const unsub = subscribe(() => setPatients([...getPatients()])); return () => { unsub(); }; }, []);
  useEffect(() => { const unsub = subscribeInjections(() => setInjectionsList([...getInjections()])); return () => { unsub(); }; }, []);

  useEffect(() => {
    if (open) {
      setPatient(""); setDoctor(""); setDate(today);
      setLineItems([]); setDiscount(0); setDiscountType("flat");
      setPaidAmount(0); setPaymentMethod("Cash");
      setCustomDraft({ name: "", price: 0, qty: 1 });
      setShowPreview(false);
    }
  }, [open]);

  const addService = (name: string) => {
    const svc = serviceOptions.find((s) => s.name === name);
    if (svc) setLineItems((prev) => [...prev, { id: nextId(), type: "SVC", name: svc.name, price: svc.price, qty: 1 }]);
  };
  const addInjection = (name: string) => {
    const inj = injectionsList.find((i) => i.name === name);
    if (inj) setLineItems((prev) => [...prev, { id: nextId(), type: "INJ", name: inj.name, price: inj.price, qty: 1 }]);
  };
  const addPackage = (name: string) => {
    const pkg = packageOptions.find((p) => p.name === name);
    if (pkg) setLineItems((prev) => [...prev, { id: nextId(), type: "PKG", name: pkg.name, price: pkg.price, qty: 1 }]);
  };
  const addMedicineByName = (name: string) => {
    const med = medicineOptions.find((m) => m.name === name);
    if (med) setLineItems((prev) => [...prev, { id: nextId(), type: "MED", name: med.name, price: med.price, qty: 1 }]);
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
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  // Medication grouping for preview/print
  const medicationItems = lineItems.filter((li) => li.type === "MED");
  const medicationTotal = medicationItems.reduce((s, li) => s + li.price * li.qty, 0);
  const nonMedicineItems = lineItems.filter((li) => li.type !== "MED");

  // Preview line items: group all meds into single "Medication" row
  const previewItems = useMemo(() => {
    const items = nonMedicineItems.map((li) => ({
      name: li.name,
      type: li.type,
      total: li.price * li.qty,
    }));
    if (medicationItems.length > 0) {
      items.push({ name: "Medication", type: "MED" as LineItemType, total: medicationTotal });
    }
    return items;
  }, [lineItems]);

  const handleAction = (action: "draft" | "print" | "payment") => {
    if (!patient) { toast.error("Please select a patient"); return; }
    const formData: InvoiceFormData = {
      patient, doctor, date,
      service: lineItems.filter((li) => li.type === "SVC").map((li) => li.name).join(", "),
      injection: lineItems.filter((li) => li.type === "INJ").map((li) => li.name).join(", "),
      packageItem: lineItems.filter((li) => li.type === "PKG").map((li) => li.name).join(", "),
      customItems: lineItems.filter((li) => li.type === "CUSTOM").map((li) => ({ name: li.name, price: li.price, qty: li.qty })),
      medicines: lineItems.filter((li) => li.type === "MED").map((li) => ({ name: li.name, qty: li.qty })),
      discount, discountType, paidAmount, paymentMethod,
      lineItems, medicationTotal,
    };
    onSubmit(formData, action);
  };

  const itemCount = lineItems.length;

  // ─── PREVIEW / PRINT VIEW ───
  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
          <div className="p-8 space-y-6" id="invoice-print-area">
            {/* Clinic Header */}
            <div className="text-center border-b border-border pb-4">
              <h2 className="text-xl font-bold text-foreground">{appSettings.clinicName}</h2>
              <p className="text-sm text-muted-foreground">{appSettings.clinicTagline}</p>
              <p className="text-xs text-muted-foreground mt-1">{appSettings.clinicAddress} | {appSettings.clinicPhone}</p>
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between text-sm">
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{patient}</span></p>
                {doctor && <p><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{doctor}</span></p>}
              </div>
              <div className="text-right space-y-1">
                <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></p>
                <p><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{paymentMethod}</span></p>
              </div>
            </div>

            {/* Invoice Items — Medicines grouped as "Medication" */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="w-8">#</span>
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              {previewItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 border-t border-border items-center text-sm">
                  <span className="w-8 text-muted-foreground">{i + 1}</span>
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-right font-semibold tabular-nums">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="ml-auto w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive tabular-nums">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="tabular-nums">{formatPrice(taxAmount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span className="text-primary tabular-nums">{formatPrice(grandTotal)}</span>
              </div>
              {paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="tabular-nums">{formatPrice(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Due</span>
                    <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(dueAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border">Thank you for choosing {appSettings.clinicName}. Get well soon!</p>
          </div>

          {/* Action bar */}
          <div className="px-6 pb-6 flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1 gap-2">
              <FileText className="w-4 h-4" /> Back to Edit
            </Button>
            <Button onClick={() => { window.print(); }} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── MAIN FORM VIEW ───
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              Create Bill
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Create and manage patient bills</p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5 pt-5">
          {/* Invoice # + Date */}
          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-primary" />
              <span className="font-medium">Invoice</span>
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px] h-9 bg-background" />
            </div>
          </div>

          {/* Patient + Doctor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                <User className="w-4 h-4 text-primary" />
                {t("patient", lang)} <span className="text-destructive">*</span>
              </Label>
              <Select value={patient} onValueChange={setPatient}>
                <SelectTrigger className="h-10"><SelectValue placeholder={t("selectPatient", lang)} /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                <Stethoscope className="w-4 h-4 text-primary" />
                Doctor / Refer Name
              </Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select or type doctor / refer name..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main 2-column selectors */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: Services / Injection / Packages / Custom */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <div>
                <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                  <Briefcase className="w-4 h-4 text-primary" /> Services
                </Label>
                <Select value="" onValueChange={addService}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        <span className="flex justify-between w-full">{s.name} <span className="text-muted-foreground ml-2">{formatPrice(s.price)}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                  <Syringe className="w-4 h-4 text-amber-500" /> Injection
                </Label>
                <Select value="" onValueChange={addInjection}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select Injection" /></SelectTrigger>
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
                <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-violet-500" /> Packages
                </Label>
                <Select value="" onValueChange={addPackage}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select Package" /></SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name} — {formatPrice(p.price)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                  <Tag className="w-4 h-4 text-muted-foreground" /> Custom Item
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Item name" value={customDraft.name} onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1 h-10" />
                  <Input type="number" placeholder="Price" value={customDraft.price || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className="w-20 h-10" />
                  <Input type="number" min={1} value={customDraft.qty} onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-16 h-10" />
                  <Button type="button" variant="outline" onClick={addCustomItem} className="h-10 px-4">Add</Button>
                </div>
              </div>
            </div>

            {/* RIGHT: Medicines */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Pill className="w-4 h-4 text-emerald-500" />
                Medicines <span className="text-muted-foreground text-xs font-normal">(pieces)</span>
              </Label>

              <div className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground bg-muted/20">
                <Barcode className="w-4 h-4" />
                <span>Scan barcode to add medicine</span>
              </div>

              <Select value="" onValueChange={addMedicineByName}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                <SelectContent>
                  {medicineOptions.map((m) => (
                    <SelectItem key={m.name} value={m.name}>{m.name} — {formatPrice(m.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">Selling price per piece. Quantity is always in pieces.</p>

              {/* Medicine count badge */}
              {medicationItems.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                      <Pill className="w-3.5 h-3.5" />
                      {medicationItems.length} medicine{medicationItems.length > 1 ? "s" : ""} added
                    </span>
                    <span className="font-bold text-emerald-700">{formatPrice(medicationTotal)}</span>
                  </div>
                  <p className="text-xs text-emerald-600/80 mt-1">Shown as "Medication" on customer invoice</p>
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          {lineItems.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1fr_90px_70px_90px_40px] gap-2 px-4 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Item</span>
                <span className="text-right">Price</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
                <span></span>
              </div>
              <div className="divide-y divide-border">
                {lineItems.map((li) => (
                  <div key={li.id} className="grid grid-cols-[1fr_90px_70px_90px_40px] gap-2 px-4 py-2.5 items-center text-sm hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeBadgeStyles[li.type]}`}>
                        {li.type}
                      </span>
                      <span className="truncate font-medium">{li.name}</span>
                    </div>
                    <span className="text-right text-muted-foreground tabular-nums">{formatPrice(li.price)}</span>
                    <div className="flex justify-center">
                      <Input
                        type="number" min={1} value={li.qty}
                        onChange={(e) => updateItemQty(li.id, parseInt(e.target.value) || 1)}
                        className="w-14 h-7 text-center text-sm px-1"
                      />
                    </div>
                    <span className="text-right font-bold text-primary tabular-nums">
                      {formatPrice(li.price * li.qty)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => removeItem(li.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Item count row */}
              <div className="px-4 py-2 bg-muted/30 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                <span className="font-semibold text-foreground">Subtotal: {formatDualPrice(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Discount + Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Tag className="w-4 h-4 text-primary" /> Discount
              </Label>
              <div className="flex gap-1.5">
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" className="flex-1 h-10" />
                <Button type="button" size="sm" variant={discountType === "flat" ? "default" : "outline"} onClick={() => setDiscountType("flat")} className="h-10 w-10 p-0">
                  <DollarSign className="w-4 h-4" />
                </Button>
                <Button type="button" size="sm" variant={discountType === "percent" ? "default" : "outline"} onClick={() => setDiscountType("percent")} className="h-10 w-10 p-0">
                  <Percent className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2"><m.icon className="w-3.5 h-3.5" /> {m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Amount Paid</Label>
                <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-10" />
              </div>

              <Button type="button" variant="outline" className="w-full text-sm h-9">Split Bill</Button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">{formatDualPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive tabular-nums font-medium">-{formatDualPrice(discountAmount)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="tabular-nums font-medium">{formatDualPrice(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 mt-2 flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span className="text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
            </div>
            {settings.dualCurrencyEnabled && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatDualPrice(grandTotal)}</span>
              </div>
            )}
            {paidAmount > 0 && (
              <div className="flex justify-between text-sm pt-1 font-semibold">
                <span className="text-muted-foreground">Due Balance</span>
                <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(dueAmount)}</span>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <Button variant="outline" onClick={() => handleAction("draft")} className="gap-2 h-11">
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2 h-11" disabled={lineItems.length === 0}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <Button onClick={() => handleAction("print")} className="gap-2 h-11 bg-primary hover:bg-primary/90">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button onClick={() => handleAction("payment")} className="gap-2 h-11 bg-[hsl(30,90%,50%)] hover:bg-[hsl(30,90%,45%)] text-white">
              <Receipt className="w-4 h-4" /> Payment (POS)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
