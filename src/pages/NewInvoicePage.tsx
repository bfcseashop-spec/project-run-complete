import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ArrowLeft, CircleDollarSign, SplitSquareHorizontal, ChevronRight, CheckCircle,
} from "lucide-react";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { opdPatients } from "@/data/opdPatients";
import { toast } from "sonner";
import { formatDualPrice, formatPrice, getCurrencySymbol } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { getSettings } from "@/data/settingsStore";
import { barcodeSVG } from "@/lib/barcode";
// QR code removed per user request
import clinicLogo from "@/assets/clinic-logo.png";
import type { InvoiceFormData, SplitPayment } from "@/components/NewInvoiceDialog";

initPatients(opdPatients);

const serviceOptions = [
  { name: "Consultation", price: 10 }, { name: "Lab Test", price: 10 },
  { name: "X-Ray", price: 15 }, { name: "Ultrasound", price: 20 },
  { name: "Health Checkup", price: 25 }, { name: "Minor Surgery", price: 50 },
  { name: "Dressing", price: 5 }, { name: "ECG", price: 12 },
  { name: "Vaccination", price: 8 }, { name: "Physiotherapy", price: 15 },
  { name: "CBC", price: 10 }, { name: "HBsAb", price: 8 },
  { name: "HBsAg", price: 7 }, { name: "HIV", price: 7 },
  { name: "2 HABS", price: 4 },
];
const packageOptions = [
  { name: "Basic Health Checkup", price: 50 }, { name: "Full Body Checkup", price: 120 },
  { name: "Diabetes Panel", price: 35 }, { name: "Cardiac Panel", price: 80 },
  { name: "Prenatal Package", price: 60 },
];
const medicineOptions = [
  { name: "Amoxicillin 500mg", price: 2.50 }, { name: "Paracetamol 650mg", price: 0.50 },
  { name: "Metformin 500mg", price: 1.00 }, { name: "Omeprazole 20mg", price: 1.50 },
  { name: "Cetirizine 10mg", price: 0.75 }, { name: "Azithromycin 250mg", price: 3.00 },
  { name: "10% GS 500ml", price: 10.00 }, { name: "Ace", price: 0.25 },
  { name: "Ibuprofen 400mg", price: 1.00 },
];
const paymentMethods = [
  { value: "Cash", label: "Cash", icon: DollarSign },
  { value: "ABA", label: "ABA", icon: CreditCard },
  { value: "ACleda", label: "ACleda", icon: CreditCard },
  { value: "Card", label: "Card", icon: CreditCard },
  { value: "Wing", label: "Wing", icon: CreditCard },
  { value: "True Money", label: "True Money", icon: CreditCard },
  { value: "Due", label: "Due", icon: CreditCard },
  { value: "Bank Transfer", label: "Bank Transfer", icon: CreditCard },
  { value: "Insurance", label: "Insurance", icon: CreditCard },
];
const doctors = [
  { name: "Dr. Sarah Smith", degree: "MBBS, MD" },
  { name: "Dr. Raj Patel", degree: "MBBS, FCPS" },
  { name: "Dr. Emily Williams", degree: "MBBS, MS (Ortho)" },
  { name: "Dr. Mark Brown", degree: "MBBS, DCH (Paediatrics)" },
  { name: "Dr. Lisa Lee", degree: "MBBS, DGO (Gynaecology)" },
];

type LineItemType = "SVC" | "MED" | "INJ" | "PKG" | "CUSTOM";
interface LineItem { id: string; type: LineItemType; name: string; price: number; qty: number; }
interface CustomItem { name: string; price: number; qty: number; }

let lineIdCounter = 0;
const nextId = () => `li-${++lineIdCounter}`;

const typeConfig: Record<LineItemType, { label: string; color: string; bg: string }> = {
  SVC: { label: "Service", color: "text-primary", bg: "bg-primary/10" },
  MED: { label: "Medicine", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  INJ: { label: "Injection", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  PKG: { label: "Package", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  CUSTOM: { label: "Custom", color: "text-muted-foreground", bg: "bg-muted" },
};

const NewInvoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = (location.state as { editData?: InvoiceFormData })?.editData || null;
  const onSubmitCallback = (location.state as { onSubmitAction?: string })?.onSubmitAction || null;

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
  const [splitMode, setSplitMode] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: "Cash", amount: 0 }, { method: "Card", amount: 0 },
  ]);
  const [activeTab, setActiveTab] = useState<"services" | "medicines">("services");
  const [showSummary, setShowSummary] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const u = subscribe(() => setPatients([...getPatients()])); return () => { u(); }; }, []);
  useEffect(() => { const u = subscribeInjections(() => setInjectionsList([...getInjections()])); return () => { u(); }; }, []);

  useEffect(() => {
    if (editData) {
      setPatient(editData.patient); setDoctor(editData.doctor); setDate(editData.date);
      setLineItems(editData.lineItems || []); setDiscount(editData.discount);
      setDiscountType(editData.discountType); setPaidAmount(editData.paidAmount);
      setPaymentMethod(editData.paymentMethod);
      if (editData.splitPayments && editData.splitPayments.length > 0) {
        setSplitMode(true); setSplitPayments(editData.splitPayments);
      }
    }
  }, []);

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

  const selectedPatient = patients.find((p) => p.name === patient);
  const patientPhone = selectedPatient?.phone || "";
  const patientAge = selectedPatient?.age || "";
  const patientGender = selectedPatient?.gender || "";
  const selectedDoctor = doctors.find((d) => d.name === doctor);
  const doctorDegree = selectedDoctor?.degree || "";

  const medicationItems = lineItems.filter((li) => li.type === "MED");
  const medicationTotal = medicationItems.reduce((s, li) => s + li.price * li.qty, 0);
  const nonMedicineItems = lineItems.filter((li) => li.type !== "MED");

  const previewItems = useMemo(() => {
    const groups: Record<LineItemType, { items: LineItem[]; label: string }> = {
      SVC: { items: [], label: "Services" },
      INJ: { items: [], label: "Injections" },
      PKG: { items: [], label: "Packages" },
      MED: { items: [], label: "Medication" },
      CUSTOM: { items: [], label: "Custom Items" },
    };
    lineItems.forEach((li) => groups[li.type].items.push(li));
    const result: { name: string; type: LineItemType; description: string; price: number; qty: number; total: number; subItems: { name: string; price: number; qty: number; total: number }[] }[] = [];
    (Object.keys(groups) as LineItemType[]).forEach((type) => {
      const { items, label } = groups[type];
      if (items.length === 0) return;
      const total = items.reduce((s, li) => s + li.price * li.qty, 0);
      const totalQty = items.reduce((s, li) => s + li.qty, 0);
      const subItems = items.map((li) => ({ name: li.name, price: li.price, qty: li.qty, total: li.price * li.qty }));
      result.push({ name: label, type, description: `${items.length} item(s)`, price: total, qty: totalQty, total, subItems });
    });
    return result;
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

  const goBack = () => navigate("/billing");

  const handleAction = (action: "draft" | "print" | "payment") => {
    if (!patient) { toast.error("Please select a patient"); return; }
    // Store in sessionStorage for BillingPage to pick up
    sessionStorage.setItem("invoiceSubmit", JSON.stringify({ data: buildFormData(), action, isEdit: !!editData }));
    toast.success(action === "draft" ? "Invoice saved" : action === "print" ? "Invoice created — printing..." : "Payment received");
    goBack();
  };

  const handlePrintInvoice = () => {
    if (!patient) { toast.error("Please select a patient"); return; }
    const s = appSettings;
    const invoiceId = `${s.invoicePrefix}-${s.nextInvoiceNumber}`;
    const now = new Date();
    const dateTimeStr = `${date} ${now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    const barcodeStr = barcodeSVG(invoiceId, 220, 50);
    const rows = previewItems.map((item, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:13px">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">${item.description}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px">${item.qty}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.price)}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.total)}</td></tr>`
    ).join("");
    let totalsHtml = `<div style="margin-left:auto;width:320px;font-size:13px;margin-top:16px">
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Subtotal</span><span style="font-weight:500">${formatDualPrice(subtotal)}</span></div>`;
    if (discountAmount > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444;font-weight:500">-${formatDualPrice(discountAmount)}</span></div>`;
    if (taxRate > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Tax (${taxRate}%)</span><span style="font-weight:500">${formatDualPrice(taxAmount)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f766e;margin-top:8px;font-weight:800;font-size:18px"><span>Grand Total</span><span style="color:#0f766e">${formatDualPrice(grandTotal)}</span></div></div>`;
    const payMethodStr = splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => sp.method).join(" + ") : paymentMethod;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${patient}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;background:#fff;padding:0;position:relative}
.page{padding:32px 40px;position:relative;overflow:hidden}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;width:320px;height:320px;pointer-events:none;z-index:0}
.content{position:relative;z-index:1}
@media print{@page{margin:15mm}body{padding:0}.page{padding:20px 30px}}</style></head><body>
<div class="page">
  <img src="${clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <div style="background:linear-gradient(135deg,#0f766e,#0369a1);border-radius:12px;padding:20px 28px;color:#fff;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1 style="font-size:22px;font-weight:800;margin:0">${s.clinicName}</h1>
        <p style="font-size:12px;opacity:0.8;margin-top:2px">${s.clinicTagline}</p>
        <p style="font-size:10px;opacity:0.6;margin-top:4px">${s.clinicAddress} · ${s.clinicPhone}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Draft Invoice</p>
        <p style="font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px">${invoiceId}</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:13px">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:600;margin-bottom:6px">Patient Info</p>
        <p><strong>${patient}</strong></p>
        ${patientAge || patientGender ? `<p style="color:#64748b;margin-top:2px">${patientAge ? `Age: ${patientAge}` : ''}${patientAge && patientGender ? ' · ' : ''}${patientGender ? `Gender: ${patientGender}` : ''}</p>` : ''}
        ${patientPhone ? `<p style="color:#64748b;margin-top:2px">📞 ${patientPhone}</p>` : ''}
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;font-weight:600;margin-bottom:6px">Doctor & Invoice</p>
        ${doctor ? `<p><strong>${doctor}</strong></p>` : ''}
        ${doctorDegree ? `<p style="color:#64748b;font-size:12px;margin-top:1px">${doctorDegree}</p>` : ''}
        <p style="margin-top:4px">Date: <strong>${dateTimeStr}</strong></p>
        <p style="margin-top:2px">Payment: <strong>${payMethodStr}</strong></p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:4px">
      <thead><tr style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5)">
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">#</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Item</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Description</th>
        <th style="padding:10px 14px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Qty</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Price</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${totalsHtml}
    <div style="text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #cbd5e1">
      <div style="display:inline-block">${barcodeStr}</div>
      <p style="font-family:monospace;font-size:12px;letter-spacing:3px;font-weight:600;margin-top:4px;color:#475569">${invoiceId}</p>
    </div>
    <div style="text-align:center;margin-top:20px;padding:12px 0;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-radius:8px">
      <p style="font-size:11px;color:#0f766e;font-weight:500">Thank you for choosing ${s.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${s.clinicWebsite} · ${s.clinicEmail}</p>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    handleAction("print");
  };

  const handlePayment = () => {
    if (!patient) { toast.error("Please select a patient"); return; }
    if (lineItems.length === 0) { toast.error("Please add at least one item"); return; }
    if (splitMode) {
      const remaining = Math.max(0, grandTotal - splitTotal);
      if (remaining > 0) {
        const updated = [...splitPayments];
        updated[0] = { ...updated[0], amount: updated[0].amount + remaining };
        setSplitPayments(updated);
      }
    } else {
      setPaidAmount(grandTotal);
    }
    // Show the invoice preview instead of navigating away
    setShowInvoice(true);
    toast.success("Payment received — Invoice ready");
  };

  const handleConfirmAndSave = () => {
    sessionStorage.setItem("invoiceSubmit", JSON.stringify({
      data: { ...buildFormData(), paidAmount: grandTotal },
      action: "payment",
      isEdit: !!editData,
    }));
    goBack();
  };

  const handlePrintFromInvoice = () => {
    const s = appSettings;
    const invoiceItems = previewItems;
    const invoiceId = `${s.invoicePrefix}-${s.nextInvoiceNumber}`;
    const now = new Date();
    const dateTimeStr = `${date} ${now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    const barcodeStr = barcodeSVG(invoiceId, 220, 50);
    const rows = invoiceItems.map((item, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:13px">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">${item.description}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px">${item.qty}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.price)}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.total)}</td></tr>`
    ).join("");
    let totalsHtml = `<div style="margin-left:auto;width:320px;font-size:13px;margin-top:16px">
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Subtotal</span><span style="font-weight:500">${formatDualPrice(subtotal)}</span></div>`;
    if (discountAmount > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444;font-weight:500">-${formatDualPrice(discountAmount)}</span></div>`;
    if (taxRate > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Tax (${taxRate}%)</span><span style="font-weight:500">${formatDualPrice(taxAmount)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f766e;margin-top:8px;font-weight:800;font-size:18px"><span>Grand Total</span><span style="color:#0f766e">${formatDualPrice(grandTotal)}</span></div>`;
    const paidLine = `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Paid</span><span style="color:#16a34a;font-weight:600">${formatDualPrice(grandTotal)}</span></div>`;
    const dueLine = `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Due</span><span style="font-weight:600">${formatDualPrice(0)}</span></div>`;
    totalsHtml += paidLine + dueLine + `</div>`;
    const payMethodStr = splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => `${sp.method}: ${formatDualPrice(sp.amount)}`).join(", ") : paymentMethod;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${patient}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;background:#fff;padding:0;position:relative}
.page{padding:32px 40px;position:relative;overflow:hidden}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;width:320px;height:320px;pointer-events:none;z-index:0}
.content{position:relative;z-index:1}
@media print{@page{margin:15mm}body{padding:0}.page{padding:20px 30px}}</style></head><body>
<div class="page">
  <img src="${clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <div style="background:linear-gradient(135deg,#0f766e,#0369a1);border-radius:12px;padding:20px 28px;color:#fff;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1 style="font-size:22px;font-weight:800;margin:0">${s.clinicName}</h1>
        <p style="font-size:12px;opacity:0.8;margin-top:2px">${s.clinicTagline}</p>
        <p style="font-size:10px;opacity:0.6;margin-top:4px">${s.clinicAddress} · ${s.clinicPhone}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Invoice</p>
        <p style="font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px">${invoiceId}</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:13px">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:600;margin-bottom:6px">Patient Info</p>
        <p><strong>${patient}</strong></p>
        ${patientAge || patientGender ? `<p style="color:#64748b;margin-top:2px">${patientAge ? `Age: ${patientAge}` : ''}${patientAge && patientGender ? ' · ' : ''}${patientGender ? `Gender: ${patientGender}` : ''}</p>` : ''}
        ${patientPhone ? `<p style="color:#64748b;margin-top:2px">📞 ${patientPhone}</p>` : ''}
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;font-weight:600;margin-bottom:6px">Doctor & Invoice</p>
        ${doctor ? `<p><strong>${doctor}</strong></p>` : ''}
        ${doctorDegree ? `<p style="color:#64748b;font-size:12px;margin-top:1px">${doctorDegree}</p>` : ''}
        <p style="margin-top:4px">Date: <strong>${dateTimeStr}</strong></p>
        <p style="margin-top:2px">Payment: <strong>${payMethodStr}</strong></p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:4px">
      <thead><tr style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5)">
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">#</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Item</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Description</th>
        <th style="padding:10px 14px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Qty</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Price</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${totalsHtml}
    <div style="text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #cbd5e1">
      <div style="display:inline-block">${barcodeStr}</div>
      <p style="font-family:monospace;font-size:12px;letter-spacing:3px;font-weight:600;margin-top:4px;color:#475569">${invoiceId}</p>
    </div>
    <div style="text-align:center;margin-top:20px;padding:12px 0;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-radius:8px">
      <p style="font-size:11px;color:#0f766e;font-weight:500">Thank you for choosing ${s.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${s.clinicWebsite} · ${s.clinicEmail}</p>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const itemCount = lineItems.length;
  const svcCount = lineItems.filter(l => l.type === "SVC").length;
  const medCount = lineItems.filter(l => l.type === "MED").length;
  const injCount = lineItems.filter(l => l.type === "INJ").length;
  const pkgCount = lineItems.filter(l => l.type === "PKG").length;

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}
            className="h-9 w-9 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">
              {editData ? "Edit Invoice" : "New Invoice"}
            </h1>
            <p className="text-primary-foreground/60 text-xs">{appSettings.clinicName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary-foreground/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary-foreground/60" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-0 h-auto p-0 text-sm text-primary-foreground focus-visible:ring-0 w-[130px]" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSummary(!showSummary)}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5 text-xs">
            <ChevronRight className={`w-4 h-4 transition-transform ${showSummary ? "rotate-0" : "rotate-180"}`} />
            {showSummary ? "Hide Summary" : "Show Summary"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Full-width Items Section */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Patient & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-1 lg:col-span-2">
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
            <div className="sm:col-span-1 lg:col-span-2">
              <Label className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Stethoscope className="w-3.5 h-3.5 text-primary" /> Doctor / Refer
              </Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d.name} value={d.name}>{d.name} — {d.degree}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabbed Item Selection — Full Width */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex border-b border-border bg-muted/30">
              <button onClick={() => setActiveTab("services")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition-colors
                  ${activeTab === "services" ? "text-primary border-b-2 border-primary bg-card" : "text-muted-foreground hover:text-foreground"}`}>
                <Layers className="w-3.5 h-3.5" /> Services & More
                {svcCount + injCount + pkgCount > 0 && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">{svcCount + injCount + pkgCount}</span>}
              </button>
              <button onClick={() => setActiveTab("medicines")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition-colors
                  ${activeTab === "medicines" ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-card" : "text-muted-foreground hover:text-foreground"}`}>
                <Pill className="w-3.5 h-3.5" /> Medicines
                {medCount > 0 && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{medCount}</span>}
              </button>
            </div>

            <div className="p-5">
              {activeTab === "services" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Service</Label>
                      <Select value="" onValueChange={addService}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Add service..." /></SelectTrigger>
                        <SelectContent>
                          {serviceOptions.map((s) => <SelectItem key={s.name} value={s.name}>{s.name} — {formatPrice(s.price)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Syringe className="w-3 h-3" /> Injection</Label>
                      <Select value="" onValueChange={addInjection}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Add injection..." /></SelectTrigger>
                        <SelectContent>
                          {injectionsList.filter((inj) => inj.status !== "out-of-stock").map((inj) => (
                            <SelectItem key={inj.id} value={inj.name}>{inj.name} {inj.strength} — {formatDualPrice(inj.price)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Package className="w-3 h-3" /> Package</Label>
                      <Select value="" onValueChange={addPackage}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Add package..." /></SelectTrigger>
                        <SelectContent>
                          {packageOptions.map((p) => <SelectItem key={p.name} value={p.name}>{p.name} — {formatPrice(p.price)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Custom Item */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Custom Item</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Item name" value={customDraft.name} onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1 h-10 text-sm" />
                      <Input type="number" placeholder="Price" value={customDraft.price || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className="w-24 h-10 text-sm" />
                      <Input type="number" min={1} value={customDraft.qty} onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-16 h-10 text-sm" />
                      <Button type="button" variant="outline" onClick={addCustomItem} className="h-10 px-4"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground bg-muted/20">
                    <Barcode className="w-4 h-4" /> Scan barcode to add medicine
                  </div>
                  <Select value="" onValueChange={addMedicineByName}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select medicine to add..." /></SelectTrigger>
                    <SelectContent>
                      {medicineOptions.map((m) => <SelectItem key={m.name} value={m.name}>{m.name} — {formatPrice(m.price)}/pc</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {medicationItems.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                        <Pill className="w-4 h-4" /> {medicationItems.length} medicine{medicationItems.length > 1 ? "s" : ""}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatPrice(medicationTotal)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Shown as "Medication" on customer invoice</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table — Full Width */}
          {lineItems.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Items ({itemCount})
                </span>
                <div className="flex items-center gap-2">
                  {svcCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{svcCount} SVC</span>}
                  {injCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{injCount} INJ</span>}
                  {pkgCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">{pkgCount} PKG</span>}
                  {medCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{medCount} MED</span>}
                </div>
              </div>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_100px_40px_70px_110px_40px] px-5 py-2 bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border shrink-0">
                <span>Type</span><span>Item Name</span><span className="text-right">Unit Price</span><span></span><span className="text-center">Qty</span><span className="text-right">Total</span><span></span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {lineItems.map((li) => (
                  <div key={li.id} className="grid grid-cols-[60px_1fr_100px_40px_70px_110px_40px] items-center px-5 py-2.5 text-sm hover:bg-muted/20 transition-colors group">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded w-fit ${typeConfig[li.type].bg} ${typeConfig[li.type].color}`}>
                      {li.type}
                    </span>
                    <span className="truncate font-medium text-foreground">{li.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums text-right">{formatDualPrice(li.price)}</span>
                    <span className="text-muted-foreground text-xs text-center">×</span>
                    <Input type="number" min={1} value={li.qty}
                      onChange={(e) => updateItemQty(li.id, parseInt(e.target.value) || 1)}
                      className="w-14 h-7 text-center text-xs px-1 border-border mx-auto" />
                    <span className="text-sm font-semibold text-primary tabular-nums text-right">{formatDualPrice(li.price * li.qty)}</span>
                    <Button variant="ghost" size="sm"
                      className="h-6 w-6 p-0 ml-auto text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(li.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Table Footer */}
              <div className="grid grid-cols-[60px_1fr_100px_40px_70px_110px_40px] px-5 py-3 bg-muted/30 border-t border-border text-sm font-semibold shrink-0">
                <span></span><span className="text-muted-foreground">Subtotal</span><span></span><span></span><span></span>
                <span className="text-right text-primary tabular-nums">{formatDualPrice(subtotal)}</span><span></span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No items added yet</p>
              <p className="text-xs mt-1">Select services or medicines above to begin</p>
            </div>
          )}
        </div>

        {/* RIGHT — Summary & Payment Sidebar */}
        {showSummary && (
          <div className="w-[340px] border-l border-border bg-muted/20 flex flex-col overflow-y-auto shrink-0">
            <div className="p-5 space-y-4 flex-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{formatDualPrice(subtotal)}</span></div>
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
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Discount amount</span><span className="text-destructive tabular-nums font-medium">-{formatDualPrice(discountAmount)}</span></div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="tabular-nums font-medium">{formatDualPrice(taxAmount)}</span></div>
                )}
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Grand Total</span>
                  <span className="text-xl font-bold text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</h3>
                  <button onClick={() => setSplitMode(!splitMode)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 transition-colors
                      ${splitMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}>
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

                {(effectivePaid > 0 || splitMode) && (
                  <div className="mt-3 flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Due Balance</span>
                    <span className={`tabular-nums ${dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border bg-card space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleAction("draft")} className="h-10 gap-1.5 text-xs font-semibold">
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </Button>
                <Button variant="outline" onClick={handlePrintInvoice} className="h-10 gap-1.5 text-xs font-semibold">
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </div>
              <Button onClick={handlePayment}
                className="w-full h-11 gap-2 text-sm font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                <CircleDollarSign className="w-4 h-4" /> Payment (POS) — {formatDualPrice(grandTotal)}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Preview Overlay after Payment */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div ref={invoiceRef} className="p-8 space-y-5 overflow-y-auto flex-1 relative">
              {/* Watermark */}
              <img src={clinicLogo} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-[0.04] pointer-events-none" />

              {/* Colorful Header */}
              <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl px-6 py-5 text-primary-foreground flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold">{appSettings.clinicName}</h2>
                  <p className="text-sm opacity-80">{appSettings.clinicTagline}</p>
                  <p className="text-[10px] opacity-60 mt-1">{appSettings.clinicAddress} · {appSettings.clinicPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest opacity-60">Invoice</p>
                  <p className="text-base font-bold font-mono tracking-wider">{appSettings.invoicePrefix}-{appSettings.nextInvoiceNumber}</p>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Patient Info</p>
                  <p className="font-semibold text-sm">{patient}</p>
                  {(patientAge || patientGender) && <p className="text-xs text-muted-foreground mt-0.5">{patientAge ? `Age: ${patientAge}` : ''}{patientAge && patientGender ? ' · ' : ''}{patientGender ? `Gender: ${patientGender}` : ''}</p>}
                  {patientPhone && <p className="text-xs text-muted-foreground mt-0.5">📞 {patientPhone}</p>}
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">Doctor & Invoice</p>
                  {doctor && <p className="font-semibold text-sm">{doctor}</p>}
                  {doctorDegree && <p className="text-[11px] text-muted-foreground">{doctorDegree}</p>}
                  <p className="text-sm mt-1">Date: <span className="font-semibold">{date} {new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Payment: <span className="font-medium">{splitMode ? splitPayments.filter(sp => sp.amount > 0).map(sp => sp.method).join(" + ") : paymentMethod}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>#</span><span>Item</span><span>Description</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
                </div>
                {previewItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-3 border-t border-border items-center text-sm">
                    <span className="text-muted-foreground">{i + 1}</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                    <span className="text-center">{item.qty}</span>
                    <span className="text-right tabular-nums">{formatPrice(item.price)}</span>
                    <span className="text-right font-semibold tabular-nums">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="ml-auto w-72 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{formatDualPrice(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums font-medium">-{formatDualPrice(discountAmount)}</span></div>}
                {taxAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="tabular-nums font-medium">{formatDualPrice(taxAmount)}</span></div>}
                <div className="border-t-2 border-primary pt-2 flex justify-between font-extrabold text-lg"><span>Grand Total</span><span className="text-primary tabular-nums">{formatDualPrice(grandTotal)}</span></div>
                {splitMode && splitPayments.filter(sp => sp.amount > 0).length > 0 ? (
                  <>
                    {splitPayments.filter(sp => sp.amount > 0).map((sp, i) => (
                      <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{sp.method}</span><span className="tabular-nums">{formatDualPrice(sp.amount)}</span></div>
                    ))}
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatDualPrice(grandTotal)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatDualPrice(grandTotal)}</span></div>
                )}
                <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className="tabular-nums text-emerald-600">{formatDualPrice(0)}</span></div>
              </div>

              {/* Barcode */}
              <div className="text-center pt-4 border-t border-dashed border-border">
                <div className="inline-block" dangerouslySetInnerHTML={{ __html: barcodeSVG(`${appSettings.invoicePrefix}-${appSettings.nextInvoiceNumber}`, 220, 50) }} />
                <p className="font-mono text-xs tracking-[0.2em] font-semibold text-muted-foreground mt-1">{appSettings.invoicePrefix}-{appSettings.nextInvoiceNumber}</p>
              </div>

              {/* Footer */}
              <div className="text-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg py-3 mt-2">
                <p className="text-xs text-primary font-medium">Thank you for choosing {appSettings.clinicName}. Get well soon! 🙏</p>
                <p className="text-[10px] text-muted-foreground mt-1">{appSettings.clinicWebsite} · {appSettings.clinicEmail}</p>
              </div>
            </div>
            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={() => { setShowInvoice(false); }} className="flex-1">
                <Eye className="w-4 h-4 mr-2" /> Back to Edit
              </Button>
              <Button variant="outline" onClick={handlePrintFromInvoice} className="flex-1 gap-2">
                <Printer className="w-4 h-4" /> Print Invoice
              </Button>
              <Button onClick={handleConfirmAndSave} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                <CheckCircle className="w-4 h-4" /> Save & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInvoicePage;
