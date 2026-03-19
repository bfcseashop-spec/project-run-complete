import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";

const dues = [
  { id: "INV-301", patient: "Sarah Johnson", amount: "$450.00", paid: "$200.00", due: "$250.00", date: "2026-03-15", status: "pending" as const },
  { id: "INV-302", patient: "Michael Chen", amount: "$320.00", paid: "$320.00", due: "$0.00", date: "2026-03-14", status: "completed" as const },
  { id: "INV-303", patient: "Emily Davis", amount: "$780.00", paid: "$0.00", due: "$780.00", date: "2026-03-10", status: "critical" as const },
  { id: "INV-304", patient: "James Wilson", amount: "$150.00", paid: "$100.00", due: "$50.00", date: "2026-03-18", status: "pending" as const },
];

const columns = [
  { key: "id", header: "Invoice" },
  { key: "patient", header: "Patient" },
  { key: "amount", header: "Total" },
  { key: "paid", header: "Paid" },
  { key: "due", header: "Due" },
  { key: "date", header: "Date" },
  { key: "status", header: "Status", render: (d: typeof dues[0]) => <StatusBadge status={d.status} /> },
];

const DuesPage = () => {
  const [data, setData] = useState(dues);
  const toolbar = useDataToolbar({ data: data as unknown as Record<string, unknown>[], dateKey: "date", columns, title: "Due_Management" });
  const display = toolbar.filteredByDate as unknown as typeof dues;

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const newItems = rows.map((row, i) => ({
        id: `INV-${300 + data.length + i + 1}`,
        patient: String(row.patient || ""), amount: String(row.amount || "$0"),
        paid: String(row.paid || "$0"), due: String(row.due || "$0"),
        date: String(row.date || new Date().toISOString().split("T")[0]),
        status: "pending" as const,
      }));
      setData((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Due Management" description="Track outstanding payments and collections">
        <Button><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
      </PageHeader>
      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />
      {toolbar.viewMode === "list" ? <DataTable columns={columns} data={display} keyExtractor={(d) => d.id} /> : <DataGridView columns={columns} data={display} keyExtractor={(d) => d.id} />}
    </div>
  );
};

export default DuesPage;
