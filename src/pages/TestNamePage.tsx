import { formatPrice, formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Pencil, Trash2, TestTube, Beaker, Eye, Barcode, Printer } from "lucide-react";
import { sampleTypes } from "@/data/labTests";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { testCategories, type TestNameEntry } from "@/data/testNameStore";
import { encodeCode128B, barcodeSVG } from "@/lib/barcode";
import { toast } from "sonner";

const TestNamePage = () => {
  useSettings();
  const store = useTestNameStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestNameEntry | null>(null);
  const [viewTest, setViewTest] = useState<TestNameEntry | null>(null);
  const [barcodeTest, setBarcodeTest] = useState<TestNameEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<Omit<TestNameEntry, "id">>({
    name: "", category: "General", sampleType: "blood",
    normalRange: "", unit: "", price: 0, active: true,
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
        <div class="ref">Ref: ${t.normalRange} ${t.unit}</div>
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

  const openAdd = () => {
    setEditingTest(null);
    setForm({ name: "", category: "General", sampleType: "blood", normalRange: "", unit: "", price: 0, active: true });
    setDialogOpen(true);
  };

  const openEdit = (t: TestNameEntry) => {
    setEditingTest(t);
    setForm({ name: t.name, category: t.category, sampleType: t.sampleType, normalRange: t.normalRange, unit: t.unit, price: t.price, active: t.active });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Test name is required"); return; }
    if (editingTest) {
      store.updateTest(editingTest.id, form);
      toast.success("Test updated successfully");
    } else {
      store.addTest(form);
      toast.success("Test added successfully");
    }
    setDialogOpen(false);
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
        <tr><td>Normal Range</td><td>${t.normalRange} ${t.unit}</td></tr>
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

  return (
    <div>
      <PageHeader title="Test Name Management" description="Manage available lab test names, pricing, and categories" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><TestTube className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{store.tests.length}</p><p className="text-xs text-muted-foreground">Total Tests</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Beaker className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active Tests</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><TestTube className="w-5 h-5 text-muted-foreground" /></div>
          <div><p className="text-2xl font-bold">{store.tests.length - activeCount}</p><p className="text-xs text-muted-foreground">Inactive Tests</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Beaker className="w-5 h-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{new Set(store.tests.map((t) => t.category)).size}</p><p className="text-xs text-muted-foreground">Categories</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Test Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-[220px]" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {testCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Test</Button>
              {selectedIds.size > 0 && (
                <Button onClick={printBatchBarcodes} size="sm" variant="secondary">
                  <Printer className="w-4 h-4 mr-1" /> Print {selectedIds.size} Label{selectedIds.size > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Normal Range</TableHead>
                  <TableHead>Unit</TableHead>
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
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell className="capitalize">{t.sampleType}</TableCell>
                    <TableCell className="text-xs">{t.normalRange}</TableCell>
                    <TableCell className="text-xs">{t.unit}</TableCell>
                    <TableCell className="text-right font-medium">{formatDualPrice(t.price)}</TableCell>
                    <TableCell>
                      <Badge
                        className="cursor-pointer"
                        variant={t.active ? "default" : "secondary"}
                        onClick={() => toggleActive(t.id)}
                      >
                        {t.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewTest(t)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Barcode" onClick={() => setBarcodeTest(t)}><Barcode className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => handlePrint(t)}><Printer className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No tests found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <label className="text-sm font-medium">Test Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Complete Blood Count" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{testCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sample Type</label>
                <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Normal Range</label>
                <Input value={form.normalRange} onChange={(e) => setForm({ ...form, normalRange: e.target.value })} placeholder="e.g. 70-100" />
              </div>
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. mg/dL" />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
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
                <div><p className="text-muted-foreground text-xs">Normal Range</p><p className="font-medium">{viewTest.normalRange} {viewTest.unit}</p></div>
                <div><p className="text-muted-foreground text-xs">Price</p><p className="font-medium text-primary">{formatDualPrice(viewTest.price)}</p></div>
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
              {/* Label preview */}
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
                  <p className="text-[9px] text-gray-400 mt-1">Ref: {barcodeTest.normalRange} {barcodeTest.unit}</p>
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
                      <div class="ref">Ref: ${barcodeTest.normalRange} ${barcodeTest.unit}</div>
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
    </div>
  );
};

export default TestNamePage;
