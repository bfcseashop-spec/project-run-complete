import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

const MedicinePage = () => (
  <div className="space-y-6">
    <PageHeader title="Medicine Management" description="Track inventory, stock levels, and expiry dates">
      <Button><Plus className="w-4 h-4 mr-2" /> Add Medicine</Button>
    </PageHeader>
    <DataTable columns={columns} data={medicines} keyExtractor={(m) => m.id} />
  </div>
);

export default MedicinePage;
