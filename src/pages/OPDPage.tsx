import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
import { printRecordReport } from "@/lib/printUtils";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { opdPatients, type OPDPatient } from "@/data/opdPatients";
import { initPatients, getPatients, addPatient, updatePatient, removePatient, subscribe } from "@/data/patientStore";
import RegisterPatientDialog from "@/components/RegisterPatientDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

initPatients(opdPatients);

const OPDPage = () => {
  const [patients, setPatients] = useState<OPDPatient[]>(getPatients());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<OPDPatient | null>(null);
  const [deletePatient, setDeletePatient] = useState<OPDPatient | null>(null);

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);

  const handleRegister = (patient: OPDPatient) => {
    if (editPatient) {
      updatePatient(editPatient.id, patient);
    } else {
      addPatient(patient);
    }
    setDialogOpen(false);
    setEditPatient(null);
  };

  const handleEdit = (patient: OPDPatient) => {
    setEditPatient(patient);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletePatient) {
      removePatient(deletePatient.id);
      setDeletePatient(null);
    }
  };

  const nextToken = patients.length > 0
    ? Math.max(...patients.map((p) => parseInt(p.id.replace("OPD-", "")))) + 1
    : 401;

  const columns = [
    { key: "id", header: "Token" },
    { key: "name", header: "Patient Name" },
    { key: "age", header: "Age/Gender", render: (p: OPDPatient) => `${p.age} / ${p.gender}` },
    { key: "phone", header: "Phone", render: (p: OPDPatient) => p.phone || "—" },
    { key: "bloodType", header: "Blood", render: (p: OPDPatient) => p.bloodType || "—" },
    { key: "patientType", header: "Type", render: (p: OPDPatient) => p.patientType || "—" },
    { key: "complaint", header: "Complaint" },
    { key: "doctor", header: "Doctor" },
    { key: "time", header: "Time" },
    { key: "status", header: "Status", render: (p: OPDPatient) => <StatusBadge status={p.status} /> },
    {
      key: "actions", header: "Actions", render: (p: OPDPatient) => {
        const fields = [
          { label: "Patient Name", value: p.name }, { label: "Age", value: String(p.age) },
          { label: "Gender", value: p.gender }, { label: "Blood Type", value: p.bloodType || "N/A" },
          { label: "Patient Type", value: p.patientType || "N/A" }, { label: "Phone", value: p.phone || "N/A" },
          { label: "Complaint", value: p.complaint }, { label: "Doctor", value: p.doctor },
          { label: "Time", value: p.time }, { label: "Status", value: p.status },
          { label: "Medical History", value: p.medicalHistory || "N/A" },
        ];
        return (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => printRecordReport({ id: p.id, sectionTitle: "OPD Patient Record", fields })}><Eye className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => handleEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => printRecordReport({ id: p.id, sectionTitle: "OPD Report", fields })}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => setDeletePatient(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        );
      },
    },
  ];

  const opdToolbar = useDataToolbar({ data: patients as unknown as Record<string, unknown>[], dateKey: "", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "OPD" });

  const handleImportOPD = async (file: File) => {
    const rows = await opdToolbar.handleImport(file);
    if (rows.length > 0) {
      rows.forEach((row) => {
        addPatient({
          id: `OPD-${nextToken}`,
          name: String(row.name || ""), age: Number(row.age) || 0,
          gender: String(row.gender || "Male"), complaint: String(row.complaint || ""),
          doctor: String(row.doctor || ""), time: String(row.time || ""),
          status: "waiting",
        } as unknown as OPDPatient);
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="OPD Section" description="Manage outpatient visits and registrations">
        <Button onClick={() => { setEditPatient(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Register Patient
        </Button>
      </PageHeader>
      <DataToolbar dateFilter={opdToolbar.dateFilter} onDateFilterChange={opdToolbar.setDateFilter} viewMode={opdToolbar.viewMode} onViewModeChange={opdToolbar.setViewMode} onExportExcel={opdToolbar.handleExportExcel} onExportPDF={opdToolbar.handleExportPDF} onImport={handleImportOPD} onDownloadSample={opdToolbar.handleDownloadSample} />
      {opdToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={patients} keyExtractor={(p) => p.id} />
      ) : (
        <DataGridView columns={columns} data={patients} keyExtractor={(p) => p.id} />
      )}
      <RegisterPatientDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditPatient(null); }}
        onSubmit={handleRegister}
        nextTokenNumber={nextToken}
        editPatient={editPatient}
      />
      <AlertDialog open={!!deletePatient} onOpenChange={() => setDeletePatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{deletePatient?.name}</span> ({deletePatient?.id}) from the OPD list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OPDPage;
