import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, Printer, Trash2, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import type { InvoiceFormData, SplitPayment } from "@/components/NewInvoiceDialog";
import { toast } from "sonner";
import { barcodeSVG } from "@/lib/barcode";
import clinicLogo from "@/assets/clinic-logo.png";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { opdPatients } from "@/data/opdPatients";
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

const doctors = [
  { name: "Dr. Sarah Smith", degree: "MBBS, MD" },
  { name: "Dr. Raj Patel", degree: "MBBS, FCPS" },
  { name: "Dr. Emily Williams", degree: "MBBS, MS (Ortho)" },
  { name: "Dr. Mark Brown", degree: "MBBS, DCH (Paediatrics)" },
  { name: "Dr. Lisa Lee", degree: "MBBS, DGO (Gynaecology)" },
];

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

interface BillingRecord {
  id: string;
  patient: string;
  service: string;
  amount: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  date: string;
  status: "completed" | "pending" | "critical";
  method: string;
  formData?: InvoiceFormData;
}

const initialData: BillingRecord[] = [
  { id: "BIL-001", patient: "Sarah Johnson", service: "Lab Test + Consultation", amount: 350, discount: 20, tax: 16.5, total: 346.5, paid: 346.5, due: 0, date: "2026-03-19", status: "completed", method: "Cash" },
  { id: "BIL-002", patient: "Michael Chen", service: "X-Ray", amount: 200, discount: 0, tax: 10, total: 210, paid: 100, due: 110, date: "2026-03-18", status: "pending", method: "Card" },
  { id: "BIL-003", patient: "Emily Davis", service: "Ultrasound + Injection", amount: 480, discount: 30, tax: 22.5, total: 472.5, paid: 0, due: 472.5, date: "2026-03-17", status: "critical", method: "—" },
  { id: "BIL-004", patient: "James Wilson", service: "Health Checkup", amount: 150, discount: 0, tax: 7.5, total: 157.5, paid: 157.5, due: 0, date: "2026-03-16", status: "completed", method: "Cash" },
  { id: "BIL-005", patient: "Rina Akter", service: "Prescription + Medicine", amount: 90, discount: 10, tax: 4, total: 84, paid: 50, due: 34, date: "2026-03-15", status: "pending", method: "ABA" },
];

const BillingPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();
  const [billingData, setBillingData] = useState<BillingRecord[]>(initialData);
  const [viewRecord, setViewRecord] = useState<BillingRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<BillingRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState(getPatients());
  useEffect(() => { const u = subscribe(() => setPatients([...getPatients()])); return u; }, []);

  // Pick up submitted invoice from the full-page form
  useEffect(() => {
    const raw = sessionStorage.getItem("invoiceSubmit");
    if (!raw) return;
    sessionStorage.removeItem("invoiceSubmit");
    try {
      const { data, action, isEdit } = JSON.parse(raw) as { data: InvoiceFormData; action: string; isEdit: boolean };
      if (isEdit) {
        // For edits we'd need the ID — simplified: just add as new
      }
      const prefix = appSettings.invoicePrefix || "BIL";
      const nextNum = parseInt(appSettings.nextInvoiceNumber) || billingData.length + 1;
      const id = `${prefix}-${String(nextNum).padStart(3, "0")}`;
      const record = buildRecord(data, id);
      setBillingData((prev) => [record, ...prev]);
    } catch { /* ignore */ }
  }, []);

  const columns = [
    { key: "id", header: "Invoice" },
    { key: "patient", header: t("patient", lang) },
    { key: "service", header: "Service" },
    { key: "total", header: t("total", lang), render: (d: BillingRecord) => <span className="font-semibold">{formatDualPrice(d.total)}</span> },
    { key: "paid", header: "Paid", render: (d: BillingRecord) => formatDualPrice(d.paid) },
    { key: "due", header: "Due", render: (d: BillingRecord) => <span className={d.due > 0 ? "text-destructive font-medium" : ""}>{formatDualPrice(d.due)}</span> },
    { key: "date", header: t("date", lang) },
    { key: "status", header: t("status", lang), render: (d: BillingRecord) => <StatusBadge status={d.status} /> },
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

  const toolbar = useDataToolbar({
    data: billingData as unknown as Record<string, unknown>[],
    dateKey: "date",
    columns,
    title: "Billing",
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
    navigate("/billing/edit", { state: { editData: record.formData } });
  };
  const handleDelete = () => { if (deleteRecord) { setBillingData((prev) => prev.filter((r) => r.id !== deleteRecord.id)); toast.success(`Invoice ${deleteRecord.id} deleted`); setDeleteRecord(null); } };
  const printInvoiceWindow = (record: BillingRecord) => {
    const s = appSettings;
    const p = patients.find((pt) => pt.name === record.patient);
    const d = doctors.find((doc) => doc.name === record.formData?.doctor);
    const items = record.formData?.lineItems;
    const grouped = items && items.length > 0 ? groupLineItems(items) : record.service.split(" + ").map((svc) => ({ name: svc, description: "—", qty: 1, price: 0, total: 0 }));
    const rows = grouped.map((item, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${i + 1}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:13px">${item.name}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">${item.description}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px">${item.qty}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.price)}</td>
       <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${formatPrice(item.total)}</td></tr>`
    ).join("");
    let totalsHtml = `<div style="margin-left:auto;width:320px;font-size:13px;margin-top:16px">
      <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Subtotal</span><span style="font-weight:500">${formatDualPrice(record.amount)}</span></div>`;
    if (record.discount > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444;font-weight:500">-${formatDualPrice(record.discount)}</span></div>`;
    if (record.tax > 0) totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Tax</span><span style="font-weight:500">${formatDualPrice(record.tax)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f766e;margin-top:8px;font-weight:800;font-size:18px"><span>Grand Total</span><span style="color:#0f766e">${formatDualPrice(record.total)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Paid</span><span style="color:#16a34a;font-weight:600">${formatDualPrice(record.paid)}</span></div>`;
    totalsHtml += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Due</span><span style="font-weight:600;color:${record.due > 0 ? '#ef4444' : '#16a34a'}">${formatDualPrice(record.due)}</span></div></div>`;
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
        ${d?.degree ? `<p style="color:#64748b;font-size:12px;margin-top:1px">${d.degree}</p>` : ''}
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
      const newRecords: BillingRecord[] = rows.map((row, i) => ({
        id: `BIL-I${String(billingData.length + i + 1).padStart(3, "0")}`,
        patient: String(row.patient || ""),
        service: String(row.service || ""),
        amount: Number(row.amount) || 0,
        discount: Number(row.discount) || 0,
        tax: Number(row.tax) || 0,
        total: Number(row.total) || 0,
        paid: Number(row.paid) || 0,
        due: Number(row.due) || 0,
        date: String(row.date || new Date().toISOString().split("T")[0]),
        status: (row.status as BillingRecord["status"]) || "pending",
        method: String(row.method || "—"),
      }));
      setBillingData((prev) => [...newRecords, ...prev]);
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
        <Button onClick={() => navigate("/billing/new")}><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={formatDualPrice(todayStats.revenue)} change={`${todayStats.count} invoices`} changeType="neutral" icon={DollarSign} iconBg="bg-primary/10" />
        <StatCard title="Today's Total" value={formatDualPrice(todayStats.total)} change={`${todayStats.completed} completed`} changeType="positive" icon={TrendingUp} iconBg="bg-success/10" />
        <StatCard title="Outstanding Due" value={formatDualPrice(todayStats.due)} change={todayStats.due > 0 ? "Needs attention" : "All clear"} changeType={todayStats.due > 0 ? "negative" : "positive"} icon={AlertTriangle} iconBg="bg-destructive/10" />
        <StatCard title="Completed" value={`${todayStats.completed}/${todayStats.count}`} change={`${todayStats.pending} pending`} changeType={todayStats.pending > 0 ? "negative" : "positive"} icon={CheckCircle} iconBg="bg-accent/50" />
      </div>

      <DataToolbar
        dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter}
        viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode}
        onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF}
        onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample}
      />

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={displayData} keyExtractor={(d) => d.id} />
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
              : viewRecord.service.split(" + ").map((svc) => ({ name: svc, description: "—", qty: 1, price: 0, total: 0 }));
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
                      {dr?.degree && <p className="text-[11px] text-muted-foreground">{dr.degree}</p>}
                      <p className="text-sm mt-1">Date: <span className="font-semibold">{viewRecord.date}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">Payment: <span className="font-medium">{viewRecord.method}</span></p>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[36px_1fr_1fr_40px_90px_100px] px-4 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>#</span><span>Item</span><span>Description</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
                    </div>
                    {grouped.map((item, i) => (
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

                  <div className="ml-auto w-72 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{formatDualPrice(viewRecord.amount)}</span></div>
                    {viewRecord.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums font-medium">-{formatDualPrice(viewRecord.discount)}</span></div>}
                    {viewRecord.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums font-medium">{formatDualPrice(viewRecord.tax)}</span></div>}
                    <div className="border-t-2 border-primary pt-2 flex justify-between font-extrabold text-lg"><span>Grand Total</span><span className="text-primary tabular-nums">{formatDualPrice(viewRecord.total)}</span></div>
                    {viewRecord.formData?.splitPayments && viewRecord.formData.splitPayments.length > 0 ? (
                      <>
                        {viewRecord.formData.splitPayments.map((sp, i) => (
                          <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{sp.method}</span><span className="tabular-nums">{formatDualPrice(sp.amount)}</span></div>
                        ))}
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatDualPrice(viewRecord.paid)}</span></div>
                      </>
                    ) : (
                      <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-emerald-600 font-semibold">{formatDualPrice(viewRecord.paid)}</span></div>
                    )}
                    <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${viewRecord.due > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(viewRecord.due)}</span></div>
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
    </div>
  );
};

export default BillingPage;
