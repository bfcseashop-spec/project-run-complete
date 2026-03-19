import { useState } from "react";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import StatCard from "@/components/StatCard";
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
  Plus, Pencil, Trash2, FileText, Clock, CheckCircle, FlaskConical,
  Droplets, Bug, Microscope, ScanLine, Shield, Search, Eye, X,
} from "lucide-react";
import {
  labReports, type LabReport, type ReportSection, type ReportInvestigation,
  reportCategories,
} from "@/data/labReports";
import LabReportView from "@/components/LabReportView";

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
  sections: [{ title: "", investigations: [{ ...emptyInvestigation }] }],
};

const LabReportsPage = () => {
  const { activeTestNames } = useTestNameStore();
  const [reports, setReports] = useState<LabReport[]>(labReports);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReport, setEditReport] = useState<LabReport | null>(null);
  const [deleteReport, setDeleteReport] = useState<LabReport | null>(null);
  const [viewReport, setViewReport] = useState<LabReport | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
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
      setReports((prev) => prev.map((r) => r.id === editReport.id ? { ...editReport, ...finalForm } : r));
    } else {
      const nextNum = reports.length > 0 ? Math.max(...reports.map(r => parseInt(r.id.split("-")[1]))) + 1 : 1001;
      setReports((prev) => [...prev, { id: `LR-${nextNum}`, ...finalForm }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteReport) {
      setReports((prev) => prev.filter((r) => r.id !== deleteReport.id));
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
      key: "status", header: "Status",
      render: (r: LabReport) => {
        const mapped = r.status === "in-progress" ? "active" : r.status;
        return <StatusBadge status={mapped as "active" | "completed" | "pending"} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: LabReport) => (
        <div className="flex items-center gap-1">
          {r.status === "completed" && (
            <Button variant="ghost" size="icon" title="View Report" onClick={() => openView(r)}>
              <Eye className="w-4 h-4 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteReport(r)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Reports" description="View and manage laboratory reports and results">
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Report</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={String(totalReports)} icon={FileText} />
        <StatCard title="Completed" value={String(completedReports)} icon={CheckCircle} />
        <StatCard title="Pending" value={String(pendingReports)} icon={Clock} />
        <StatCard title="In Progress" value={String(inProgressReports)} icon={FlaskConical} />
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

      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />

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
                    <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Patient ID</Label>
                    <Input value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="P-XXX" />
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
                    <Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr." />
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
                <div className="grid grid-cols-4 gap-4">
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
    </div>
  );
};

export default LabReportsPage;
