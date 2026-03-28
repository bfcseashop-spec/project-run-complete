import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useMemo, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, TestTube, Beaker, Eye, Barcode, Printer, Download, Upload, FileSpreadsheet, FileText, LayoutList, LayoutGrid, FolderPlus, Droplets, X, FlaskConical, Layers, HelpCircle, Settings2, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { type TestNameEntry } from "@/data/testNameStore";
import { encodeCode128B, barcodeSVG } from "@/lib/barcode";
import { exportToExcel, exportToPDF, generateSampleExcel, importFromExcel } from "@/lib/exportUtils";
import { toast } from "sonner";

const TestNamePage = () => {
  useSettings();
  const store = useTestNameStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestNameEntry | null>(null);
  const [viewTest, setViewTest] = useState<TestNameEntry | null>(null);
  const [barcodeTest, setBarcodeTest] = useState<TestNameEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [sampleTypeDialog, setSampleTypeDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSampleType, setNewSampleType] = useState("");
  const [manageRangeParam, setManageRangeParam] = useState<number | null>(null);
  const [rangeEntries, setRangeEntries] = useState<{ label: string; value: string }[]>([]);
  const [newRangeLabel, setNewRangeLabel] = useState("");
  const [newRangeValue, setNewRangeValue] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState<number | null>(null);
  const [sampleTypeSearch, setSampleTypeSearch] = useState("");
  const [sampleTypeOpen, setSampleTypeOpen] = useState(false);

  const defaultUnits = [
    "g/dL", "%", "10^6/µL", "10^12/L", "10^3/µL", "10^9/L",
    "10^3/µL (or cells/µL)", "10^3/µL (or 10^9/L)", "fL", "pg", "pg/cell",
    "U/L", "mg/dL", "mmol/L", "µmol/L", "mL/min/1.73m²", "mOsm/kg",
    "ng/mL", "pg/mL", "µIU/mL", "pmol/L", "IU/mL", "copies/mL", "IU/L",
    "CFU/mL", "mm/hr", "mg/L", "ng/L", "µg/mL", "µg/L", "µg/dL", "ng/dL",
    "mmHg", "bpm", "breaths/min", "°C", "°F",
    "cells/HPF", "cells/µL", "mEq/L", "mmol/L (electrolytes)",
    "IU", "units (U)", "drops (gtt)", "tablet(s)", "capsule(s)",
    "mL", "L", "g", "mg", "µg", "mIU/mL", "10^3/mm^3",
    "g/L", "sec", "cells/mm³", "ratio", "mL/min", "g%",
    "mg/24hr", "pH", "million/cmm", "thou/cmm",
    "Positive/Negative", "Reactive/Non-Reactive", "Present/Absent",
  ];
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const allUnits = [...new Set([...defaultUnits, ...customUnits])];
  const categoryColors: Record<string, string> = {
    Hematology: "bg-destructive/10 text-destructive border-destructive/30",
    Biochemistry: "bg-warning/10 text-warning border-warning/30",
    Microbiology: "bg-success/10 text-success border-success/30",
    Immunology: "bg-info/10 text-info border-info/30",
    Radiology: "bg-accent/10 text-accent border-accent/30",
    Cardiology: "bg-destructive/15 text-destructive border-destructive/30",
    Urology: "bg-primary/10 text-primary border-primary/30",
    Endocrinology: "bg-warning/15 text-warning border-warning/30",
    General: "bg-muted text-muted-foreground border-border",
  };
  const categoryBorder: Record<string, string> = {
    Hematology: "border-l-destructive",
    Biochemistry: "border-l-warning",
    Microbiology: "border-l-success",
    Immunology: "border-l-info",
    Radiology: "border-l-accent",
    Cardiology: "border-l-destructive",
    Urology: "border-l-primary",
    Endocrinology: "border-l-warning",
    General: "border-l-muted-foreground",
  };
  const catIcon: Record<string, string> = {
    Hematology: "bg-destructive/10 text-destructive",
    Biochemistry: "bg-warning/10 text-warning",
    Microbiology: "bg-success/10 text-success",
    Immunology: "bg-info/10 text-info",
    Radiology: "bg-accent/10 text-accent",
    Cardiology: "bg-destructive/10 text-destructive",
    Urology: "bg-primary/10 text-primary",
    Endocrinology: "bg-warning/10 text-warning",
    General: "bg-muted text-muted-foreground",
  };

  interface ReportParameter {
    id: number;
    paramName: string;
    category: string;
    unit: string;
    normalRange: string;
    resultType: "manual" | "dropdown";
  }

  let paramCounter = 1;

  const [form, setForm] = useState<Omit<TestNameEntry, "id"> & { description: string; isLabTest: boolean; sampleCollectionRequired: boolean; parameters: ReportParameter[] }>({
    name: "", category: "General", sampleType: "blood",
    normalRange: "", unit: "", price: 0, active: true,
    description: "", isLabTest: true, sampleCollectionRequired: true,
    parameters: [{ id: 1, paramName: "", category: "General", unit: "", normalRange: "", resultType: "manual" }],
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const printBatchBarcodes = () => {
    const selected = store.tests.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) { toast.error("No tests selected"); return; }
    const printWin = window.open("", "_blank", "width=700,height=900");
    if (!printWin) return;
    const labels = selected.map((t) => {
      const svg = barcodeSVG(t.id, 220, 50);
      return `<div class="label">
        <div class="clinic">ClinicPOS Laboratory</div>
        <div class="test-name">${t.name}</div>
        <div class="meta">${t.category} · ${t.sampleType.charAt(0).toUpperCase() + t.sampleType.slice(1)} · ${formatPrice(t.price)}</div>
        <div class="barcode-wrap">${svg}</div>
        <div class="code">${t.id}</div>
        
      </div>`;
    }).join("");
    printWin.document.write(`<!DOCTYPE html><html><head><title>Batch Barcodes</title>
      <style>
        @page { margin: 8mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; padding: 4mm; }
        .label { border: 1px solid #ddd; border-radius: 4px; padding: 10px 12px; text-align: center; page-break-inside: avoid; }
        .clinic { font-size: 7px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
        .test-name { font-size: 11px; font-weight: 700; color: #111; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .meta { font-size: 8px; color: #777; margin-bottom: 8px; }
        .barcode-wrap { display: flex; justify-content: center; margin-bottom: 4px; }
        .barcode-wrap svg { width: 220px; height: 50px; }
        .code { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; font-weight: 700; color: #222; }
        .ref { font-size: 7px; color: #999; margin-top: 3px; }
        .header { text-align: center; padding: 8mm 0 4mm; border-bottom: 1px solid #eee; margin-bottom: 4mm; }
        .header h1 { font-size: 16px; font-weight: 700; }
        .header p { font-size: 10px; color: #888; margin-top: 2px; }
      </style></head><body>
      <div class="header"><h1>Barcode Labels — Batch Print</h1><p>${selected.length} label(s) · Printed ${new Date().toLocaleDateString()}</p></div>
      <div class="grid">${labels}</div>
    </body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 300);
  };

  const filtered = store.tests.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const defaultParams = (): ReportParameter[] => [{ id: ++paramCounter, paramName: "", category: "General", unit: "", normalRange: "", resultType: "manual" }];

  const openAdd = () => {
    setEditingTest(null);
    setForm({ name: "", category: "General", sampleType: "blood", normalRange: "", unit: "", price: 0, active: true, description: "", isLabTest: true, sampleCollectionRequired: true, parameters: defaultParams() });
    setDialogOpen(true);
  };

  const openEdit = async (t: TestNameEntry) => {
    setEditingTest(t);
    // Load saved parameters from database
    let params: ReportParameter[] = [];
    try {
      const dbParams = await store.loadParameters(t.id);
      if (dbParams.length > 0) {
        params = dbParams.map((p: any, i: number) => ({
          id: ++paramCounter,
          paramName: p.paramName,
          category: p.category,
          unit: p.unit,
          normalRange: p.normalRange,
          resultType: p.resultType,
        }));
      }
    } catch { /* ignore */ }
    if (params.length === 0) {
      params = [{ id: ++paramCounter, paramName: t.name, category: t.category, unit: t.unit, normalRange: t.normalRange, resultType: "manual" }];
    }
    setForm({ name: t.name, category: t.category, sampleType: t.sampleType, normalRange: t.normalRange, unit: t.unit, price: t.price, active: t.active, description: "", isLabTest: true, sampleCollectionRequired: true, parameters: params });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Test name is required"); return; }
    const firstParam = form.parameters[0];
    const saveData = {
      name: form.name, category: form.category, sampleType: form.sampleType,
      normalRange: firstParam?.normalRange || form.normalRange,
      unit: firstParam?.unit || form.unit,
      price: form.price, active: form.active,
    };
    try {
      let testId: string;
      if (editingTest) {
        await store.updateTest(editingTest.id, saveData);
        testId = editingTest.id;
      } else {
        const newTest = await store.addTest(saveData);
        testId = newTest.id;
      }
      // Save parameters to database
      await store.saveParameters(testId, form.parameters.map((p, i) => ({
        paramName: p.paramName, category: p.category, unit: p.unit,
        normalRange: p.normalRange, resultType: p.resultType, sortOrder: i,
      })));
      toast.success(editingTest ? "Test updated successfully" : `Test added with ${form.parameters.length} parameter(s)`);
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save test");
    }
  };

  const handleDelete = (id: string) => {
    store.removeTest(id);
    toast.success("Test removed");
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await store.removeTest(id);
    }
    toast.success(`${selectedIds.size} test(s) deleted`);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const handlePrint = (t: TestNameEntry) => {
    const printWin = window.open("", "_blank", "width=400,height=300");
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Test: ${t.name}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-bottom:1px solid #eee}td:first-child{font-weight:600;width:40%;color:#555}.header{font-size:18px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #333}</style>
      </head><body>
      <div class="header">${t.name} (${t.id})</div>
      <table>
        <tr><td>Category</td><td>${t.category}</td></tr>
        <tr><td>Sample Type</td><td style="text-transform:capitalize">${t.sampleType}</td></tr>
        
        <tr><td>Price</td><td>${formatPrice(t.price)}</td></tr>
        <tr><td>Status</td><td>${t.active ? "Active" : "Inactive"}</td></tr>
      </table></body></html>
    `);
    printWin.document.close();
    printWin.print();
  };

  const toggleActive = (id: string) => {
    const t = store.tests.find((x) => x.id === id);
    if (t) store.updateTest(id, { active: !t.active });
  };

  const activeCount = store.tests.filter((t) => t.active).length;

  const exportColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Test Name" },
    { key: "category", header: "Category" },
    { key: "sampleType", header: "Sample Type" },
    
    { key: "price", header: "Price" },
    { key: "active", header: "Active" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filtered as unknown as Record<string, unknown>[], exportColumns, "Test_Names");
    toast.success(`Exported ${filtered.length} tests to Excel`);
  };

  const handleExportPDF = () => {
    exportToPDF(filtered as unknown as Record<string, unknown>[], exportColumns, "Test Name Management");
  };

  const handleDownloadSample = () => {
    generateSampleExcel(exportColumns, "Test_Names");
    toast.success("Sample template downloaded");
  };

  const handleImportFile = async (file: File) => {
    try {
      const rows = await importFromExcel(file, exportColumns);
      let added = 0;
      rows.forEach((row) => {
        const name = String(row.name || "").trim();
        if (!name) return;
        if (store.findByName(name)) return;
        store.addTest({
          name,
          category: String(row.category || "General"),
          sampleType: String(row.sampleType || "blood"),
          normalRange: String(row.normalRange || "-"),
          unit: String(row.unit || ""),
          price: Number(row.price) || 0,
          active: row.active !== false && row.active !== "false" && row.active !== "Inactive",
        });
        added++;
      });
      toast.success(`Imported ${added} new tests (${rows.length - added} skipped as duplicates)`);
    } catch {
      toast.error("Failed to import file. Please check the format.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        toast.error("Please upload an Excel (.xlsx/.xls) or CSV file");
        return;
      }
      handleImportFile(file);
      e.target.value = "";
    }
  };

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (store.categories.includes(name)) { toast.error("Category already exists"); return; }
    store.addCategory(name);
    setNewCategory("");
    toast.success(`Category "${name}" added`);
  };

  const handleAddSampleType = () => {
    const name = newSampleType.trim().toLowerCase();
    if (!name) return;
    if (store.sampleTypes.includes(name)) { toast.error("Sample type already exists"); return; }
    store.addSampleType(name);
    setNewSampleType("");
    toast.success(`Sample type "${name}" added`);
  };

  return (
    <div>
      <PageHeader title="Test Name Management" description="Manage available lab test names, pricing, and categories">
        <Button variant="outline" size="sm" onClick={() => setCategoryDialog(true)}>
          <FolderPlus className="w-4 h-4 mr-1" /> Categories
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSampleTypeDialog(true)}>
          <Droplets className="w-4 h-4 mr-1" /> Sample Types
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary"><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><TestTube className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{store.tests.length}</p><p className="text-xs text-muted-foreground">Total Tests</p></div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Beaker className="w-5 h-5 text-success" /></div>
          <div><p className="text-2xl font-bold text-success">{activeCount}</p><p className="text-xs text-muted-foreground">Active Tests</p></div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-warning"><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><FlaskConical className="w-5 h-5 text-warning" /></div>
          <div><p className="text-2xl font-bold text-warning">{store.tests.length - activeCount}</p><p className="text-xs text-muted-foreground">Inactive Tests</p></div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-info"><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><Layers className="w-5 h-5 text-info" /></div>
          <div><p className="text-2xl font-bold text-info">{store.categories.length}</p><p className="text-xs text-muted-foreground">Categories</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Test Directory</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-[220px]" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {store.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* View toggle */}
              <div className="flex border border-border rounded-md">
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setViewMode("list")}>
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Test</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Import</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Import Excel File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSample}>
                    <Download className="w-4 h-4 mr-2" /> Download Sample File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" /> Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" /> Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedIds.size > 0 && (
                <>
                  <Button onClick={printBatchBarcodes} size="sm" variant="secondary">
                    <Printer className="w-4 h-4 mr-1" /> Print {selectedIds.size} Label{selectedIds.size > 1 ? "s" : ""}
                  </Button>
                  <Button onClick={() => setBulkDeleteOpen(true)} size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sample</TableHead>
                    
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className={`${!t.active ? "opacity-50" : ""} ${selectedIds.has(t.id) ? "bg-primary/5" : ""}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={() => toggleSelect(t.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline" className={categoryColors[t.category] || categoryColors.General}>{t.category}</Badge></TableCell>
                      <TableCell className="capitalize">{t.sampleType}</TableCell>
                      
                      <TableCell className="text-right font-medium">{formatPrice(t.price)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`cursor-pointer ${t.active ? "bg-success/15 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}
                          variant="outline"
                          onClick={() => toggleActive(t.id)}
                        >
                          {t.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewTest(t)}><Eye className="w-3.5 h-3.5 text-info" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 text-warning" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/10" title="Barcode" onClick={() => setBarcodeTest(t)}><Barcode className="w-3.5 h-3.5 text-accent" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => handlePrint(t)}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No tests found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((t) => (
                <Card key={t.id} className={`relative border-l-4 ${categoryBorder[t.category] || categoryBorder.General} ${!t.active ? "opacity-50" : ""}`}>
                  <CardContent className="pt-5 pb-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${catIcon[t.category] || catIcon.General}`}>
                          <TestTube className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.id}</p>
                        </div>
                      </div>
                      <Badge
                        className={`cursor-pointer shrink-0 text-[10px] ${t.active ? "bg-success/15 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}
                        variant="outline"
                        onClick={() => toggleActive(t.id)}
                      >
                        {t.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline" className={`ml-1 text-[10px] px-1.5 py-0 ${categoryColors[t.category] || categoryColors.General}`}>{t.category}</Badge></div>
                      <div><span className="text-muted-foreground">Sample:</span> <span className="font-medium capitalize">{t.sampleType}</span></div>
                      
                      <div><span className="text-muted-foreground">Price:</span> <span className="font-medium text-primary">{formatPrice(t.price)}</span></div>
                    </div>
                    <div className="flex justify-end gap-0.5 pt-1 border-t border-border">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewTest(t)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewTest(t)}><Eye className="w-3.5 h-3.5 text-info" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 text-warning" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/10" title="Barcode" onClick={() => setBarcodeTest(t)}><Barcode className="w-3.5 h-3.5 text-accent" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => handlePrint(t)}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">No tests found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Test Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-bold tracking-tight">{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Service Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Service Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Complete Blood Count" className="h-11 bg-muted/30 border-border/60 focus:bg-background transition-colors" />
            </div>

            {/* Category + Price row */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11 bg-muted/30 border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{store.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Price <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="h-11 bg-muted/30 border-border/60 focus:bg-background transition-colors" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Optional description for this test..."
                className="bg-muted/30 border-border/60 focus:bg-background transition-colors resize-y"
              />
            </div>

            {/* Lab Test toggles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="isLabTest"
                  checked={form.isLabTest}
                  onCheckedChange={(v) => setForm({ ...form, isLabTest: !!v })}
                  className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                <Label htmlFor="isLabTest" className="text-sm font-medium cursor-pointer">
                  Lab Test (creates lab request when added to bill)
                </Label>
              </div>
              {form.isLabTest && (
                <div className="ml-7 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="sampleRequired"
                      checked={form.sampleCollectionRequired}
                      onCheckedChange={(v) => setForm({ ...form, sampleCollectionRequired: !!v })}
                      className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    <Label htmlFor="sampleRequired" className="text-sm font-medium cursor-pointer">
                      Sample collection required
                    </Label>
                  </div>
                  {form.sampleCollectionRequired && (
                    <div className="space-y-2 max-w-[220px] relative">
                      <Label className="text-xs text-muted-foreground">Sample type</Label>
                      <div className="relative">
                        <Input
                          value={sampleTypeOpen ? sampleTypeSearch : form.sampleType}
                          onChange={(e) => {
                            setSampleTypeSearch(e.target.value);
                            setSampleTypeOpen(true);
                          }}
                          onFocus={() => {
                            setSampleTypeSearch(form.sampleType);
                            setSampleTypeOpen(true);
                          }}
                          onBlur={() => setTimeout(() => setSampleTypeOpen(false), 200)}
                          placeholder="Search sample type..."
                          className="h-10 bg-muted/30 border-border/60 capitalize"
                          autoComplete="off"
                        />
                        {sampleTypeOpen && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-[200px] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                            {store.sampleTypes
                              .filter(s => s.toLowerCase().includes(sampleTypeSearch.toLowerCase()))
                              .map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  className={`w-full text-left px-3 py-2 text-sm capitalize cursor-pointer flex items-center gap-2 ${form.sampleType === s ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent hover:text-accent-foreground"}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setForm({ ...form, sampleType: s });
                                    setSampleTypeOpen(false);
                                  }}
                                >
                                  {form.sampleType === s && <span className="text-primary">✓</span>}
                                  {s}
                                </button>
                              ))
                            }
                            {sampleTypeSearch.trim() && !store.sampleTypes.some(s => s.toLowerCase() === sampleTypeSearch.toLowerCase()) && (
                              <div className="px-3 py-2 text-xs text-muted-foreground border-t">No match found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider + Parameters Section */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-foreground">Report Parameters</h3>
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground italic mb-4">
                Configure parameters for test result entry. Manual = type value; Dropdown = select from predefined options.
              </p>

              <div className="space-y-4">
                {form.parameters.map((param, idx) => (
                  <div key={param.id} className="border border-border/70 rounded-lg bg-background shadow-sm overflow-hidden">
                    {/* Parameter header bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/50">
                      <span className="text-xs font-bold text-muted-foreground border border-border rounded-full px-3 py-0.5 bg-background">#{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={form.parameters.length <= 1}
                        onClick={() => setForm({ ...form, parameters: form.parameters.filter(p => p.id !== param.id) })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Parameter + Category row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">Parameter</Label>
                          <Input
                            value={param.paramName}
                            onChange={(e) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, paramName: e.target.value } : p) })}
                            placeholder={idx === 0 ? "Auto-filled from test name" : "Parameter name"}
                            className="h-10 bg-muted/20 border-border/60"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">Category</Label>
                          <Select
                            value={param.category}
                            onValueChange={(v) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, category: v } : p) })}
                          >
                            <SelectTrigger className="h-10 bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                            <SelectContent>{store.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Unit + Result Type row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs font-semibold text-foreground">Unit</Label>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <Popover open={unitDropdownOpen === param.id} onOpenChange={(open) => {
                            if (open) {
                              setUnitSearch(param.unit || "");
                              setUnitDropdownOpen(param.id);
                            } else {
                              setUnitDropdownOpen(null);
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start h-10 font-normal bg-muted/20 border-border/60 text-sm"
                              >
                                {param.unit || <span className="text-muted-foreground">Select unit...</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start" side="bottom" sideOffset={4}>
                              <div className="p-2 border-b border-border">
                                <div className="flex items-center gap-2 px-2">
                                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <input
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    placeholder="Search or type unit..."
                                    value={unitSearch}
                                    onChange={(e) => setUnitSearch(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto p-1" style={{ scrollbarWidth: 'thin' }}>
                                {allUnits
                                  .filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()))
                                  .map(u => (
                                    <button
                                      key={u}
                                      type="button"
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-sm transition-colors ${
                                        param.unit === u ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent hover:text-accent-foreground"
                                      }`}
                                      onClick={() => {
                                        setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, unit: u } : p) });
                                        setUnitDropdownOpen(null);
                                      }}
                                    >
                                      {param.unit === u && <Check className="w-3.5 h-3.5 shrink-0" />}
                                      <span className={param.unit === u ? "" : "pl-5"}>{u}</span>
                                    </button>
                                  ))
                                }
                                {unitSearch.trim() && !allUnits.some(u => u.toLowerCase() === unitSearch.toLowerCase()) && (
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground border-t text-primary font-medium mt-1 pt-2"
                                    onClick={() => {
                                      const newUnit = unitSearch.trim();
                                      setCustomUnits(prev => [...prev, newUnit]);
                                      setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, unit: newUnit } : p) });
                                      setUnitDropdownOpen(null);
                                      toast.success(`Unit "${newUnit}" added`);
                                    }}
                                  >
                                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add "{unitSearch.trim()}"
                                  </button>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">Result Type</Label>
                          <Select
                            value={param.resultType}
                            onValueChange={(v) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, resultType: v as "manual" | "dropdown" } : p) })}
                          >
                            <SelectTrigger className="h-10 bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual (type value)</SelectItem>
                              <SelectItem value="dropdown">Dropdown (select)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Normal/Reference Ranges row */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs font-semibold text-foreground">Normal/Reference Ranges</Label>
                          <HelpCircle className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex gap-2 items-end">
                          <Textarea
                            value={param.normalRange}
                            onChange={(e) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, normalRange: e.target.value } : p) })}
                            rows={2}
                            placeholder={"e.g. Normal\n<140 mg/dL"}
                            className="text-sm resize-y bg-muted/20 border-border/60 min-h-[60px]"
                          />
                          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 h-8 text-xs"
                            onClick={() => {
                              const lines = param.normalRange.split("\n").filter(l => l.trim());
                              const entries: { label: string; value: string }[] = [];
                              for (let i = 0; i < lines.length; i++) {
                                entries.push({ label: lines[i] || "", value: "" });
                              }
                              if (entries.length === 0) entries.push({ label: "", value: "" });
                              setRangeEntries(entries);
                              setManageRangeParam(param.id);
                            }}
                          >
                            <Pencil className="w-3 h-3" /> Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Parameter Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-dashed border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                  onClick={() => setForm({ ...form, parameters: [...form.parameters, { id: ++paramCounter, paramName: "", category: form.category, unit: "", normalRange: "", resultType: "manual" }] })}
                >
                  <Plus className="w-4 h-4" /> Add parameter
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="min-w-[100px]">{editingTest ? "Update" : "Add Test"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewTest} onOpenChange={(open) => !open && setViewTest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Test Details</DialogTitle></DialogHeader>
          {viewTest && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TestTube className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{viewTest.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{viewTest.id}</p>
                </div>
                <Badge className="ml-auto" variant={viewTest.active ? "default" : "secondary"}>
                  {viewTest.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Category</p><p className="font-medium">{viewTest.category}</p></div>
                <div><p className="text-muted-foreground text-xs">Sample Type</p><p className="font-medium capitalize">{viewTest.sampleType}</p></div>
                <div><p className="text-muted-foreground text-xs">Normal Range</p><p className="font-medium">{viewTest.normalRange}</p></div>
                <div><p className="text-muted-foreground text-xs">Price</p><p className="font-medium text-primary">{formatPrice(viewTest.price)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTest(null)}>Close</Button>
            <Button onClick={() => { if (viewTest) { openEdit(viewTest); setViewTest(null); } }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Dialog */}
      <Dialog open={!!barcodeTest} onOpenChange={(open) => !open && setBarcodeTest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Barcode className="w-5 h-5" /> Test Barcode Label</DialogTitle></DialogHeader>
          {barcodeTest && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="bg-white border border-border rounded-lg p-6 w-full shadow-sm" id="barcode-label">
                <div className="text-center mb-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">ClinicPOS Laboratory</p>
                </div>
                <div className="text-center mb-3">
                  <p className="text-sm font-bold text-gray-900">{barcodeTest.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{barcodeTest.category} · {barcodeTest.sampleType.charAt(0).toUpperCase() + barcodeTest.sampleType.slice(1)} · {formatPrice(barcodeTest.price)}</p>
                </div>
                <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: barcodeSVG(barcodeTest.id, 260, 60) }} />
                <div className="text-center mt-2">
                  <p className="font-mono text-xs tracking-[0.25em] text-gray-800 font-semibold">{barcodeTest.id}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Ref: {barcodeTest.normalRange}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button className="flex-1" variant="outline" onClick={() => setBarcodeTest(null)}>Close</Button>
                <Button className="flex-1" onClick={() => {
                  const svg = barcodeSVG(barcodeTest.id, 260, 60);
                  const printWin = window.open("", "_blank", "width=450,height=350");
                  if (!printWin) return;
                  printWin.document.write(`<!DOCTYPE html><html><head><title>Barcode: ${barcodeTest.id}</title>
                    <style>
                      @page { size: 80mm 40mm; margin: 4mm; }
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; }
                      .label { width: 300px; padding: 16px 20px; text-align: center; }
                      .clinic { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px; }
                      .test-name { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 2px; }
                      .meta { font-size: 9px; color: #777; margin-bottom: 10px; }
                      .barcode-wrap { display: flex; justify-content: center; margin-bottom: 6px; }
                      .barcode-wrap svg { width: 260px; height: 60px; }
                      .code { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 4px; font-weight: 700; color: #222; }
                      .ref { font-size: 8px; color: #999; margin-top: 4px; }
                    </style></head><body>
                    <div class="label">
                      <div class="clinic">ClinicPOS Laboratory</div>
                      <div class="test-name">${barcodeTest.name}</div>
                      <div class="meta">${barcodeTest.category} · ${barcodeTest.sampleType.charAt(0).toUpperCase() + barcodeTest.sampleType.slice(1)} · ${formatPrice(barcodeTest.price)}</div>
                      <div class="barcode-wrap">${svg}</div>
                      <div class="code">${barcodeTest.id}</div>
                      <div class="ref">Ref: ${barcodeTest.normalRange}</div>
                    </div></body></html>`);
                  printWin.document.close();
                  setTimeout(() => printWin.print(), 200);
                }}>
                  <Printer className="w-4 h-4 mr-1" /> Print Label
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderPlus className="w-5 h-5" /> Manage Categories</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {store.categories.map((cat) => {
                const count = store.tests.filter((t) => t.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 group">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{cat}</Badge>
                      <span className="text-xs text-muted-foreground">{count} test{count !== 1 ? "s" : ""}</span>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => {
                        if (count > 0) { toast.error(`Cannot delete "${cat}" — ${count} test(s) using it`); return; }
                        store.removeCategory(cat);
                        toast.success(`Category "${cat}" removed`);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCategoryDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sample Type Management Dialog */}
      <Dialog open={sampleTypeDialog} onOpenChange={setSampleTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Droplets className="w-5 h-5" /> Manage Sample Types</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="New sample type name..."
                value={newSampleType}
                onChange={(e) => setNewSampleType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSampleType()}
              />
              <Button onClick={handleAddSampleType} size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {store.sampleTypes.map((st) => {
                const count = store.tests.filter((t) => t.sampleType === st).length;
                return (
                  <div key={st} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 group">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{st}</Badge>
                      <span className="text-xs text-muted-foreground">{count} test{count !== 1 ? "s" : ""}</span>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => {
                        if (count > 0) { toast.error(`Cannot delete "${st}" — ${count} test(s) using it`); return; }
                        store.removeSampleType(st);
                        toast.success(`Sample type "${st}" removed`);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSampleTypeDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Normal Ranges Dialog */}
      <Dialog open={manageRangeParam !== null} onOpenChange={(open) => { if (!open) setManageRangeParam(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" /> Manage Reference Ranges</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Add reference range entries (e.g. "Normal &lt;140 mg/dL").</p>
          <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
            {rangeEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={entry.label}
                  onChange={(e) => setRangeEntries(rangeEntries.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                  placeholder="e.g. Normal <140 mg/dL"
                  className="h-9 flex-1"
                />
                <Button
                  type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                  disabled={rangeEntries.length <= 1}
                  onClick={() => setRangeEntries(rangeEntries.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setRangeEntries([...rangeEntries, { label: "", value: "" }])}>
            <Plus className="w-3.5 h-3.5" /> Add Range
          </Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageRangeParam(null)}>Cancel</Button>
            <Button onClick={() => {
              const text = rangeEntries
                .filter(e => e.label.trim())
                .map(e => e.label.trim())
                .join("\n");
              if (manageRangeParam !== null) {
                setForm({ ...form, parameters: form.parameters.map(p => p.id === manageRangeParam ? { ...p, normalRange: text } : p) });
              }
              setManageRangeParam(null);
              toast.success("Reference ranges updated");
            }}>Save Ranges</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestNamePage;
