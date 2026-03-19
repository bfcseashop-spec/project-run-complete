import { useState } from "react";
import { printRecordReport } from "@/lib/printUtils";
import PageHeader from "@/components/PageHeader";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
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
  Heart, Plus, Stethoscope, Syringe, Baby, Eye, Printer,
  Pencil, Trash2, Activity, Users, CalendarCheck,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HealthService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  status: "active" | "pending" | "completed";
  description: string;
}

const categories = [
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

const initialServices: HealthService[] = [
  { id: "HS-101", name: "General Health Checkup", category: "General Consultation", price: 500, duration: "30 min", status: "active", description: "Comprehensive physical examination with basic vitals and health assessment." },
  { id: "HS-102", name: "Flu Vaccination", category: "Vaccination", price: 350, duration: "15 min", status: "active", description: "Annual influenza vaccination for adults and children above 6 months." },
  { id: "HS-103", name: "Prenatal Checkup", category: "Maternal Care", price: 800, duration: "45 min", status: "active", description: "Routine prenatal visit including ultrasound review and maternal health assessment." },
  { id: "HS-104", name: "Vision Screening", category: "Eye Care", price: 400, duration: "20 min", status: "active", description: "Standard vision test and eye health screening for all age groups." },
  { id: "HS-105", name: "Child Immunization (DPT)", category: "Vaccination", price: 250, duration: "10 min", status: "active", description: "Diphtheria, Pertussis, and Tetanus vaccine for infants and children." },
  { id: "HS-106", name: "Diabetes Screening", category: "General Consultation", price: 600, duration: "25 min", status: "pending", description: "Fasting blood sugar and HbA1c test with doctor consultation." },
  { id: "HS-107", name: "Postnatal Care", category: "Maternal Care", price: 700, duration: "40 min", status: "completed", description: "Post-delivery health checkup for mother and newborn." },
];

const emptyForm = { name: "", category: "", price: "", duration: "", status: "active", description: "" };

const HealthServicesPage = () => {
  useSettings();
  const [services, setServices] = useState<HealthService[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<HealthService | null>(null);
  const [deleteService, setDeleteService] = useState<HealthService | null>(null);
  const [form, setForm] = useState(emptyForm);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const openNew = () => { setEditService(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: HealthService) => {
    setEditService(s);
    setForm({ name: s.name, category: s.category, price: String(s.price), duration: s.duration, status: s.status, description: s.description });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.price) return;
    if (editService) {
      setServices((prev) => prev.map((s) => s.id === editService.id ? {
        ...s, name: form.name, category: form.category, price: parseFloat(form.price),
        duration: form.duration, status: form.status as HealthService["status"], description: form.description,
      } : s));
    } else {
      const nextId = `HS-${100 + services.length + 1}`;
      setServices((prev) => [{
        id: nextId, name: form.name, category: form.category, price: parseFloat(form.price),
        duration: form.duration, status: form.status as HealthService["status"], description: form.description,
      }, ...prev]);
    }
    setDialogOpen(false);
    setEditService(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (deleteService) {
      setServices((prev) => prev.filter((s) => s.id !== deleteService.id));
      setDeleteService(null);
    }
  };

  const activeCount = services.filter((s) => s.status === "active").length;
  const totalRevenue = services.reduce((sum, s) => sum + s.price, 0);

  const columns = [
    { key: "id", header: "Service ID" },
    {
      key: "name", header: "Service Name", render: (s: HealthService) => {
        const Icon = categoryIcons[s.category] || Heart;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.category}</p>
            </div>
          </div>
        );
      },
    },
    { key: "price", header: "Price", render: (s: HealthService) => <span className="font-semibold text-foreground">{formatDualPrice(s.price)}</span> },
    { key: "duration", header: "Duration" },
    { key: "status", header: "Status", render: (s: HealthService) => <StatusBadge status={s.status} /> },
    {
      key: "actions", header: "Actions", render: (s: HealthService) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => printRecordReport({
            id: s.id, sectionTitle: "Health Service", fields: [
              { label: "Service Name", value: s.name }, { label: "Category", value: s.category },
              { label: "Price", value: formatDualPrice(s.price) }, { label: "Duration", value: s.duration },
              { label: "Status", value: s.status }, { label: "Description", value: s.description },
            ],
          })}><Eye className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => printRecordReport({
            id: s.id, sectionTitle: "Health Service Report", fields: [
              { label: "Service Name", value: s.name }, { label: "Category", value: s.category },
              { label: "Price", value: formatDualPrice(s.price) }, { label: "Duration", value: s.duration },
              { label: "Status", value: s.status }, { label: "Description", value: s.description },
            ],
          })}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => setDeleteService(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        price: Number(row.price) || 0, duration: String(row.duration || ""), status: "active" as const, description: String(row.description || ""),
      }));
      setServices((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Health Services" description="Manage clinic health services, packages, and consultations">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
      </PageHeader>

      <DataToolbar dateFilter={hsToolbar.dateFilter} onDateFilterChange={hsToolbar.setDateFilter} viewMode={hsToolbar.viewMode} onViewModeChange={hsToolbar.setViewMode} onExportExcel={hsToolbar.handleExportExcel} onExportPDF={hsToolbar.handleExportPDF} onImport={handleImportHS} onDownloadSample={hsToolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Services" value={String(services.length)} icon={Heart} change="All categories" />
        <StatCard title="Active Services" value={String(activeCount)} icon={Activity} change={`${Math.round((activeCount / services.length) * 100)}% active`} changeType="positive" />
        <StatCard title="Categories" value={String(new Set(services.map((s) => s.category)).size)} icon={CalendarCheck} change="Service categories" />
        <StatCard title="Avg. Price" value={formatDualPrice(Math.round(totalRevenue / services.length))} icon={Users} change="Per service" />
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
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price *</Label>
                <Input placeholder="e.g. 500" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Input placeholder="e.g. 30 min" value={form.duration} onChange={(e) => update("duration", e.target.value)} />
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
    </div>
  );
};

export default HealthServicesPage;
