import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { useDataToolbar } from "@/hooks/use-data-toolbar";

import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, DollarSign, Clock, CheckCircle, AlertTriangle,
  Search, Home, Zap, Package, Users, Wrench, Megaphone, HelpCircle, Monitor, Eye, Printer,
  Tag, X,
} from "lucide-react";
import { printRecordReport } from "@/lib/printUtils";
import { type ExpenseRecord, expenseCategories, paymentMethods } from "@/data/expenseRecords";
import {
  getExpenseRecords, setExpenseRecords, addExpenseRecord, removeExpenseRecord,
  updateExpenseRecord, subscribeExpenses,
} from "@/data/expenseStore";

const categoryIcons: Record<string, React.ElementType> = {
  rent: Home, utilities: Zap, supplies: Package, salaries: Users,
  equipment: Monitor, maintenance: Wrench, marketing: Megaphone, miscellaneous: HelpCircle,
};

const emptyForm: Omit<ExpenseRecord, "id"> = {
  title: "", category: "miscellaneous", amount: 0, paidTo: "", paymentMethod: "cash",
  date: new Date().toISOString().split("T")[0], receipt: "", notes: "", status: "pending",
};

const CUSTOM_CATEGORIES_KEY = "expense_custom_categories";
const loadCustomCategories = (): string[] => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]"); } catch { return []; }
};

const ExpensesPage = () => {
  
  const [records, setRecords] = useState<ExpenseRecord[]>(getExpenseRecords());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ExpenseRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ExpenseRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<ExpenseRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Custom categories
  const [customCategories, setCustomCategories] = useState<string[]>(loadCustomCategories());
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const allCategories = [...expenseCategories, ...customCategories];

  const addCustomCategory = () => {
    const name = newCategoryName.trim().toLowerCase();
    if (!name || allCategories.includes(name)) return;
    const updated = [...customCategories, name];
    setCustomCategories(updated);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    setNewCategoryName("");
  };

  const removeCustomCategory = (cat: string) => {
    const updated = customCategories.filter(c => c !== cat);
    setCustomCategories(updated);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  };

  // Sync with store
  useEffect(() => {
    const unsub = subscribeExpenses(() => setRecords([...getExpenseRecords()]));
    return () => unsub();
  }, []);

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: ExpenseRecord) => {
    setEditRecord(r);
    const { id, ...rest } = r;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.paidTo || form.amount <= 0) return;
    if (editRecord) {
      updateExpenseRecord(editRecord.id, form);
    } else {
      const allRecs = getExpenseRecords();
      const nextId = `EXP-${String(allRecs.length + 1).padStart(3, "0")}`;
      addExpenseRecord({ id: nextId, ...form });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteRecord) {
      removeExpenseRecord(deleteRecord.id);
      setDeleteRecord(null);
    }
  };

  const filtered = records.filter(r => {
    const matchSearch = searchTerm === "" ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchCat = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const totalAmount = records.reduce((s, r) => s + r.amount, 0);
  const paidAmount = records.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const pendingAmount = records.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const overdueAmount = records.filter(r => r.status === "overdue").reduce((s, r) => s + r.amount, 0);

  const columns = [
    { key: "id", header: "Expense ID" },
    { key: "title", header: "Title" },
    {
      key: "category", header: "Category",
      render: (r: ExpenseRecord) => {
        const Icon = categoryIcons[r.category] || HelpCircle;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{r.category}</span>
          </div>
        );
      },
    },
    {
      key: "amount", header: "Amount",
      render: (r: ExpenseRecord) => (
        <span className="font-semibold text-card-foreground font-number">{formatPrice(r.amount)}</span>
      ),
    },
    { key: "paidTo", header: "Paid To" },
    {
      key: "paymentMethod", header: "Payment",
      render: (r: ExpenseRecord) => <span className="capitalize">{r.paymentMethod}</span>,
    },
    { key: "date", header: "Date" },
    {
      key: "status", header: "Status",
      render: (r: ExpenseRecord) => {
        const mapped = r.status === "overdue" ? "pending" : r.status === "paid" ? "completed" : "active";
        return <StatusBadge status={mapped as "active" | "completed" | "pending"} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: ExpenseRecord) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewRecord(r)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(r)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printRecordReport({
            id: r.id, sectionTitle: "Expense Report", fields: [
              { label: "Title", value: r.title }, { label: "Category", value: r.category },
              { label: "Amount", value: formatPrice(r.amount) }, { label: "Paid To", value: r.paidTo },
              { label: "Payment Method", value: r.paymentMethod }, { label: "Date", value: r.date },
              { label: "Receipt #", value: r.receipt }, { label: "Status", value: r.status },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({
    data: records as unknown as Record<string, unknown>[],
    dateKey: "date",
    columns: columns.map(c => ({ key: c.key, header: c.header })),
    title: "Expenses",
  });

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const nextNum = records.length + 1;
      const newRecords: ExpenseRecord[] = rows.map((row, i) => ({
        id: `EXP-${String(nextNum + i).padStart(3, "0")}`,
        title: String(row.title || ""), category: (row.category as ExpenseRecord["category"]) || "miscellaneous",
        amount: Number(row.amount) || 0, paidTo: String(row.paidTo || ""),
        paymentMethod: (row.paymentMethod as ExpenseRecord["paymentMethod"]) || "cash",
        date: String(row.date || new Date().toISOString().split("T")[0]),
        receipt: String(row.receipt || ""), notes: String(row.notes || ""), status: "pending",
      }));
      setRecords(prev => [...newRecords, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track and categorize clinic expenditures">
        <Button variant="outline" onClick={() => setShowCategoryDialog(true)}><Tag className="w-4 h-4 mr-2" /> Category</Button>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Expense</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expenses" value={formatPrice(totalAmount)} icon={DollarSign} />
        <StatCard title="Paid" value={formatPrice(paidAmount)} icon={CheckCircle} />
        <StatCard title="Pending" value={formatPrice(pendingAmount)} icon={Clock} />
        <StatCard title="Overdue" value={formatPrice(overdueAmount)} icon={AlertTriangle} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, payee, or ID..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={r => r.id} />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Expense" : "New Expense"}</DialogTitle>
            <DialogDescription>{editRecord ? "Update the expense details." : "Enter details for the new expense."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly Rent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as ExpenseRecord["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min={0} value={form.amount || ""} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paid To *</Label>
                <Input value={form.paidTo} onChange={e => setForm({ ...form, paidTo: e.target.value })} placeholder="Vendor / Payee" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v as ExpenseRecord["paymentMethod"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Receipt #</Label>
                <Input value={form.receipt} onChange={e => setForm({ ...form, receipt: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as ExpenseRecord["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editRecord ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={open => !open && setDeleteRecord(null)}>
      {/* View Dialog (Read-Only) */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              {(() => { const Icon = categoryIcons[viewRecord?.category || ""] || HelpCircle; return <Icon className="w-5 h-5 text-primary" />; })()}
              Expense Details
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Expense ID</p><p className="font-medium text-foreground">{viewRecord.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>
                  {(() => { const mapped = viewRecord.status === "overdue" ? "pending" : viewRecord.status === "paid" ? "completed" : "active"; return <StatusBadge status={mapped as "active" | "completed" | "pending"} />; })()}
                </div>
                <div><p className="text-xs text-muted-foreground">Title</p><p className="font-medium text-foreground">{viewRecord.title}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium text-foreground capitalize">{viewRecord.category}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold text-foreground">{formatPrice(viewRecord.amount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Paid To</p><p className="font-medium text-foreground">{viewRecord.paidTo}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium text-foreground capitalize">{viewRecord.paymentMethod}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium text-foreground">{viewRecord.date}</p></div>
                <div><p className="text-xs text-muted-foreground">Receipt #</p><p className="font-medium text-foreground">{viewRecord.receipt || "—"}</p></div>
              </div>
              {viewRecord.notes && (
                <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm text-foreground mt-1">{viewRecord.notes}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const r = viewRecord; setViewRecord(null); if (r) openEdit(r); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewRecord) printRecordReport({
              id: viewRecord.id, sectionTitle: "Expense Report", fields: [
                { label: "Title", value: viewRecord.title }, { label: "Category", value: viewRecord.category },
                { label: "Amount", value: formatPrice(viewRecord.amount) }, { label: "Paid To", value: viewRecord.paidTo },
                { label: "Payment Method", value: viewRecord.paymentMethod }, { label: "Date", value: viewRecord.date },
                { label: "Receipt #", value: viewRecord.receipt }, { label: "Status", value: viewRecord.status },
              ],
            }); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteRecord?.title}" ({deleteRecord?.id})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpensesPage;
