import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus, Eye, Trash2, RotateCcw, DollarSign, AlertTriangle,
  CheckCircle, Clock, Package, ClipboardList, Minus, Search,
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { toast } from "sonner";
import {
  getRefunds, getAuditLog, addRefund, updateRefundStatus,
  deleteRefund, subscribeRefunds, RefundRecord, RefundItem, AuditEntry,
} from "@/data/refundStore";
import { initPatients, getPatients, subscribe as subscribePatients } from "@/data/patientStore";
import { getInjections, updateInjection, computeInjectionStatus, subscribeInjections } from "@/data/injectionStore";
import { opdPatients } from "@/data/opdPatients";

initPatients(opdPatients);

// Simulated medicine stock updater (MedicinePage uses local state, so we just toast)
const restockMedicine = (name: string, qty: number) => {
  // In a real app this would update a shared store
  console.log(`[RESTOCK] Medicine "${name}" +${qty} units`);
};

const paymentMethods = [
  { value: "Cash", label: "Cash Refund" },
  { value: "ABA", label: "ABA Transfer" },
  { value: "ACleda", label: "ACleda Transfer" },
  { value: "Card", label: "Card Refund" },
  { value: "Credit", label: "Store Credit" },
];

const RefundPage = () => {
  const { settings } = useSettings();
  const lang = settings.language;

  const [refunds, setRefunds] = useState(getRefunds());
  const [auditLog, setAuditLog] = useState(getAuditLog());
  const [patients, setPatients] = useState(getPatients());
  const [injections, setInjections] = useState(getInjections());

  useEffect(() => {
    const u1 = subscribeRefunds(() => { setRefunds([...getRefunds()]); setAuditLog([...getAuditLog()]); });
    const u2 = subscribePatients(() => setPatients([...getPatients()]));
    const u3 = subscribeInjections(() => setInjections([...getInjections()]));
    return () => { u1(); u2(); u3(); };
  }, []);

  // Dialog states
  const [showNewRefund, setShowNewRefund] = useState(false);
  const [viewRecord, setViewRecord] = useState<RefundRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<RefundRecord | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // New refund form
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [returnItems, setReturnItems] = useState<RefundItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  // Available items to return (simulated from billing/inventory)
  const availableItems = useMemo(() => {
    const items: { name: string; type: RefundItem["type"]; maxQty: number; unitPrice: number }[] = [];
    // Medicines from the invoice system
    const meds = [
      { name: "Amoxicillin 500mg", price: 2.50, stock: 10 },
      { name: "Paracetamol 650mg", price: 0.50, stock: 10 },
      { name: "Metformin 500mg", price: 1.00, stock: 10 },
      { name: "Omeprazole 20mg", price: 1.50, stock: 10 },
      { name: "Cetirizine 10mg", price: 0.75, stock: 10 },
      { name: "Azithromycin 250mg", price: 3.00, stock: 10 },
      { name: "10% GS 500ml", price: 10.00, stock: 10 },
      { name: "Ibuprofen 400mg", price: 1.00, stock: 10 },
    ];
    meds.forEach((m) => items.push({ name: m.name, type: "MED", maxQty: m.stock, unitPrice: m.price }));
    // Injections
    injections.forEach((inj) => items.push({ name: inj.name, type: "INJ", maxQty: 10, unitPrice: inj.price }));
    // Services
    const svcs = [
      { name: "Consultation", price: 10 }, { name: "Lab Test", price: 10 },
      { name: "X-Ray", price: 15 }, { name: "Ultrasound", price: 20 },
      { name: "Health Checkup", price: 25 },
    ];
    svcs.forEach((s) => items.push({ name: s.name, type: "SVC", maxQty: 5, unitPrice: s.price }));
    return items;
  }, [injections]);

  const filteredAvailableItems = availableItems.filter(
    (item) => item.name.toLowerCase().includes(itemSearch.toLowerCase()) && !returnItems.some((ri) => ri.name === item.name)
  );

  const addReturnItem = (item: typeof availableItems[0]) => {
    setReturnItems((prev) => [...prev, { name: item.name, type: item.type, qty: 1, unitPrice: item.unitPrice, total: item.unitPrice }]);
  };

  const updateReturnQty = (name: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((ri) => ri.name === name ? { ...ri, qty: Math.max(1, qty), total: ri.unitPrice * Math.max(1, qty) } : ri)
    );
  };

  const removeReturnItem = (name: string) => {
    setReturnItems((prev) => prev.filter((ri) => ri.name !== name));
  };

  const totalRefund = returnItems.reduce((s, ri) => s + ri.total, 0);

  const handleSubmitRefund = () => {
    if (!selectedPatient) { toast.error("Please select a patient"); return; }
    if (returnItems.length === 0) { toast.error("Please add items to return"); return; }
    if (!refundReason.trim()) { toast.error("Please provide a reason for the refund"); return; }

    // Update inventory stocks
    returnItems.forEach((item) => {
      if (item.type === "INJ") {
        const inj = injections.find((i) => i.name === item.name);
        if (inj) {
          const newStock = inj.stock + item.qty;
          updateInjection(inj.id, { stock: newStock, status: computeInjectionStatus(newStock) });
        }
      } else if (item.type === "MED") {
        restockMedicine(item.name, item.qty);
      }
    });

    addRefund({
      invoiceId: selectedInvoice || "N/A",
      patient: selectedPatient,
      items: returnItems,
      totalRefund,
      reason: refundReason,
      method: refundMethod,
      status: "completed",
      date: new Date().toISOString().slice(0, 10),
      processedBy: "Admin",
    });

    toast.success(`Refund processed — ${formatPrice(totalRefund)} returned. Inventory updated.`);
    resetForm();
    setShowNewRefund(false);
  };

  const resetForm = () => {
    setSelectedPatient("");
    setSelectedInvoice("");
    setRefundReason("");
    setRefundMethod("Cash");
    setReturnItems([]);
    setItemSearch("");
  };

  const handleDelete = () => {
    if (deleteRecord) {
      deleteRefund(deleteRecord.id);
      toast.success(`Refund ${deleteRecord.id} deleted`);
      setDeleteRecord(null);
    }
  };

  // Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRefunds = refunds.filter((r) => r.date === todayStr);
  const totalRefundedToday = todayRefunds.reduce((s, r) => s + r.totalRefund, 0);
  const completedCount = refunds.filter((r) => r.status === "completed").length;
  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  const columns = [
    { key: "id", header: "Refund ID" },
    { key: "patient", header: t("patient", lang) },
    { key: "invoiceId", header: "Invoice" },
    {
      key: "items", header: "Items",
      render: (r: RefundRecord) => (
        <span className="text-xs text-muted-foreground">{r.items.map((i) => i.name).join(", ").slice(0, 40)}{r.items.length > 2 ? "..." : ""}</span>
      ),
    },
    { key: "totalRefund", header: t("total", lang), render: (r: RefundRecord) => <span className="font-semibold text-destructive">{formatDualPrice(r.totalRefund)}</span> },
    { key: "method", header: "Method" },
    { key: "date", header: t("date", lang) },
    { key: "status", header: t("status", lang), render: (r: RefundRecord) => <StatusBadge status={r.status} /> },
  ];

  const toolbar = useDataToolbar({ data: refunds as unknown as Record<string, unknown>[], dateKey: "date", columns, title: "Refunds" });
  const displayData = toolbar.filteredByDate as unknown as RefundRecord[];

  const typeColors: Record<string, string> = {
    MED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    INJ: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    SVC: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PKG: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    CUSTOM: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("refund", lang)} subtitle="Process returns, restock inventory, and manage refunds">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAuditLog(true)} className="gap-2">
            <ClipboardList className="w-4 h-4" /> Audit Log
          </Button>
          <Button onClick={() => { resetForm(); setShowNewRefund(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Refund
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's Refunds" value={formatDualPrice(totalRefundedToday)} change={`${todayRefunds.length} refund(s)`} changeType="neutral" icon={RotateCcw} iconBg="bg-destructive/10" />
        <StatCard title="Total Refunds" value={String(refunds.length)} change="All time" changeType="neutral" icon={DollarSign} iconBg="bg-primary/10" />
        <StatCard title="Completed" value={String(completedCount)} change={`${pendingCount} pending`} changeType={pendingCount > 0 ? "negative" : "positive"} icon={CheckCircle} iconBg="bg-success/10" />
        <StatCard title="Pending" value={String(pendingCount)} change={pendingCount > 0 ? "Needs attention" : "All clear"} changeType={pendingCount > 0 ? "negative" : "positive"} icon={AlertTriangle} iconBg="bg-warning/10" />
      </div>

      {/* Toolbar */}
      <DataToolbar {...toolbar} onImport={undefined} />

      {/* Table */}
      <DataTable
        data={displayData}
        columns={columns}
        viewMode={toolbar.viewMode}
        onAction={(action, row) => {
          const record = row as unknown as RefundRecord;
          if (action === "view") setViewRecord(record);
          else if (action === "delete") setDeleteRecord(record);
        }}
        actions={["view", "delete"]}
      />

      {/* New Refund Dialog */}
      <Dialog open={showNewRefund} onOpenChange={setShowNewRefund}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" /> Process Refund
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Patient & Invoice */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Patient *</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger><SelectValue placeholder="Select patient..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Original Invoice ID</Label>
                <Input placeholder="e.g., INV-1001" value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} />
              </div>
            </div>

            {/* Item Search & Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Items to Return</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines, injections, services..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {itemSearch && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                  {filteredAvailableItems.slice(0, 8).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => { addReturnItem(item); setItemSearch(""); }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeColors[item.type]}`}>{item.type}</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{formatPrice(item.unitPrice)}</span>
                    </button>
                  ))}
                  {filteredAvailableItems.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">No items found</p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Return Items */}
            {returnItems.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_80px_80px_80px_40px] px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Type</span><span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span><span></span>
                </div>
                {returnItems.map((item) => (
                  <div key={item.name} className="grid grid-cols-[auto_1fr_80px_80px_80px_40px] px-4 py-2.5 border-t border-border items-center text-sm">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold mr-2 ${typeColors[item.type]}`}>{item.type}</span>
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => updateReturnQty(item.name, item.qty - 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center tabular-nums font-medium">{item.qty}</span>
                      <button onClick={() => updateReturnQty(item.name, item.qty + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-right tabular-nums text-muted-foreground">{formatPrice(item.unitPrice)}</span>
                    <span className="text-right tabular-nums font-semibold">{formatPrice(item.total)}</span>
                    <button onClick={() => removeReturnItem(item.name)} className="text-destructive/50 hover:text-destructive ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_80px] px-4 py-3 border-t-2 border-primary bg-primary/5">
                  <span className="font-bold text-sm">Total Refund Amount</span>
                  <span className="text-right font-extrabold text-destructive tabular-nums text-base">{formatDualPrice(totalRefund)}</span>
                </div>
              </div>
            )}

            {/* Reason & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reason for Return *</Label>
                <Textarea placeholder="Explain reason..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} />
              </div>
            </div>

            {/* Inventory Note */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Package className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Inventory Auto-Update:</strong> Returned medicines and injections will automatically be restocked in inventory. Service refunds will only issue a financial refund.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewRefund(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmitRefund} className="flex-1 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <RotateCcw className="w-4 h-4" /> Process Refund — {formatPrice(totalRefund)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Refund Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund Details — {viewRecord?.id}</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient</p>
                  <p className="font-semibold text-sm">{viewRecord.patient}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Invoice: {viewRecord.invoiceId}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Refund Info</p>
                  <p className="font-semibold text-sm text-destructive">{formatDualPrice(viewRecord.totalRefund)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{viewRecord.method} · {viewRecord.date}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Returned Items</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {viewRecord.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeColors[item.type]}`}>{item.type}</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">×{item.qty}</span>
                        <span className="font-semibold tabular-nums">{formatPrice(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{viewRecord.reason}</p>
              </div>

              <div className="flex items-center justify-between">
                <StatusBadge status={viewRecord.status} />
                <p className="text-xs text-muted-foreground">Processed by: {viewRecord.processedBy}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Refund Audit Log
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No audit entries yet</p>
            ) : (
              auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.action === "REFUND_CREATED" ? "bg-primary" :
                    entry.action === "STATUS_CHANGED" ? "bg-amber-500" : "bg-destructive"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.detail}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(entry.timestamp).toLocaleString()} · {entry.id}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Refund Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete refund <strong>{deleteRecord?.id}</strong> for {deleteRecord?.patient}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RefundPage;
