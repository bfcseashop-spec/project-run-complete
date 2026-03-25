import { useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Pencil, Trash2, FileText, Clock, CheckCircle, FlaskConical,
  Droplets, Bug, Microscope, ScanLine, Shield, Search, Eye, X, Printer, Barcode as BarcodeIcon,
  MoreHorizontal, Upload, ClipboardEdit, Tag, FileDown, Paperclip,
} from "lucide-react";
import { printBarcode, printCompactLabReport, printSampleBarcodes } from "@/lib/printUtils";
import { toast } from "sonner";
import {
  labReports as staticLabReports, type LabReport, type ReportSection, type ReportInvestigation,
  reportCategories,
} from "@/data/labReports";
import { getLabReports, subscribeLabReports, addLabReport, updateLabReport, removeLabReport } from "@/data/labReportStore";
import LabReportView, { printLabReport } from "@/components/LabReportView";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";

const categoryIcons: Record<string, React.ElementType> = {
  hematology: Droplets, biochemistry: FlaskConical, microbiology: Bug,
  pathology: Microscope, radiology: ScanLine, immunology: Shield,
};

const emptyInvestigation: ReportInvestigation = {
  name: "", result: "", referenceValue: "", unit: "", flag: undefined,
};

const emptySection: ReportSection = { title: "", investigations: [{ ...emptyInvestigation }] };

const emptyForm: Omit<LabReport, "id"> = {
  patient: "", patientId: "", age: 0, gender: "Male",
  testName: "", doctor: "", date: new Date().toISOString().split("T")[0],
  resultDate: "", status: "pending", category: "biochemistry", result: "",
  normalRange: "", remarks: "", sampleType: "Blood",
  collectedAt: "", reportedAt: "",
  technician: "", pathologist: "", instrument: "",
  expectedTAT: "",
  sections: [{ title: "", investigations: [{ ...emptyInvestigation }] }],
  attachments: [],
};

const LabReportsPage = () => {
  const { activeTestNames } = useTestNameStore();
  const reports = useSyncExternalStore(subscribeLabReports, getLabReports);
  const patients = useSyncExternalStore(subscribePatients, getPatients);
  const doctorNames = useSyncExternalStore(subscribeDoctors, getActiveDoctorNames);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReport, setEditReport] = useState<LabReport | null>(null);
  const [deleteReport, setDeleteReport] = useState<LabReport | null>(null);
  const [viewReport, setViewReport] = useState<LabReport | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [inputResultsReport, setInputResultsReport] = useState<LabReport | null>(null);
  const [uploadReport, setUploadReport] = useState<LabReport | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const openAdd = () => {
    setEditReport(null);
    setForm({
      ...emptyForm,
      sections: [{ title: "", investigations: [{ ...emptyInvestigation }] }],
    });
    setDialogOpen(true);
  };
  const openEdit = (r: LabReport) => {
    setEditReport(r);
    const { id, ...rest } = r;
    setForm({
      ...rest,
      sections: rest.sections.length > 0 ? rest.sections : [{ ...emptySection }],
    });
    setDialogOpen(true);
  };
  const openView = (r: LabReport) => { setViewReport(r); setViewOpen(true); };

  // --- Section & Investigation helpers ---
  const updateSection = (sIdx: number, field: string, value: string) => {
    const sections = [...form.sections];
    sections[sIdx] = { ...sections[sIdx], [field]: value };
    setForm({ ...form, sections });
  };

  const addSection = () => {
    setForm({
      ...form,
      sections: [...form.sections, { title: "", investigations: [{ ...emptyInvestigation }] }],
    });
  };

  const removeSection = (sIdx: number) => {
    setForm({ ...form, sections: form.sections.filter((_, i) => i !== sIdx) });
  };

  const updateInvestigation = (sIdx: number, iIdx: number, field: string, value: string | undefined) => {
    const sections = [...form.sections];
    const investigations = [...sections[sIdx].investigations];
    investigations[iIdx] = { ...investigations[iIdx], [field]: value };
    sections[sIdx] = { ...sections[sIdx], investigations };
    setForm({ ...form, sections });
  };

  const addInvestigation = (sIdx: number) => {
    const sections = [...form.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      investigations: [...sections[sIdx].investigations, { ...emptyInvestigation }],
    };
    setForm({ ...form, sections });
  };

  const removeInvestigation = (sIdx: number, iIdx: number) => {
    const sections = [...form.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      investigations: sections[sIdx].investigations.filter((_, i) => i !== iIdx),
    };
    setForm({ ...form, sections });
  };

  const handleSubmit = () => {
    if (!form.patient || !form.testName || !form.doctor) return;
    // Clean empty sections
    const cleanedSections = form.sections
      .filter((s) => s.title || s.investigations.some((inv) => inv.name))
      .map((s) => ({
        ...s,
        investigations: s.investigations.filter((inv) => inv.name),
      }));
    const finalForm = { ...form, sections: cleanedSections };

    if (editReport) {
      updateLabReport(editReport.id, finalForm);
    } else {
      addLabReport(finalForm);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteReport) {
      removeLabReport(deleteReport.id);
      setDeleteReport(null);
    }
  };

  const filtered = reports.filter((r) => {
    const matchSearch = searchTerm === "" ||
      r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchCategory = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "completed").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const inProgressReports = reports.filter((r) => r.status === "in-progress").length;

  const columns = [
    { key: "id", header: "Report ID" },
    {
      key: "patient", header: "Patient",
      render: (r: LabReport) => (
        <div>
          <div className="font-medium text-card-foreground">{r.patient}</div>
          <div className="text-xs text-muted-foreground">{r.patientId} · {r.age}y · {r.gender}</div>
        </div>
      ),
    },
    { key: "testName", header: "Test Name" },
    {
      key: "category", header: "Category",
      render: (r: LabReport) => {
        const Icon = categoryIcons[r.category] || FlaskConical;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{r.category}</span>
          </div>
        );
      },
    },
    { key: "doctor", header: "Doctor" },
    { key: "date", header: "Date" },
    {
      key: "result", header: "Result",
      render: (r: LabReport) => r.result ? (
        <span className="font-medium text-card-foreground">{r.result}</span>
      ) : (
        <span className="text-muted-foreground italic">Awaiting</span>
      ),
    },
    {
      key: "processingTime", header: "Processing Time",
      render: (r: LabReport) => {
        if (!r.date) return <span className="text-muted-foreground">—</span>;
        const startDate = new Date(r.date);
        const endDate = r.resultDate ? new Date(r.resultDate) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) return <span className="text-muted-foreground">—</span>;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const diffWeeks = diffDays / 7;
        let label: string;
        let colorClass: string;
        if (diffHrs < 24) {
          label = `${Math.max(1, Math.round(diffHrs))}h`;
          colorClass = "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
        } else if (diffDays < 7) {
          label = `${Math.round(diffDays)}d`;
          colorClass = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
        } else {
          label = `${diffWeeks.toFixed(1)}w`;
          colorClass = "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
        }

        // Check if overdue based on expectedTAT
        let isOverdue = false;
        if (r.expectedTAT && !r.resultDate) {
          const tatMatch = r.expectedTAT.match(/^(\d+)(h|d|w)$/);
          if (tatMatch) {
            const tatVal = parseInt(tatMatch[1]);
            const tatUnit = tatMatch[2];
            const tatHrs = tatUnit === "h" ? tatVal : tatUnit === "d" ? tatVal * 24 : tatVal * 168;
            if (diffHrs > tatHrs) {
              isOverdue = true;
              colorClass = "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
            }
          }
        }

        return (
          <div className="flex flex-col gap-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
              <Clock className="w-3 h-3" />
              {label}
              {!r.resultDate && <span className="opacity-60 font-normal ml-0.5">(ongoing)</span>}
            </span>
            {r.expectedTAT && (
              <span className={`text-[10px] ml-1 ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {isOverdue ? "⚠ Overdue" : `ETA: ${r.expectedTAT}`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "attachments", header: "Files",
      render: (r: LabReport) => {
        const files = r.attachments || [];
        if (files.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{files.length} file{files.length > 1 ? "s" : ""}</span>
          </div>
        );
      },
    },
    {
      key: "status", header: "Status",
      render: (r: LabReport) => {
        const mapped = r.status === "in-progress" ? "active" : r.status;
        return <StatusBadge status={mapped as "active" | "completed" | "pending"} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: LabReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => openView(r)}>
              <Eye className="w-3.5 h-3.5 mr-2 text-info" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(r)}>
              <Pencil className="w-3.5 h-3.5 mr-2 text-warning" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUploadReport(r)}>
              <Upload className="w-3.5 h-3.5 mr-2 text-primary" /> Upload Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInputResultsReport(r)}>
              <ClipboardEdit className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Input Test Results
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => printBarcode(r.id, r.patient)}>
              <BarcodeIcon className="w-3.5 h-3.5 mr-2" /> Barcode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => printSampleBarcodes({ id: r.id, patient: r.patient, patientId: r.patientId, testName: r.testName, sampleType: r.sampleType, date: r.date })}>
              <Tag className="w-3.5 h-3.5 mr-2" /> Sample Barcodes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => printCompactLabReport(r)}>
              <FileDown className="w-3.5 h-3.5 mr-2 text-indigo-600" /> Print (Compact)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => printLabReport(r)}>
              <Printer className="w-3.5 h-3.5 mr-2 text-indigo-600" /> Print (Full Size)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteReport(r)} className="text-destructive focus:text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const reportToolbar = useDataToolbar({ data: reports as unknown as Record<string, unknown>[], dateKey: "date", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Lab_Reports" });

  const handleImportReports = async (file: File) => {
    const rows = await reportToolbar.handleImport(file);
    if (rows.length > 0) {
      rows.forEach((row) => {
        addLabReport({
          patient: String(row.patient || ""), patientId: String(row.patientId || ""),
          age: Number(row.age) || 0, gender: (row.gender as LabReport["gender"]) || "Male",
          testName: String(row.testName || ""), doctor: String(row.doctor || ""),
          date: String(row.date || new Date().toISOString().split("T")[0]), resultDate: "",
          status: "pending", category: "biochemistry", result: "", normalRange: "", remarks: "",
          sampleType: "Blood", collectedAt: "", reportedAt: "",
          technician: "", pathologist: "", instrument: "", sections: [], attachments: [],
        });
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Reports" description="View and manage laboratory reports and results">
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Report</Button>
      </PageHeader>

      <DataToolbar dateFilter={reportToolbar.dateFilter} onDateFilterChange={reportToolbar.setDateFilter} viewMode={reportToolbar.viewMode} onViewModeChange={reportToolbar.setViewMode} onExportExcel={reportToolbar.handleExportExcel} onExportPDF={reportToolbar.handleExportPDF} onImport={handleImportReports} onDownloadSample={reportToolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(var(--primary))" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(var(--primary))" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>Total Reports</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{totalReports}</p>
              <p className="text-xs text-muted-foreground">All lab reports</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <FileText className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(142, 71%, 45%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(142, 71%, 45%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(142, 71%, 45%)" }}>Completed</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{completedReports}</p>
              <p className="text-xs text-muted-foreground">{totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0}% complete</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(142, 71%, 45%, 0.12)" }}>
              <CheckCircle className="w-6 h-6" style={{ color: "hsl(142, 71%, 45%)" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(45, 93%, 47%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(45, 93%, 47%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(45, 93%, 47%)" }}>Pending</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{pendingReports}</p>
              <p className="text-xs text-muted-foreground">Awaiting results</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(45, 93%, 47%, 0.12)" }}>
              <Clock className="w-6 h-6" style={{ color: "hsl(45, 93%, 47%)" }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group" style={{ borderLeft: "3px solid hsl(210, 70%, 50%)" }}>
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(210, 70%, 50%)" }} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(210, 70%, 50%)" }}>In Progress</p>
              <p className="text-3xl font-black text-card-foreground tracking-tight leading-none">{inProgressReports}</p>
              <p className="text-xs text-muted-foreground">Currently processing</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(210, 70%, 50%, 0.12)" }}>
              <FlaskConical className="w-6 h-6" style={{ color: "hsl(210, 70%, 50%)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by patient, test, or ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {reportCategories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reportToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      )}

      {/* Report View */}
      <LabReportView report={viewReport} open={viewOpen} onOpenChange={setViewOpen} />

      {/* ========== NEW / EDIT REPORT FORM ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <div className="bg-primary px-6 py-4 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground text-lg">
                {editReport ? "Edit Lab Report" : "New Lab Report"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                {editReport ? "Update report details and investigation results." : "Fill in patient details, test information, and investigation results."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Patient Information */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider">Patient Information</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Patient Name <span className="text-destructive">*</span></Label>
                    <Select value={form.patient} onValueChange={(v) => {
                      const p = patients.find((pt) => pt.name === v);
                      setForm({ ...form, patient: v, patientId: p?.id || form.patientId, age: p?.age || form.age, gender: (p?.gender as any) || form.gender });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Patient ID</Label>
                    <Input value={form.patientId} readOnly className="bg-muted" placeholder="Auto-filled" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Age</Label>
                    <Input type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as LabReport["gender"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ref. By Doctor <span className="text-destructive">*</span></Label>
                    <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctorNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sample Type</Label>
                    <Input value={form.sampleType} onChange={(e) => setForm({ ...form, sampleType: e.target.value })} placeholder="Blood, Urine..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test & Report Info */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider">Test & Report Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Test Name <span className="text-destructive">*</span></Label>
                    <Select value={form.testName} onValueChange={(v) => setForm({ ...form, testName: v })}>
                      <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                      <SelectContent>
                        {activeTestNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as LabReport["category"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {reportCategories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LabReport["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Registered Date</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Collected At</Label>
                    <Input value={form.collectedAt} onChange={(e) => setForm({ ...form, collectedAt: e.target.value })} placeholder="08:30 AM" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reported Date</Label>
                    <Input type="date" value={form.resultDate} onChange={(e) => setForm({ ...form, resultDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reported At</Label>
                    <Input value={form.reportedAt} onChange={(e) => setForm({ ...form, reportedAt: e.target.value })} placeholder="04:35 PM" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expected TAT</Label>
                    <Select value={form.expectedTAT || ""} onValueChange={(v) => setForm({ ...form, expectedTAT: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="2h">2 Hours</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="6h">6 Hours</SelectItem>
                        <SelectItem value="12h">12 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="2d">2 Days</SelectItem>
                        <SelectItem value="3d">3 Days</SelectItem>
                        <SelectItem value="5d">5 Days</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                        <SelectItem value="2w">2 Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Technician</Label>
                    <Input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} placeholder="Tech. Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pathologist</Label>
                    <Input value={form.pathologist} onChange={(e) => setForm({ ...form, pathologist: e.target.value })} placeholder="Dr. Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instrument</Label>
                    <Input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} placeholder="e.g. Mindray 300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investigation Sections */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider">Investigations</h3>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Section
                  </Button>
                </div>

                {form.sections.map((section, sIdx) => (
                  <div key={sIdx} className="border border-border rounded-lg overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-3">
                      <Input
                        className="bg-transparent border-0 px-0 h-8 font-bold text-sm uppercase tracking-wider focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                        value={section.title}
                        onChange={(e) => updateSection(sIdx, "title", e.target.value)}
                        placeholder="Section title (e.g. HEMOGLOBIN, RBC COUNT)"
                      />
                      {form.sections.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => removeSection(sIdx)}>
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-muted/30">
                      <div className="col-span-4 text-[10px] font-bold text-muted-foreground uppercase">Investigation</div>
                      <div className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase">Result</div>
                      <div className="col-span-3 text-[10px] font-bold text-muted-foreground uppercase">Reference Value</div>
                      <div className="col-span-1 text-[10px] font-bold text-muted-foreground uppercase">Unit</div>
                      <div className="col-span-1 text-[10px] font-bold text-muted-foreground uppercase">Flag</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Investigation Rows */}
                    {section.investigations.map((inv, iIdx) => (
                      <div key={iIdx} className="grid grid-cols-12 gap-2 px-4 py-1.5 border-b border-border/50 last:border-0 items-center">
                        <div className="col-span-4">
                          <Input
                            className="h-8 text-sm"
                            value={inv.name}
                            onChange={(e) => updateInvestigation(sIdx, iIdx, "name", e.target.value)}
                            placeholder="e.g. Hemoglobin (Hb)"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            className="h-8 text-sm font-semibold"
                            value={inv.result}
                            onChange={(e) => updateInvestigation(sIdx, iIdx, "result", e.target.value)}
                            placeholder="Value"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            className="h-8 text-sm"
                            value={inv.referenceValue}
                            onChange={(e) => updateInvestigation(sIdx, iIdx, "referenceValue", e.target.value)}
                            placeholder="e.g. 13.0 - 17.0"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            className="h-8 text-sm"
                            value={inv.unit}
                            onChange={(e) => updateInvestigation(sIdx, iIdx, "unit", e.target.value)}
                            placeholder="g/dL"
                          />
                        </div>
                        <div className="col-span-1">
                          <Select
                            value={inv.flag || "none"}
                            onValueChange={(v) => updateInvestigation(sIdx, iIdx, "flag", v === "none" ? undefined : v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="High">
                                <span className="text-destructive font-semibold">High</span>
                              </SelectItem>
                              <SelectItem value="Low">
                                <span className="text-warning font-semibold">Low</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {section.investigations.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeInvestigation(sIdx, iIdx)}>
                              <X className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Row */}
                    <div className="px-4 py-2 border-t border-border/50">
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => addInvestigation(sIdx)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Investigation
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Summary & Remarks */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Overall Result</Label>
                    <Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="e.g. Normal, Borderline High" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Normal Range (Summary)</Label>
                    <Input value={form.normalRange} onChange={(e) => setForm({ ...form, normalRange: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} placeholder="Clinical observations, recommendations..." />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />
          <DialogFooter className="px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editReport ? "Update Report" : "Create Report"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReport} onOpenChange={(open) => !open && setDeleteReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete report {deleteReport?.id} for {deleteReport?.patient}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== INPUT TEST RESULTS DIALOG ========== */}
      <Dialog open={!!inputResultsReport} onOpenChange={(open) => !open && setInputResultsReport(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div className="px-6 pt-5 pb-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardEdit className="w-5 h-5 text-primary" />
                Input Test Results
              </DialogTitle>
              <DialogDescription>
                Enter results for {inputResultsReport?.id} — {inputResultsReport?.testName}
              </DialogDescription>
            </DialogHeader>
          </div>
          {inputResultsReport && (
            <InputTestResultsForm
              report={inputResultsReport}
              onSave={(sections, remarks, technician) => {
                updateLabReport(inputResultsReport.id, {
                  sections,
                  remarks,
                  technician,
                  status: "completed",
                  resultDate: new Date().toISOString().split("T")[0],
                  reportedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                });
                toast.success("Test results saved & report marked completed");
                setInputResultsReport(null);
              }}
              onCancel={() => setInputResultsReport(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ========== UPLOAD REPORT DIALOG ========== */}
      <Dialog open={!!uploadReport} onOpenChange={(open) => !open && setUploadReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Report — {uploadReport?.id}</DialogTitle>
            <DialogDescription>
              Upload a scanned report or document for {uploadReport?.patient}
            </DialogDescription>
          </DialogHeader>
          {uploadReport && (
            <UploadReportForm
              report={uploadReport}
              onDone={(attachment) => {
                const existing = uploadReport.attachments || [];
                updateLabReport(uploadReport.id, {
                  attachments: [...existing, attachment],
                  status: uploadReport.status === "pending" ? "in-progress" : uploadReport.status,
                });
                toast.success("Report file uploaded successfully");
                setUploadReport(null);
              }}
              onCancel={() => setUploadReport(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ========== SUB-COMPONENTS ========== */

function InputTestResultsForm({ report, onSave, onCancel }: {
  report: LabReport;
  onSave: (sections: ReportSection[], remarks: string, technician: string) => void;
  onCancel: () => void;
}) {
  const [sections, setSections] = useState<ReportSection[]>(
    report.sections.length > 0 ? report.sections.map(s => ({
      ...s,
      investigations: s.investigations.map(inv => ({ ...inv })),
    })) : [{ title: report.testName, investigations: [{ ...emptyInvestigation }] }]
  );
  const [remarks, setRemarks] = useState(report.remarks);
  const [technician, setTechnician] = useState(report.technician);

  const updateInv = (sIdx: number, iIdx: number, field: string, value: string | undefined) => {
    const newSections = [...sections];
    const invs = [...newSections[sIdx].investigations];
    const updated = { ...invs[iIdx], [field]: value };

    // Auto-detect flag from result vs reference range
    if (field === "result" && value && invs[iIdx].referenceValue) {
      updated.flag = detectFlag(value, invs[iIdx].referenceValue);
    }
    if (field === "referenceValue" && value && invs[iIdx].result) {
      updated.flag = detectFlag(invs[iIdx].result, value);
    }

    invs[iIdx] = updated;
    newSections[sIdx] = { ...newSections[sIdx], investigations: invs };
    setSections(newSections);
  };

  const addInv = (sIdx: number) => {
    const newSections = [...sections];
    newSections[sIdx] = {
      ...newSections[sIdx],
      investigations: [...newSections[sIdx].investigations, { ...emptyInvestigation }],
    };
    setSections(newSections);
  };

  return (
    <div className="space-y-0">
      {/* Lab Technologist */}
      <div className="px-6 pb-4 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lab Technologist</Label>
        <Input
          value={technician}
          onChange={e => setTechnician(e.target.value)}
          placeholder="Enter technologist name"
          className="h-9"
        />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-0 px-6 py-2.5 bg-muted/60 border-y border-border">
        <div className="col-span-4 text-xs font-bold text-primary uppercase tracking-wider">Parameter</div>
        <div className="col-span-3 text-xs font-bold text-primary uppercase tracking-wider">Result</div>
        <div className="col-span-2 text-xs font-bold text-primary uppercase tracking-wider">Unit</div>
        <div className="col-span-3 text-xs font-bold text-primary uppercase tracking-wider">Normal/Reference Ranges</div>
      </div>

      {/* Sections & Investigations */}
      <div className="max-h-[50vh] overflow-y-auto">
        {sections.map((sec, sIdx) => (
          <div key={sIdx}>
            {/* Section Header */}
            <div className="px-6 py-2 bg-primary/5 border-b border-border">
              <Input
                className="h-6 bg-transparent border-0 px-0 font-bold text-xs uppercase tracking-widest text-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-primary/50 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                value={sec.title}
                onChange={e => {
                  const newSections = [...sections];
                  newSections[sIdx] = { ...newSections[sIdx], title: e.target.value };
                  setSections(newSections);
                }}
                placeholder="Section title (e.g. HAEMATOLOGY)"
              />
            </div>

            {/* Investigation Rows */}
            {sec.investigations.map((inv, iIdx) => {
              const isOutOfRange = inv.flag === "High" || inv.flag === "Low";
              return (
                <div key={iIdx} className="grid grid-cols-12 gap-0 px-6 py-2.5 border-b border-border/40 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-4 pr-3">
                    <Input
                      className="h-8 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-card-foreground"
                      value={inv.name}
                      onChange={e => updateInv(sIdx, iIdx, "name", e.target.value)}
                      placeholder="e.g. Hemoglobin"
                    />
                  </div>
                  <div className="col-span-3 pr-3">
                    <Input
                      className={`h-8 text-sm font-semibold rounded-md ${
                        isOutOfRange
                          ? "border-destructive/50 bg-destructive/5 text-destructive"
                          : "border-border"
                      }`}
                      value={inv.result}
                      onChange={e => updateInv(sIdx, iIdx, "result", e.target.value)}
                      placeholder="Enter result"
                    />
                  </div>
                  <div className="col-span-2 pr-3">
                    <span className="text-xs text-muted-foreground">
                      {inv.unit || "—"}
                    </span>
                    <Input
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground sr-only"
                      value={inv.unit}
                      onChange={e => updateInv(sIdx, iIdx, "unit", e.target.value)}
                      placeholder="Unit"
                    />
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs text-muted-foreground">
                      {inv.referenceValue ? `(${inv.referenceValue})` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Add Row */}
            <div className="px-6 py-1.5 border-b border-border/30">
              <Button variant="ghost" size="sm" className="text-xs h-6 text-primary" onClick={() => addInv(sIdx)}>
                <Plus className="w-3 h-3 mr-1" /> Add Parameter
              </Button>
            </div>
          </div>
        ))}

        {/* Add Section */}
        <div className="px-6 py-2">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
            setSections([...sections, { title: "", investigations: [{ ...emptyInvestigation }] }]);
          }}>
            <Plus className="w-3 h-3 mr-1" /> Add Section
          </Button>
        </div>
      </div>

      {/* Remarks */}
      <div className="px-6 pt-4 pb-2 space-y-1.5 border-t border-border">
        <Label className="text-xs text-muted-foreground">Remarks</Label>
        <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Clinical notes, observations..." />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 px-6 py-3 border-t border-border bg-muted/30">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(sections, remarks, technician)}>
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Save & Complete
        </Button>
      </div>
    </div>
  );
}

/** Auto-detect High/Low flag by comparing numeric result to reference range */
function detectFlag(result: string, refRange: string): "High" | "Low" | undefined {
  const num = parseFloat(result);
  if (isNaN(num)) return undefined;

  // Handle formats: "4.0-10.0", "(4.0-10.0)", "<10.0", ">5.0"
  const cleaned = refRange.replace(/[()]/g, "").trim();

  const rangeMatch = cleaned.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) {
      if (num < low) return "Low";
      if (num > high) return "High";
      return undefined;
    }
  }

  const ltMatch = cleaned.match(/^<\s*([\d.]+)$/);
  if (ltMatch) {
    const max = parseFloat(ltMatch[1]);
    if (!isNaN(max) && num >= max) return "High";
    return undefined;
  }

  const gtMatch = cleaned.match(/^>\s*([\d.]+)$/);
  if (gtMatch) {
    const min = parseFloat(gtMatch[1]);
    if (!isNaN(min) && num <= min) return "Low";
    return undefined;
  }

  return undefined;
}

function UploadReportForm({ report, onDone, onCancel }: {
  report: LabReport;
  onDone: (attachment: { name: string; url: string; type: string; uploadedAt: string }) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "file";
      const path = `${report.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("lab-reports").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("lab-reports").getPublicUrl(path);
      onDone({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">Select a report file (PDF, Image)</p>
        <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="max-w-xs mx-auto" />
      </div>
      {preview && (
        <div className="border border-border rounded-lg overflow-hidden">
          <img src={preview} alt="Preview" className="max-h-48 mx-auto object-contain" />
        </div>
      )}
      {file && (
        <p className="text-xs text-muted-foreground text-center">
          Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}
      {/* Show existing attachments */}
      {(report.attachments || []).length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Existing Files</Label>
          {(report.attachments || []).map((att, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5">
              <Paperclip className="w-3 h-3 text-primary flex-shrink-0" />
              <a href={att.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{att.name}</a>
              <span className="text-muted-foreground ml-auto flex-shrink-0">{new Date(att.uploadedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!file || uploading} onClick={handleUpload}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
}

export default LabReportsPage;
