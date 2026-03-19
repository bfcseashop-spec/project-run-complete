import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

const DoctorPage = () => (
  <div className="space-y-6">
    <PageHeader title="Doctor Management" description="Manage doctor profiles, schedules, and assignments">
      <Button><Plus className="w-4 h-4 mr-2" /> Add Doctor</Button>
    </PageHeader>
    <DataTable columns={columns} data={doctors} keyExtractor={(d) => d.id} />
  </div>
);

export default DoctorPage;
