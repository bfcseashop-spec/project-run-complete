import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, Printer, Search } from "lucide-react";
import { printRecordReport } from "@/lib/printUtils";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { opdPatients, type OPDPatient, type BloodType, type PatientType } from "@/data/opdPatients";
import { initPatients, getPatients, addPatient, updatePatient, removePatient, subscribe } from "@/data/patientStore";
import RegisterPatientDialog from "@/components/RegisterPatientDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

initPatients(opdPatients);

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const patientTypes: PatientType[] = ["Walk In", "Indoor", "Outdoor", "Emergency"];

const OPDPage = () => {
  const [patients, setPatients] = useState<OPDPatient[]>(getPatients());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<OPDPatient | null>(null);
  const [deletePatient, setDeletePatient] = useState<OPDPatient | null>(null);
  const [search, setSearch] = useState("");
  const [filterBlood, setFilterBlood] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.complaint.toLowerCase().includes(q) || p.doctor.toLowerCase().includes(q) || (p.phone || "").includes(q);
      const matchesBlood = filterBlood === "all" || p.bloodType === filterBlood;
      const matchesType = filterType === "all" || p.patientType === filterType;
      return matchesSearch && matchesBlood && matchesType;
    });
  }, [patients, search, filterBlood, filterType]);

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
    { key: "patientType", header: "Type", render: (p: OPDPatient) => {
      if (!p.patientType) return "—";
      const typeStyles: Record<string, string> = {
        "Walk In": "bg-primary/10 text-primary",
        "Indoor": "bg-blue-500/10 text-blue-600",
        "Outdoor": "bg-emerald-500/10 text-emerald-600",
        "Emergency": "bg-destructive/10 text-destructive",
      };
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles[p.patientType] || "bg-muted text-muted-foreground"}`}>{p.patientType}</span>;
    }},
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

  const opdToolbar = useDataToolbar({ data: filteredPatients as unknown as Record<string, unknown>[], dateKey: "", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "OPD" });

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

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, token, complaint..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Patient Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {patientTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBlood} onValueChange={setFilterBlood}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blood</SelectItem>
            {bloodTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterBlood !== "all" || filterType !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={() => { setSearch(""); setFilterBlood("all"); setFilterType("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      <DataToolbar dateFilter={opdToolbar.dateFilter} onDateFilterChange={opdToolbar.setDateFilter} viewMode={opdToolbar.viewMode} onViewModeChange={opdToolbar.setViewMode} onExportExcel={opdToolbar.handleExportExcel} onExportPDF={opdToolbar.handleExportPDF} onImport={handleImportOPD} onDownloadSample={opdToolbar.handleDownloadSample} />
      {opdToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filteredPatients} keyExtractor={(p) => p.id} />
      ) : (
        <DataGridView columns={columns} data={filteredPatients} keyExtractor={(p) => p.id} />
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
