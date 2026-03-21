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
      return { name: g.label, description: `${g.items.length} item(s)`, qty, price: total, total };
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
  const handlePrint = (record: BillingRecord) => { setViewRecord(record); setTimeout(() => window.print(), 300); };

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
          {viewRecord && (
            <>
              <div className="p-8 space-y-6" id="invoice-print-area" ref={printRef}>
                <div className="text-center border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-foreground">{appSettings.clinicName}</h2>
                  <p className="text-sm text-muted-foreground">{appSettings.clinicTagline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{appSettings.clinicAddress} | {appSettings.clinicPhone}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Invoice:</span> <span className="font-semibold">{viewRecord.id}</span></p>
                    <p><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{viewRecord.patient}</span></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{viewRecord.date}</span></p>
                    <p><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{viewRecord.method}</span></p>
                  </div>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_100px] px-4 py-2.5 bg-primary/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>#</span><span>Description</span><span className="text-right">Amount</span>
                  </div>
                  {(() => {
                    const items = viewRecord.formData?.lineItems;
                    if (items && items.length > 0) {
                      const nonMed = items.filter(li => li.type !== "MED");
                      const meds = items.filter(li => li.type === "MED");
                      const medTotal = meds.reduce((s, li) => s + li.price * li.qty, 0);
                      const display = [
                        ...nonMed.map(li => ({ name: li.name, total: li.price * li.qty })),
                        ...(meds.length > 0 ? [{ name: "Medication", total: medTotal }] : []),
                      ];
                      return display.map((item, i) => (
                        <div key={i} className="grid grid-cols-[40px_1fr_100px] px-4 py-3 border-t border-border items-center text-sm">
                          <span className="text-muted-foreground">{i + 1}</span>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-right font-semibold tabular-nums">{formatDualPrice(item.total)}</span>
                        </div>
                      ));
                    }
                    return viewRecord.service.split(" + ").map((svc, i) => (
                      <div key={i} className="grid grid-cols-[40px_1fr_100px] px-4 py-3 border-t border-border items-center text-sm">
                        <span className="text-muted-foreground">{i + 1}</span>
                        <span className="font-medium">{svc}</span>
                        <span className="text-right tabular-nums">—</span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="ml-auto w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatDualPrice(viewRecord.amount)}</span></div>
                  {viewRecord.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums">-{formatDualPrice(viewRecord.discount)}</span></div>}
                  {viewRecord.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">{formatDualPrice(viewRecord.tax)}</span></div>}
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-base"><span>Grand Total</span><span className="text-primary tabular-nums">{formatDualPrice(viewRecord.total)}</span></div>
                  {viewRecord.formData?.splitPayments && viewRecord.formData.splitPayments.length > 0 ? (
                    <>
                      {viewRecord.formData.splitPayments.map((sp, i) => (
                        <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{sp.method}</span><span className="tabular-nums">{formatDualPrice(sp.amount)}</span></div>
                      ))}
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Paid</span><span className="tabular-nums">{formatDualPrice(viewRecord.paid)}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="tabular-nums">{formatDualPrice(viewRecord.paid)}</span></div>
                  )}
                  <div className="flex justify-between text-sm font-semibold"><span className="text-muted-foreground">Due</span><span className={`tabular-nums ${viewRecord.due > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatDualPrice(viewRecord.due)}</span></div>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border">Thank you for choosing {appSettings.clinicName}. Get well soon!</p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button variant="outline" onClick={() => setViewRecord(null)} className="flex-1">Close</Button>
                <Button onClick={() => window.print()} className="flex-1 gap-2 bg-primary hover:bg-primary/90"><Printer className="w-4 h-4" /> Print Invoice</Button>
              </div>
            </>
          )}
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
