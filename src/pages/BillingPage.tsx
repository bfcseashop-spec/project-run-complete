import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";

import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, Printer, Trash2, DollarSign, TrendingUp, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { getSettings, updateSettings } from "@/data/settingsStore";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import type { InvoiceFormData, SplitPayment } from "@/components/NewInvoiceDialog";
import { toast } from "sonner";
import { barcodeSVG } from "@/lib/barcode";
import clinicLogo from "@/assets/clinic-logo.png";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { opdPatients } from "@/data/opdPatients";
import { deductMedicine } from "@/data/medicineStore";
import { getInjections, updateInjection, computeInjectionStatus } from "@/data/injectionStore";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

initPatients(opdPatients);


type LineItemType = "SVC" | "MED" | "INJ" | "PKG" | "CUSTOM";

const groupLineItems = (lineItems: { type: string; name: string; price: number; qty: number }[]) => {
  const groups: Record<string, { label: string; items: typeof lineItems }> = {
    SVC: { label: "Services", items: [] },
    INJ: { label: "Injections", items: [] },
    PKG: { label: "Packages", items: [] },
    MED: { label: "Medication", items: [] },
    CUSTOM: { label: "Custom Items", items: [] },
  };
  lineItems.forEach((li) => {
    const g = groups[li.type];
    if (g) g.items.push(li);
  });
  return Object.entries(groups)
    .filter(([, g]) => g.items.length > 0)
    .map(([, g]) => {
      const total = g.items.reduce((s, li) => s + li.price * li.qty, 0);
      const qty = g.items.reduce((s, li) => s + li.qty, 0);
      const subItems = g.items.map((li) => ({ name: li.name, price: li.price, qty: li.qty, total: li.price * li.qty }));
      return { name: g.label, description: `${g.items.length} item(s)`, qty, price: total, total, subItems };
    });
};

import { BillingRecord, getBillingRecords, setBillingRecords, addBillingRecord, removeBillingRecord, updateBillingRecord, subscribeBilling } from "@/data/billingStore";
import { getActiveDoctorsWithDetails, subscribeDoctors } from "@/data/doctorStore";
import { getNextInvoiceNumber } from "@/lib/invoiceId";
import { getRefunds, subscribeRefunds } from "@/data/refundStore";

const BillingPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();
  const [billingData, setBillingData] = useState<BillingRecord[]>(getBillingRecords());
  const [viewRecord, setViewRecord] = useState<BillingRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<BillingRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState(getPatients());
  const [refunds, setRefunds] = useState(getRefunds());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkDeleteStep, setBulkDeleteStep] = useState<0 | 1 | 2>(0);
  const [doctors, setDoctors] = useState(getActiveDoctorsWithDetails());
  useEffect(() => { const u = subscribe(() => setPatients([...getPatients()])); return u; }, []);
  useEffect(() => { const u = subscribeBilling(() => setBillingData([...getBillingRecords()])); return u; }, []);
  useEffect(() => { const u = subscribeRefunds(() => setRefunds([...getRefunds()])); return () => { u(); }; }, []);
  useEffect(() => { const u = subscribeDoctors(() => setDoctors([...getActiveDoctorsWithDetails()])); return u; }, []);

  const refundedInvoiceIds = useMemo(() => new Set(refunds.map(r => r.invoiceId)), [refunds]);
  const refundAmountByInvoice = useMemo(() => {
    const map = new Map<string, number>();
    refunds.forEach(r => map.set(r.invoiceId, (map.get(r.invoiceId) || 0) + r.totalRefund));
    return map;
  }, [refunds]);

  const getBillStatus = (record: BillingRecord): { label: string; color: string } => {
    if (refundedInvoiceIds.has(record.id)) return { label: "Refunded", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800" };
    if (record.due <= 0) return { label: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
    if (record.paid > 0) return { label: "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    return { label: "Issued", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
  };

  // Pick up submitted invoice from the full-page form (only completed payments)
  useEffect(() => {
    const raw = sessionStorage.getItem("invoiceSubmit");
    if (!raw) return;
    sessionStorage.removeItem("invoiceSubmit");
    try {
      const { data, action, isEdit, editRecordId } = JSON.parse(raw) as { data: InvoiceFormData; action: string; isEdit: boolean; editRecordId?: string };
      // Only add to billing list when payment is completed
      if (action !== "payment") return;

      if (isEdit && editRecordId) {
        // Update existing record
        const record = buildRecord(data, editRecordId);
        updateBillingRecord(editRecordId, record);
        toast.success(`Invoice ${editRecordId} updated`);
        return;
      }

      const prefix = appSettings.invoicePrefix || "BL";
      const nextNum = getNextInvoiceNumber(billingData.map(r => r.id), prefix);
      const id = `${prefix}-${String(nextNum).padStart(2, "0")}`;
      const record = buildRecord(data, id);
      addBillingRecord(record);
      updateSettings({ nextInvoiceNumber: String(nextNum + 1) });

      // Deduct stock for medicines and injections
      const items = data.lineItems || [];
      (async () => {
        for (const li of items) {
          if (li.type === "MED") {
            await deductMedicine(li.name, li.qty);
          } else if (li.type === "INJ") {
            const allInj = getInjections();
            const inj = allInj.find(i => i.name === li.name);
            if (inj && inj.stock >= li.qty) {
              const newStock = inj.stock - li.qty;
              await updateInjection(inj.id, { stock: newStock, status: computeInjectionStatus(newStock) });
            }
          }
        }
      })();
    } catch { /* ignore */ }
  }, []);

  const getMedQty = (r: BillingRecord) => {
    if (r.formData?.lineItems) {
      return r.formData.lineItems.filter(li => li.type === "MED").reduce((s, li) => s + li.qty, 0);
    }
    // Fallback: check service string for medicine-related keywords
    if (r.service.toLowerCase().includes("medicine") || r.service.toLowerCase().includes("prescription")) return 1;
    return 0;
  };
  const getInjection = (r: BillingRecord) => {
    if (r.formData?.lineItems) {
      const inj = r.formData.lineItems.filter(li => li.type === "INJ");
      return inj.length > 0 ? inj.map(li => li.name).join(", ") : "—";
    }
    return r.service.toLowerCase().includes("injection") ? "Yes" : "—";
  };
  const getPackages = (r: BillingRecord) => {
    if (r.formData?.lineItems) {
      const pkg = r.formData.lineItems.filter(li => li.type === "PKG");
      return pkg.length > 0 ? pkg.map(li => li.name).join(", ") : "—";
    }
    if (r.service.toLowerCase().includes("checkup") || r.service.toLowerCase().includes("package")) return "Yes";
    return "—";
  };

  const columns = [
    { key: "id", header: "Bill No", render: (d: BillingRecord) => (
      <span className="font-mono font-semibold text-sm">
        {d.id}
        {refundedInvoiceIds.has(d.id) && (
          <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            <RotateCcw className="w-2.5 h-2.5" />↻
          </span>
        )}
      </span>
    )},
    { key: "date", header: t("date", lang), render: (d: BillingRecord) => (
      <span className="text-muted-foreground text-sm">{d.date}</span>
    )},
    { key: "patient", header: t("patient", lang), render: (d: BillingRecord) => (
      <span className="font-medium">{d.patient}</span>
    )},
    { key: "medQty", header: "Qty (Med)", render: (d: BillingRecord) => {
      const qty = getMedQty(d);
      return <span className="tabular-nums text-sm">{qty > 0 ? qty : "—"}</span>;
    }},
    { key: "services", header: "Services", render: (d: BillingRecord) => {
      if (d.formData?.lineItems) {
        const svcs = d.formData.lineItems.filter(li => li.type === "SVC" || li.type === "CUSTOM");
        return <span className="text-sm truncate max-w-[140px] block">{svcs.length > 0 ? svcs.map(li => li.name).join(", ") : "—"}</span>;
      }
      return <span className="text-sm text-muted-foreground">{d.service || "—"}</span>;
    }},
    { key: "injection", header: "Injection", render: (d: BillingRecord) => (
      <span className="text-sm">{getInjection(d)}</span>
    )},
    { key: "packages", header: "Packages", render: (d: BillingRecord) => (
      <span className="text-sm">{getPackages(d)}</span>
    )},
    { key: "total", header: "Total", render: (d: BillingRecord) => (
      <div>
        <span className="font-semibold tabular-nums">{formatDualPrice(d.total)}</span>
        {refundAmountByInvoice.has(d.id) && (
          <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-medium">
            Refund: -{formatPrice(refundAmountByInvoice.get(d.id)!)}
          </span>
        )}
      </div>
    )},
    { key: "paid", header: "Paid", render: (d: BillingRecord) => <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{formatDualPrice(d.paid)}</span> },
    { key: "method", header: "Payment Method", render: (d: BillingRecord) => <span className="text-sm">{d.method || "—"}</span> },
    { key: "billStatus", header: "Status", render: (d: BillingRecord) => {
      const st = getBillStatus(d);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${st.color}`}>
          {st.label}
        </span>
      );
    }},
    {
      key: "actions", header: "Actions", render: (d: BillingRecord) => (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewRecord(d)}><Eye className="w-4 h-4 text-primary" /></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePrint(d)}><Printer className="w-4 h-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent>Print</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteRecord(d)}><Trash2 className="w-4 h-4 text-destructive/70" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];

  // Only show paid bills (due <= 0) in billing list; unpaid go to Due Management
  const paidBillingData = useMemo(() => billingData.filter(r => r.due <= 0), [billingData]);

  const toolbar = useDataToolbar({
    data: paidBillingData as unknown as Record<string, unknown>[],
    dateKey: "date",
    columns,
    title: "Billing",
    searchKeys: ["id", "patient", "service", "method", "status"],
  });

  const displayData = toolbar.filteredByDate as unknown as BillingRecord[];

  const buildRecord = (data: InvoiceFormData, id: string): BillingRecord => {
    const parts: string[] = [];
    if (data.service) parts.push(data.service);
    if (data.injection) parts.push(data.injection);
    if (data.packageItem) parts.push(data.packageItem);
    data.customItems.forEach((c) => parts.push(c.name));
    if (data.medicines.length > 0) parts.push("Medication");
    const serviceNames = parts.join(" + ") || "—";
    const items = data.lineItems || [];
    const subtotal = items.reduce((s, li) => s + li.price * li.qty, 0);
    const discountAmt = data.discountType === "percent" ? (subtotal * data.discount) / 100 : data.discount;
    const afterDiscount = Math.max(0, subtotal - discountAmt);
    const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
    const taxAmt = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmt;
    const due = Math.max(0, total - data.paidAmount);
    const status: BillingRecord["status"] = due === 0 ? "completed" : data.paidAmount === 0 ? "critical" : "pending";
    return { id, patient: data.patient, service: serviceNames, amount: subtotal, discount: discountAmt, tax: taxAmt, total, paid: data.paidAmount, due, date: data.date, status, method: data.paymentMethod, formData: data };
  };

  const handleEdit = (record: BillingRecord) => {
    navigate("/billing/edit", { state: { editData: record.formData, editRecordId: record.id } });
  };
  const handleDelete = () => { if (deleteRecord) { removeBillingRecord(deleteRecord.id); toast.success(`Invoice ${deleteRecord.id} deleted`); setDeleteRecord(null); } };
  const printInvoiceWindow = (record: BillingRecord) => {
    const s = appSettings;
    const p = patients.find((pt) => pt.name === record.patient);
    const d = doctors.find((doc) => doc.name === record.formData?.doctor);
    const items = record.formData?.lineItems;
    const grouped = items && items.length > 0 ? groupLineItems(items) : record.service.split(" + ").map((svc) => ({ name: svc, description: "—", qty: 1, price: 0, total: 0, subItems: [] as { name: string; price: number; qty: number; total: number }[] }));
    const rows = grouped.map((item, i) => {
      const mainRow = `<tr style="background:#f8fafc"><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:13px">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">${item.description}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:600">${item.qty}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;font-weight:600">${formatPrice(item.price)}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.total)}</td></tr>`;
      const subRows = (item.subItems || []).map((sub: any) =>
        `<tr><td style="padding:4px 14px;border-bottom:1px solid #f1f5f9"></td>
         <td style="padding:4px 14px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;padding-left:28px">↳ ${sub.name}</td>
         <td style="padding:4px 14px;border-bottom:1px solid #f1f5f9"></td>
         <td style="padding:4px 14px;border-bottom:1px solid #f1f5f9"></td>
         <td style="padding:4px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:11px;color:#94a3b8;font-variant-numeric:tabular-nums">${formatPrice(sub.price)}</td>
         <td style="padding:4px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:11px;color:#94a3b8;font-variant-numeric:tabular-nums">${formatPrice(sub.total)}</td></tr>`
      ).join("");
      return mainRow + subRows;
    }).join("");
    let totalsHtml = `<div style="margin-left:auto;width:320px;font-size:13px;margin-top:16px">
      <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Subtotal</span><span style="font-weight:500">${formatPrice(record.amount)}</span></div>`;
    if (record.discount > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444;font-weight:500">-${formatPrice(record.discount)}</span></div>`;
    if (record.tax > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Tax</span><span style="font-weight:500">${formatPrice(record.tax)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f766e;margin-top:8px;font-weight:800;font-size:18px"><span>Grand Total</span><span style="color:#0f766e">${formatDualPrice(record.total)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Paid</span><span style="color:#16a34a;font-weight:600">${formatPrice(record.paid)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Due</span><span style="font-weight:600;color:${record.due > 0 ? '#ef4444' : '#16a34a'}">${formatPrice(record.due)}</span></div></div>`;
    const barcodeStr = barcodeSVG(record.id, 220, 50);
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${record.patient}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;background:#fff}.page{padding:32px 40px;position:relative;overflow:hidden}.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;width:320px;height:320px;pointer-events:none;z-index:0}.content{position:relative;z-index:1}@media print{@page{margin:15mm}.page{padding:20px 30px}}</style></head><body>
<div class="page">
  <img src="${clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <div style="background:linear-gradient(135deg,#0f766e,#0369a1);border-radius:12px;padding:20px 28px;color:#fff;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div><h1 style="font-size:22px;font-weight:800;margin:0">${s.clinicName}</h1><p style="font-size:12px;opacity:0.8;margin-top:2px">${s.clinicTagline}</p><p style="font-size:10px;opacity:0.6;margin-top:4px">${s.clinicAddress} · ${s.clinicPhone}</p></div>
      <div style="text-align:right"><p style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Invoice</p><p style="font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px">${record.id}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:13px">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:600;margin-bottom:6px">Patient Info</p>
        <p><strong>${record.patient}</strong></p>
        ${p?.age || p?.gender ? `<p style="color:#64748b;margin-top:2px">${p.age ? `Age: ${p.age}` : ''}${p.age && p.gender ? ' · ' : ''}${p.gender ? `Gender: ${p.gender}` : ''}</p>` : ''}
        ${p?.phone ? `<p style="color:#64748b;margin-top:2px">📞 ${p.phone}</p>` : ''}
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#2563eb;font-weight:600;margin-bottom:6px">Doctor & Invoice</p>
        ${record.formData?.doctor ? `<p><strong>${record.formData.doctor}</strong></p>` : ''}
        ${d?.qualification ? `<p style="color:#64748b;font-size:12px;margin-top:1px">${d.qualification}</p>` : ''}
        <p style="margin-top:4px">Date: <strong>${record.date}</strong></p>
        <p style="margin-top:2px">Payment: <strong>${record.method}</strong></p>
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
      <p style="font-family:monospace;font-size:12px;letter-spacing:3px;font-weight:600;margin-top:4px;color:#475569">${record.id}</p>
    </div>
    <div style="text-align:center;margin-top:20px;padding:12px 0;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-radius:8px">
      <p style="font-size:11px;color:#0f766e;font-weight:500">Thank you for choosing ${s.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${s.clinicWebsite} · ${s.clinicEmail}</p>
    </div>
  </div>
</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };
  const handlePrint = (record: BillingRecord) => { printInvoiceWindow(record); };

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const newRecords: BillingRecord[] = rows.map((row, i) => {
        // Build synthetic lineItems from Qty (Med), Services, Injection, Packages columns
        const lineItems: any[] = [];
        let liIdx = 0;

        const medQtyRaw = String(row.medQty || row["Qty (Med)"] || "");
        const medQtyNum = parseInt(medQtyRaw) || 0;
        if (medQtyNum > 0) {
          lineItems.push({ id: `imp-${i}-${liIdx++}`, type: "MED", name: "Medicine", price: 0, qty: medQtyNum });
        }

        const svcRaw = String(row.services || row["Services"] || "");
        if (svcRaw && svcRaw !== "-" && svcRaw !== "—") {
          const svcPrice = parseFloat(svcRaw) || 0;
          lineItems.push({ id: `imp-${i}-${liIdx++}`, type: "SVC", name: svcPrice > 0 ? `Service (${svcRaw})` : svcRaw, price: svcPrice, qty: 1 });
        }

        const injRaw = String(row.injection || row["Injection"] || "");
        if (injRaw && injRaw !== "-" && injRaw !== "—") {
          lineItems.push({ id: `imp-${i}-${liIdx++}`, type: "INJ", name: injRaw, price: 0, qty: 1 });
        }

        const pkgRaw = String(row.packages || row["Packages"] || "");
        if (pkgRaw && pkgRaw !== "-" && pkgRaw !== "—") {
          lineItems.push({ id: `imp-${i}-${liIdx++}`, type: "PKG", name: pkgRaw, price: 0, qty: 1 });
        }

        const serviceParts: string[] = [];
        if (lineItems.some((li: any) => li.type === "MED")) serviceParts.push("Medication");
        if (lineItems.some((li: any) => li.type === "SVC")) serviceParts.push("Service");
        if (lineItems.some((li: any) => li.type === "INJ")) serviceParts.push("Injection");
        if (lineItems.some((li: any) => li.type === "PKG")) serviceParts.push("Package");
        const serviceStr = String(row.service || "") || serviceParts.join(" + ") || "—";

        const total = Number(row.total) || 0;
        const paid = Number(row.paid) || 0;
        const due = Number(row.due) || Math.max(0, total - paid);
        let status: BillingRecord["status"] = "completed";
        if (due > 0 && paid > 0) status = "pending";
        else if (due > 0 && paid <= 0) status = "critical";

        const statusRaw = String(row.status || "").toLowerCase();
        if (statusRaw === "unpaid" || statusRaw === "critical") status = "critical";
        else if (statusRaw === "partial" || statusRaw === "pending") status = "pending";
        else if (statusRaw === "paid" || statusRaw === "completed") status = "completed";

        const formData: any = lineItems.length > 0 ? { lineItems, patient: "", doctor: "", service: "", injection: "", packageItem: "", medicines: [], customItems: [], discount: 0, discountType: "flat", paidAmount: paid, splitPayments: [], date: String(row.date || row["Date"] || ""), paymentMethod: String(row.method || row["Payment Method"] || "Cash"), medicationTotal: 0 } : undefined;

        return {
          id: String(row.id || row["Bill No"] || `BIL-I${String(billingData.length + i + 1).padStart(3, "0")}`),
          patient: String(row.patient || row["Patient"] || ""),
          service: serviceStr,
          amount: Number(row.amount) || total,
          discount: Number(row.discount) || 0,
          tax: Number(row.tax) || 0,
          total,
          paid,
          due,
          date: String(row.date || row["Date"] || new Date().toISOString().split("T")[0]),
          status,
          method: String(row.method || row["Payment Method"] || "—"),
          formData: formData || undefined,
        };
      });
      for (const rec of newRecords) {
        try { await addBillingRecord(rec); } catch { /* skip duplicates */ }
      }
      toast.success(`Imported ${newRecords.length} billing records`);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayStats = useMemo(() => {
    const todayRecords = billingData.filter((r) => r.date === today);
    return {
      revenue: todayRecords.reduce((s, r) => s + r.paid, 0),
      total: todayRecords.reduce((s, r) => s + r.total, 0),
      due: todayRecords.reduce((s, r) => s + r.due, 0),
      count: todayRecords.length,
      completed: todayRecords.filter((r) => r.status === "completed").length,
      pending: todayRecords.filter((r) => r.status === "pending" || r.status === "critical").length,
    };
  }, [billingData, today]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing", lang)} description="Create invoices, track payments and manage billing records">
        <div className="flex items-center gap-2">
          {selectedKeys.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteStep(1)} className="gap-1.5">
              <Trash2 className="w-4 h-4" /> Delete {selectedKeys.size} Selected
            </Button>
          )}
          <Button onClick={() => navigate("/billing/new")}><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </div>
      </PageHeader>

      <DataToolbar
        dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter}
        viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode}
        searchQuery={toolbar.searchQuery} onSearchChange={toolbar.setSearchQuery}
        searchPlaceholder="Search by invoice, patient, service..."
        onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF}
        onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample}
      />

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={displayData} keyExtractor={(d) => d.id} selectable selectedKeys={selectedKeys} onSelectionChange={setSelectedKeys} />
      ) : (
        <DataGridView columns={columns} data={displayData} keyExtractor={(d) => d.id} />
      )}

      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
          {viewRecord && (() => {
            const pt = patients.find((p) => p.name === viewRecord.patient);
            const dr = doctors.find((doc) => doc.name === viewRecord.formData?.doctor);
            const items = viewRecord.formData?.lineItems;
            const grouped = items && items.length > 0
              ? groupLineItems(items)
              : viewRecord.service.split(" + ").map((svc) => ({ name: svc, description: "—", qty: 1, price: 0, total: 0, subItems: [] as { name: string; price: number; qty: number; total: number }[] }));
            return (
              <>
                <div className="p-8 space-y-5 relative" ref={printRef}>
                  <img src={clinicLogo} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-[0.04] pointer-events-none" />

                  <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl px-6 py-5 text-primary-foreground flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-extrabold">{appSettings.clinicName}</h2>
                      <p className="text-sm opacity-80">{appSettings.clinicTagline}</p>
                      <p className="text-[10px] opacity-60 mt-1">{appSettings.clinicAddress} · {appSettings.clinicPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest opacity-60">Invoice</p>
                      <p className="text-base font-bold font-mono tracking-wider">{viewRecord.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Patient Info</p>
                      <p className="font-semibold text-sm">{viewRecord.patient}</p>
                      {(pt?.age || pt?.gender) && <p className="text-xs text-muted-foreground mt-0.5">{pt.age ? `Age: ${pt.age}` : ''}{pt.age && pt.gender ? ' · ' : ''}{pt.gender ? `Gender: ${pt.gender}` : ''}</p>}
                      {pt?.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {pt.phone}</p>}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">Doctor & Invoice</p>
                      {viewRecord.formData?.doctor && <p className="font-semibold text-sm">{viewRecord.formData.doctor}</p>}
                      {dr?.qualification && <p className="text-[11px] text-muted-foreground">{dr.qualification}</p>}
                      <p className="text-sm mt-1">Date: <span className="font-semibold">{viewRecord.date}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">Payment: <span className="font-medium">{viewRecord.method}</span></p>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>#</span><span>Item</span><span>Description</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
                    </div>
                    {grouped.map((item, i) => (
                      <div key={i}>
                        <div className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-3 border-t border-border items-center text-sm bg-muted/30">
                          <span className="text-muted-foreground">{i + 1}</span>
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                          <span className="text-center font-medium">{item.qty}</span>
                          <span className="text-right tabular-nums font-medium">{formatPrice(item.price)}</span>
                          <span className="text-right font-bold tabular-nums">{formatPrice(item.total)}</span>
                        </div>
                        {(item.subItems || []).map((sub: any, j: number) => (
                          <div key={j} className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-1.5 border-t border-border/40 items-center text-xs text-muted-foreground/70">
                            <span></span>
                            <span className="pl-3">↳ {sub.name}</span>
                            <span></span>
                            <span></span>
                            <span className="text-right tabular-nums">{formatPrice(sub.price)}</span>
                            <span className="text-right tabular-nums">{formatPrice(sub.total)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="ml-auto w-72 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{formatPrice(viewRecord.amount)}</span></div>
                    {viewRecord.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums font-medium">-{formatPrice(viewRecord.discount)}</span></div>}
                    {viewRecord.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums font-medium">{formatPrice(viewRecord.tax)}</span></div>}
                    <div className="border-t-2 border-primary pt-2 flex justify-between font-extrabold text-lg"><span>Grand Total</span><span className="text-primary tabular-nums">{formatDualPrice(viewRecord.total)}</span></div>
                    {viewRecord.formData?.splitPayments && viewRecord.formData.splitPayments.length > 0 ? (
                      <>
                        {viewRecord.formData.splitPayments.map((sp, i) => (
                          <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{sp.method}</span><span className="tabular-nums">{formatPrice(sp.amount)}</span></div>
                        ))}
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatPrice(viewRecord.paid)}</span></div>
                      </>
                    ) : (
                      <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatPrice(viewRecord.paid)}</span></div>
                    )}
                    <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${viewRecord.due > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(viewRecord.due)}</span></div>
                  </div>

                  <div className="text-center pt-4 border-t border-dashed border-border">
                    <div className="inline-block" dangerouslySetInnerHTML={{ __html: barcodeSVG(viewRecord.id, 220, 50) }} />
                    <p className="font-mono text-xs tracking-[0.2em] font-semibold text-muted-foreground mt-1">{viewRecord.id}</p>
                  </div>

                  <div className="text-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg py-3 mt-2">
                    <p className="text-xs text-primary font-medium">Thank you for choosing {appSettings.clinicName}. Get well soon! 🙏</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{appSettings.clinicWebsite} · {appSettings.clinicEmail}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <Button variant="outline" onClick={() => setViewRecord(null)} className="flex-1">Close</Button>
                  <Button onClick={() => printInvoiceWindow(viewRecord)} className="flex-1 gap-2 bg-primary hover:bg-primary/90"><Printer className="w-4 h-4" /> Print Invoice</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete invoice <span className="font-semibold">{deleteRecord?.id}</span> for <span className="font-semibold">{deleteRecord?.patient}</span>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete — Step 1: First Confirmation */}
      <AlertDialog open={bulkDeleteStep === 1} onOpenChange={(open) => { if (!open && bulkDeleteStep === 1) setBulkDeleteStep(0); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Bulk Delete — Step 1 of 2
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <span className="font-bold text-foreground">{selectedKeys.size} invoice(s)</span>. This will permanently remove them from the billing records.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteStep(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); setBulkDeleteStep(2); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete — Step 2: Final Confirmation */}
      <AlertDialog open={bulkDeleteStep === 2} onOpenChange={(open) => !open && setBulkDeleteStep(0)}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> ⚠️ Final Confirmation — Step 2 of 2
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-destructive">This action CANNOT be undone.</span>
              <br /><br />
              The following <span className="font-bold text-foreground">{selectedKeys.size}</span> invoices will be permanently deleted:
              <span className="block mt-2 max-h-32 overflow-y-auto text-xs font-mono bg-muted rounded-md p-2">
                {Array.from(selectedKeys).join(", ")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteStep(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const ids = Array.from(selectedKeys);
                let deleted = 0;
                for (const id of ids) {
                  try { await removeBillingRecord(id); deleted++; } catch { /* skip */ }
                }
                toast.success(`${deleted} invoice(s) deleted successfully`);
                setSelectedKeys(new Set());
                setBulkDeleteStep(0);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedKeys.size} Invoice(s) Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BillingPage;
