import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";

const doctors = [
  { id: "D001", name: "Dr. Sarah Smith", specialty: "General Medicine", phone: "+1-555-0101", status: "active" as const, patients: 128 },
  { id: "D002", name: "Dr. Raj Patel", specialty: "Pathology", phone: "+1-555-0102", status: "active" as const, patients: 95 },
  { id: "D003", name: "Dr. Emily Williams", specialty: "Orthopedics", phone: "+1-555-0103", status: "active" as const, patients: 76 },
  { id: "D004", name: "Dr. Mark Brown", specialty: "Dermatology", phone: "+1-555-0104", status: "inactive" as const, patients: 42 },
  { id: "D005", name: "Dr. Lisa Lee", specialty: "Cardiology", phone: "+1-555-0105", status: "active" as const, patients: 110 },
];

const columns = [
  { key: "id", header: "ID" },
  { key: "name", header: "Doctor Name" },
  { key: "specialty", header: "Specialty" },
  { key: "phone", header: "Contact" },
  { key: "patients", header: "Patients" },
  { key: "status", header: "Status", render: (d: typeof doctors[0]) => <StatusBadge status={d.status} /> },
];

const DoctorPage = () => {
  const [data, setData] = useState(doctors);
  const toolbar = useDataToolbar({ data: data as unknown as Record<string, unknown>[], dateKey: "", columns, title: "Doctors" });
  const display = toolbar.filteredByDate as unknown as typeof doctors;

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const newItems = rows.map((row, i) => ({
        id: `D${String(data.length + i + 1).padStart(3, "0")}`,
        name: String(row.name || ""), specialty: String(row.specialty || ""),
        phone: String(row.phone || ""), status: "active" as const,
        patients: Number(row.patients) || 0,
      }));
      setData((prev) => [...newItems, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Management" description="Manage doctor profiles, schedules, and assignments">
        <Button><Plus className="w-4 h-4 mr-2" /> Add Doctor</Button>
      </PageHeader>
      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />
      {toolbar.viewMode === "list" ? <DataTable columns={columns} data={display} keyExtractor={(d) => d.id} /> : <DataGridView columns={columns} data={display} keyExtractor={(d) => d.id} />}
    </div>
  );
};

export default DoctorPage;
