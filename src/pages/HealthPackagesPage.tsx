import { useState } from "react";
import { printRecordReport } from "@/lib/printUtils";
import PageHeader from "@/components/PageHeader";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import StatCard from "@/components/StatCard";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package, Plus, Eye, Printer, Pencil, Trash2,
  Activity, Users, Tag, Layers,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface HealthPackage {
  id: string;
  name: string;
  services: string[];
  price: number;
  discountPercent: number;
  validity: string;
  status: "active" | "pending" | "completed";
  description: string;
}

const availableServices = [
  "General Health Checkup", "Flu Vaccination", "Prenatal Checkup",
  "Vision Screening", "Child Immunization (DPT)", "Diabetes Screening",
  "Postnatal Care", "Dental Cleaning", "Blood Test Panel",
  "ECG", "Chest X-Ray", "Ultrasound Abdomen",
];

const initialPackages: HealthPackage[] = [
  {
    id: "PKG-001", name: "Basic Health Checkup", services: ["General Health Checkup", "Blood Test Panel", "ECG"],
    price: 1200, discountPercent: 15, validity: "1 Month", status: "active",
    description: "Essential health screening package with basic vitals, blood work, and heart checkup.",
  },
  {
    id: "PKG-002", name: "Women's Wellness Package", services: ["General Health Checkup", "Prenatal Checkup", "Ultrasound Abdomen", "Blood Test Panel"],
    price: 2500, discountPercent: 20, validity: "3 Months", status: "active",
    description: "Comprehensive women's health package including prenatal and ultrasound services.",
  },
  {
    id: "PKG-003", name: "Child Care Bundle", services: ["Child Immunization (DPT)", "General Health Checkup", "Vision Screening"],
    price: 800, discountPercent: 10, validity: "6 Months", status: "active",
    description: "Pediatric health package covering vaccination, general checkup, and eye screening.",
  },
  {
    id: "PKG-004", name: "Executive Health Package", services: ["General Health Checkup", "Blood Test Panel", "ECG", "Chest X-Ray", "Ultrasound Abdomen", "Diabetes Screening"],
    price: 4500, discountPercent: 25, validity: "1 Year", status: "active",
    description: "Premium comprehensive health assessment for executives with full diagnostics.",
  },
  {
    id: "PKG-005", name: "Dental Care Package", services: ["Dental Cleaning", "General Health Checkup"],
    price: 600, discountPercent: 5, validity: "6 Months", status: "pending",
    description: "Basic dental hygiene and general health checkup bundle.",
  },
];

const emptyForm = { name: "", services: [] as string[], price: "", discountPercent: "", validity: "", status: "active", description: "" };

const HealthPackagesPage = () => {
  useSettings();
  const [packages, setPackages] = useState<HealthPackage[]>(initialPackages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<HealthPackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<HealthPackage | null>(null);
  const [viewPkg, setViewPkg] = useState<HealthPackage | null>(null);
  const [form, setForm] = useState(emptyForm);

  const update = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const openNew = () => { setEditPkg(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: HealthPackage) => {
    setEditPkg(p);
    setForm({ name: p.name, services: [...p.services], price: String(p.price), discountPercent: String(p.discountPercent), validity: p.validity, status: p.status, description: p.description });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || form.services.length === 0) return;
    if (editPkg) {
      setPackages((prev) => prev.map((p) => p.id === editPkg.id ? {
        ...p, name: form.name, services: form.services, price: parseFloat(form.price),
        discountPercent: parseFloat(form.discountPercent) || 0, validity: form.validity,
        status: form.status as HealthPackage["status"], description: form.description,
      } : p));
    } else {
      const nextId = `PKG-${String(packages.length + 1).padStart(3, "0")}`;
      setPackages((prev) => [{
        id: nextId, name: form.name, services: form.services, price: parseFloat(form.price),
        discountPercent: parseFloat(form.discountPercent) || 0, validity: form.validity,
        status: form.status as HealthPackage["status"], description: form.description,
      }, ...prev]);
    }
    setDialogOpen(false);
    setEditPkg(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (deletePkg) {
      setPackages((prev) => prev.filter((p) => p.id !== deletePkg.id));
      setDeletePkg(null);
    }
  };

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service) ? f.services.filter((s) => s !== service) : [...f.services, service],
    }));
  };

  const activeCount = packages.filter((p) => p.status === "active").length;
  const avgDiscount = packages.length > 0 ? Math.round(packages.reduce((s, p) => s + p.discountPercent, 0) / packages.length) : 0;

  const columns = [
    { key: "id", header: "Package ID" },
    {
      key: "name", header: "Package Name", render: (p: HealthPackage) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.services.length} services included</p>
          </div>
        </div>
      ),
    },
    {
      key: "price", header: "Price", render: (p: HealthPackage) => (
        <div>
          <span className="font-semibold text-foreground">{formatDualPrice(p.price)}</span>
          {p.discountPercent > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">{p.discountPercent}% off</Badge>}
        </div>
      ),
    },
    { key: "validity", header: "Validity" },
    {
      key: "services", header: "Services", render: (p: HealthPackage) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {p.services.slice(0, 2).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
          {p.services.length > 2 && <Badge variant="secondary" className="text-[10px]">+{p.services.length - 2} more</Badge>}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (p: HealthPackage) => <StatusBadge status={p.status} /> },
    {
      key: "actions", header: "Actions", render: (p: HealthPackage) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewPkg(p)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(p)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printRecordReport({
            id: p.id, sectionTitle: "Health Package Report", fields: [
              { label: "Package Name", value: p.name }, { label: "Services", value: p.services.join(", ") },
              { label: "Price", value: formatDualPrice(p.price) }, { label: "Discount", value: `${p.discountPercent}%` },
              { label: "Validity", value: p.validity }, { label: "Status", value: p.status },
              { label: "Description", value: p.description },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeletePkg(p)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const pkgToolbar = useDataToolbar({ data: packages as unknown as Record<string, unknown>[], dateKey: "", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Health_Packages" });

  const handleImport = async (file: File) => {
    const rows = await pkgToolbar.handleImport(file);
    if (rows.length > 0) {
      const newItems: HealthPackage[] = rows.map((row, i) => ({
        id: `PKG-${String(packages.length + i + 1).padStart(3, "0")}`,
        name: String(row.name || ""), services: String(row.services || "").split(",").map(s => s.trim()).filter(Boolean),
        price: Number(row.price) || 0, discountPercent: Number(row.discountPercent) || 0,
        validity: String(row.validity || ""), status: "active" as const, description: String(row.description || ""),
      }));
      setPackages((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Health Packages" description="Create and manage bundled health service packages with discounts">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Package</Button>
      </PageHeader>

      <DataToolbar dateFilter={pkgToolbar.dateFilter} onDateFilterChange={pkgToolbar.setDateFilter} viewMode={pkgToolbar.viewMode} onViewModeChange={pkgToolbar.setViewMode} onExportExcel={pkgToolbar.handleExportExcel} onExportPDF={pkgToolbar.handleExportPDF} onImport={handleImport} onDownloadSample={pkgToolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Packages" value={String(packages.length)} icon={Package} change="All packages" />
        <StatCard title="Active" value={String(activeCount)} icon={Activity} change={`${packages.length > 0 ? Math.round((activeCount / packages.length) * 100) : 0}% active`} changeType="positive" />
        <StatCard title="Avg. Discount" value={`${avgDiscount}%`} icon={Tag} change="Across packages" />
        <StatCard title="Total Services" value={String(new Set(packages.flatMap(p => p.services)).size)} icon={Layers} change="Unique services" />
      </div>

      {pkgToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={packages} keyExtractor={(p) => p.id} />
      ) : (
        <DataGridView columns={columns} data={packages} keyExtractor={(p) => p.id} />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewPkg} onOpenChange={() => setViewPkg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Package Details
            </DialogTitle>
          </DialogHeader>
          {viewPkg && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Package ID</p><p className="font-medium text-foreground">{viewPkg.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewPkg.status} /></div>
                <div><p className="text-xs text-muted-foreground">Package Name</p><p className="font-medium text-foreground">{viewPkg.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Validity</p><p className="font-medium text-foreground">{viewPkg.validity || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-foreground">{formatDualPrice(viewPkg.price)}</p></div>
                <div><p className="text-xs text-muted-foreground">Discount</p><p className="font-medium text-foreground">{viewPkg.discountPercent}%</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Included Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewPkg.services.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>
              {viewPkg.description && (
                <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm text-foreground mt-1">{viewPkg.description}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPkg(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const p = viewPkg; setViewPkg(null); if (p) openEdit(p); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewPkg) printRecordReport({
              id: viewPkg.id, sectionTitle: "Health Package Report", fields: [
                { label: "Package Name", value: viewPkg.name }, { label: "Services", value: viewPkg.services.join(", ") },
                { label: "Price", value: formatDualPrice(viewPkg.price) }, { label: "Discount", value: `${viewPkg.discountPercent}%` },
                { label: "Validity", value: viewPkg.validity }, { label: "Status", value: viewPkg.status },
                { label: "Description", value: viewPkg.description },
              ],
            }); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditPkg(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editPkg ? "Edit Package" : "Add New Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Package Name *</Label>
              <Input placeholder="e.g. Executive Health Package" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price *</Label>
                <Input placeholder="e.g. 2500" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input placeholder="e.g. 15" type="number" value={form.discountPercent} onChange={(e) => update("discountPercent", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Validity</Label>
                <Input placeholder="e.g. 3 Months" value={form.validity} onChange={(e) => update("validity", e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Included Services * <span className="text-muted-foreground text-xs">({form.services.length} selected)</span></Label>
              <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-muted/30 max-h-[180px] overflow-y-auto">
                {availableServices.map((service) => {
                  const selected = form.services.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                        selected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the package..." rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editPkg ? "Save Changes" : "Add Package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePkg} onOpenChange={() => setDeletePkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{deletePkg?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HealthPackagesPage;
