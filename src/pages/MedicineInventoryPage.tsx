import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Pencil, Printer, Trash2, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatPrice, formatDualPrice } from "@/lib/currency";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { printRecordReport } from "@/lib/printUtils";
import { toast } from "sonner";
import {
  getMedicines, updateMedicine, deleteMedicine, subscribeMedicines, Medicine,
} from "@/data/medicineStore";

const MedicineInventoryPage = () => {
  const { settings } = useSettings();
  const lang = settings.language;
  const [medicines, setMedicines] = useState(getMedicines());
  const [viewMed, setViewMed] = useState<Medicine | null>(null);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [deleteMed, setDeleteMed] = useState<Medicine | null>(null);
  const [editForm, setEditForm] = useState({ stock: 0, price: 0 });

  useEffect(() => {
    const unsub = subscribeMedicines(() => setMedicines([...getMedicines()]));
    return unsub;
  }, []);

  const inStock = medicines.filter((m) => m.status === "in-stock").length;
  const lowStock = medicines.filter((m) => m.status === "low-stock").length;
  const outOfStock = medicines.filter((m) => m.status === "out-of-stock").length;
  const totalValue = medicines.reduce((s, m) => s + m.stock * m.price, 0);

  const columns = [
    { key: "id", header: t("code", lang) },
    { key: "name", header: t("name", lang) },
    { key: "category", header: t("category", lang) },
    {
      key: "stock", header: t("stock", lang),
      render: (m: Medicine) => (
        <span className={`font-semibold tabular-nums ${m.stock <= 0 ? "text-destructive" : m.stock <= 20 ? "text-amber-600" : "text-foreground"}`}>
          {m.stock} {m.unit}
        </span>
      ),
    },
    {
      key: "price", header: t("price", lang),
      render: (m: Medicine) => <span className="tabular-nums">{formatPrice(m.price)}</span>,
    },
    {
      key: "value", header: "Value",
      render: (m: Medicine) => <span className="font-semibold tabular-nums">{formatPrice(m.stock * m.price)}</span>,
    },
    { key: "expiry", header: "Expiry" },
    {
      key: "status", header: t("status", lang),
      render: (m: Medicine) => <StatusBadge status={m.status} />,
    },
    {
      key: "actions", header: t("actions", lang),
      render: (m: Medicine) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" onClick={() => setViewMed(m)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" onClick={() => { setEditMed(m); setEditForm({ stock: m.stock, price: m.price }); }}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={() => printRecordReport({
            id: m.id, sectionTitle: "Medicine Report", fields: [
              { label: "Name", value: m.name }, { label: "Category", value: m.category },
              { label: "Stock", value: `${m.stock} ${m.unit}` }, { label: "Price", value: formatPrice(m.price) },
              { label: "Value", value: formatPrice(m.stock * m.price) }, { label: "Expiry", value: m.expiry },
              { label: "Status", value: m.status },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => setDeleteMed(m)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({ data: medicines as unknown as Record<string, unknown>[], dateKey: "expiry", columns, title: "Medicine Inventory" });
  const display = toolbar.filteredByDate as unknown as Medicine[];

  return (
    <div className="space-y-6">
      <PageHeader title="Medicine Inventory" description="Track stock levels, values, and expiry dates" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t("inStock", lang)} value={String(inStock)} change={`${medicines.length} total`} changeType="positive" icon={CheckCircle} iconBg="bg-emerald-500/10" />
        <StatCard title={t("lowStock", lang)} value={String(lowStock)} change={lowStock > 0 ? "Needs reorder" : "All good"} changeType={lowStock > 0 ? "negative" : "positive"} icon={AlertTriangle} iconBg="bg-amber-500/10" />
        <StatCard title={t("outOfStock", lang)} value={String(outOfStock)} change={outOfStock > 0 ? "Urgent" : "None"} changeType={outOfStock > 0 ? "negative" : "positive"} icon={XCircle} iconBg="bg-destructive/10" />
        <StatCard title="Total Value" value={formatDualPrice(totalValue)} change="Inventory worth" changeType="neutral" icon={Package} iconBg="bg-primary/10" />
      </div>

      <DataToolbar
        dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter}
        viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode}
        onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF}
        onImport={() => {}} onDownloadSample={toolbar.handleDownloadSample}
      />

      {toolbar.viewMode === "list" ? (
        <DataTable data={display} columns={columns} keyExtractor={(m) => (m as Medicine).id} />
      ) : (
        <DataGridView data={display} columns={columns} keyExtractor={(m) => (m as Medicine).id} />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewMed} onOpenChange={() => setViewMed(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {viewMed?.name}</DialogTitle></DialogHeader>
          {viewMed && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Code", viewMed.id], ["Category", viewMed.category],
                ["Stock", `${viewMed.stock} ${viewMed.unit}`], ["Unit Price", formatPrice(viewMed.price)],
                ["Total Value", formatPrice(viewMed.stock * viewMed.price)], ["Expiry", viewMed.expiry],
              ].map(([l, v]) => (
                <div key={l} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</p>
                  <p className="font-semibold text-sm mt-0.5">{v}</p>
                </div>
              ))}
              <div className="col-span-2"><StatusBadge status={viewMed.status} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewMed(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMed} onOpenChange={() => setEditMed(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Stock — {editMed?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stock Quantity</Label>
              <Input type="number" value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unit Price</Label>
              <Input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMed(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editMed) { updateMedicine(editMed.id, { stock: editForm.stock, price: editForm.price }); toast.success("Updated"); setEditMed(null); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteMed} onOpenChange={() => setDeleteMed(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteMed?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this medicine from inventory.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteMed) { deleteMedicine(deleteMed.id); toast.success("Deleted"); setDeleteMed(null); } }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicineInventoryPage;
