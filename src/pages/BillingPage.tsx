import { useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import NewInvoiceDialog, { InvoiceFormData } from "@/components/NewInvoiceDialog";
import { toast } from "sonner";
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
  formData?: InvoiceFormData; // stored for edit
}

const initialData: BillingRecord[] = [
  { id: "BIL-001", patient: "Sarah Johnson", service: "Lab Test + Consultation", amount: 350, discount: 20, tax: 16.5, total: 346.5, paid: 346.5, due: 0, date: "2026-03-19", status: "completed", method: "Cash" },
  { id: "BIL-002", patient: "Michael Chen", service: "X-Ray", amount: 200, discount: 0, tax: 10, total: 210, paid: 100, due: 110, date: "2026-03-18", status: "pending", method: "Card" },
  { id: "BIL-003", patient: "Emily Davis", service: "Ultrasound + Injection", amount: 480, discount: 30, tax: 22.5, total: 472.5, paid: 0, due: 472.5, date: "2026-03-17", status: "critical", method: "—" },
  { id: "BIL-004", patient: "James Wilson", service: "Health Checkup", amount: 150, discount: 0, tax: 7.5, total: 157.5, paid: 157.5, due: 0, date: "2026-03-16", status: "completed", method: "Cash" },
  { id: "BIL-005", patient: "Rina Akter", service: "Prescription + Medicine", amount: 90, discount: 10, tax: 4, total: 84, paid: 50, due: 34, date: "2026-03-15", status: "pending", method: "Mobile Pay" },
];

const BillingPage = () => {
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();
  const [billingData, setBillingData] = useState<BillingRecord[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BillingRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<BillingRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<BillingRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

    return {
      id, patient: data.patient, service: serviceNames,
      amount: subtotal, discount: discountAmt, tax: taxAmt,
      total, paid: data.paidAmount, due,
      date: data.date, status, method: data.paymentMethod,
      formData: data,
    };
  };

  const handleSubmit = (data: InvoiceFormData, action: "draft" | "print" | "payment") => {
    if (editRecord) {
      // Update existing record
      const updated = buildRecord(data, editRecord.id);
      setBillingData((prev) => prev.map((r) => r.id === editRecord.id ? updated : r));
      setDialogOpen(false);
      setEditRecord(null);
      toast.success(`Invoice ${editRecord.id} updated`);
    } else {
      // Create new
      const prefix = appSettings.invoicePrefix || "BIL";
      const nextNum = parseInt(appSettings.nextInvoiceNumber) || billingData.length + 1;
      const id = `${prefix}-${String(nextNum).padStart(3, "0")}`;
      const record = buildRecord(data, id);
      setBillingData((prev) => [record, ...prev]);
      setDialogOpen(false);

      if (action === "draft") toast.success(`Invoice ${id} saved as draft`);
      else if (action === "print") toast.success(`Invoice ${id} created — printing...`);
      else toast.success(`Payment received for ${id}`);
    }
  };

  const handleEdit = (record: BillingRecord) => {
    setEditRecord(record);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteRecord) {
      setBillingData((prev) => prev.filter((r) => r.id !== deleteRecord.id));
      toast.success(`Invoice ${deleteRecord.id} deleted`);
      setDeleteRecord(null);
    }
  };

  const handlePrint = (record: BillingRecord) => {
    setViewRecord(record);
    setTimeout(() => window.print(), 300);
  };

  const columns = [
    { key: "id" as const, header: "Invoice" },
    { key: "patient" as const, header: t("patient", lang) },
    { key: "service" as const, header: "Service" },
    { key: "total" as const, header: t("total", lang), render: (d: BillingRecord) => <span className="font-semibold">{formatDualPrice(d.total)}</span> },
    { key: "paid" as const, header: "Paid", render: (d: BillingRecord) => formatDualPrice(d.paid) },
    { key: "due" as const, header: "Due", render: (d: BillingRecord) => <span className={d.due > 0 ? "text-destructive font-medium" : ""}>{formatDualPrice(d.due)}</span> },
    { key: "date" as const, header: t("date", lang) },
    { key: "status" as const, header: t("status", lang), render: (d: BillingRecord) => <StatusBadge status={d.status} /> },
    {
      key: "actions" as const, header: "Actions", render: (d: BillingRecord) => (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewRecord(d)}>
                  <Eye className="w-4 h-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(d)}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePrint(d)}>
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteRecord(d)}>
                  <Trash2 className="w-4 h-4 text-destructive/70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing", lang)} description="Create invoices, track payments and manage billing records">
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={billingData} keyExtractor={(d) => d.id} />
      <NewInvoiceDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditRecord(null); }}
        onSubmit={handleSubmit}
        editData={editRecord?.formData || null}
      />

      {/* View Invoice Dialog */}
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
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="w-8">#</span>
                    <span>Description</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {viewRecord.service.split(" + ").map((svc, i) => (
                    <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 border-t border-border items-center text-sm">
                      <span className="w-8 text-muted-foreground">{i + 1}</span>
                      <span className="font-medium text-foreground">{svc}</span>
                      <span className="text-right tabular-nums">—</span>
                    </div>
                  ))}
                </div>

                <div className="ml-auto w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatPrice(viewRecord.amount)}</span>
                  </div>
                  {viewRecord.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-destructive tabular-nums">-{formatPrice(viewRecord.discount)}</span>
                    </div>
                  )}
                  {viewRecord.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="tabular-nums">{formatPrice(viewRecord.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                    <span>Grand Total</span>
                    <span className="text-primary tabular-nums">{formatPrice(viewRecord.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="tabular-nums">{formatPrice(viewRecord.paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Due</span>
                    <span className={`tabular-nums ${viewRecord.due > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatPrice(viewRecord.due)}</span>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
                  Thank you for choosing {appSettings.clinicName}. Get well soon!
                </p>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <Button variant="outline" onClick={() => setViewRecord(null)} className="flex-1">Close</Button>
                <Button onClick={() => window.print()} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                  <Printer className="w-4 h-4" /> Print Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <span className="font-semibold">{deleteRecord?.id}</span> for <span className="font-semibold">{deleteRecord?.patient}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BillingPage;
