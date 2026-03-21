import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Syringe, Eye, Printer, Barcode } from "lucide-react";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  InjectionItem, getInjections, addInjection, updateInjection, deleteInjection,
  subscribeInjections, computeInjectionStatus,
} from "@/data/injectionStore";

const emptyForm: Omit<InjectionItem, "id"> = {
  name: "", category: "", strength: "", route: "", stock: 0, unit: "Amps", price: 0, status: "in-stock",
};

const categories = ["Antibiotic", "Antidiabetic", "Analgesic", "Antiemetic", "Antacid", "Corticosteroid", "Diuretic", "Supplement"];
const routes = ["IV", "IM", "SC", "ID", "IV/IM"];
const units = ["Vials", "Amps", "Pre-filled Syringes"];

const InjectionsPage = () => {
  useSettings();
  const [injections, setInjections] = useState<InjectionItem[]>(getInjections());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInj, setEditInj] = useState<InjectionItem | null>(null);
  const [deleteInj, setDeleteInj] = useState<InjectionItem | null>(null);
  const [viewInj, setViewInj] = useState<InjectionItem | null>(null);
  const [form, setForm] = useState<Omit<InjectionItem, "id">>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => { const unsub = subscribeInjections(() => setInjections([...getInjections()])); return () => { unsub(); }; }, []);

  const openNew = () => { setEditInj(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (inj: InjectionItem) => {
    setEditInj(inj);
    setForm({ name: inj.name, category: inj.category, strength: inj.strength, route: inj.route, stock: inj.stock, unit: inj.unit, price: inj.price, status: inj.status });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.category) { toast.error("Name and category are required"); return; }
    const status = computeInjectionStatus(form.stock);
    if (editInj) {
      updateInjection(editInj.id, { ...form, status });
      toast.success("Injection updated");
    } else {
      const nextId = `INJ-${String(getInjections().length + 1).padStart(3, "0")}`;
      addInjection({ id: nextId, ...form, status });
      toast.success("Injection added");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteInj) {
      deleteInjection(deleteInj.id);
      setDeleteInj(null);
      selectedIds.delete(deleteInj.id);
      setSelectedIds(new Set(selectedIds));
      toast.success("Injection deleted");
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteInjection(id));
    toast.success(`Deleted ${selectedIds.size} injection(s)`);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const lowStockCount = injections.filter((i) => i.status === "low-stock").length;
  const outOfStockCount = injections.filter((i) => i.status === "out-of-stock").length;

  const columns = [
    { key: "id", header: "Code" },
    { key: "name", header: "Injection Name" },
    { key: "category", header: "Category" },
    { key: "strength", header: "Strength" },
    { key: "route", header: "Route", render: (i: InjectionItem) => <Badge variant="outline" className="text-xs">{i.route}</Badge> },
    { key: "stock", header: "Stock", render: (i: InjectionItem) => `${i.stock} ${i.unit}` },
    { key: "price", header: "Price", render: (i: InjectionItem) => formatDualPrice(i.price) },
    { key: "status", header: "Status", render: (i: InjectionItem) => <StatusBadge status={i.status} /> },
    {
      key: "actions", header: "Actions", render: (i: InjectionItem) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewInj(i)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(i)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printRecordReport({
            id: i.id, sectionTitle: "Injection Report", fields: [
              { label: "Name", value: i.name }, { label: "Category", value: i.category },
              { label: "Strength", value: i.strength }, { label: "Route", value: i.route },
              { label: "Stock", value: `${i.stock} ${i.unit}` }, { label: "Price", value: formatDualPrice(i.price) },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50" title="Barcode" onClick={() => printBarcode(i.id, i.name)}>
            <Barcode className="w-3.5 h-3.5 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteInj(i)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const injToolbar = useDataToolbar({ data: injections as unknown as Record<string, unknown>[], dateKey: "", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Injections" });

  const handleImportInj = async (file: File) => {
    const rows = await injToolbar.handleImport(file);
    if (rows.length > 0) {
      rows.forEach((row, i) => {
        const nextId = `INJ-${String(getInjections().length + i + 1).padStart(3, "0")}`;
        addInjection({
          id: nextId, name: String(row.name || ""), category: String(row.category || ""),
          strength: String(row.strength || ""), route: String(row.route || "IV"),
          stock: Number(row.stock) || 0, unit: String(row.unit || "Vials"),
          price: Number(row.price) || 0, status: computeInjectionStatus(Number(row.stock) || 0),
        });
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Injections" description="Manage injection inventory, stock levels, and routes">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Injection</Button>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
      </PageHeader>

      <DataToolbar dateFilter={injToolbar.dateFilter} onDateFilterChange={injToolbar.setDateFilter} viewMode={injToolbar.viewMode} onViewModeChange={injToolbar.setViewMode} onExportExcel={injToolbar.handleExportExcel} onExportPDF={injToolbar.handleExportPDF} onImport={handleImportInj} onDownloadSample={injToolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Syringe className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{injections.length}</p><p className="text-xs text-muted-foreground">Total Injections</p></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center"><Syringe className="w-5 h-5 text-accent-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{lowStockCount}</p><p className="text-xs text-muted-foreground">Low Stock</p></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Syringe className="w-5 h-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold text-foreground">{outOfStockCount}</p><p className="text-xs text-muted-foreground">Out of Stock</p></div>
          </div>
        </div>
      </div>

      {injToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={injections} keyExtractor={(i) => i.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
      ) : (
        <DataGridView columns={columns} data={injections} keyExtractor={(i) => i.id} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editInj ? "Edit Injection" : "Add Injection"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Injection Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ceftriaxone" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Strength</Label>
                <Input value={form.strength} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} placeholder="e.g. 1g" />
              </div>
              <div>
                <Label>Route</Label>
                <Select value={form.route} onValueChange={(v) => setForm((f) => ({ ...f, route: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editInj ? "Update" : "Add"} Injection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteInj} onOpenChange={(open) => !open && setDeleteInj(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Injection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteInj?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Injection(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedIds.size}</strong> selected injection(s)? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InjectionsPage;
