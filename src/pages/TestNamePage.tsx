import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useMemo, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, TestTube, Beaker, Eye, Barcode, Printer, Download, Upload, FileSpreadsheet, FileText, LayoutList, LayoutGrid, FolderPlus, Droplets, X, FlaskConical, Layers, HelpCircle, Settings2 } from "lucide-react";
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

  const defaultUnits = [
    "mg/dL", "g/dL", "g/L", "mmol/L", "µmol/L", "mEq/L", "IU/L", "U/L",
    "ng/mL", "ng/dL", "pg/mL", "µg/dL", "µg/L", "mIU/mL", "µIU/mL",
    "mm/hr", "sec", "cells/µL", "cells/mm³", "x10³/µL", "x10⁶/µL",
    "10^3/uL", "10^6/uL", "million/cmm", "thou/cmm",
    "%", "ratio", "mm Hg", "mL/min", "fL", "pg", "g%",
    "mg/L", "mg/24hr", "mL", "copies/mL", "CFU/mL", "pH",
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
                <Button onClick={printBatchBarcodes} size="sm" variant="secondary">
                  <Printer className="w-4 h-4 mr-1" /> Print {selectedIds.size} Label{selectedIds.size > 1 ? "s" : ""}
                </Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            {/* Service/Test Name */}
            <div className="space-y-1.5">
              <Label className="font-semibold">Service Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2 HABS" className="h-11" />
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{store.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Price <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="h-11" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Optional description for this test..."
              />
            </div>

            {/* Lab Test Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isLabTest"
                  checked={form.isLabTest}
                  onCheckedChange={(v) => setForm({ ...form, isLabTest: !!v })}
                />
                <Label htmlFor="isLabTest" className="font-medium cursor-pointer">
                  Lab Test (creates lab request when added to bill)
                </Label>
              </div>
              {form.isLabTest && (
                <div className="ml-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sampleRequired"
                      checked={form.sampleCollectionRequired}
                      onCheckedChange={(v) => setForm({ ...form, sampleCollectionRequired: !!v })}
                    />
                    <Label htmlFor="sampleRequired" className="font-medium cursor-pointer">
                      Sample collection required
                    </Label>
                  </div>
                  {form.sampleCollectionRequired && (
                    <div className="space-y-1.5 max-w-[200px]">
                      <Label className="text-sm">Sample type</Label>
                      <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v })}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{store.sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Report Parameters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Report Parameters</h3>
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Configure parameters for test result entry. Manual = type value; Dropdown = select from predefined options.
              </p>

              {form.parameters.map((param, idx) => (
                <div key={param.id} className="border border-border rounded-xl p-5 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1">#{idx + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={form.parameters.length <= 1}
                      onClick={() => setForm({ ...form, parameters: form.parameters.filter(p => p.id !== param.id) })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-medium">Parameter</Label>
                      <Input
                        value={param.paramName}
                        onChange={(e) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, paramName: e.target.value } : p) })}
                        placeholder={idx === 0 ? "Auto-filled from test name" : "Parameter name"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-medium">Category</Label>
                      <Select
                        value={param.category}
                        onValueChange={(v) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, category: v } : p) })}
                      >
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{store.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="font-medium">Unit</Label>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <Input
                        value={param.unit}
                        onChange={(e) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, unit: e.target.value } : p) })}
                        placeholder="e.g. mg/dL"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="font-medium">Normal/Reference Ranges</Label>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          value={param.normalRange}
                          onChange={(e) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, normalRange: e.target.value } : p) })}
                          rows={3}
                          placeholder={"e.g. Normal\n<140mg/dL\nPrediabetes\n(140-199)mg/dL"}
                          className="text-sm resize-y"
                        />
                        <Button type="button" variant="outline" size="sm" className="shrink-0 self-end gap-1 h-8"
                          onClick={() => {
                            const lines = param.normalRange.split("\n").filter(l => l.trim());
                            const entries: { label: string; value: string }[] = [];
                            for (let i = 0; i < lines.length; i += 2) {
                              entries.push({ label: lines[i] || "", value: lines[i + 1] || "" });
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
                    <div className="space-y-1.5">
                      <Label className="font-medium">Result Type</Label>
                      <Select
                        value={param.resultType}
                        onValueChange={(v) => setForm({ ...form, parameters: form.parameters.map(p => p.id === param.id ? { ...p, resultType: v as "manual" | "dropdown" } : p) })}
                      >
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual (type value)</SelectItem>
                          <SelectItem value="dropdown">Dropdown (select)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Parameter Button */}
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setForm({ ...form, parameters: [...form.parameters, { id: ++paramCounter, paramName: "", category: form.category, unit: "", normalRange: "", resultType: "manual" }] })}
              >
                <Plus className="w-4 h-4" /> Add parameter
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingTest ? "Update" : "Add Test"}</Button>
          </DialogFooter>
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
          <p className="text-sm text-muted-foreground">Add label/value pairs for normal ranges (e.g. "Normal" → "&lt;140mg/dL").</p>
          <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
            {rangeEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={entry.label}
                  onChange={(e) => setRangeEntries(rangeEntries.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                  placeholder="Label (e.g. Normal)"
                  className="h-9"
                />
                <Input
                  value={entry.value}
                  onChange={(e) => setRangeEntries(rangeEntries.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                  placeholder="Value (e.g. <140mg/dL)"
                  className="h-9"
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
                .filter(e => e.label.trim() || e.value.trim())
                .map(e => `${e.label}\n${e.value}`)
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
