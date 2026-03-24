import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { getBillingRecords, subscribeBilling, updateBillingRecord, removeBillingRecord } from "@/data/billingStore";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CreditCard, CheckCircle, Eye, Pencil, Trash2, Banknote } from "lucide-react";
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
  service: string;
}

const columns = [
  { key: "id" as const, header: "Invoice" },
  { key: "patient" as const, header: "Patient" },
  { key: "amount" as const, header: "Total" },
  { key: "paid" as const, header: "Paid" },
  { key: "due" as const, header: "Due", render: (d: DueRow) => <span className="font-semibold text-destructive">{d.due}</span> },
  { key: "method" as const, header: "Pay Method" },
  { key: "date" as const, header: "Date" },
  { key: "status" as const, header: "Status", render: (d: DueRow) => <StatusBadge status={d.status} /> },
  { key: "actions" as const, header: "Actions", render: (d: DueRow) => null },
];

const DuesPage = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState(getBillingRecords());
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<DueRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");

  useEffect(() => {
    const unsub = subscribeBilling(() => setBilling([...getBillingRecords()]));
    return () => unsub();
  }, []);

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
        service: r.service,
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

  const openViewDialog = (row: DueRow) => {
    setSelectedDue(row);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (row: DueRow) => {
    setSelectedDue(row);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (row: DueRow) => {
    navigate(`/new-invoice?edit=${row.id}`);
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

  const handleDelete = async () => {
    if (!selectedDue) return;
    try {
      await removeBillingRecord(selectedDue.id);
      toast.success(`${selectedDue.id} deleted successfully`);
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const handleImport = async (file: File) => {
    await toolbar.handleImport(file);
  };

  const actionColumns = columns.map(col =>
    col.key === "actions"
      ? {
          ...col,
          render: (d: DueRow) => (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => openViewDialog(d)} className="gap-1 h-8 px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                <Eye className="w-3.5 h-3.5" /> View
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit(d)} className="gap-1 h-8 px-2 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => openPayDialog(d)} className="gap-1 h-8 px-2 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                <Banknote className="w-3.5 h-3.5" /> Pay
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDeleteDialog(d)} className="gap-1 h-8 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" /> Invoice Details — {selectedDue?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedDue && (
            <div className="space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-medium">{selectedDue.patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedDue.service}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDue.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{selectedDue.method}</span>
                </div>
              </div>
              <div className="rounded-xl border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{selectedDue.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-emerald-600">{selectedDue.paid}</span>
                </div>
                <hr />
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-destructive">Outstanding Due</span>
                  <span className="font-bold text-destructive text-lg">{selectedDue.due}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setViewDialogOpen(false); if (selectedDue) openPayDialog(selectedDue); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Banknote className="w-4 h-4 mr-1" /> Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-500" /> Record Payment — {selectedDue?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedDue && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-4 text-sm space-y-1.5">
                <p><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedDue.patient}</span></p>
                <p><span className="text-muted-foreground">Total:</span> <span className="font-medium">{selectedDue.amount}</span></p>
                <p><span className="text-muted-foreground">Already Paid:</span> <span className="font-medium text-emerald-600">{selectedDue.paid}</span></p>
                <p className="font-bold text-destructive text-base pt-1">Outstanding: {selectedDue.due}</p>
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
            <Button onClick={handlePay} className="bg-emerald-600 hover:bg-emerald-700">Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Due Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{selectedDue?.id}</span> for <span className="font-semibold text-foreground">{selectedDue?.patient}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuesPage;
