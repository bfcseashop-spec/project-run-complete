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
  Calendar, User, Stethoscope, Briefcase, Syringe, Package,
  Tag, DollarSign, Percent, CreditCard, Printer, Receipt, Save, Pill,
  Barcode, Trash2, FileText, Eye, Plus, X, ShoppingCart, Layers,
  ArrowRight, CircleDollarSign, SplitSquareHorizontal, ChevronDown,
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
  { value: "Cash", label: "Cash", icon: DollarSign },
  { value: "Card", label: "Card", icon: CreditCard },
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

const typeConfig: Record<LineItemType, { label: string; color: string; bg: string }> = {
  SVC: { label: "Service", color: "text-primary", bg: "bg-primary/10" },
  MED: { label: "Medicine", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  INJ: { label: "Injection", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  PKG: { label: "Package", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  CUSTOM: { label: "Custom", color: "text-muted-foreground", bg: "bg-muted" },
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
  const [activeTab, setActiveTab] = useState<"services" | "medicines">("services");

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
      setActiveTab("services");
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
    const items = nonMedicineItems.map((li) => ({ name: li.name, type: li.type, total: li.price * li.qty }));
    if (medicationItems.length > 0) items.push({ name: "Medication", type: "MED" as LineItemType, total: medicationTotal });
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
    const s = appSettings;
    const rows = previewItems.map((item, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:500">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${formatPrice(item.total)}</td></tr>`
    ).join("");

    let totalsHtml = `<div style="margin-left:auto;width:260px;font-size:14px">
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
    if (splitMode) {
      const currentSplitTotal = splitPayments.reduce((s, sp) => s + sp.amount, 0);
      const remaining = Math.max(0, grandTotal - currentSplitTotal);
      if (remaining > 0) {
        const updated = [...splitPayments];
        updated[0] = { ...updated[0], amount: updated[0].amount + remaining };
        setSplitPayments(updated);
      }
      onSubmit({ ...buildFormData(), paidAmount: grandTotal, splitPayments: splitPayments.map((sp, i) => i === 0 && remaining > 0 ? { ...sp, amount: sp.amount + remaining } : sp).filter(sp => sp.amount > 0) }, "payment");
    } else {
      setPaidAmount(grandTotal);
      onSubmit({ ...buildFormData(), paidAmount: grandTotal }, "payment");
    }
  };

  // ─── PREVIEW VIEW ───
  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 gap-0">
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
              {splitMode && splitPayments.filter(sp => sp.amount > 0).length > 0 ? (
                <>
                  {splitPayments.filter(sp => sp.amount > 0).map((sp, i) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{sp.method}</span><span className="tabular-nums">{formatPrice(sp.amount)}</span></div>
                  ))}
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="tabular-nums">{formatPrice(splitTotal)}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(dueAmount)}</span></div>
                </>
              ) : effectivePaid > 0 ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums">{formatPrice(effectivePaid)}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(dueAmount)}</span></div>
                </>
              ) : null}
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
  const itemCount = lineItems.length;
  const svcCount = lineItems.filter(l => l.type === "SVC").length;
  const medCount = lineItems.filter(l => l.type === "MED").length;
  const injCount = lineItems.filter(l => l.type === "INJ").length;
  const pkgCount = lineItems.filter(l => l.type === "PKG").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] max-h-[95vh] overflow-hidden p-0 gap-0">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-primary-foreground">
                {editData ? "Edit Invoice" : "New Invoice"}
              </DialogTitle>
              <p className="text-primary-foreground/60 text-xs">{appSettings.clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary-foreground/60" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-0 h-auto p-0 text-sm text-primary-foreground focus-visible:ring-0 w-[130px]" />
            </div>
          </div>
        </div>

        {/* Body: Two-column layout */}
        <div className="flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(95vh - 130px)" }}>
          {/* LEFT PANEL - Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Patient & Doctor Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="w-3.5 h-3.5 text-primary" /> Patient <span className="text-destructive">*</span>
                </Label>
                <Select value={patient} onValueChange={setPatient}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select patient..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" /> Doctor / Refer
                </Label>
                <Select value={doctor} onValueChange={setDoctor}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Items — Tabbed */}
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              {/* Tab Header */}
              <div className="flex border-b border-border bg-muted/30">
                <button
                  onClick={() => setActiveTab("services")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors
                    ${activeTab === "services" ? "text-primary border-b-2 border-primary bg-card" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Layers className="w-3.5 h-3.5" /> Services & More
                </button>
                <button
                  onClick={() => setActiveTab("medicines")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors
                    ${activeTab === "medicines" ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-card" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Pill className="w-3.5 h-3.5" /> Medicines
                  {medCount > 0 && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{medCount}</span>}
                </button>
              </div>

              <div className="p-4">
                {activeTab === "services" ? (
                  <div className="space-y-3">
                    {/* Services */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Service
                        </Label>
                        <Select value="" onValueChange={addService}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Add service..." /></SelectTrigger>
                          <SelectContent>
                            {serviceOptions.map((s) => <SelectItem key={s.name} value={s.name}>{s.name} — {formatPrice(s.price)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Syringe className="w-3 h-3" /> Injection
                        </Label>
                        <Select value="" onValueChange={addInjection}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Add injection..." /></SelectTrigger>
                          <SelectContent>
                            {injectionsList.filter((inj) => inj.status !== "out-of-stock").map((inj) => (
                              <SelectItem key={inj.id} value={inj.name}>{inj.name} {inj.strength} — {formatDualPrice(inj.price)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Package
                      </Label>
                      <Select value="" onValueChange={addPackage}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Add package..." /></SelectTrigger>
                        <SelectContent>
                          {packageOptions.map((p) => <SelectItem key={p.name} value={p.name}>{p.name} — {formatPrice(p.price)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Custom item inline */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Custom Item
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="Name" value={customDraft.name} onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1 h-9 text-sm" />
                        <Input type="number" placeholder="Price" value={customDraft.price || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className="w-20 h-9 text-sm" />
                        <Input type="number" min={1} value={customDraft.qty} onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-14 h-9 text-sm" />
                        <Button type="button" variant="outline" onClick={addCustomItem} size="sm" className="h-9 px-3 text-xs">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground bg-muted/20">
                      <Barcode className="w-4 h-4" /> Scan barcode to add medicine
                    </div>
                    <Select value="" onValueChange={addMedicineByName}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select medicine to add..." /></SelectTrigger>
                      <SelectContent>
                        {medicineOptions.map((m) => <SelectItem key={m.name} value={m.name}>{m.name} — {formatPrice(m.price)}/pc</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {medicationItems.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-sm flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                          <Pill className="w-3.5 h-3.5" /> {medicationItems.length} medicine{medicationItems.length > 1 ? "s" : ""}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatPrice(medicationTotal)}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">Shown as "Medication" on customer invoice</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Items ({itemCount})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {svcCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{svcCount} SVC</span>}
                    {injCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{injCount} INJ</span>}
                    {pkgCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">{pkgCount} PKG</span>}
                    {medCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{medCount} MED</span>}
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
                  {lineItems.map((li) => (
                    <div key={li.id} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/20 transition-colors group">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${typeConfig[li.type].bg} ${typeConfig[li.type].color}`}>
                        {li.type}
                      </span>
                      <span className="flex-1 truncate font-medium text-foreground">{li.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{formatPrice(li.price)}</span>
                      <span className="text-muted-foreground text-xs">×</span>
                      <Input type="number" min={1} value={li.qty}
                        onChange={(e) => updateItemQty(li.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-7 text-center text-xs px-1 border-border" />
                      <span className="text-sm font-semibold text-primary tabular-nums w-20 text-right">{formatPrice(li.price * li.qty)}</span>
                      <Button variant="ghost" size="sm"
                        className="h-6 w-6 p-0 text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(li.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No items added yet</p>
                <p className="text-xs">Select services or medicines above to begin</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Summary & Payment */}
          <div className="w-full md:w-[340px] border-l border-border bg-muted/20 flex flex-col overflow-y-auto">
            <div className="p-5 space-y-4 flex-1">
              {/* Quick Summary */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums font-medium">{formatDualPrice(subtotal)}</span>
                  </div>

                  {/* Inline discount */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">Discount</span>
                    <div className="flex items-center gap-1">
                      <Input type="number" min={0} value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0" className="w-16 h-7 text-xs text-right tabular-nums" />
                      <button onClick={() => setDiscountType(discountType === "flat" ? "percent" : "flat")}
                        className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                        {discountType === "flat" ? <DollarSign className="w-3 h-3" /> : <Percent className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Discount amount</span>
                      <span className="text-destructive tabular-nums font-medium">-{formatDualPrice(discountAmount)}</span>
                    </div>
                  )}

                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                      <span className="tabular-nums font-medium">{formatDualPrice(taxAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Grand Total</span>
                  <span className="text-xl font-bold text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</h3>
                  <button
                    onClick={() => setSplitMode(!splitMode)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 transition-colors
                      ${splitMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <SplitSquareHorizontal className="w-3 h-3" />
                    {splitMode ? "Single Pay" : "Split Bill"}
                  </button>
                </div>

                {splitMode ? (
                  <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                    {splitPayments.map((sp, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Select value={sp.method} onValueChange={(v) => {
                          const updated = [...splitPayments]; updated[i] = { ...sp, method: v }; setSplitPayments(updated);
                        }}>
                          <SelectTrigger className="w-[100px] h-8 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" min={0} placeholder="0" value={sp.amount || ""}
                          onChange={(e) => { const updated = [...splitPayments]; updated[i] = { ...sp, amount: parseFloat(e.target.value) || 0 }; setSplitPayments(updated); }}
                          className="flex-1 h-8 text-sm tabular-nums" />
                        {splitPayments.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/50 hover:text-destructive"
                            onClick={() => setSplitPayments(splitPayments.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="w-full h-7 text-[11px] gap-1 text-muted-foreground"
                      onClick={() => setSplitPayments([...splitPayments, { method: "Cash", amount: 0 }])}>
                      <Plus className="w-3 h-3" /> Add Method
                    </Button>
                    {splitTotal > 0 && (
                      <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border">
                        <span className="text-muted-foreground">Split Total</span>
                        <span className={`tabular-nums ${splitTotal >= grandTotal ? "text-emerald-600" : "text-destructive"}`}>{formatPrice(splitTotal)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <span className="flex items-center gap-2"><m.icon className="w-3.5 h-3.5" /> {m.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Amount Paid</Label>
                      <Input type="number" min={0} value={paidAmount || ""} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0" className="h-9 tabular-nums" />
                    </div>
                  </div>
                )}

                {/* Due Balance */}
                {(effectivePaid > 0 || splitMode) && (
                  <div className="mt-3 flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Due Balance</span>
                    <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-border bg-card space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleAction("draft")} className="h-10 gap-1.5 text-xs font-semibold">
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </Button>
                <Button variant="outline" onClick={() => {
                  if (!patient) { toast.error("Please select a patient"); return; }
                  setShowPreview(true);
                }} className="h-10 gap-1.5 text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>
              </div>
              <Button onClick={handlePrintInvoice} variant="secondary" className="w-full h-10 gap-1.5 text-xs font-semibold">
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </Button>
              <Button onClick={handlePayment}
                className="w-full h-11 gap-2 text-sm font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                <CircleDollarSign className="w-4 h-4" /> Payment (POS) — {formatPrice(grandTotal)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
