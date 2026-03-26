import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, Printer, Search, ClipboardList, Users, UserCheck, Building, TreePine, AlertCircle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { printRecordReport } from "@/lib/printUtils";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { opdPatients, type OPDPatient, type BloodType, type PatientType } from "@/data/opdPatients";
import { initPatients, getPatients, addPatient, updatePatient, removePatient, subscribe } from "@/data/patientStore";
import RegisterPatientDialog from "@/components/RegisterPatientDialog";
import ViewPatientDialog from "@/components/ViewPatientDialog";
import PatientVisitSummary from "@/components/PatientVisitSummary";
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
  const [viewPatient, setViewPatient] = useState<OPDPatient | null>(null);
  const [deletePatient, setDeletePatient] = useState<OPDPatient | null>(null);
  const [summaryPatient, setSummaryPatient] = useState<OPDPatient | null>(null);
  const [search, setSearch] = useState("");
  const [filterBlood, setFilterBlood] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);

  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.complaint.toLowerCase().includes(q) || p.doctor.toLowerCase().includes(q) || (p.phone || "").includes(q);
        const matchesBlood = filterBlood === "all" || p.bloodType === filterBlood;
        const matchesType = filterType === "all" || p.patientType === filterType;
        return matchesSearch && matchesBlood && matchesType;
      })
      .sort((a, b) => {
        const aNumber = Number.parseInt(a.id.replace("OPD-", ""), 10) || 0;
        const bNumber = Number.parseInt(b.id.replace("OPD-", ""), 10) || 0;
        return bNumber - aNumber;
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
    { key: "id", header: "Serial No.", render: (p: OPDPatient) => <span className="text-xs font-medium text-foreground">{p.id}</span> },
    { key: "name", header: "Patient Name", render: (p: OPDPatient) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 text-xs font-medium text-muted-foreground">
          {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{p.name}</span>
      </div>
    )},
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
    { key: "complaint", header: "Chief Complaint" },
    { key: "doctor", header: "Doctor" },
    { key: "time", header: "Time" },
    
    {
      key: "actions", header: "Actions", render: (p: OPDPatient) => {
        const fields = [
          { label: "Patient Name", value: p.name }, { label: "Age", value: String(p.age) },
          { label: "Gender", value: p.gender }, { label: "Blood Type", value: p.bloodType || "N/A" },
          { label: "Patient Type", value: p.patientType || "N/A" }, { label: "Phone", value: p.phone || "N/A" },
          { label: "Chief Complaint", value: p.complaint }, { label: "Doctor", value: p.doctor },
          { label: "Time", value: p.time }, { label: "Status", value: p.status },
          { label: "Medical History", value: p.medicalHistory || "N/A" },
        ];
        return (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50" title="Visit Summary" onClick={() => setSummaryPatient(p)}><ClipboardList className="w-3.5 h-3.5 text-accent-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewPatient(p)}><Eye className="w-3.5 h-3.5 text-info" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => handleEdit(p)}><Pencil className="w-3.5 h-3.5 text-warning" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => printRecordReport({ id: p.id, sectionTitle: "OPD Report", fields, photo: p.photo })}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeletePatient(p)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

      {/* OPD Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Total Patients", val: String(patients.length), icon: Users, grad: "linear-gradient(135deg, hsl(210, 100%, 56%), hsl(230, 85%, 58%))", shadow: "0 4px 20px hsl(210, 100%, 56% / 0.25)" },
          { label: "Walk In", val: String(patients.filter(p => p.patientType === "Walk In").length), icon: UserCheck, grad: "linear-gradient(135deg, hsl(152, 68%, 45%), hsl(165, 72%, 40%))", shadow: "0 4px 20px hsl(152, 68%, 45% / 0.25)" },
          { label: "Indoor", val: String(patients.filter(p => p.patientType === "Indoor").length), icon: Building, grad: "linear-gradient(135deg, hsl(262, 78%, 55%), hsl(275, 72%, 50%))", shadow: "0 4px 20px hsl(262, 78%, 55% / 0.25)" },
          { label: "Outdoor", val: String(patients.filter(p => p.patientType === "Outdoor").length), icon: TreePine, grad: "linear-gradient(135deg, hsl(38, 92%, 50%), hsl(28, 90%, 48%))", shadow: "0 4px 20px hsl(38, 92%, 50% / 0.25)" },
          { label: "Emergency", val: String(patients.filter(p => p.patientType === "Emergency").length), icon: AlertCircle, grad: "linear-gradient(135deg, hsl(0, 72%, 51%), hsl(348, 80%, 47%))", shadow: "0 4px 20px hsl(0, 72%, 51% / 0.25)" },
        ].map((c) => {
          const IconComp = c.icon;
          return (
            <div
              key={c.label}
              className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: c.grad, boxShadow: c.shadow }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -left-3 -bottom-3 w-14 h-14 rounded-full bg-white/5" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-white/90">{c.label}</p>
                  <p className="text-3xl font-black text-white font-number tracking-tight leading-none drop-shadow-sm">{c.val}</p>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsl(0, 0%, 100% / 0.18)", backdropFilter: "blur(8px)" }}>
                  <IconComp className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, token, chief complaint..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
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
      <ViewPatientDialog
        open={!!viewPatient}
        onOpenChange={(open) => { if (!open) setViewPatient(null); }}
        patient={viewPatient}
      />
      <PatientVisitSummary
        open={!!summaryPatient}
        onOpenChange={(open) => { if (!open) setSummaryPatient(null); }}
        patient={summaryPatient}
      />
    </div>
  );
};

export default OPDPage;
