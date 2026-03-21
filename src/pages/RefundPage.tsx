import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye, Trash2, RotateCcw, DollarSign, AlertTriangle,
  CheckCircle, Package, ClipboardList, Minus, Plus, Search,
  ScanBarcode, Printer, ArrowRight, Receipt, RefreshCw, ArrowLeftRight,
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { printRecordReport } from "@/lib/printUtils";
import { toast } from "sonner";
import {
  getRefunds, getAuditLog, addRefund,
  deleteRefund, subscribeRefunds, RefundRecord, RefundItem,
} from "@/data/refundStore";
import { getBillingRecords, BillingRecord, subscribeBilling } from "@/data/billingStore";
import { getInjections, updateInjection, computeInjectionStatus, subscribeInjections } from "@/data/injectionStore";
import { getMedicines, restockMedicine, deductMedicine, subscribeMedicines, Medicine } from "@/data/medicineStore";

const paymentMethods = [
  { value: "Cash", label: "Cash Refund" },
  { value: "ABA", label: "ABA Transfer" },
  { value: "ACleda", label: "ACleda Transfer" },
  { value: "Card", label: "Card Refund" },
  { value: "Credit", label: "Store Credit" },
];

const typeColors: Record<string, string> = {
  MED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INJ: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SVC: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PKG: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CUSTOM: "bg-muted text-muted-foreground",
};

interface RefundableItem {
  name: string;
  type: RefundItem["type"];
  qty: number;
  unitPrice: number;
  selected: boolean;
  refundQty: number;
}

interface ReplacementItem {
  medicineId: string;
  name: string;
  qty: number;
  unitPrice: number;
  available: number;
}

type RefundMode = "money" | "replace" | null;

const RefundPage = () => {
  const { settings } = useSettings();
  const lang = settings.language;

  const [refunds, setRefunds] = useState(getRefunds());
  const [auditLog, setAuditLog] = useState(getAuditLog());
  const [billingRecords, setBillingRecords] = useState(getBillingRecords());
  const [injections, setInjections] = useState(getInjections());
  const [medicines, setMedicines] = useState(getMedicines());

  useEffect(() => {
    const u1 = subscribeRefunds(() => { setRefunds([...getRefunds()]); setAuditLog([...getAuditLog()]); });
    const u2 = subscribeBilling(() => setBillingRecords([...getBillingRecords()]));
    const u3 = subscribeInjections(() => setInjections([...getInjections()]));
    const u4 = subscribeMedicines(() => setMedicines([...getMedicines()]));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [foundInvoice, setFoundInvoice] = useState<BillingRecord | null>(null);
  const [searchError, setSearchError] = useState("");

  // Refund process state
  const [refundableItems, setRefundableItems] = useState<RefundableItem[]>([]);
  const [refundMode, setRefundMode] = useState<RefundMode>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");

  // Replacement state
  const [replacements, setReplacements] = useState<ReplacementItem[]>([]);
  const [showMedicinePicker, setShowMedicinePicker] = useState(false);

  // Dialog states
  const [viewRecord, setViewRecord] = useState<RefundRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<RefundRecord | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Search invoice
  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) { setSearchError("Please enter an Invoice ID or Patient Name"); return; }
    setSearchError("");

    const found = billingRecords.find(
      (r) => r.id.toUpperCase() === q.toUpperCase() || r.patient.toLowerCase().includes(q.toLowerCase())
    );

    if (found) {
      setFoundInvoice(found);
      const items: RefundableItem[] = [];
      if (found.formData?.lineItems) {
        found.formData.lineItems.forEach((li) => {
          items.push({
            name: li.name, type: li.type as RefundItem["type"],
            qty: li.qty, unitPrice: li.price, selected: false, refundQty: li.qty,
          });
        });
      }
      setRefundableItems(items);
      setRefundMode(null);
      setReplacements([]);
    } else {
      setFoundInvoice(null);
      setRefundableItems([]);
      setSearchError(`No invoice found for "${searchQuery}"`);
    }
  };

  const handleScan = () => {
    toast.info("Scanner activated — scan an invoice barcode");
    if (billingRecords.length > 0) {
      const inv = billingRecords[Math.floor(Math.random() * billingRecords.length)];
      setSearchQuery(inv.id);
      setTimeout(() => {
        setFoundInvoice(inv);
        const items: RefundableItem[] = (inv.formData?.lineItems || []).map((li) => ({
          name: li.name, type: li.type as RefundItem["type"],
          qty: li.qty, unitPrice: li.price, selected: false, refundQty: li.qty,
        }));
        setRefundableItems(items);
        setRefundMode(null);
        setReplacements([]);
        toast.success(`Scanned: ${inv.id}`);
      }, 500);
    }
  };

  const toggleItemSelect = (name: string) => {
    setRefundableItems((prev) => prev.map((i) => i.name === name ? { ...i, selected: !i.selected } : i));
  };

  const updateRefundQty = (name: string, qty: number) => {
    setRefundableItems((prev) => prev.map((i) => i.name === name ? { ...i, refundQty: Math.max(1, Math.min(qty, i.qty)) } : i));
  };

  const selectedItems = refundableItems.filter((i) => i.selected);
  const totalReturnValue = selectedItems.reduce((s, i) => s + i.unitPrice * i.refundQty, 0);
  const totalReplacementValue = replacements.reduce((s, r) => s + r.unitPrice * r.qty, 0);
  const balanceDiff = totalReturnValue - totalReplacementValue;

  // Add replacement medicine
  const addReplacement = (med: Medicine) => {
    if (replacements.find((r) => r.medicineId === med.id)) {
      setReplacements((prev) => prev.map((r) => r.medicineId === med.id ? { ...r, qty: Math.min(r.qty + 1, med.stock) } : r));
    } else {
      setReplacements((prev) => [...prev, { medicineId: med.id, name: med.name, qty: 1, unitPrice: med.price, available: med.stock }]);
    }
    setShowMedicinePicker(false);
  };

  const updateReplacementQty = (medId: string, qty: number) => {
    setReplacements((prev) => prev.map((r) => r.medicineId === medId ? { ...r, qty: Math.max(1, Math.min(qty, r.available)) } : r));
  };

  const removeReplacement = (medId: string) => {
    setReplacements((prev) => prev.filter((r) => r.medicineId !== medId));
  };

  const handleProcessRefund = () => {
    if (selectedItems.length === 0) { toast.error("Please select items to return"); return; }
    if (!refundMode) { toast.error("Please choose Refund Money or Replace Medicine"); return; }
    if (!refundReason.trim()) { toast.error("Please provide a reason"); return; }
    if (refundMode === "replace" && replacements.length === 0) { toast.error("Please select replacement medicines"); return; }

    // 1. Restock returned items into inventory
    selectedItems.forEach((item) => {
      if (item.type === "INJ") {
        const inj = injections.find((i) => i.name === item.name);
        if (inj) updateInjection(inj.id, { stock: inj.stock + item.refundQty, status: computeInjectionStatus(inj.stock + item.refundQty) });
      } else if (item.type === "MED") {
        restockMedicine(item.name, item.refundQty);
      }
    });

    // 2. If replacing, deduct replacement medicines from inventory
    if (refundMode === "replace") {
      replacements.forEach((r) => {
        const ok = deductMedicine(r.name, r.qty);
        if (!ok) toast.warning(`Could not deduct ${r.name} — insufficient stock`);
      });
    }

    const refundItems: RefundItem[] = selectedItems.map((i) => ({
      name: i.name, type: i.type, qty: i.refundQty, unitPrice: i.unitPrice, total: i.unitPrice * i.refundQty,
    }));

    const refundAmount = refundMode === "money" ? totalReturnValue : Math.max(0, balanceDiff);
    const methodLabel = refundMode === "replace"
      ? `Replace (${replacements.map((r) => `${r.name} x${r.qty}`).join(", ")})${balanceDiff > 0 ? ` + ${refundMethod} ${formatPrice(balanceDiff)}` : ""}`
      : refundMethod;

    addRefund({
      invoiceId: foundInvoice?.id || "N/A",
      patient: foundInvoice?.patient || "Unknown",
      items: refundItems,
      totalRefund: refundAmount,
      reason: refundReason,
      method: methodLabel,
      status: "completed",
      date: new Date().toISOString().slice(0, 10),
      processedBy: "Admin",
    });

    if (refundMode === "money") {
      toast.success(`Refund of ${formatPrice(totalReturnValue)} processed. Inventory updated.`);
    } else {
      toast.success(`Medicine replaced successfully.${balanceDiff > 0 ? ` Balance ${formatPrice(balanceDiff)} refunded via ${refundMethod}.` : ""} Inventory updated.`);
    }
    resetAll();
  };

  const resetAll = () => {
    setSearchQuery(""); setFoundInvoice(null); setRefundableItems([]);
    setRefundReason(""); setRefundMethod("Cash"); setRefundMode(null);
    setReplacements([]); setSearchError("");
  };

  const handleDelete = () => {
    if (deleteRecord) { deleteRefund(deleteRecord.id); toast.success(`Refund ${deleteRecord.id} deleted`); setDeleteRecord(null); }
  };

  // Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRefunds = refunds.filter((r) => r.date === todayStr);
  const totalRefundedToday = todayRefunds.reduce((s, r) => s + r.totalRefund, 0);
  const completedCount = refunds.filter((r) => r.status === "completed").length;
  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  const columns = [
    { key: "id", header: "Refund ID" },
    { key: "invoiceId", header: "Invoice" },
    { key: "patient", header: t("patient", lang) },
    {
      key: "items", header: "Returned Items",
      render: (r: RefundRecord) => (
        <div className="flex flex-wrap gap-1">
          {r.items.slice(0, 2).map((i, idx) => (
            <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[i.type]}`}>{i.name}</span>
          ))}
          {r.items.length > 2 && <Badge variant="secondary" className="text-[10px]">+{r.items.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: "totalRefund", header: "Amount",
      render: (r: RefundRecord) => <span className="font-semibold text-destructive tabular-nums">{formatDualPrice(r.totalRefund)}</span>,
    },
    {
      key: "method", header: "Type",
      render: (r: RefundRecord) => (
        <Badge variant="outline" className={`text-[10px] ${r.method.startsWith("Replace") ? "border-emerald-300 text-emerald-700 dark:text-emerald-400" : "border-amber-300 text-amber-700 dark:text-amber-400"}`}>
          {r.method.startsWith("Replace") ? "🔄 Replace" : `💰 ${r.method}`}
        </Badge>
      ),
    },
    { key: "date", header: t("date", lang) },
    { key: "status", header: t("status", lang), render: (r: RefundRecord) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: t("actions", lang),
      render: (r: RefundRecord) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" onClick={() => setViewRecord(r)}><Eye className="w-3.5 h-3.5 text-info" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={() => printRecordReport({
            id: r.id, sectionTitle: "Refund Report", fields: [
              { label: "Patient", value: r.patient }, { label: "Invoice", value: r.invoiceId },
              { label: "Items", value: r.items.map(i => `${i.name} x${i.qty}`).join(", ") },
              { label: "Total Refund", value: formatDualPrice(r.totalRefund) }, { label: "Method", value: r.method },
              { label: "Reason", value: r.reason }, { label: "Date", value: r.date },
            ],
          })}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => setDeleteRecord(r)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({ data: refunds as unknown as Record<string, unknown>[], dateKey: "date", columns, title: "Refunds" });
  const displayData = toolbar.filteredByDate as unknown as RefundRecord[];

  const availableMedicines = medicines.filter((m) => m.stock > 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("refund", lang)} description="Return items, refund money, or replace medicine — inventory auto-adjusts">
        <Button variant="outline" onClick={() => setShowAuditLog(true)} className="gap-2">
          <ClipboardList className="w-4 h-4" /> Audit Log
        </Button>
      </PageHeader>

      {/* ===== STEP 1: SEARCH ===== */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-heading">Step 1: Find Invoice</h2>
            <p className="text-xs text-muted-foreground">Search by Bill No, Patient Name, or scan barcode</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter Invoice ID (e.g. BIL-001) or Patient Name..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="pl-9 h-11 text-sm"
            />
          </div>
          <Button onClick={handleSearch} className="h-11 px-6 gap-2"><Search className="w-4 h-4" /> Search</Button>
          <Button variant="outline" onClick={handleScan} className="h-11 px-6 gap-2"><ScanBarcode className="w-4 h-4" /> Scan</Button>
        </div>

        {searchError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{searchError}</p>
          </div>
        )}

        {/* ===== STEP 2: INVOICE FOUND ===== */}
        {foundInvoice && (
          <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{foundInvoice.id}</h3>
                  <p className="text-xs text-muted-foreground">Invoice found — select items to return</p>
                </div>
              </div>
              <StatusBadge status={foundInvoice.status} />
            </div>

            {/* Invoice summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Patient", foundInvoice.patient, ""],
                ["Total", formatDualPrice(foundInvoice.total), ""],
                ["Paid", formatDualPrice(foundInvoice.paid), "text-emerald-600"],
                ["Due", formatDualPrice(foundInvoice.due), foundInvoice.due > 0 ? "text-destructive" : "text-muted-foreground"],
              ].map(([label, value, color]) => (
                <div key={label} className="bg-card border border-border rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Step 2: Select items */}
            {refundableItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-700">2</div>
                  <p className="text-sm font-semibold text-foreground">Select Items to Return</p>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[40px_60px_1fr_70px_80px_80px_100px] px-4 py-2.5 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span></span><span>Type</span><span>Item</span><span className="text-center">Qty</span>
                    <span className="text-right">Price</span><span className="text-right">Total</span><span className="text-center">Return Qty</span>
                  </div>
                  {refundableItems.map((item) => (
                    <div key={item.name} className={`grid grid-cols-[40px_60px_1fr_70px_80px_80px_100px] px-4 py-3 border-t border-border items-center text-sm transition-colors ${item.selected ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                      <Checkbox checked={item.selected} onCheckedChange={() => toggleItemSelect(item.name)} />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit ${typeColors[item.type]}`}>{item.type}</span>
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="text-center text-muted-foreground tabular-nums">{item.qty}</span>
                      <span className="text-right text-muted-foreground tabular-nums">{formatPrice(item.unitPrice)}</span>
                      <span className="text-right font-semibold tabular-nums">{formatPrice(item.unitPrice * item.qty)}</span>
                      <div className="flex items-center justify-center gap-1">
                        {item.selected ? (
                          <>
                            <button onClick={() => updateRefundQty(item.name, item.refundQty - 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20"><Minus className="w-3 h-3" /></button>
                            <span className="w-6 text-center tabular-nums font-medium text-xs">{item.refundQty}</span>
                            <button onClick={() => updateRefundQty(item.name, item.refundQty + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20"><Plus className="w-3 h-3" /></button>
                          </>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Choose action */}
            {selectedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-700">3</div>
                  <p className="text-sm font-semibold text-foreground">Choose Action — What does the patient want?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Refund Money */}
                  <button
                    onClick={() => { setRefundMode("money"); setReplacements([]); }}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                      refundMode === "money"
                        ? "border-destructive bg-destructive/5 shadow-lg shadow-destructive/10"
                        : "border-border hover:border-destructive/40 hover:bg-destructive/5"
                    }`}
                  >
                    {refundMode === "money" && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"><CheckCircle className="w-3 h-3 text-destructive-foreground" /></div>}
                    <DollarSign className="w-8 h-8 text-destructive mb-2" />
                    <h4 className="font-bold text-foreground">Refund Money</h4>
                    <p className="text-xs text-muted-foreground mt-1">Return items & get cash/card refund. Items go back to inventory.</p>
                    <p className="text-lg font-extrabold text-destructive mt-2 tabular-nums">{formatDualPrice(totalReturnValue)}</p>
                  </button>

                  {/* Replace Medicine */}
                  <button
                    onClick={() => setRefundMode("replace")}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                      refundMode === "replace"
                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                        : "border-border hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    }`}
                  >
                    {refundMode === "replace" && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                    <ArrowLeftRight className="w-8 h-8 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-foreground">Replace Medicine</h4>
                    <p className="text-xs text-muted-foreground mt-1">Swap returned items for different medicines. Balance auto-calculated.</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-2 tabular-nums">Exchange</p>
                  </button>
                </div>

                {/* Replace Medicine — Picker */}
                {refundMode === "replace" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Select Replacement Medicine(s)</p>
                      <Button size="sm" variant="outline" onClick={() => setShowMedicinePicker(true)} className="gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400">
                        <Plus className="w-3 h-3" /> Add Medicine
                      </Button>
                    </div>

                    {replacements.length > 0 ? (
                      <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1fr_80px_80px_80px_40px] px-3 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          <span>Medicine</span><span className="text-center">Stock</span><span className="text-center">Qty</span><span className="text-right">Price</span><span></span>
                        </div>
                        {replacements.map((r) => (
                          <div key={r.medicineId} className="grid grid-cols-[1fr_80px_80px_80px_40px] px-3 py-2.5 border-t border-emerald-200 dark:border-emerald-800 items-center text-sm">
                            <span className="font-medium">{r.name}</span>
                            <span className="text-center text-muted-foreground tabular-nums">{r.available}</span>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => updateReplacementQty(r.medicineId, r.qty - 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                              <span className="w-6 text-center tabular-nums font-medium text-xs">{r.qty}</span>
                              <button onClick={() => updateReplacementQty(r.medicineId, r.qty + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                            </div>
                            <span className="text-right tabular-nums font-semibold">{formatPrice(r.unitPrice * r.qty)}</span>
                            <button onClick={() => removeReplacement(r.medicineId)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-600/60 text-center py-4">Click "Add Medicine" to select replacement items</p>
                    )}

                    {/* Balance calculation */}
                    {replacements.length > 0 && (
                      <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Returned items value</span>
                          <span className="font-semibold tabular-nums">{formatPrice(totalReturnValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Replacement items value</span>
                          <span className="font-semibold tabular-nums">{formatPrice(totalReplacementValue)}</span>
                        </div>
                        <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold">
                          <span>{balanceDiff > 0 ? "Refund to patient" : balanceDiff < 0 ? "Patient pays extra" : "Even exchange"}</span>
                          <span className={`tabular-nums ${balanceDiff > 0 ? "text-destructive" : balanceDiff < 0 ? "text-emerald-600" : "text-foreground"}`}>
                            {balanceDiff === 0 ? formatPrice(0) : formatPrice(Math.abs(balanceDiff))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Refund Summary & Process */}
                {refundMode && (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {refundMode === "money" || (refundMode === "replace" && balanceDiff > 0) ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Refund Method</Label>
                          <Select value={refundMethod} onValueChange={setRefundMethod}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ) : <div />}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Reason for Return *</Label>
                        <Textarea placeholder="Why is the patient returning?" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} />
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Inventory Auto-Update:</strong> Returned items will be restocked.{" "}
                        {refundMode === "replace" ? "Replacement medicines will be deducted from inventory." : "Financial refund will be issued."}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={resetAll} className="flex-1">Cancel</Button>
                      <Button
                        onClick={handleProcessRefund}
                        className={`flex-1 gap-2 ${refundMode === "money" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                      >
                        {refundMode === "money" ? (
                          <><RotateCcw className="w-4 h-4" /> Refund {formatPrice(totalReturnValue)}</>
                        ) : (
                          <><ArrowLeftRight className="w-4 h-4" /> Process Exchange{balanceDiff > 0 ? ` + ${formatPrice(balanceDiff)} refund` : ""}</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== REFUND HISTORY ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><ClipboardList className="w-4 h-4 text-accent-foreground" /></div>
          <h2 className="text-lg font-bold text-foreground font-heading">Refund & Exchange History</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Today's Refunds" value={formatDualPrice(totalRefundedToday)} change={`${todayRefunds.length} refund(s)`} changeType="neutral" icon={RotateCcw} iconBg="bg-destructive/10" />
          <StatCard title="Total Records" value={String(refunds.length)} change="All time" changeType="neutral" icon={DollarSign} iconBg="bg-primary/10" />
          <StatCard title="Completed" value={String(completedCount)} change={`${pendingCount} pending`} changeType={pendingCount > 0 ? "negative" : "positive"} icon={CheckCircle} iconBg="bg-accent/50" />
          <StatCard title="Pending" value={String(pendingCount)} change={pendingCount > 0 ? "Needs attention" : "All clear"} changeType={pendingCount > 0 ? "negative" : "positive"} icon={AlertTriangle} iconBg="bg-destructive/10" />
        </div>

        <DataToolbar
          dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter}
          viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode}
          onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF}
          onImport={() => {}} onDownloadSample={toolbar.handleDownloadSample}
        />

        {toolbar.viewMode === "list" ? (
          <DataTable data={displayData} columns={columns} keyExtractor={(r) => (r as RefundRecord).id} />
        ) : (
          <DataGridView data={displayData} columns={columns} keyExtractor={(r) => (r as RefundRecord).id} />
        )}
      </div>

      {/* Medicine Picker Dialog */}
      <Dialog open={showMedicinePicker} onOpenChange={setShowMedicinePicker}>
        <DialogContent className="max-w-lg max-h-[70vh]">
          <DialogHeader><DialogTitle>Select Replacement Medicine</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {availableMedicines.map((med) => (
              <button
                key={med.id}
                onClick={() => addReplacement(med)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.category} · {med.stock} {med.unit} available</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm tabular-nums">{formatPrice(med.price)}</p>
                  <p className="text-[10px] text-muted-foreground">per {med.unit.slice(0, -1) || "unit"}</p>
                </div>
              </button>
            ))}
            {availableMedicines.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No medicines in stock</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Refund Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" /> Refund Details — {viewRecord?.id}
            </DialogTitle>
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
                  <p className="text-xs text-muted-foreground mt-0.5">{viewRecord.date}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Method / Type</p>
                <p className="font-medium text-sm">{viewRecord.method}</p>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewRecord) printRecordReport({
              id: viewRecord.id, sectionTitle: "Refund Report", fields: [
                { label: "Patient", value: viewRecord.patient }, { label: "Invoice", value: viewRecord.invoiceId },
                { label: "Items", value: viewRecord.items.map(i => `${i.name} x${i.qty}`).join(", ") },
                { label: "Total", value: formatDualPrice(viewRecord.totalRefund) }, { label: "Method", value: viewRecord.method },
                { label: "Reason", value: viewRecord.reason }, { label: "Date", value: viewRecord.date },
              ],
            }); }}><Printer className="w-4 h-4 mr-1" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Refund Audit Log</DialogTitle></DialogHeader>
          <div className="space-y-1">
            {auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No audit entries yet</p>
            ) : auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${entry.action === "REFUND_CREATED" ? "bg-primary" : entry.action === "STATUS_CHANGED" ? "bg-amber-500" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{entry.detail}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(entry.timestamp).toLocaleString()} · {entry.id}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Refund Record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete refund <strong>{deleteRecord?.id}</strong>. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RefundPage;
