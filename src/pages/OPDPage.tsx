import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
    { key: "age", header: "Age", render: (p: OPDPatient) => `${p.age} / ${p.gender}` },
    { key: "complaint", header: "Complaint" },
    { key: "doctor", header: "Doctor" },
    { key: "time", header: "Time" },
    { key: "status", header: "Status", render: (p: OPDPatient) => <StatusBadge status={p.status} /> },
    {
      key: "actions", header: "Actions", render: (p: OPDPatient) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletePatient(p)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="OPD Section" description="Manage outpatient visits and registrations">
        <Button onClick={() => { setEditPatient(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Register Patient
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={patients} keyExtractor={(p) => p.id} />
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
