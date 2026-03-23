import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Eye, Pencil, Printer, Trash2, FileText, Plus, CircleDollarSign,
  User, Stethoscope, Calendar, Hash, DollarSign, Clock, Package,
} from "lucide-react";
import { getDrafts, subscribeDrafts, removeDraft, type DraftInvoice } from "@/data/draftStore";
import { addBillingRecord, getBillingRecords } from "@/data/billingStore";
import { formatPrice, formatDualPrice } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import { barcodeSVG } from "@/lib/barcode";
import clinicLogo from "@/assets/clinic-logo.png";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import StatusBadge from "@/components/StatusBadge";

const typeColors: Record<string, string> = {
  SVC: "bg-primary/10 text-primary",
  MED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  INJ: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PKG: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CUSTOM: "bg-muted text-muted-foreground",
};
const typeLabels: Record<string, string> = {
  SVC: "Service", MED: "Medicine", INJ: "Injection", PKG: "Package", CUSTOM: "Custom",
};

const DraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(getDrafts());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDraft, setViewDraft] = useState<DraftInvoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeDrafts(() => setDrafts([...getDrafts()]));
    return unsub;
  }, []);

  const handleEdit = (draft: DraftInvoice) => {
    navigate("/billing/new", { state: { editData: draft.formData, draftId: draft.id } });
  };

  const handleDelete = () => {
    if (deleteId) {
      removeDraft(deleteId);
      toast.success("Draft deleted");
      setDeleteId(null);
    }
  };

  const handleCompletePayment = (draft: DraftInvoice) => {
    const s = getSettings();
    const invoiceId = `${s.invoicePrefix}-${s.nextInvoiceNumber}`;
    const fd = draft.formData;
    const subtotal = (fd.lineItems || []).reduce((s, li) => s + li.price * li.qty, 0);
    const discAmt = fd.discountType === "percent" ? (subtotal * fd.discount) / 100 : fd.discount;
    const afterDisc = Math.max(0, subtotal - discAmt);
    const taxRate = s.taxEnabled ? parseFloat(s.taxRate) || 0 : 0;
    const tax = (afterDisc * taxRate) / 100;
    const total = afterDisc + tax;

    const record = {
      id: invoiceId,
      patient: fd.patient,
      service: fd.service || (fd.lineItems || []).map((l) => l.name).join(", "),
      amount: subtotal,
      discount: discAmt,
      tax,
      total,
      paid: total,
      due: 0,
      date: fd.date,
      status: "completed" as const,
      method: fd.paymentMethod || "Cash",
      formData: { ...fd, paidAmount: total },
    };
    addBillingRecord(record);
    removeDraft(draft.id);
    setViewDraft(null);
    toast.success(`Payment completed — Invoice ${invoiceId} created`);
  };

  const handlePrint = (draft: DraftInvoice) => {
    const s = getSettings();
    const fd = draft.formData;
    const items = fd.lineItems || [];
    const subtotal = items.reduce((s, li) => s + li.price * li.qty, 0);
    const discAmt = fd.discountType === "percent" ? (subtotal * fd.discount) / 100 : fd.discount;
    const afterDisc = Math.max(0, subtotal - discAmt);
    const taxRate = s.taxEnabled ? parseFloat(s.taxRate) || 0 : 0;
    const tax = (afterDisc * taxRate) / 100;
    const total = afterDisc + tax;
    const barcodeStr = barcodeSVG(draft.id, 200, 45);

    const rows = items.map((li, i) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px">${i + 1}</td>
       <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:12px">${li.name}</td>
       <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${li.qty}</td>
       <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:12px;font-variant-numeric:tabular-nums">${formatPrice(li.price)}</td>
       <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:12px;font-variant-numeric:tabular-nums">${formatPrice(li.price * li.qty)}</td></tr>`
    ).join("");

    const win = window.open("", "_blank", "width=700,height=800");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Draft - ${draft.id}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;padding:24px 32px;position:relative}
    @media print{@page{margin:15mm}}</style></head><body>
    <div style="background:linear-gradient(135deg,#0f766e,#0369a1);border-radius:10px;padding:16px 24px;color:#fff;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
      <div><h1 style="font-size:18px;font-weight:800">${s.clinicName}</h1><p style="font-size:11px;opacity:0.7">${s.clinicTagline}</p></div>
      <div style="text-align:right"><p style="font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Draft Invoice</p><p style="font-size:14px;font-weight:700;font-family:monospace">${draft.id}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:12px">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px"><p style="font-size:9px;text-transform:uppercase;color:#16a34a;font-weight:600;margin-bottom:4px">Patient</p><p><strong>${fd.patient}</strong></p></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 14px"><p style="font-size:9px;text-transform:uppercase;color:#2563eb;font-weight:600;margin-bottom:4px">Doctor & Date</p><p><strong>${fd.doctor || "—"}</strong></p><p style="margin-top:2px">Date: <strong>${fd.date}</strong></p></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px">
      <thead><tr style="background:#f0fdfa"><th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:600">#</th><th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:600">Item</th><th style="padding:8px 12px;text-align:center;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:600">Qty</th><th style="padding:8px 12px;text-align:right;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:600">Price</th><th style="padding:8px 12px;text-align:right;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:600">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-left:auto;width:260px;font-size:12px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#64748b">Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${discAmt > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444">-${formatPrice(discAmt)}</span></div>` : ''}
      ${tax > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#64748b">Tax</span><span>${formatPrice(tax)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #0f766e;margin-top:6px;font-weight:800;font-size:15px"><span>Total</span><span style="color:#0f766e">${formatPrice(total)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#f59e0b;font-weight:600"><span>Status</span><span>DRAFT — Unpaid</span></div>
    </div>
    <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1px dashed #cbd5e1">
      <div style="display:inline-block">${barcodeStr}</div>
      <p style="font-family:monospace;font-size:11px;letter-spacing:2px;font-weight:600;margin-top:4px;color:#475569">${draft.id}</p>
    </div>
    <div style="text-align:center;margin-top:16px;padding:10px 0;background:#f0fdfa;border-radius:6px">
      <p style="font-size:10px;color:#0f766e;font-weight:500">Draft Invoice — ${s.clinicName}</p>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const columns: { key: string; header: string; sortable?: boolean; render?: (item: DraftInvoice) => React.ReactNode }[] = [
    { key: "id", header: "Draft ID", sortable: true, render: (d) => <span className="font-mono font-semibold text-primary">{d.id}</span> },
    { key: "date", header: "Date", sortable: true },
    { key: "patient", header: "Patient", sortable: true, render: (d) => <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div><span className="font-medium">{d.patient}</span></div> },
    { key: "doctor", header: "Doctor", sortable: true, render: (d) => <span className="text-muted-foreground">{d.doctor || "—"}</span> },
    { key: "itemCount", header: "Items", sortable: true, render: (d) => <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium"><Package className="w-3 h-3" /> {d.itemCount}</span> },
    { key: "total", header: "Total", sortable: true, render: (d) => <span className="font-bold tabular-nums text-primary">{formatPrice(d.total)}</span> },
    { key: "savedAt", header: "Saved", sortable: true, render: (d) => <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(d.savedAt).toLocaleDateString()}</span> },
    {
      key: "actions", header: "Actions", render: (draft) => (
        <TooltipProvider>
          <div className="flex items-center gap-0.5">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => setViewDraft(draft)}>
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>View Details</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10 text-primary" onClick={() => handleEdit(draft)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Edit Invoice</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={() => handlePrint(draft)}>
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Print Draft</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-emerald-500/10 text-emerald-600" onClick={() => handleCompletePayment(draft)}>
                <CircleDollarSign className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Complete Payment</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive" onClick={() => setDeleteId(draft.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Draft Invoices" description={`${drafts.length} draft invoice(s) awaiting completion`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/billing")} className="gap-2">
            <DollarSign className="w-4 h-4" /> Billing
          </Button>
          <Button onClick={() => navigate("/billing/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Invoice
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {drafts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drafts.length}</p>
              <p className="text-xs text-muted-foreground">Total Drafts</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatPrice(drafts.reduce((s, d) => s + d.total, 0))}</p>
              <p className="text-xs text-muted-foreground">Total Draft Value</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Hash className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drafts.reduce((s, d) => s + d.itemCount, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </div>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-dashed border-border rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Draft Invoices</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">When you save an invoice as a draft, it will appear here. You can resume editing, print, or complete payment at any time.</p>
          <Button onClick={() => navigate("/billing/new")} className="mt-5 gap-2">
            <Plus className="w-4 h-4" /> Create New Invoice
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <DataTable
            columns={columns}
            data={drafts}
            keyExtractor={(d) => d.id}
          />
        </div>
      )}

      {/* View Dialog — Professional Layout */}
      <Dialog open={!!viewDraft} onOpenChange={() => setViewDraft(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          {viewDraft && (() => {
            const fd = viewDraft.formData;
            const items = fd.lineItems || [];
            const subtotal = items.reduce((s, li) => s + li.price * li.qty, 0);
            const discAmt = fd.discountType === "percent" ? (subtotal * fd.discount) / 100 : fd.discount;
            const afterDisc = Math.max(0, subtotal - discAmt);
            const appSettings = getSettings();
            const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
            const tax = (afterDisc * taxRate) / 100;
            const total = afterDisc + tax;

            return (
              <div>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/70 px-6 py-4 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-60">Draft Invoice</p>
                      <h3 className="text-xl font-extrabold tracking-tight">{viewDraft.id}</h3>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Info Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Patient</p>
                      </div>
                      <p className="font-semibold text-sm">{viewDraft.patient}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">Doctor & Date</p>
                      </div>
                      <p className="font-semibold text-sm">{viewDraft.doctor || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {viewDraft.date}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[28px_1fr_50px_80px_90px] px-3 py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>#</span><span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
                    </div>
                    {items.map((li: any, i: number) => (
                      <div key={i} className="grid grid-cols-[28px_1fr_50px_80px_90px] px-3 py-2.5 border-t border-border items-center text-sm hover:bg-muted/30 transition-colors">
                        <span className="text-muted-foreground text-xs">{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColors[li.type] || "bg-muted text-muted-foreground"}`}>
                            {typeLabels[li.type] || li.type}
                          </span>
                          <span className="font-medium">{li.name}</span>
                        </div>
                        <span className="text-center font-medium">{li.qty}</span>
                        <span className="text-right tabular-nums text-muted-foreground">{formatPrice(li.price)}</span>
                        <span className="text-right font-bold tabular-nums">{formatPrice(li.price * li.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="ml-auto w-64 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{formatPrice(subtotal)}</span></div>
                    {discAmt > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive tabular-nums">-{formatPrice(discAmt)}</span></div>}
                    {tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="tabular-nums">{formatPrice(tax)}</span></div>}
                    <div className="border-t-2 border-primary pt-2 flex justify-between font-extrabold text-base">
                      <span>Total</span>
                      <span className="text-primary tabular-nums">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
                    <Button variant="outline" className="gap-1.5 text-xs h-9" onClick={() => { setViewDraft(null); handleEdit(viewDraft); }}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button variant="outline" className="gap-1.5 text-xs h-9" onClick={() => handlePrint(viewDraft)}>
                      <Printer className="w-3.5 h-3.5" /> Print
                    </Button>
                    <Button className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCompletePayment(viewDraft)}>
                      <CircleDollarSign className="w-3.5 h-3.5" /> Pay Now
                    </Button>
                    <Button variant="destructive" className="gap-1.5 text-xs h-9" onClick={() => { setDeleteId(viewDraft.id); setViewDraft(null); }}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>This draft invoice will be permanently removed and cannot be recovered.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DraftsPage;
