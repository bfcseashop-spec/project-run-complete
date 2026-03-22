import { useState, useMemo } from "react";
import { printRecordReport } from "@/lib/printUtils";
import PageHeader from "@/components/PageHeader";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import { useTestNameStore } from "@/hooks/use-test-name-store";
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
  Activity, Tag, Layers, CheckCircle2, Clock, FileText, TestTube, Search, X,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageTest {
  id: string;
  name: string;
  category: string;
  price: number;
}
interface HealthPackage {
  id: string;
  name: string;
  services: string[];
  tests: PackageTest[];
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
    tests: [{ id: "TN-001", name: "Complete Blood Count", category: "Hematology", price: 350 }, { id: "TN-002", name: "Blood Sugar (Fasting)", category: "Biochemistry", price: 150 }],
    price: 1200, discountPercent: 15, validity: "1 Month", status: "active",
    description: "Essential health screening package with basic vitals, blood work, and heart checkup.",
  },
  {
    id: "PKG-002", name: "Women's Wellness Package", services: ["General Health Checkup", "Prenatal Checkup", "Ultrasound Abdomen", "Blood Test Panel"],
    tests: [{ id: "TN-009", name: "Urine Routine", category: "Urology", price: 200 }, { id: "TN-010", name: "Thyroid Profile", category: "Biochemistry", price: 600 }],
    price: 2500, discountPercent: 20, validity: "3 Months", status: "active",
    description: "Comprehensive women's health package including prenatal and ultrasound services.",
  },
  {
    id: "PKG-003", name: "Child Care Bundle", services: ["Child Immunization (DPT)", "General Health Checkup", "Vision Screening"],
    tests: [],
    price: 800, discountPercent: 10, validity: "6 Months", status: "active",
    description: "Pediatric health package covering vaccination, general checkup, and eye screening.",
  },
  {
    id: "PKG-004", name: "Executive Health Package", services: ["General Health Checkup", "Blood Test Panel", "ECG", "Chest X-Ray", "Ultrasound Abdomen", "Diabetes Screening"],
    tests: [{ id: "TN-001", name: "Complete Blood Count", category: "Hematology", price: 350 }, { id: "TN-004", name: "Lipid Profile", category: "Biochemistry", price: 800 }, { id: "TN-007", name: "Liver Function Test", category: "Biochemistry", price: 900 }, { id: "TN-008", name: "Kidney Function Test", category: "Biochemistry", price: 800 }],
    price: 4500, discountPercent: 25, validity: "1 Year", status: "active",
    description: "Premium comprehensive health assessment for executives with full diagnostics.",
  },
  {
    id: "PKG-005", name: "Dental Care Package", services: ["Dental Cleaning", "General Health Checkup"],
    tests: [],
    price: 600, discountPercent: 5, validity: "6 Months", status: "pending",
    description: "Basic dental hygiene and general health checkup bundle.",
  },
];

const emptyForm = { name: "", services: [] as string[], tests: [] as PackageTest[], price: "", discountPercent: "", validity: "", status: "active", description: "" };

const serviceColors: Record<string, string> = {
  "General Health Checkup": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Flu Vaccination": "bg-blue-50 text-blue-700 border-blue-200",
  "Prenatal Checkup": "bg-pink-50 text-pink-700 border-pink-200",
  "Vision Screening": "bg-violet-50 text-violet-700 border-violet-200",
  "Child Immunization (DPT)": "bg-amber-50 text-amber-700 border-amber-200",
  "Diabetes Screening": "bg-orange-50 text-orange-700 border-orange-200",
  "Postnatal Care": "bg-rose-50 text-rose-700 border-rose-200",
  "Dental Cleaning": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Blood Test Panel": "bg-red-50 text-red-700 border-red-200",
  "ECG": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Chest X-Ray": "bg-slate-50 text-slate-700 border-slate-200",
  "Ultrasound Abdomen": "bg-teal-50 text-teal-700 border-teal-200",
};

const HealthPackagesPage = () => {
  useSettings();
  const { activeTests } = useTestNameStore();
  const [packages, setPackages] = useState<HealthPackage[]>(initialPackages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<HealthPackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<HealthPackage | null>(null);
  const [viewPkg, setViewPkg] = useState<HealthPackage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [testSearch, setTestSearch] = useState("");

  const update = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const openNew = () => { setEditPkg(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: HealthPackage) => {
    setEditPkg(p);
    setForm({ name: p.name, services: [...p.services], tests: [...p.tests], price: String(p.price), discountPercent: String(p.discountPercent), validity: p.validity, status: p.status, description: p.description });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || (form.services.length === 0 && form.tests.length === 0)) return;
    if (editPkg) {
      setPackages((prev) => prev.map((p) => p.id === editPkg.id ? {
        ...p, name: form.name, services: form.services, tests: form.tests, price: parseFloat(form.price),
        discountPercent: parseFloat(form.discountPercent) || 0, validity: form.validity,
        status: form.status as HealthPackage["status"], description: form.description,
      } : p));
    } else {
      const nextId = `PKG-${String(packages.length + 1).padStart(3, "0")}`;
      setPackages((prev) => [{
        id: nextId, name: form.name, services: form.services, tests: form.tests, price: parseFloat(form.price),
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

  const selectedTestIds = new Set(form.tests.map((t) => t.id));

  const toggleTest = (test: typeof activeTests[0]) => {
    if (selectedTestIds.has(test.id)) {
      setForm((f) => ({ ...f, tests: f.tests.filter((t) => t.id !== test.id) }));
    } else {
      setForm((f) => ({ ...f, tests: [...f.tests, { id: test.id, name: test.name, category: test.category, price: test.price }] }));
    }
  };

  const filteredTests = useMemo(() => {
    return activeTests.filter((t) =>
      testSearch === "" || t.name.toLowerCase().includes(testSearch.toLowerCase())
    );
  }, [activeTests, testSearch]);

  const activeCount = packages.filter((p) => p.status === "active").length;
  const avgDiscount = packages.length > 0 ? Math.round(packages.reduce((s, p) => s + p.discountPercent, 0) / packages.length) : 0;
  const totalRevenue = packages.reduce((s, p) => s + p.price, 0);

  const doPrint = (p: HealthPackage) => printRecordReport({
    id: p.id, sectionTitle: "Health Package Report", fields: [
      { label: "Package Name", value: p.name },
      { label: "Status", value: p.status.charAt(0).toUpperCase() + p.status.slice(1) },
      { label: "Price", value: formatDualPrice(p.price) },
      { label: "Discount", value: `${p.discountPercent}%` },
      { label: "Discounted Price", value: formatDualPrice(p.price * (1 - p.discountPercent / 100)) },
      { label: "Validity", value: p.validity },
      { label: "Services", value: p.services.join(", ") },
      { label: "Tests", value: p.tests.length > 0 ? p.tests.map((t) => `${t.name} (${formatDualPrice(t.price)})`).join(", ") : "—" },
      { label: "Description", value: p.description },
    ],
  });

  const columns = [
    { key: "id", header: "Package ID" },
    {
      key: "name", header: "Package Name", render: (p: HealthPackage) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{p.name}</p>
            <p className="text-[11px] text-muted-foreground">{p.services.length} services{p.tests.length > 0 ? ` · ${p.tests.length} tests` : ''} · {p.validity}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price", header: "Price", render: (p: HealthPackage) => (
        <div className="space-y-0.5">
          <span className="font-bold text-foreground tabular-nums">{formatDualPrice(p.price)}</span>
          {p.discountPercent > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0">{p.discountPercent}% off</Badge>
              <span className="text-[10px] text-muted-foreground tabular-nums">{formatDualPrice(p.price * (1 - p.discountPercent / 100))}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "services", header: "Included Services", render: (p: HealthPackage) => (
        <div className="flex flex-wrap gap-1 max-w-[260px]">
          {p.services.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className={`text-[10px] border ${serviceColors[s] || "bg-muted text-muted-foreground border-border"}`}>{s}</Badge>
          ))}
          {p.services.length > 3 && (
            <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => setViewPkg(p)}>+{p.services.length - 3} more</Badge>
          )}
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
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => doPrint(p)}>
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
        tests: [],
        price: Number(row.price) || 0, discountPercent: Number(row.discountPercent) || 0,
        validity: String(row.validity || ""), status: "active" as const, description: String(row.description || ""),
      }));
      setPackages((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Health Packages" description="Create and manage bundled health service packages with discounts">
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Package</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Packages" value={String(packages.length)} icon={Package} change="All packages" />
        <StatCard title="Active Packages" value={String(activeCount)} icon={Activity} change={`${packages.length > 0 ? Math.round((activeCount / packages.length) * 100) : 0}% active`} changeType="positive" />
        <StatCard title="Avg. Discount" value={`${avgDiscount}%`} icon={Tag} change="Across all packages" />
        <StatCard title="Total Value" value={formatDualPrice(totalRevenue)} icon={Layers} change={`${new Set(packages.flatMap(p => p.services)).size} unique services`} />
      </div>

      <DataToolbar dateFilter={pkgToolbar.dateFilter} onDateFilterChange={pkgToolbar.setDateFilter} viewMode={pkgToolbar.viewMode} onViewModeChange={pkgToolbar.setViewMode} onExportExcel={pkgToolbar.handleExportExcel} onExportPDF={pkgToolbar.handleExportPDF} onImport={handleImport} onDownloadSample={pkgToolbar.handleDownloadSample} />

      {pkgToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={packages} keyExtractor={(p) => p.id} />
      ) : (
        <DataGridView columns={columns} data={packages} keyExtractor={(p) => p.id} />
      )}

      {/* ========== Professional View Dialog ========== */}
      <Dialog open={!!viewPkg} onOpenChange={() => setViewPkg(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl">
          {viewPkg && (
            <div>
              {/* Header */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-bold text-foreground">{viewPkg.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{viewPkg.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={viewPkg.status} />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-3 border-b border-border">
                <div className="px-5 py-3.5 border-r border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price</span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums">{formatDualPrice(viewPkg.price)}</p>
                </div>
                <div className="px-5 py-3.5 border-r border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Discount</span>
                  </div>
                  <p className="text-lg font-bold text-success tabular-nums">{viewPkg.discountPercent}%</p>
                  <p className="text-[10px] text-muted-foreground">After: {formatDualPrice(viewPkg.price * (1 - viewPkg.discountPercent / 100))}</p>
                </div>
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Validity</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{viewPkg.validity || "—"}</p>
                </div>
              </div>

              {/* Included Services - Full List */}
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                    Included Services
                  </h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{viewPkg.services.length} services</Badge>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  {viewPkg.services.map((service, i) => (
                    <div
                      key={service}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                        i < viewPkg.services.length - 1 ? "border-b border-border" : ""
                      } ${i % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
                    >
                      <span className="text-xs font-bold text-primary w-5 flex-shrink-0">{i + 1}.</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        serviceColors[service]?.includes("emerald") ? "bg-emerald-500" :
                        serviceColors[service]?.includes("blue") ? "bg-blue-500" :
                        serviceColors[service]?.includes("pink") ? "bg-pink-500" :
                        serviceColors[service]?.includes("violet") ? "bg-violet-500" :
                        serviceColors[service]?.includes("amber") ? "bg-amber-500" :
                        serviceColors[service]?.includes("orange") ? "bg-orange-500" :
                        serviceColors[service]?.includes("rose") ? "bg-rose-500" :
                        serviceColors[service]?.includes("cyan") ? "bg-cyan-500" :
                        serviceColors[service]?.includes("red") ? "bg-red-500" :
                        serviceColors[service]?.includes("indigo") ? "bg-indigo-500" :
                        serviceColors[service]?.includes("slate") ? "bg-slate-500" :
                        serviceColors[service]?.includes("teal") ? "bg-teal-500" :
                        "bg-muted-foreground"
                      }`} />
                      <span className="font-medium text-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Included Tests */}
              {viewPkg.tests.length > 0 && (
                <div className="px-6 py-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TestTube className="w-4 h-4 text-info" />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                      Included Tests
                    </h3>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{viewPkg.tests.length} tests</Badge>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {viewPkg.tests.map((test, i) => (
                      <div
                        key={test.id}
                        className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                          i < viewPkg.tests.length - 1 ? "border-b border-border" : ""
                        } ${i % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-info w-5 flex-shrink-0">{i + 1}.</span>
                          <div className="w-2 h-2 rounded-full bg-info flex-shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{test.name}</span>
                            <Badge variant="outline" className="text-[9px] ml-2 py-0 px-1.5 bg-info/5 border-info/20 text-info">{test.category}</Badge>
                          </div>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{formatDualPrice(test.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-bold text-foreground">
                      Test Total: <span className="text-info ml-1">{formatDualPrice(viewPkg.tests.reduce((s, t) => s + t.price, 0))}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {viewPkg.description && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border">
                    {viewPkg.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-6 py-3">
                <Button variant="outline" size="sm" onClick={() => setViewPkg(null)}>Close</Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-warning hover:bg-warning/10 gap-1.5" onClick={() => { const p = viewPkg; setViewPkg(null); if (p) openEdit(p); }}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 gap-1.5" onClick={() => { if (viewPkg) doPrint(viewPkg); }}>
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Add / Edit Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditPkg(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {editPkg ? "Edit Package" : "Add New Package"}
            </DialogTitle>
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
              <Label className="mb-2 block">
                Included Services *
                <span className="text-muted-foreground text-xs ml-1">({form.services.length} selected)</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-muted/30 max-h-[200px] overflow-y-auto">
                {availableServices.map((service) => {
                  const selected = form.services.includes(service);
                  const colorClass = serviceColors[service] || "";
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`text-left text-xs px-3 py-2 rounded-md border transition-all ${
                        selected
                          ? `${colorClass || "bg-primary/10 border-primary text-primary"} font-semibold shadow-sm`
                          : "bg-background border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {selected && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                        {service}
                      </span>
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

      {/* ========== Delete Confirmation ========== */}
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
