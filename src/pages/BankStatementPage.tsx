import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DollarSign, TrendingUp, Banknote, Building2, Landmark,
  CreditCard, Smartphone, Coins, Send, Shield, Search,
  ArrowLeft, Download, Plus, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import { getBillingRecords, subscribeBilling, type BillingRecord } from "@/data/billingStore";
import { formatPrice, formatDualPrice, convertToSecondary, getCurrencySymbol } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { getSettings } from "@/data/settingsStore";
import { DatePreset, filterByDate } from "@/lib/dateFilters";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";

const paymentMeta: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Cash:             { color: "hsl(142, 71%, 45%)", bg: "hsl(142, 71%, 96%)", icon: Banknote },
  ABA:              { color: "hsl(217, 91%, 60%)", bg: "hsl(217, 91%, 96%)", icon: Building2 },
  ACleda:           { color: "hsl(38, 92%, 50%)",  bg: "hsl(38, 92%, 96%)",  icon: Landmark },
  Card:             { color: "hsl(270, 60%, 55%)", bg: "hsl(270, 60%, 96%)", icon: CreditCard },
  Wing:             { color: "hsl(195, 80%, 45%)", bg: "hsl(195, 80%, 96%)", icon: Smartphone },
  "Binance(USDT)":  { color: "hsl(45, 90%, 48%)",  bg: "hsl(45, 90%, 96%)",  icon: Coins },
  "True Money":     { color: "hsl(15, 85%, 52%)",  bg: "hsl(15, 85%, 96%)",  icon: Smartphone },
  "Bank Transfer":  { color: "hsl(200, 50%, 40%)", bg: "hsl(200, 50%, 96%)", icon: Send },
  Insurance:        { color: "hsl(340, 60%, 50%)", bg: "hsl(340, 60%, 96%)", icon: Shield },
  Due:              { color: "hsl(45, 90%, 48%)",  bg: "hsl(45, 90%, 96%)",  icon: DollarSign },
};

const allMethods = ["ABA", "ACleda", "Cash", "Due", "Card", "Wing", "Binance(USDT)", "True Money", "Bank Transfer", "Insurance"];

const datePresets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "all", label: "All Time" },
];

interface ManualEntry {
  method: string;
  amount: number;
  note: string;
  date: string;
  type: "credit" | "debit";
}

const BankStatementPage = () => {
  const { settings } = useSettings();
  const appSettings = getSettings();
  const [billing, setBilling] = useState<BillingRecord[]>(getBillingRecords());
  const [dateFilter, setDateFilter] = useState<DatePreset>("today");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState<ManualEntry>({ method: "Cash", amount: 0, note: "", date: new Date().toISOString().slice(0, 10), type: "credit" });

  useEffect(() => { const u = subscribeBilling(() => setBilling([...getBillingRecords()])); return u; }, []);

  const filtered = useMemo(() => filterByDate(billing, "date", dateFilter), [billing, dateFilter]);

  // Compute per-method stats
  const methodStats = useMemo(() => {
    return allMethods.map((method) => {
      // For split payments, check individual splits; for simple, check method field
      const matching = filtered.filter((r) => {
        if (r.formData?.splitPayments && r.formData.splitPayments.length > 0) {
          return r.formData.splitPayments.some(sp => sp.method === method && sp.amount > 0);
        }
        return r.method === method;
      });

      const totalAmount = matching.reduce((sum, r) => {
        if (r.formData?.splitPayments && r.formData.splitPayments.length > 0) {
          const sp = r.formData.splitPayments.find(sp => sp.method === method);
          return sum + (sp?.amount || 0);
        }
        return sum + r.paid;
      }, 0);

      // Add manual entries
      const manualTotal = manualEntries
        .filter(e => e.method === method)
        .reduce((s, e) => s + (e.type === "credit" ? e.amount : -e.amount), 0);

      return { method, total: totalAmount + manualTotal, count: matching.length };
    });
  }, [filtered, manualEntries]);

  const totalRevenue = useMemo(() => filtered.reduce((s, r) => s + r.paid, 0), [filtered]);
  const totalTransactions = useMemo(() => filtered.filter(r => r.paid > 0).length, [filtered]);
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Transaction list for selected method
  const selectedTransactions = useMemo(() => {
    if (!selectedMethod) return [];
    return filtered.filter((r) => {
      if (r.formData?.splitPayments && r.formData.splitPayments.length > 0) {
        return r.formData.splitPayments.some(sp => sp.method === selectedMethod && sp.amount > 0);
      }
      return r.method === selectedMethod;
    });
  }, [filtered, selectedMethod]);

  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return selectedTransactions;
    const q = searchQuery.toLowerCase();
    return selectedTransactions.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.patient.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q)
    );
  }, [selectedTransactions, searchQuery]);

  const getMethodAmount = (record: BillingRecord, method: string) => {
    if (record.formData?.splitPayments && record.formData.splitPayments.length > 0) {
      return record.formData.splitPayments.find(sp => sp.method === method)?.amount || 0;
    }
    return record.paid;
  };

  const handleAddManual = () => {
    if (newEntry.amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    setManualEntries(prev => [...prev, { ...newEntry }]);
    toast.success(`Manual ${newEntry.type} of ${formatPrice(newEntry.amount)} added to ${newEntry.method}`);
    setShowAddDialog(false);
    setNewEntry({ method: "Cash", amount: 0, note: "", date: new Date().toISOString().slice(0, 10), type: "credit" });
  };

  const handleExport = () => {
    const data = (selectedMethod ? searchedTransactions : filtered).map(r => ({
      Invoice: r.id, Patient: r.patient, Date: r.date, Amount: r.total, Paid: r.paid, Due: r.due, Method: r.method,
    }));
    const cols = [
      { key: "Invoice", header: "Invoice" }, { key: "Patient", header: "Patient" },
      { key: "Date", header: "Date" }, { key: "Amount", header: "Amount" },
      { key: "Paid", header: "Paid" }, { key: "Due", header: "Due" }, { key: "Method", header: "Method" },
    ];
    exportToExcel(data, cols, `Bank_Statement_${dateFilter}`);
    toast.success("Statement exported");
  };

  const txColumns = [
    { key: "id", header: "Invoice", render: (d: BillingRecord) => <span className="font-mono font-semibold text-sm">{d.id}</span> },
    { key: "patient", header: "Patient", render: (d: BillingRecord) => <span className="font-medium">{d.patient}</span> },
    { key: "date", header: "Date", render: (d: BillingRecord) => <span className="text-muted-foreground text-sm">{d.date}</span> },
    { key: "service", header: "Service", render: (d: BillingRecord) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{d.service}</span> },
    { key: "amount", header: "Amount", render: (d: BillingRecord) => (
      <span className="font-semibold tabular-nums">{formatPrice(selectedMethod ? getMethodAmount(d, selectedMethod) : d.paid)}</span>
    )},
    { key: "status", header: "Status", render: (d: BillingRecord) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        d.due <= 0
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      }`}>
        {d.due <= 0 ? "Paid" : "Partial"}
      </span>
    )},
  ];

  const secondarySymbol = appSettings.dualCurrencyEnabled ? getCurrencySymbol(appSettings.secondaryCurrency) : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Statement" description="Payment dashboard and sales breakdown by payment method">
        <Button onClick={() => setShowAddDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Manual Amount</Button>
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> Export Statement</Button>
      </PageHeader>

      {/* Date Filter */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Filter by Date Range</h3>
        <div className="w-64">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Date Range</Label>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DatePreset)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {datePresets.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-6" style={{ background: "linear-gradient(135deg, hsl(217, 91%, 97%), hsl(217, 91%, 93%))" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-black text-foreground mt-1">{formatPrice(totalRevenue)}</p>
              {appSettings.dualCurrencyEnabled && (
                <p className="text-sm text-muted-foreground mt-0.5">{secondarySymbol}{convertToSecondary(totalRevenue).toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">{totalTransactions} completed transactions</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(217, 91%, 60%)" }}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-6" style={{ background: "linear-gradient(135deg, hsl(160, 84%, 97%), hsl(160, 84%, 93%))" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Transactions</p>
              <p className="text-3xl font-black text-foreground mt-1">{totalTransactions}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Completed orders</p>
              <p className="text-xs text-muted-foreground mt-2">Avg. {formatPrice(Math.round(avgTransaction * 100) / 100)} per transaction</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(160, 84%, 39%)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dashboard */}
      <div>
        <h3 className="text-lg font-bold text-foreground">Payment Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-4">Sales breakdown by payment method</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {methodStats.map(({ method, total, count }) => {
            const meta = paymentMeta[method] || paymentMeta.Cash;
            const Icon = meta.icon;
            const isActive = selectedMethod === method;
            return (
              <button
                key={method}
                onClick={() => { setSelectedMethod(isActive ? null : method); setSearchQuery(""); }}
                className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  isActive ? "ring-2 ring-offset-2 ring-primary shadow-lg scale-[1.02]" : ""
                }`}
                style={{
                  borderColor: meta.color,
                  background: meta.bg,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-foreground">{method}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                </div>
                <p className="text-xl font-black tabular-nums" style={{ color: meta.color }}>{formatPrice(total)}</p>
                {appSettings.dualCurrencyEnabled && (
                  <p className="text-xs text-muted-foreground mt-0.5">{secondarySymbol}{convertToSecondary(total).toLocaleString()}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">{count} transaction{count !== 1 ? "s" : ""}</p>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: meta.color }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      {selectedMethod && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Transaction History — {selectedMethod}</h3>
              <p className="text-sm text-muted-foreground">All transactions using this payment method</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoice, patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedMethod(null); setSearchQuery(""); }} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Button>
            </div>
          </div>
          <div className="p-4">
            {searchedTransactions.length > 0 ? (
              <DataTable columns={txColumns} data={searchedTransactions} keyExtractor={(d) => d.id} />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">No transactions found for this payment method</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Manual Amount Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Type</Label>
                <Select value={newEntry.type} onValueChange={(v) => setNewEntry(p => ({ ...p, type: v as "credit" | "debit" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit"><span className="flex items-center gap-1.5"><ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Credit</span></SelectItem>
                    <SelectItem value="debit"><span className="flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5 text-destructive" /> Debit</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Payment Method</Label>
                <Select value={newEntry.method} onValueChange={(v) => setNewEntry(p => ({ ...p, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Amount</Label>
              <Input type="number" min={0} value={newEntry.amount || ""} onChange={(e) => setNewEntry(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Date</Label>
              <Input type="date" value={newEntry.date} onChange={(e) => setNewEntry(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Note (optional)</Label>
              <Input value={newEntry.note} onChange={(e) => setNewEntry(p => ({ ...p, note: e.target.value }))} placeholder="Description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddManual}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankStatementPage;
