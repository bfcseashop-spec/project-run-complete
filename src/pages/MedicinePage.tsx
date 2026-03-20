import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const medicines = [
  { id: "M001", name: "Amoxicillin 500mg", category: "Antibiotic", stock: 240, unit: "Caps", expiry: "2025-12-15", status: "in-stock" as const },
  { id: "M002", name: "Paracetamol 650mg", category: "Analgesic", stock: 500, unit: "Tabs", expiry: "2026-03-20", status: "in-stock" as const },
  { id: "M003", name: "Metformin 500mg", category: "Antidiabetic", stock: 18, unit: "Tabs", expiry: "2025-08-10", status: "low-stock" as const },
  { id: "M004", name: "Omeprazole 20mg", category: "Antacid", stock: 0, unit: "Caps", expiry: "2025-06-01", status: "out-of-stock" as const },
  { id: "M005", name: "Cetirizine 10mg", category: "Antihistamine", stock: 150, unit: "Tabs", expiry: "2026-01-30", status: "in-stock" as const },
  { id: "M006", name: "Azithromycin 250mg", category: "Antibiotic", stock: 45, unit: "Tabs", expiry: "2025-11-22", status: "low-stock" as const },
];

const columns = [
  { key: "id", header: "Code" },
  { key: "name", header: "Medicine Name" },
  { key: "category", header: "Category" },
  { key: "stock", header: "Stock", render: (m: typeof medicines[0]) => `${m.stock} ${m.unit}` },
  { key: "expiry", header: "Expiry Date" },
  { key: "status", header: "Status", render: (m: typeof medicines[0]) => <StatusBadge status={m.status} /> },
];

const MedicinePage = () => {
  const [data, setData] = useState(medicines);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const toolbar = useDataToolbar({ data: data as unknown as Record<string, unknown>[], dateKey: "expiry", columns, title: "Medicines" });
  const display = toolbar.filteredByDate as unknown as typeof medicines;

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const newItems = rows.map((row, i) => ({
        id: `M${String(data.length + i + 1).padStart(3, "0")}`,
        name: String(row.name || ""), category: String(row.category || ""),
        stock: Number(row.stock) || 0, unit: String(row.unit || "Tabs"),
        expiry: String(row.expiry || ""), status: "in-stock" as const,
      }));
      setData((prev) => [...newItems, ...prev]);
    }
  };

  const handleBulkDelete = () => {
    setData((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Medicine Management" description="Track inventory, stock levels, and expiry dates">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
        <Button><Plus className="w-4 h-4 mr-2" /> Add Medicine</Button>
      </PageHeader>
      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />
      {toolbar.viewMode === "list" ? <DataTable columns={columns} data={display} keyExtractor={(m) => m.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} /> : <DataGridView columns={columns} data={display} keyExtractor={(m) => m.id} />}

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Medicine(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected medicine(s)? This action cannot be undone.
            </AlertDialogDescription>
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
