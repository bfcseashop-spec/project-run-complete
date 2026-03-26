import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Plus, Pencil, Trash2, Syringe, Eye, Printer, Barcode, Search, PackagePlus, ImageIcon, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
          image: String(row.image || ""), quantity: Number(row.quantity) || 0,
          sold_out: Number(row.sold_out) || 0, status: computeInjectionStatus(Number(row.stock) || 0),
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Injections */}
        <div className="relative overflow-hidden rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(210, 100%, 56%), hsl(230, 90%, 62%))", boxShadow: "0 4px 20px hsl(210, 100%, 56% / 0.3)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: "hsl(0, 0%, 100% / 0.1)", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(0, 0%, 100% / 0.2)", backdropFilter: "blur(8px)" }}>
              <Syringe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-number">{injections.length}</p>
              <p className="text-[11px] font-medium" style={{ color: "hsl(0, 0%, 100% / 0.85)" }}>Total Injections</p>
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div className="relative overflow-hidden rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(155, 75%, 42%), hsl(168, 80%, 38%))", boxShadow: "0 4px 20px hsl(155, 75%, 42% / 0.3)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: "hsl(0, 0%, 100% / 0.1)", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(0, 0%, 100% / 0.2)", backdropFilter: "blur(8px)" }}>
              <Syringe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-number">{injections.filter(i => i.status === "in-stock").length}</p>
              <p className="text-[11px] font-medium" style={{ color: "hsl(0, 0%, 100% / 0.85)" }}>In Stock</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="relative overflow-hidden rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(38, 95%, 50%), hsl(28, 90%, 52%))", boxShadow: "0 4px 20px hsl(38, 95%, 50% / 0.3)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: "hsl(0, 0%, 100% / 0.1)", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(0, 0%, 100% / 0.2)", backdropFilter: "blur(8px)" }}>
              <Syringe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-number">{lowStockCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "hsl(0, 0%, 100% / 0.85)" }}>Low Stock</p>
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="relative overflow-hidden rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(0, 75%, 52%), hsl(350, 80%, 48%))", boxShadow: "0 4px 20px hsl(0, 75%, 52% / 0.3)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: "hsl(0, 0%, 100% / 0.1)", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(0, 0%, 100% / 0.2)", backdropFilter: "blur(8px)" }}>
              <Syringe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-number">{outOfStockCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "hsl(0, 0%, 100% / 0.85)" }}>Out of Stock</p>
            </div>
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
                <Label>Image</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.image ? (
                    <div className="relative">
                      <img src={form.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, image: "" }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input type="file" accept="image/*" className="hidden" id="inj-image-upload" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const ext = file.name.split(".").pop();
                      const path = `${Date.now()}.${ext}`;
                      const { error } = await supabase.storage.from("injection-images").upload(path, file);
                      if (error) { toast.error("Upload failed"); return; }
                      const { data: urlData } = supabase.storage.from("injection-images").getPublicUrl(path);
                      setForm(f => ({ ...f, image: urlData.publicUrl }));
                      toast.success("Image uploaded");
                    }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("inj-image-upload")?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Image
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
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
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Stock Available</Label>
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
                <div><p className="text-xs text-muted-foreground">Quantity</p><p className="font-medium text-foreground">{viewInj.quantity}</p></div>
                <div><p className="text-xs text-muted-foreground">Stock Available</p><p className="font-medium text-foreground">{viewInj.stock}</p></div>
                <div><p className="text-xs text-muted-foreground">Sold Out</p><p className="font-medium text-foreground">{viewInj.sold_out}</p></div>
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
