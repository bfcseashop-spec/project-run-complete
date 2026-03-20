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
  Barcode, Trash2, ShoppingCart, FileText, Eye, Plus, X,
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

export interface SplitPayment {
  method: string;
  amount: number;
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
  lineItems: LineItem[];
  medicationTotal: number;
  splitPayments?: SplitPayment[];
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

const NewInvoiceDialog = ({ open, onOpenChange, onSubmit, editData }: NewInvoiceDialogProps) => {
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
  const [splitMode, setSplitMode] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: "Cash", amount: 0 },
    { method: "Card", amount: 0 },
  ]);

  useEffect(() => { const unsub = subscribe(() => setPatients([...getPatients()])); return () => { unsub(); }; }, []);
  useEffect(() => { const unsub = subscribeInjections(() => setInjectionsList([...getInjections()])); return () => { unsub(); }; }, []);

  useEffect(() => {
    if (open && editData) {
      setPatient(editData.patient); setDoctor(editData.doctor); setDate(editData.date);
      setLineItems(editData.lineItems || []); setDiscount(editData.discount);
      setDiscountType(editData.discountType); setPaidAmount(editData.paidAmount);
      setPaymentMethod(editData.paymentMethod);
      setCustomDraft({ name: "", price: 0, qty: 1 }); setShowPreview(false);
      if (editData.splitPayments && editData.splitPayments.length > 0) {
        setSplitMode(true); setSplitPayments(editData.splitPayments);
      } else {
        setSplitMode(false); setSplitPayments([{ method: "Cash", amount: 0 }, { method: "Card", amount: 0 }]);
      }
    } else if (open) {
      setPatient(""); setDoctor(""); setDate(today); setLineItems([]);
      setDiscount(0); setDiscountType("flat"); setPaidAmount(0); setPaymentMethod("Cash");
      setCustomDraft({ name: "", price: 0, qty: 1 }); setShowPreview(false);
      setSplitMode(false); setSplitPayments([{ method: "Cash", amount: 0 }, { method: "Card", amount: 0 }]);
    }
  }, [open, editData]);

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

  const subtotal = lineItems.reduce((s, li) => s + li.price * li.qty, 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + taxAmount;
  const splitTotal = splitPayments.reduce((s, sp) => s + sp.amount, 0);
  const effectivePaid = splitMode ? splitTotal : paidAmount;
  const dueAmount = Math.max(0, grandTotal - effectivePaid);

  const medicationItems = lineItems.filter((li) => li.type === "MED");
  const medicationTotal = medicationItems.reduce((s, li) => s + li.price * li.qty, 0);
  const nonMedicineItems = lineItems.filter((li) => li.type !== "MED");

  const previewItems = useMemo(() => {
    const items = nonMedicineItems.map((li) => ({
      name: li.name, type: li.type, total: li.price * li.qty,
    }));
    if (medicationItems.length > 0) {
      items.push({ name: "Medication", type: "MED" as LineItemType, total: medicationTotal });
    }
    return items;
  }, [lineItems]);

  const buildFormData = (): InvoiceFormData => ({
    patient, doctor, date,
    service: lineItems.filter((li) => li.type === "SVC").map((li) => li.name).join(", "),
    injection: lineItems.filter((li) => li.type === "INJ").map((li) => li.name).join(", "),
    packageItem: lineItems.filter((li) => li.type === "PKG").map((li) => li.name).join(", "),
    customItems: lineItems.filter((li) => li.type === "CUSTOM").map((li) => ({ name: li.name, price: li.price, qty: li.qty })),
    medicines: lineItems.filter((li) => li.type === "MED").map((li) => ({ name: li.name, qty: li.qty })),
    discount, discountType,
    paidAmount: effectivePaid,
    paymentMethod: splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => sp.method).join(" + ") : paymentMethod,
    lineItems, medicationTotal,
    splitPayments: splitMode ? splitPayments.filter(sp => sp.amount > 0) : undefined,
  });

  const handleAction = (action: "draft" | "print" | "payment") => {
    if (!patient) { toast.error("Please select a patient"); return; }
    onSubmit(buildFormData(), action);
  };

  const handlePrintInvoice = () => {
    if (!patient) { toast.error("Please select a patient"); return; }
    // Build invoice HTML and print
    const s = appSettings;
    const rows = previewItems.map((item, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:500">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${formatPrice(item.total)}</td></tr>`
    ).join("");

    let totalsHtml = `
      <div style="margin-left:auto;width:260px;font-size:14px">
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#6b7280">Subtotal</span><span>${formatPrice(subtotal)}</span></div>`;
    if (discountAmount > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#6b7280">Discount</span><span style="color:#dc2626">-${formatPrice(discountAmount)}</span></div>`;
    if (taxRate > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#6b7280">Tax (${taxRate}%)</span><span>${formatPrice(taxAmount)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #e5e7eb;margin-top:6px;font-weight:700;font-size:18px"><span>Grand Total</span><span style="color:#0f766e">${formatPrice(grandTotal)}</span></div>`;
    if (splitMode && splitPayments.filter(sp => sp.amount > 0).length > 0) {
      totalsHtml += `<div style="border-top:1px solid #e5e7eb;margin-top:4px;padding-top:6px">`;
      splitPayments.filter(sp => sp.amount > 0).forEach(sp => {
        totalsHtml += `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px"><span style="color:#6b7280">${sp.method}</span><span>${formatPrice(sp.amount)}</span></div>`;
      });
      totalsHtml += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:600"><span style="color:#6b7280">Total Paid</span><span>${formatPrice(splitTotal)}</span></div>`;
      totalsHtml += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:600"><span style="color:#6b7280">Due</span><span style="color:${dueAmount > 0 ? '#dc2626' : '#059669'}">${formatPrice(dueAmount)}</span></div>`;
      totalsHtml += `</div>`;
    } else if (effectivePaid > 0) {
      totalsHtml += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span style="color:#6b7280">Paid</span><span>${formatPrice(effectivePaid)}</span></div>`;
      totalsHtml += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:600"><span style="color:#6b7280">Due</span><span style="color:${dueAmount > 0 ? '#dc2626' : '#059669'}">${formatPrice(dueAmount)}</span></div>`;
    }
    totalsHtml += `</div>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${patient}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff;padding:32px 40px}
@media print{@page{margin:15mm}body{padding:20px 30px}}</style></head><body>
<div style="text-align:center;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:24px">
  <h1 style="font-size:22px;font-weight:700;color:#0f766e">${s.clinicName}</h1>
  <p style="font-size:12px;color:#666;margin-top:2px">${s.clinicTagline}</p>
  <p style="font-size:11px;color:#888;margin-top:6px">${s.clinicAddress} • ${s.clinicPhone}</p>
</div>
<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:20px">
  <div><p><span style="color:#6b7280">Patient:</span> <strong>${patient}</strong></p>${doctor ? `<p><span style="color:#6b7280">Doctor:</span> <strong>${doctor}</strong></p>` : ''}</div>
  <div style="text-align:right"><p><span style="color:#6b7280">Date:</span> <strong>${date}</strong></p><p><span style="color:#6b7280">Payment:</span> <strong>${splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => sp.method).join(" + ") : paymentMethod}</strong></p></div>
</div>
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px">
  <thead><tr style="background:#f0fdfa"><th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px">#</th>
  <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px">Description</th>
  <th style="padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px">Amount</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${totalsHtml}
<p style="text-align:center;font-size:11px;color:#888;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px">Thank you for choosing ${s.clinicName}. Get well soon!</p>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    onSubmit(buildFormData(), "print");
  };

  const handlePayment = () => {
    if (!patient) { toast.error("Please select a patient"); return; }
    if (lineItems.length === 0) { toast.error("Please add at least one item"); return; }
    // Auto-fill paid amount to grand total for POS
    setPaidAmount(grandTotal);
    onSubmit({ ...buildFormData(), paidAmount: grandTotal }, "payment");
  };

  // ─── PREVIEW VIEW ───
  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
          <div className="p-8 space-y-6" id="invoice-print-area">
            <div className="text-center border-b-2 border-primary/30 pb-4">
              <h2 className="text-xl font-bold text-primary">{appSettings.clinicName}</h2>
              <p className="text-sm text-muted-foreground">{appSettings.clinicTagline}</p>
              <p className="text-xs text-muted-foreground mt-1">{appSettings.clinicAddress} • {appSettings.clinicPhone}</p>
            </div>

            <div className="flex justify-between text-sm">
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Patient:</span> <span className="font-semibold">{patient}</span></p>
                {doctor && <p><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{doctor}</span></p>}
              </div>
              <div className="text-right space-y-1">
                <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></p>
                <p><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => sp.method).join(" + ") : paymentMethod}</span></p>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_100px] px-4 py-2.5 bg-primary/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>#</span><span>Description</span><span className="text-right">Amount</span>
              </div>
              {previewItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[40px_1fr_100px] px-4 py-3 border-t border-border items-center text-sm">
                  <span className="text-muted-foreground">{i + 1}</span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-right font-semibold tabular-nums">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="ml-auto w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums">-{formatPrice(discountAmount)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="tabular-nums">{formatPrice(taxAmount)}</span></div>}
              <div className="border-t-2 border-primary/30 pt-2 flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-primary tabular-nums">{formatPrice(grandTotal)}</span>
              </div>
              {paidAmount > 0 && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums">{formatPrice(paidAmount)}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(dueAmount)}</span></div>
                </>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border">Thank you for choosing {appSettings.clinicName}. Get well soon!</p>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1 gap-2">
              <FileText className="w-4 h-4" /> Back to Edit
            </Button>
            <Button onClick={() => { window.print(); }} className="flex-1 gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── MAIN FORM ───
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-primary-foreground">
              <ShoppingCart className="w-5 h-5" />
              {editData ? "Edit Bill" : "Create Bill"}
            </DialogTitle>
            <p className="text-primary-foreground/70 text-sm mt-0.5">Create and manage patient bills</p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5 pt-5">
          {/* Invoice # + Date row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-primary" />
              <span className="font-semibold">Invoice</span>
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px] h-9" />
            </div>
          </div>

          {/* Patient + Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                <User className="w-4 h-4 text-primary" />
                {t("patient", lang)} <span className="text-destructive">*</span>
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
              <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                <Stethoscope className="w-4 h-4 text-primary" />
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

          {/* Two-column: Services/Injections/Packages/Custom + Medicines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT */}
            <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                  <Briefcase className="w-4 h-4 text-primary" /> Services
                </Label>
                <Select value="" onValueChange={addService}>
                  <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name} — {formatPrice(s.price)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                  <Syringe className="w-4 h-4 text-amber-500" /> Injection
                </Label>
                <Select value="" onValueChange={addInjection}>
                  <SelectTrigger><SelectValue placeholder="Select Injection" /></SelectTrigger>
                  <SelectContent>
                    {injectionsList.filter((inj) => inj.status !== "out-of-stock").map((inj) => (
                      <SelectItem key={inj.id} value={inj.name}>{inj.name} {inj.strength} — {formatDualPrice(inj.price)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                  <Package className="w-4 h-4 text-violet-500" /> Packages
                </Label>
                <Select value="" onValueChange={addPackage}>
                  <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name} — {formatPrice(p.price)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold">
                  <Tag className="w-4 h-4 text-muted-foreground" /> Custom Item
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Item name" value={customDraft.name} onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1" />
                  <Input type="number" placeholder="Price" value={customDraft.price || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className="w-20" />
                  <Input type="number" min={1} value={customDraft.qty} onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-16" />
                  <Button type="button" variant="outline" onClick={addCustomItem} size="sm" className="h-10 px-3">Add</Button>
                </div>
              </div>
            </div>

            {/* RIGHT: Medicines */}
            <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Pill className="w-4 h-4 text-emerald-500" /> Medicines <span className="text-muted-foreground text-xs font-normal">(pieces)</span>
              </Label>

              <div className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground bg-muted/30">
                <Barcode className="w-4 h-4" /> Scan barcode to add medicine
              </div>

              <Select value="" onValueChange={addMedicineByName}>
                <SelectTrigger><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                <SelectContent>
                  {medicineOptions.map((m) => (
                    <SelectItem key={m.name} value={m.name}>{m.name} — {formatPrice(m.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">Selling price per piece. Quantity is always in pieces.</p>

              {medicationItems.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                      <Pill className="w-3.5 h-3.5" /> {medicationItems.length} medicine{medicationItems.length > 1 ? "s" : ""} added
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(medicationTotal)}</span>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 mt-1">Shown as "Medication" on customer invoice</p>
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          {lineItems.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_60px_80px_36px] gap-2 px-4 py-2.5 bg-primary/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Item</span><span className="text-right">Price</span><span className="text-center">Qty</span><span className="text-right">Total</span><span></span>
              </div>
              <div className="divide-y divide-border">
                {lineItems.map((li) => (
                  <div key={li.id} className="grid grid-cols-[1fr_80px_60px_80px_36px] gap-2 px-4 py-2 items-center text-sm hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${typeBadgeStyles[li.type]}`}>{li.type}</span>
                      <span className="truncate font-medium">{li.name}</span>
                    </div>
                    <span className="text-right text-muted-foreground tabular-nums">{formatPrice(li.price)}</span>
                    <div className="flex justify-center">
                      <Input type="number" min={1} value={li.qty} onChange={(e) => updateItemQty(li.id, parseInt(e.target.value) || 1)} className="w-12 h-7 text-center text-sm px-1" />
                    </div>
                    <span className="text-right font-semibold text-primary tabular-nums">{formatPrice(li.price * li.qty)}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => removeItem(li.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discount + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Tag className="w-4 h-4 text-primary" /> Discount
              </Label>
              <div className="flex gap-1.5">
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" className="flex-1" />
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              <Button type="button" variant="outline" className="w-full text-sm h-9">Split Bill</Button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">{formatDualPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive tabular-nums font-medium">-{formatDualPrice(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="tabular-nums font-medium">{formatDualPrice(taxAmount)}</span>
              </div>
            )}
            <div className="border-t-2 border-primary/20 pt-3 mt-2 flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span className="text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between text-sm pt-1 font-semibold">
                <span className="text-muted-foreground">Due Balance</span>
                <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(dueAmount)}</span>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <Button variant="outline" onClick={() => handleAction("draft")} className="gap-2 h-11 border-border">
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button variant="outline" onClick={() => { if (!patient) { toast.error("Please select a patient"); return; } setShowPreview(true); }} className="gap-2 h-11">
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <Button onClick={handlePrintInvoice} className="gap-2 h-11">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button onClick={handlePayment} className="gap-2 h-11 bg-orange-500 hover:bg-orange-600 text-white">
              <Receipt className="w-4 h-4" /> Payment (POS)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
