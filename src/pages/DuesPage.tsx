import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { getBillingRecords, subscribeBilling, updateBillingRecord } from "@/data/billingStore";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";

interface DueRow {
  id: string;
  patient: string;
  amount: string;
  paid: string;
  due: string;
  date: string;
  status: "pending" | "completed" | "critical";
  rawDue: number;
  rawPaid: number;
  rawTotal: number;
  method: string;
}

const columns = [
  { key: "id" as const, header: "Invoice" },
  { key: "patient" as const, header: "Patient" },
  { key: "amount" as const, header: "Total" },
  { key: "paid" as const, header: "Paid" },
  { key: "due" as const, header: "Due" },
  { key: "method" as const, header: "Pay Method" },
  { key: "date" as const, header: "Date" },
  { key: "status" as const, header: "Status", render: (d: DueRow) => <StatusBadge status={d.status} /> },
  { key: "actions" as const, header: "Actions", render: (d: DueRow) => null }, // placeholder, overridden below
];

const DuesPage = () => {
  const [billing, setBilling] = useState(getBillingRecords());
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<DueRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");

  useEffect(() => {
    const unsub = subscribeBilling(() => setBilling([...getBillingRecords()]));
    return () => unsub();
  }, []);

  // Only show records with outstanding dues
  const dueRows: DueRow[] = useMemo(() =>
    billing
      .filter(r => r.due > 0)
      .map(r => ({
        id: r.id,
        patient: r.patient,
        amount: formatPrice(r.total),
        paid: formatPrice(r.paid),
        due: formatPrice(r.due),
        date: r.date,
        status: r.status,
        rawDue: r.due,
        rawPaid: r.paid,
        rawTotal: r.total,
        method: r.method,
      })),
    [billing]
  );

  const totalDue = useMemo(() => dueRows.reduce((s, r) => s + r.rawDue, 0), [dueRows]);
  const totalPaid = useMemo(() => dueRows.reduce((s, r) => s + r.rawPaid, 0), [dueRows]);
  const criticalCount = useMemo(() => dueRows.filter(r => r.status === "critical").length, [dueRows]);

  const toolbar = useDataToolbar({
    data: dueRows as unknown as Record<string, unknown>[],
    dateKey: "date",
    columns,
    title: "Due_Management",
  });
  const display = toolbar.filteredByDate as unknown as DueRow[];

  const openPayDialog = (row: DueRow) => {
    setSelectedDue(row);
    setPayAmount(String(row.rawDue));
    setPayMethod("Cash");
    setPayDialogOpen(true);
  };

  const handlePay = () => {
    if (!selectedDue) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0 || amt > selectedDue.rawDue) {
      toast.error("Invalid payment amount");
      return;
    }
    const newPaid = selectedDue.rawPaid + amt;
    const newDue = selectedDue.rawTotal - newPaid;
    updateBillingRecord(selectedDue.id, {
      paid: newPaid,
      due: Math.max(0, newDue),
      method: payMethod,
    });
    toast.success(`Payment of ${formatPrice(amt)} recorded for ${selectedDue.id}`);
    setPayDialogOpen(false);
  };

  const handleImport = async (file: File) => {
    await toolbar.handleImport(file);
  };

  const actionColumns = columns.map(col =>
    col.key === "actions"
      ? {
          ...col,
          render: (d: DueRow) => (
            <Button size="sm" variant="outline" onClick={() => openPayDialog(d)} className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Pay
            </Button>
          ),
        }
      : col
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Due Management" description="Track outstanding payments and collections from billing" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} title="Total Outstanding" value={formatPrice(totalDue)} accentColor="hsl(350, 65%, 55%)" />
        <StatCard icon={CheckCircle} title="Partially Paid" value={formatPrice(totalPaid)} accentColor="hsl(38, 92%, 50%)" />
        <StatCard icon={CreditCard} title="Due Invoices" value={String(dueRows.length)} accentColor="hsl(217, 91%, 60%)" />
        <StatCard icon={DollarSign} title="Critical (Unpaid)" value={String(criticalCount)} accentColor="hsl(0, 70%, 50%)" />
      </div>

      <DataToolbar
        dateFilter={toolbar.dateFilter}
        onDateFilterChange={toolbar.setDateFilter}
        viewMode={toolbar.viewMode}
        onViewModeChange={toolbar.setViewMode}
        onExportExcel={toolbar.handleExportExcel}
        onExportPDF={toolbar.handleExportPDF}
        onImport={handleImport}
        onDownloadSample={toolbar.handleDownloadSample}
      />

      {toolbar.viewMode === "list" ? (
        <DataTable columns={actionColumns} data={display} keyExtractor={(d) => d.id} />
      ) : (
        <DataGridView columns={actionColumns} data={display} keyExtractor={(d) => d.id} />
      )}

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {selectedDue?.id}</DialogTitle>
          </DialogHeader>
          {selectedDue && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Patient:</span> {selectedDue.patient}</p>
                <p><span className="text-muted-foreground">Total:</span> {selectedDue.amount}</p>
                <p><span className="text-muted-foreground">Already Paid:</span> {selectedDue.paid}</p>
                <p className="font-bold text-destructive">Outstanding: {selectedDue.due}</p>
              </div>
              <div>
                <Label>Payment Amount</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} max={selectedDue.rawDue} min={0} />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cash", "ABA", "ACleda", "Card", "Wing", "Binance(USDT)", "True Money", "Bank Transfer", "Insurance"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePay}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuesPage;
