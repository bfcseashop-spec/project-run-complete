import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Plus, Pencil, Trash2, Syringe, Eye, Printer, Barcode, Search, PackagePlus, ImageIcon } from "lucide-react";
import { printInjectionReport, printBarcode } from "@/lib/printUtils";
import { formatPrice } from "@/lib/currency";
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
  name: "", category: "", strength: "", route: "", stock: 0, unit: "", price: 0, purchase_price: 0, image: "", quantity: 0, sold_out: 0, status: "in-stock",
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [addStockInj, setAddStockInj] = useState<InjectionItem | null>(null);
  const [addStockQty, setAddStockQty] = useState(0);

  useEffect(() => { const unsub = subscribeInjections(() => setInjections([...getInjections()])); return () => { unsub(); }; }, []);

  const openNew = () => { setEditInj(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (inj: InjectionItem) => {
    setEditInj(inj);
    setForm({ name: inj.name, category: inj.category, strength: inj.strength, route: inj.route, stock: inj.stock, unit: inj.unit, price: inj.price, purchase_price: inj.purchase_price, image: inj.image, quantity: inj.quantity, sold_out: inj.sold_out, status: inj.status });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editInj) {
      updateInjection(editInj.id, { ...form });
      toast.success("Injection updated");
    } else {
      const nextId = `INJ-${String(getInjections().length + 1).padStart(3, "0")}`;
      addInjection({ id: nextId, ...form });
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

  const handleAddStock = async () => {
    if (!addStockInj || addStockQty <= 0) return;
    const newStock = addStockInj.stock + addStockQty;
    await updateInjection(addStockInj.id, { stock: newStock, status: computeInjectionStatus(newStock) });
    toast.success(`Added ${addStockQty} to ${addStockInj.name}`);
    setAddStockInj(null);
    setAddStockQty(0);
  };

  const lowStockCount = injections.filter((i) => i.status === "low-stock").length;
  const outOfStockCount = injections.filter((i) => i.status === "out-of-stock").length;

  const columns = [
    {
      key: "image", header: "Image", render: (i: InjectionItem) => (
        i.image ? (
          <img src={i.image} alt={i.name} className="w-9 h-9 rounded-md object-cover border border-border" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )
      ),
    },
    { key: "id", header: "Code" },
    { key: "name", header: "Injection Name" },
    { key: "purchase_price", header: "Purchase Price", render: (i: InjectionItem) => formatPrice(i.purchase_price) },
    { key: "price", header: "Sale Price", render: (i: InjectionItem) => formatPrice(i.price) },
    { key: "quantity", header: "Quantity", render: (i: InjectionItem) => <span className="font-medium text-foreground">{i.quantity}</span> },
    { key: "stock", header: "Stock Available", render: (i: InjectionItem) => (
      <span className={`font-medium ${i.stock === 0 ? "text-destructive" : i.stock <= 20 ? "text-warning" : "text-foreground"}`}>
        {i.stock}
      </span>
    )},
    { key: "sold_out", header: "Sold Out", render: (i: InjectionItem) => <span className="font-medium text-foreground">{i.sold_out}</span> },
    {
      key: "actions", header: "Actions", render: (i: InjectionItem) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewInj(i)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(i)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-500/10" title="Add Stock" onClick={() => { setAddStockInj(i); setAddStockQty(0); }}>
            <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printInjectionReport({
            id: i.id, name: i.name, category: i.category,
            unit: i.unit, price: formatPrice(i.price), status: computeInjectionStatus(i.stock),
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
          strength: String(row.strength || ""), route: String(row.route || ""),
          stock: Number(row.stock) || 0, unit: String(row.unit || ""),
          price: Number(row.price) || 0, purchase_price: Number(row.purchase_price) || 0,
          image: String(row.image || ""), status: computeInjectionStatus(Number(row.stock) || 0),
        });
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Injections" description="Manage injection inventory and stock levels">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Injection</Button>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
      </PageHeader>

      <DataToolbar dateFilter={injToolbar.dateFilter} onDateFilterChange={injToolbar.setDateFilter} viewMode={injToolbar.viewMode} onViewModeChange={injToolbar.setViewMode} onExportExcel={injToolbar.handleExportExcel} onExportPDF={injToolbar.handleExportPDF} onImport={handleImportInj} onDownloadSample={injToolbar.handleDownloadSample} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

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

      {(() => {
        const q = searchQuery.toLowerCase().trim();
        const filtered = q ? injections.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)) : injections;
        return injToolbar.viewMode === "list" ? (
          <DataTable columns={columns} data={filtered} keyExtractor={(i) => i.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
        ) : (
          <DataGridView columns={columns} data={filtered} keyExtractor={(i) => i.id} />
        );
      })()}

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
              <div className="col-span-2">
                <Label>Image URL</Label>
                <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <Input type="number" value={form.purchase_price} onChange={(e) => setForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Sale Price</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as InjectionItem["status"] }))}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editInj ? "Update" : "Add"} Injection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog (Read-Only) */}
      <Dialog open={!!viewInj} onOpenChange={() => setViewInj(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Syringe className="w-5 h-5 text-primary" /> Injection Details
            </DialogTitle>
          </DialogHeader>
          {viewInj && (
            <div className="space-y-4 py-2">
              {viewInj.image && (
                <div className="flex justify-center">
                  <img src={viewInj.image} alt={viewInj.name} className="w-20 h-20 rounded-lg object-cover border border-border" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Code</p><p className="font-medium text-foreground">{viewInj.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewInj.status} /></div>
                <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-foreground">{viewInj.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Stock</p><p className="font-medium text-foreground">{viewInj.stock}</p></div>
                <div><p className="text-xs text-muted-foreground">Purchase Price</p><p className="font-semibold text-foreground">{formatPrice(viewInj.purchase_price)}</p></div>
                <div><p className="text-xs text-muted-foreground">Sale Price</p><p className="font-semibold text-foreground">{formatPrice(viewInj.price)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInj(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const i = viewInj; setViewInj(null); if (i) openEdit(i); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewInj) printInjectionReport({
              id: viewInj.id, name: viewInj.name, category: viewInj.category,
              unit: viewInj.unit, price: formatPrice(viewInj.price), status: computeInjectionStatus(viewInj.stock),
            }); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
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

      {/* Add Stock Dialog */}
      <Dialog open={!!addStockInj} onOpenChange={(open) => { if (!open) setAddStockInj(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-600" /> Add Stock
            </DialogTitle>
          </DialogHeader>
          {addStockInj && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Adding stock to <strong className="text-foreground">{addStockInj.name}</strong> (Current: {addStockInj.stock})</p>
              <div>
                <Label>Quantity to Add</Label>
                <Input type="number" min={1} value={addStockQty} onChange={(e) => setAddStockQty(Number(e.target.value))} placeholder="Enter quantity" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStockInj(null)}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={addStockQty <= 0}>Add Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InjectionsPage;
