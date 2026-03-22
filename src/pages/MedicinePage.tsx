import { useState, useEffect, useRef, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Pencil, Eye, Printer, Search, Package, PackageCheck,
  AlertTriangle, PackageX, DollarSign, TrendingUp, Upload, X, Calendar,
  Barcode as BarcodeIcon, Image as ImageIcon, Pill, ShoppingCart, Tag, Info, Link,
} from "lucide-react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
  getMedicines, addMedicine, updateMedicine, deleteMedicine, subscribeMedicines, Medicine,
} from "@/data/medicineStore";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";

const categories = [
  "Antibiotic", "Analgesic", "Antidiabetic", "Antacid", "Antihistamine",
  "Cardiovascular", "Dermatology", "Injection", "IV Fluid", "Syrup",
  "Tablet", "Capsule", "Sachets", "Supplement", "Other",
];
const units = ["Tabs", "Caps", "Pieces", "Vials", "Amps", "Bottles", "Sachets", "Syringes", "Tubes"];

const emptyForm = {
  name: "", manufacturer: "", boxNo: "", category: "Tablet", purchasePrice: 0,
  price: 0, stock: 0, unit: "Box", soldOut: 0, image: "", expiry: "",
  batchNo: "", stockAlert: 10, imageUrl: "",
};

const unitTypes = ["Box", "Pieces", "Tabs", "Caps", "Vials", "Amps", "Bottles", "Sachets", "Syringes", "Tubes", "Strips"];

const MedicinePage = () => {
  useSettings();
  const [data, setData] = useState(getMedicines());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [viewMed, setViewMed] = useState<Medicine | null>(null);
  const [deleteMed, setDeleteMed] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    const unsub = subscribeMedicines(() => setData([...getMedicines()]));
    return unsub;
  }, []);

  const openAdd = () => { setEditMed(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Medicine) => {
    setEditMed(m);
    setForm({
      name: m.name, manufacturer: m.manufacturer, boxNo: m.boxNo, category: m.category,
      purchasePrice: m.purchasePrice, price: m.price, stock: m.stock, unit: m.unit,
      soldOut: m.soldOut, image: m.image, expiry: m.expiry,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, image: url }));
    toast.success("Image added");
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Medicine name is required"); return; }
    if (editMed) {
      updateMedicine(editMed.id, { ...form });
      toast.success("Medicine updated");
    } else {
      addMedicine({ ...form });
      toast.success("Medicine added");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteMed) {
      deleteMedicine(deleteMed.id);
      setDeleteMed(null);
      toast.success("Medicine deleted");
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteMedicine(id));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    toast.success("Selected medicines deleted");
  };

  const handlePrint = (m: Medicine) => {
    printRecordReport({
      id: m.id, sectionTitle: "Medicine Report", photo: m.image || undefined,
      fields: [
        { label: "Name", value: m.name }, { label: "Manufacturer", value: m.manufacturer },
        { label: "Category", value: m.category }, { label: "Box No.", value: m.boxNo },
        { label: "Purchase Price", value: `$${m.purchasePrice.toFixed(2)}` },
        { label: "Selling Price", value: `$${m.price.toFixed(2)}` },
        { label: "Quantity", value: `${m.stock} ${m.unit}` },
        { label: "Sold Out", value: String(m.soldOut) },
        { label: "Available", value: String(m.stock - m.soldOut) },
        { label: "Expiry Date", value: m.expiry },
        { label: "Status", value: m.status.replace("-", " ") },
      ],
    });
  };

  // Filters
  const filtered = data.filter((m) => {
    const matchSearch = searchTerm === "" ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.boxNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === "all" || m.category === filterCategory;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  // Stats
  const totalItems = data.length;
  const inStock = data.filter((m) => m.status === "in-stock").length;
  const lowStock = data.filter((m) => m.status === "low-stock").length;
  const outOfStock = data.filter((m) => m.status === "out-of-stock").length;
  const purchaseValue = data.reduce((s, m) => s + m.purchasePrice * m.stock, 0);
  const salesValue = data.reduce((s, m) => s + m.price * m.stock, 0);

  // Low stock alerts
  const lowStockItems = data.filter((m) => m.status === "low-stock" || m.status === "out-of-stock");

  const usedCategories = [...new Set(data.map((m) => m.category))];

  const columns = [
    {
      key: "image", header: "Image",
      render: (m: Medicine) => (
        <div className="w-10 h-10 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center">
          {m.image ? (
            <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "name", header: "Medicine Name",
      render: (m: Medicine) => (
        <div>
          <p className="font-semibold text-card-foreground text-sm">{m.name}</p>
          <p className="text-xs text-muted-foreground">{m.manufacturer}</p>
        </div>
      ),
    },
    { key: "boxNo", header: "Box No." },
    {
      key: "category", header: "Category",
      render: (m: Medicine) => (
        <Badge variant="outline" className="border-primary/30 text-primary text-xs font-medium">{m.category}</Badge>
      ),
    },
    {
      key: "purchasePrice", header: "Purchase Price",
      render: (m: Medicine) => (
        <span className="text-orange-600 font-semibold text-sm">$ {m.purchasePrice.toFixed(2)}</span>
      ),
    },
    {
      key: "price", header: "Selling Price",
      render: (m: Medicine) => (
        <span className="text-primary font-semibold text-sm">$ {m.price.toFixed(2)}</span>
      ),
    },
    {
      key: "stock", header: "Quantity",
      render: (m: Medicine) => (
        <span className="font-bold text-info text-sm">{m.stock}</span>
      ),
    },
    {
      key: "unit", header: "Unit",
      render: (m: Medicine) => (
        <Badge variant="secondary" className="text-xs">{m.unit}</Badge>
      ),
    },
    {
      key: "soldOut", header: "Sold Out",
      render: (m: Medicine) => (
        <span className={`text-xs font-semibold ${m.soldOut > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
          {m.soldOut} sold
        </span>
      ),
    },
    {
      key: "available", header: "Available",
      render: (m: Medicine) => {
        const avail = m.stock - m.soldOut;
        return <span className="font-bold text-card-foreground text-sm">{avail}</span>;
      },
    },
    {
      key: "status", header: "Status",
      render: (m: Medicine) => {
        const mapped = m.status === "in-stock" ? "active" : m.status === "low-stock" ? "pending" : "inactive";
        const labels: Record<string, string> = { "in-stock": "In Stock", "low-stock": "Low Stock", "out-of-stock": "Out of Stock" };
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            m.status === "in-stock" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
            m.status === "low-stock" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
            "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              m.status === "in-stock" ? "bg-emerald-500" : m.status === "low-stock" ? "bg-amber-500" : "bg-red-500"
            }`} />
            {labels[m.status]}
          </span>
        );
      },
    },
    {
      key: "expiry", header: "Expiry Date",
      render: (m: Medicine) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {m.expiry}
        </div>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (m: Medicine) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewMed(m)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(m)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => handlePrint(m)}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50" title="Barcode" onClick={() => printBarcode(m.id, m.name)}>
            <BarcodeIcon className="w-3.5 h-3.5 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteMed(m)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({ data: data as unknown as Record<string, unknown>[], dateKey: "expiry", columns: columns.map((c) => ({ key: c.key, header: c.header })), title: "Medicines" });

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      rows.forEach((row) => {
        addMedicine({
          name: String(row.name || ""),
          manufacturer: String(row.manufacturer || ""),
          boxNo: String(row.boxNo || "-"),
          category: String(row.category || "Other"),
          purchasePrice: Number(row.purchasePrice) || 0,
          price: Number(row.price) || 0,
          stock: Number(row.stock) || 0,
          unit: String(row.unit || "Pieces"),
          soldOut: Number(row.soldOut) || 0,
          image: "",
          expiry: String(row.expiry || ""),
        });
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Medicine" description="Manage medicine inventory, stock levels, and pricing">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Medicine</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Items" value={String(totalItems)} icon={Package} />
        <StatCard title="In Stock" value={String(inStock)} icon={PackageCheck} />
        <StatCard title="Low Stock" value={String(lowStock)} icon={AlertTriangle} />
        <StatCard title="Out of Stock" value={String(outOfStock)} icon={PackageX} />
        <StatCard title="Purchase Value" value={`$${purchaseValue.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Sales Value" value={`$${salesValue.toFixed(2)}`} icon={TrendingUp} />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-sm">Low Stock Alert - {lowStockItems.length} medicine(s) below threshold</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStockItems.slice(0, 5).map((m) => (
              <Badge key={m.id} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30">
                {m.name} ({m.stock - m.soldOut} left)
              </Badge>
            ))}
            {lowStockItems.length > 5 && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                +{lowStockItems.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-card-foreground">Medicine Management</span>
          <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, batch, manufacturer..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Category</SelectItem>
              {usedCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table with Pagination */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
        const safeCurrentPage = Math.min(currentPage, totalPages);
        const startIdx = (safeCurrentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, filtered.length);
        const paginatedData = filtered.slice(startIdx, endIdx);

        return (
          <>
            <ScrollArea className="w-full rounded-lg border border-border">
              <div className="min-w-[1200px]">
                {toolbar.viewMode === "list" ? (
                  <DataTable columns={columns} data={paginatedData} keyExtractor={(m) => (m as Medicine).id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
                ) : (
                  <DataGridView columns={columns} data={paginatedData} keyExtractor={(m) => (m as Medicine).id} />
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-card-foreground">{filtered.length > 0 ? startIdx + 1 : 0}-{endIdx}</span> of <span className="font-semibold text-card-foreground">{filtered.length}</span> medicines
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) { page = i + 1; }
                  else if (safeCurrentPage <= 3) { page = i + 1; }
                  else if (safeCurrentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                  else { page = safeCurrentPage - 2 + i; }
                  return (
                    <Button key={page} variant={page === safeCurrentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        );
      })()}

      {/* View Dialog */}
      <Dialog open={!!viewMed} onOpenChange={(open) => !open && setViewMed(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Medicine Details</DialogTitle>
            <DialogDescription>Viewing {viewMed?.name}</DialogDescription>
          </DialogHeader>
          {viewMed && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 pb-3 border-b border-border">
                <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {viewMed.image ? (
                    <img src={viewMed.image} alt={viewMed.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{viewMed.name}</h3>
                  <p className="text-xs text-muted-foreground">{viewMed.manufacturer}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">{viewMed.category}</Badge>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      viewMed.status === "in-stock" ? "bg-emerald-50 text-emerald-600" :
                      viewMed.status === "low-stock" ? "bg-amber-50 text-amber-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {viewMed.status === "in-stock" ? "In Stock" : viewMed.status === "low-stock" ? "Low Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Medicine ID</p><p className="font-mono text-xs">{viewMed.id}</p></div>
                <div><p className="text-muted-foreground text-xs">Box No.</p><p className="font-medium">{viewMed.boxNo}</p></div>
                <div><p className="text-muted-foreground text-xs">Purchase Price (Per Pcs)</p><p className="font-medium text-orange-600">${viewMed.purchasePrice.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground text-xs">Selling Price (Per Pcs)</p><p className="font-medium text-primary">${viewMed.price.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground text-xs">Quantity (Total Pcs)</p><p className="font-bold text-info">{viewMed.stock}</p></div>
                <div><p className="text-muted-foreground text-xs">Unit</p><p className="font-medium">{viewMed.unit}</p></div>
                <div><p className="text-muted-foreground text-xs">Sold Out</p><p className="font-medium text-orange-500">{viewMed.soldOut} sold</p></div>
                <div><p className="text-muted-foreground text-xs">Available</p><p className="font-bold">{viewMed.stock - viewMed.soldOut}</p></div>
                <div><p className="text-muted-foreground text-xs">Expiry Date</p><p className="font-medium">{viewMed.expiry}</p></div>
                <div><p className="text-muted-foreground text-xs">Total Purchase Value</p><p className="font-medium">${(viewMed.purchasePrice * viewMed.stock).toFixed(2)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMed(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const m = viewMed; setViewMed(null); if (m) openEdit(m); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewMed) handlePrint(viewMed); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMed ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
            <DialogDescription>{editMed ? `Editing ${editMed.name}` : "Enter the medicine details below"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Image Upload */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/60 transition-colors flex items-center justify-center overflow-hidden bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.image ? (
                    <img src={form.image} alt="Medicine" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                {form.image && (
                  <button
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/80"
                    onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold">Medicine Image</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Upload a product photo. Max 5MB, JPG/PNG.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Image
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

            {/* Name & Manufacturer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input placeholder="e.g. Amoxicillin 500mg" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Manufacturer</Label>
                <Input placeholder="e.g. BBCA Pharma" value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} />
              </div>
            </div>

            {/* Category, Box No */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Box No.</Label>
                <Input placeholder="-" value={form.boxNo} onChange={(e) => setForm((p) => ({ ...p, boxNo: e.target.value }))} />
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price (Per Pcs) $</Label>
                <Input type="number" min={0} step="0.01" value={form.purchasePrice} onChange={(e) => setForm((p) => ({ ...p, purchasePrice: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Selling Price (Per Pcs) $</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              </div>
            </div>

            {/* Quantity, Unit, Sold Out */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity (Total Pcs)</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry} onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editMed ? "Update Medicine" : "Add Medicine"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteMed} onOpenChange={(open) => !open && setDeleteMed(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteMed?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Medicine(s)</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the selected medicines.</AlertDialogDescription>
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

export default MedicinePage;
