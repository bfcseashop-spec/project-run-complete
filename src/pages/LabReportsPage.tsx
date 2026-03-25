import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
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
  const { activeTestNames, findByName } = useTestNameStore();
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
      key: "processingTime", header: "Processing Time",
      render: (r: LabReport) => {
        if (!r.date) return <span className="text-muted-foreground">—</span>;
        const startDate = new Date(r.date);
        const isCompleted = r.status === "completed" && r.resultDate;
        const endDate = isCompleted ? new Date(r.resultDate!) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) return <span className="text-muted-foreground">—</span>;
        const diffMins = diffMs / (1000 * 60);
        const diffHrs = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        let label: string;
        if (diffMins < 60) {
          label = `${Math.max(1, Math.round(diffMins))}m`;
        } else if (diffHrs < 24) {
          label = `${Math.round(diffHrs)}h`;
        } else {
          label = `${Math.round(diffDays)}d`;
        }

        if (isCompleted) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950">
              <Clock className="w-3 h-3" />
              {label}
              <span className="opacity-70 font-normal">✓</span>
            </span>
          );
        }

        // Ongoing — check overdue
        let colorClass = diffHrs < 24
          ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
          : diffDays < 3
          ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950"
          : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";

        let isOverdue = false;
        if (r.expectedTAT) {
          const tatMatch = r.expectedTAT.match(/(\d+)\s*(h|hour|d|day|w|week|m|min)/i);
          if (tatMatch) {
            const tatVal = parseInt(tatMatch[1]);
            const u = tatMatch[2].toLowerCase();
            const tatMins = u.startsWith("m") ? tatVal : u.startsWith("h") ? tatVal * 60 : u.startsWith("d") ? tatVal * 1440 : tatVal * 10080;
            if (diffMins > tatMins) {
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
              <span className="opacity-60 font-normal ml-0.5">(ongoing)</span>
            </span>
            {isOverdue && (
              <span className="text-[10px] ml-1 text-destructive font-semibold">⚠ Overdue</span>
            )}
          </div>
        );
      },
    },
    {
      key: "sampleType", header: "Sample Type",
      render: (r: LabReport) => (
        <span className="text-xs">{r.sampleType || "—"}</span>
      ),
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
        <Button variant="outline" onClick={() => navigate("/test-names")}><Plus className="w-4 h-4 mr-2" /> Parameter</Button>
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

      {/* ========== NEW / EDIT REPORT FORM (Simplified) ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-primary px-5 py-3.5 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground text-base">
                {editReport ? `Edit (${editReport.id})` : "New Lab Report"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 text-xs sr-only">
                {editReport ? "Update report details." : "Create a new lab report."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Test Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Test Name <span className="text-destructive">*</span></Label>
              <Select value={form.testName} onValueChange={(v) => {
                const testInfo = findByName(v);
                setForm({
                  ...form,
                  testName: v,
                  normalRange: testInfo ? String(testInfo.price) : form.normalRange,
                  sampleType: testInfo?.sampleType || form.sampleType,
                  category: (testInfo?.category as any) || form.category,
                });
              }}>
                <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                <SelectContent>
                  {activeTestNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Patient */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Patient</Label>
              <Select value={form.patient} onValueChange={(v) => {
                const p = patients.find((pt) => pt.name === v);
                setForm({ ...form, patient: v, patientId: p?.id || form.patientId, age: p?.age || form.age, gender: (p?.gender as any) || form.gender });
              }}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Category + Sample Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as LabReport["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reportCategories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sample Type <span className="text-destructive">*</span></Label>
                <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blood">Blood</SelectItem>
                    <SelectItem value="Urine">Urine</SelectItem>
                    <SelectItem value="Stool">Stool</SelectItem>
                    <SelectItem value="Sputum">Sputum</SelectItem>
                    <SelectItem value="Swab">Swab</SelectItem>
                    <SelectItem value="CSF">CSF</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price + Turnaround Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Price ($) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.normalRange} readOnly className="bg-muted/50 cursor-not-allowed" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Turnaround Time</Label>
                <Input value={form.expectedTAT || ""} onChange={(e) => setForm({ ...form, expectedTAT: e.target.value })} placeholder="e.g. 2 hours, 1 day" />
              </div>
            </div>

            {/* Refer Name (Doctor) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Refer Name</Label>
              <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                <SelectTrigger><SelectValue placeholder="Person who referred/uploaded" /></SelectTrigger>
                <SelectContent>
                  {doctorNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Description / Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} placeholder="" />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LabReport["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Full-width action button */}
          <div className="px-5 pb-5">
            <Button className="w-full h-11 text-sm font-semibold" onClick={handleSubmit}>
              {editReport ? "Update" : "Create Report"}
            </Button>
          </div>
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
              onDone={(attachments) => {
                const existing = uploadReport.attachments || [];
                updateLabReport(uploadReport.id, {
                  attachments: [...existing, ...attachments],
                  status: uploadReport.status === "pending" ? "in-progress" : uploadReport.status,
                });
                toast.success(`${attachments.length} file${attachments.length > 1 ? "s" : ""} uploaded successfully`);
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

  const isPositiveResult = (result: string) => {
    return result.toLowerCase() === "positive";
  };

  const isResultFlagged = (inv: ReportInvestigation) => {
    return inv.flag === "High" || inv.flag === "Low" || isPositiveResult(inv.result);
  };

  return (
    <div className="space-y-0">
      {/* Lab Technologist */}
      <div className="px-6 pb-5 space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Lab Technologist</Label>
        <Select value={technician} onValueChange={setTechnician}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select lab technologist" />
          </SelectTrigger>
          <SelectContent>
            {technician && !["Md Ekbal Hossain (Lab Technologist)", "Dr. Shaheen Akter (Lab Technologist)", "Farhan Rahman (Lab Technologist)"].includes(technician) && (
              <SelectItem value={technician}>{technician}</SelectItem>
            )}
            <SelectItem value="Md Ekbal Hossain (Lab Technologist)">Md Ekbal Hossain (Lab Technologist)</SelectItem>
            <SelectItem value="Dr. Shaheen Akter (Lab Technologist)">Dr. Shaheen Akter (Lab Technologist)</SelectItem>
            <SelectItem value="Farhan Rahman (Lab Technologist)">Farhan Rahman (Lab Technologist)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-0 px-6 py-3 border-y border-border bg-muted/40">
        <div className="col-span-3 text-xs font-bold text-primary uppercase tracking-wider">Parameter</div>
        <div className="col-span-3 text-xs font-bold text-primary uppercase tracking-wider">Result</div>
        <div className="col-span-2 text-xs font-bold text-primary uppercase tracking-wider">Unit</div>
        <div className="col-span-4 text-xs font-bold text-primary uppercase tracking-wider">Normal/Reference Ranges</div>
      </div>

      {/* Sections & Investigations */}
      <div className="max-h-[60vh] overflow-y-auto">
        {sections.map((sec, sIdx) => (
          <div key={sIdx}>
            {/* Investigation Rows */}
            {sec.investigations.map((inv, iIdx) => {
              const flagged = isResultFlagged(inv);
              return (
                <div key={iIdx} className="grid grid-cols-12 gap-0 px-6 py-3.5 border-b border-border/30 items-start">
                  {/* Parameter */}
                  <div className="col-span-3 pr-2 pt-1.5">
                    <Input
                      className="h-8 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-card-foreground"
                      value={inv.name}
                      onChange={e => updateInv(sIdx, iIdx, "name", e.target.value)}
                      placeholder="e.g. Hemoglobin"
                    />
                  </div>
                  {/* Result — editable */}
                  <div className="col-span-3 pr-4 pt-0.5">
                    <Input
                      className={`h-9 text-sm font-semibold rounded-md px-3 ${
                        flagged
                          ? "border-2 border-destructive text-destructive"
                          : "border border-border"
                      }`}
                      value={inv.result}
                      onChange={e => updateInv(sIdx, iIdx, "result", e.target.value)}
                      placeholder="Enter result"
                    />
                  </div>
                  {/* Unit */}
                  <div className="col-span-2 pr-2 pt-2">
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  {/* Normal/Reference Range — editable, multiline support */}
                  <div className="col-span-4 pt-0.5">
                    <Textarea
                      className="min-h-[36px] text-sm border-0 bg-transparent px-0 py-1.5 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground"
                      value={inv.referenceValue}
                      onChange={e => updateInv(sIdx, iIdx, "referenceValue", e.target.value)}
                      placeholder="—"
                      rows={1}
                    />
                  </div>
                </div>
              );
            })}

            {/* Add Row */}
            <div className="px-6 py-1.5 border-b border-border/20">
              <Button variant="ghost" size="sm" className="text-xs h-6 text-primary hover:text-primary" onClick={() => addInv(sIdx)}>
                <Plus className="w-3 h-3 mr-1" /> Add Parameter
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div className="px-6 pt-4 pb-3 space-y-1.5 border-t border-border">
        <Label className="text-xs text-muted-foreground font-medium">Remarks</Label>
        <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Clinical notes, observations..." />
      </div>

      {/* Full-width Save Button */}
      <div className="px-6 pb-4">
        <Button className="w-full h-11 text-sm font-semibold" onClick={() => onSave(sections, remarks, technician)}>
          Save Results
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
  onDone: (attachments: { name: string; url: string; type: string; uploadedAt: string }[]) => void;
  onCancel: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((f) => {
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreviews((prev) => [...prev, { name: f.name, url: reader.result as string }]);
        reader.readAsDataURL(f);
      } else {
        setPreviews((prev) => [...prev, { name: f.name, url: null }]);
      }
    });
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const results: { name: string; url: string; type: string; uploadedAt: string }[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "file";
        const path = `${report.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error } = await supabase.storage.from("lab-reports").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("lab-reports").getPublicUrl(path);
        results.push({ name: file.name, url: urlData.publicUrl, type: file.type, uploadedAt: new Date().toISOString() });
      }
      onDone(results);
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
        <p className="text-sm text-muted-foreground mb-3">Select report files (PDF, Image) — multiple allowed</p>
        <Input type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} className="max-w-xs mx-auto" />
      </div>
      {previews.length > 0 && (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {previews.map((p, i) => (
            <div key={i} className="flex items-center gap-2 border border-border rounded-lg p-2">
              {p.url ? (
                <img src={p.url} alt={p.name} className="h-16 w-16 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{(files[i]?.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => removeFile(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
      )}
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
        <Button size="sm" disabled={files.length === 0 || uploading} onClick={handleUpload}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> {uploading ? "Uploading..." : `Upload${files.length > 1 ? ` (${files.length})` : ""}`}
        </Button>
      </div>
    </div>
  );
}

export default LabReportsPage;
