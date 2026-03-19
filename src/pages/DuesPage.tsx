import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

const DuesPage = () => (
  <div className="space-y-6">
    <PageHeader title="Due Management" description="Track outstanding payments and collections">
      <Button><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
    </PageHeader>
    <DataTable columns={columns} data={dues} keyExtractor={(d) => d.id} />
  </div>
);

export default DuesPage;
