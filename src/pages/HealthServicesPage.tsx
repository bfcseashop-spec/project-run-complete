import { useState } from "react";
import { printHealthServiceReport } from "@/lib/printUtils";
import PageHeader from "@/components/PageHeader";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Heart, Plus, Stethoscope, Syringe, Baby, Eye, Printer,
  Pencil, Trash2, Activity, TrendingUp, LayoutGrid, X,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface HealthService {
  id: string;
  name: string;
  category: string;
  price: number;
  status: "active" | "pending" | "completed";
  description: string;
}

const defaultCategories = [
  "General Consultation",
  "Vaccination",
  "Maternal Care",
  "Eye Care",
  "Dental Care",
  "Physiotherapy",
  "Nutrition & Diet",
  "Mental Health",
];

const categoryIcons: Record<string, React.ElementType> = {
  "General Consultation": Stethoscope,
  "Vaccination": Syringe,
  "Maternal Care": Baby,
  "Eye Care": Eye,
};

const categoryColors: Record<string, string> = {
  "General Consultation": "hsl(var(--primary))",
  "Vaccination": "hsl(210, 70%, 50%)",
  "Maternal Care": "hsl(330, 60%, 55%)",
  "Eye Care": "hsl(170, 60%, 40%)",
  "Dental Care": "hsl(45, 70%, 50%)",
  "Physiotherapy": "hsl(260, 50%, 55%)",
  "Nutrition & Diet": "hsl(140, 55%, 45%)",
  "Mental Health": "hsl(200, 60%, 50%)",
};

const initialServices: HealthService[] = [
  { id: "HS-101", name: "General Health Checkup", category: "General Consultation", price: 500, status: "active", description: "Comprehensive physical examination with basic vitals and health assessment." },
  { id: "HS-102", name: "Flu Vaccination", category: "Vaccination", price: 350, status: "active", description: "Annual influenza vaccination for adults and children above 6 months." },
  { id: "HS-103", name: "Prenatal Checkup", category: "Maternal Care", price: 800, status: "active", description: "Routine prenatal visit including ultrasound review and maternal health assessment." },
  { id: "HS-104", name: "Vision Screening", category: "Eye Care", price: 400, status: "active", description: "Standard vision test and eye health screening for all age groups." },
  { id: "HS-105", name: "Child Immunization (DPT)", category: "Vaccination", price: 250, status: "active", description: "Diphtheria, Pertussis, and Tetanus vaccine for infants and children." },
  { id: "HS-106", name: "Diabetes Screening", category: "General Consultation", price: 600, status: "pending", description: "Fasting blood sugar and HbA1c test with doctor consultation." },
  { id: "HS-107", name: "Postnatal Care", category: "Maternal Care", price: 700, status: "completed", description: "Post-delivery health checkup for mother and newborn." },
];

const emptyForm = { name: "", category: "", price: "", status: "active", description: "" };

const HealthServicesPage = () => {
  useSettings();
  const [services, setServices] = useState<HealthService[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<HealthService | null>(null);
  const [deleteService, setDeleteService] = useState<HealthService | null>(null);
  const [viewService, setViewService] = useState<HealthService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const allCategories = [...defaultCategories, ...customCategories];

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const openNew = () => { setEditService(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: HealthService) => {
    setEditService(s);
    setForm({ name: s.name, category: s.category, price: String(s.price), status: s.status, description: s.description });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.price) {
      toast.error("Name, category, and price are required");
      return;
    }
    if (editService) {
      setServices((prev) => prev.map((s) => s.id === editService.id ? {
        ...s, name: form.name, category: form.category, price: parseFloat(form.price),
        status: form.status as HealthService["status"], description: form.description,
      } : s));
      toast.success("Service updated");
    } else {
      const nextId = `HS-${100 + services.length + 1}`;
      setServices((prev) => [{
        id: nextId, name: form.name, category: form.category, price: parseFloat(form.price),
        status: form.status as HealthService["status"], description: form.description,
      }, ...prev]);
      toast.success("Service added");
    }
    setDialogOpen(false);
    setEditService(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (deleteService) {
      setServices((prev) => prev.filter((s) => s.id !== deleteService.id));
      setDeleteService(null);
      toast.success("Service deleted");
    }
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (allCategories.includes(name)) { toast.error("Category already exists"); return; }
    setCustomCategories((prev) => [...prev, name]);
    setNewCategoryName("");
    toast.success("Category added");
  };

  const activeCount = services.filter((s) => s.status === "active").length;
  const pendingCount = services.filter((s) => s.status === "pending").length;
  const totalRevenue = services.reduce((sum, s) => sum + s.price, 0);
  const uniqueCategories = new Set(services.map((s) => s.category)).size;

  const columns = [
    { key: "id", header: "Service ID" },
    {
      key: "name", header: "Service Name", render: (s: HealthService) => {
        const Icon = categoryIcons[s.category] || Heart;
        const color = categoryColors[s.category] || "hsl(var(--primary))";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-foreground leading-tight">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.category}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category", header: "Category", render: (s: HealthService) => {
        const color = categoryColors[s.category] || "hsl(var(--primary))";
        return (
          <Badge variant="outline" className="text-xs font-medium" style={{ borderColor: `${color}40`, color, background: `${color}08` }}>
            {s.category}
          </Badge>
        );
      },
    },
    { key: "price", header: "Price", render: (s: HealthService) => <span className="font-bold text-foreground">{formatDualPrice(s.price)}</span> },
    { key: "status", header: "Status", render: (s: HealthService) => <StatusBadge status={s.status} /> },
    {
      key: "actions", header: "Actions", render: (s: HealthService) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewService(s)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(s)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printHealthServiceReport({
            id: s.id, name: s.name, category: s.category, price: s.price, status: s.status, description: s.description,
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteService(s)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const hsToolbar = useDataToolbar({ data: services as unknown as Record<string, unknown>[], dateKey: "", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Health_Services" });

  const handleImportHS = async (file: File) => {
    const rows = await hsToolbar.handleImport(file);
    if (rows.length > 0) {
      const newItems: HealthService[] = rows.map((row, i) => ({
        id: `HS-${100 + services.length + i + 1}`, name: String(row.name || ""), category: String(row.category || "General Consultation"),
        price: Number(row.price) || 0, status: "active" as const, description: String(row.description || ""),
      }));
      setServices((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Health Services" description="Manage clinic health services, packages, and consultations">
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
      </PageHeader>

      <DataToolbar dateFilter={hsToolbar.dateFilter} onDateFilterChange={hsToolbar.setDateFilter} viewMode={hsToolbar.viewMode} onViewModeChange={hsToolbar.setViewMode} onExportExcel={hsToolbar.handleExportExcel} onExportPDF={hsToolbar.handleExportPDF} onImport={handleImportHS} onDownloadSample={hsToolbar.handleDownloadSample} />

      {/* Enhanced Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(var(--primary))" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(var(--primary))" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>Total Services</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{services.length}</p>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <Heart className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(142, 71%, 45%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(142, 71%, 45%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(142, 71%, 45%)" }}>Active</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{activeCount}</p>
              <p className="text-xs text-muted-foreground">{pendingCount} pending</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(142, 71%, 45%, 0.12)" }}>
              <Activity className="w-6 h-6" style={{ color: "hsl(142, 71%, 45%)" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(260, 50%, 55%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(260, 50%, 55%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(260, 50%, 55%)" }}>Categories</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{uniqueCategories}</p>
              <p className="text-xs text-muted-foreground">{allCategories.length} available</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(260, 50%, 55%, 0.12)" }}>
              <LayoutGrid className="w-6 h-6" style={{ color: "hsl(260, 50%, 55%)" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(45, 70%, 50%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(45, 70%, 50%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(45, 70%, 50%)" }}>Avg. Price</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{formatDualPrice(Math.round(totalRevenue / services.length))}</p>
              <p className="text-xs text-muted-foreground">Per service</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(45, 70%, 50%, 0.12)" }}>
              <TrendingUp className="w-6 h-6" style={{ color: "hsl(45, 70%, 50%)" }} />
            </div>
          </div>
        </div>
      </div>

      {hsToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={services} keyExtractor={(s) => s.id} />
      ) : (
        <DataGridView columns={columns} data={services} keyExtractor={(s) => s.id} />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditService(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editService ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Service Name *</Label>
              <Input placeholder="e.g. General Health Checkup" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price *</Label>
                <Input placeholder="e.g. 500" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
              </div>
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
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the service..." rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editService ? "Save Changes" : "Add Service"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewService} onOpenChange={() => setViewService(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              {(() => {
                const Icon = categoryIcons[viewService?.category || ""] || Heart;
                const color = categoryColors[viewService?.category || ""] || "hsl(var(--primary))";
                return <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}><Icon className="w-4 h-4" style={{ color }} /></div>;
              })()}
              Service Details
            </DialogTitle>
          </DialogHeader>
          {viewService && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Service ID</p><p className="font-medium text-foreground">{viewService.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewService.status} /></div>
                <div><p className="text-xs text-muted-foreground">Service Name</p><p className="font-medium text-foreground">{viewService.name}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="outline" className="text-xs mt-1" style={{
                    borderColor: `${categoryColors[viewService.category] || "hsl(var(--primary))"}40`,
                    color: categoryColors[viewService.category] || "hsl(var(--primary))",
                  }}>{viewService.category}</Badge>
                </div>
                <div><p className="text-xs text-muted-foreground">Price</p><p className="font-bold text-foreground text-lg">{formatDualPrice(viewService.price)}</p></div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{viewService.description || "No description provided."}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewService(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const s = viewService; setViewService(null); if (s) openEdit(s); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewService) printHealthServiceReport({
              id: viewService.id, name: viewService.name, category: viewService.category,
              price: viewService.price, status: viewService.status, description: viewService.description,
            }); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{deleteService?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Manager Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
              />
              <Button onClick={addCategory}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium mb-2">Available Categories</p>
              <div className="flex flex-wrap gap-2">
                {defaultCategories.map((c) => (
                  <Badge key={c} variant="secondary" className="text-sm py-1 px-3">{c}</Badge>
                ))}
                {customCategories.map((c) => (
                  <Badge key={c} variant="outline" className="text-sm py-1 px-3 gap-1">
                    {c}
                    <button
                      onClick={() => {
                        setCustomCategories((prev) => prev.filter((cc) => cc !== c));
                        toast.success("Category removed");
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthServicesPage;
