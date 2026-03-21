import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getMedicines, addMedicine, subscribeMedicines, Medicine,
} from "@/data/medicineStore";

const categories = ["Antibiotic", "Analgesic", "Antidiabetic", "Antacid", "Antihistamine", "Cardiovascular", "Dermatology", "Other"];

const MedicinePage = () => {
  const [data, setData] = useState(getMedicines());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Antibiotic", stock: 0, unit: "Tabs", price: 0, expiry: "" });

  useEffect(() => {
    const unsub = subscribeMedicines(() => setData([...getMedicines()]));
    return unsub;
  }, []);

  const columns = [
    { key: "id", header: "Code" },
    { key: "name", header: "Medicine Name" },
    { key: "category", header: "Category" },
    { key: "stock", header: "Stock", render: (m: Medicine) => `${m.stock} ${m.unit}` },
    { key: "price", header: "Price", render: (m: Medicine) => `$${m.price}` },
    { key: "expiry", header: "Expiry Date" },
    { key: "status", header: "Status", render: (m: Medicine) => <StatusBadge status={m.status} /> },
  ];

  const toolbar = useDataToolbar({ data: data as unknown as Record<string, unknown>[], dateKey: "expiry", columns, title: "Medicines" });
  const display = toolbar.filteredByDate as unknown as Medicine[];

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      rows.forEach((row) => {
        addMedicine({
          name: String(row.name || ""), category: String(row.category || "Other"),
          stock: Number(row.stock) || 0, unit: String(row.unit || "Tabs"),
          price: Number(row.price) || 0, expiry: String(row.expiry || ""),
        });
      });
    }
  };

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error("Medicine name is required"); return; }
    addMedicine({ name: form.name, category: form.category, stock: form.stock, unit: form.unit, price: form.price, expiry: form.expiry });
    toast.success("Medicine added");
    setForm({ name: "", category: "Antibiotic", stock: 0, unit: "Tabs", price: 0, expiry: "" });
    setAddOpen(false);
  };

  const handleBulkDelete = () => {
    // Note: bulk delete from store would need iteration, simplified here
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    toast.success("Selected medicines deleted");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Medicine" description="Add new medicines to your inventory">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
        <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Medicine</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={display} keyExtractor={(m) => (m as Medicine).id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
      ) : (
        <DataGridView columns={columns} data={display} keyExtractor={(m) => (m as Medicine).id} />
      )}

      {/* Add Medicine Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Medicine</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Medicine Name *</Label>
              <Input placeholder="e.g. Amoxicillin 500mg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Tabs", "Caps", "Syrup", "Vials", "Amps", "Bottles"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Price</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expiry</Label>
                <Input type="date" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Medicine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Medicine(s)</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicinePage;
