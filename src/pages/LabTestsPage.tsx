import { useState, useEffect, useSyncExternalStore } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus, Pencil, Trash2, TestTube, Clock, CheckCircle, Activity,
  Search, AlertTriangle, FlaskConical, FileText, Droplets, ClipboardList,
} from "lucide-react";
import {
  labTests as initialLabTests, type LabTest, labTestNames, sampleTypes,
  priorityLevels,
} from "@/data/labTests";
import { getTechnicians, subscribeTechnicians } from "@/data/technicianStore";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";

const sampleTypeIcons: Record<string, React.ElementType> = {
  blood: Droplets,
  urine: FlaskConical,
  stool: FlaskConical,
  sputum: FlaskConical,
  swab: TestTube,
  tissue: TestTube,
  csf: Droplets,
  other: ClipboardList,
};

const emptyForm: Omit<LabTest, "id"> = {
  patient: "", patientId: "", age: 0, gender: "Male",
  test: "", doctor: "", date: new Date().toISOString().split("T")[0], completedDate: "",
  status: "pending", priority: "routine", sampleType: "blood",
  sampleStatus: "not-collected", result: "", normalRange: "", unit: "",
  abnormal: false, notes: "", technicianAssigned: "",
};

const LabTestsPage = () => {
  const patients = useSyncExternalStore(subscribePatients, getPatients);
  const doctorNames = useSyncExternalStore(subscribeDoctors, getActiveDoctorNames);
  const technicians = useSyncExternalStore(subscribeTechnicians, getTechnicians);
  const [tests, setTests] = useState<LabTest[]>(initialLabTests);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState<LabTest | null>(null);
  const [deleteTest, setDeleteTest] = useState<LabTest | null>(null);
  const [resultTest, setResultTest] = useState<LabTest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [resultForm, setResultForm] = useState({ result: "", abnormal: false, notes: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSampleType, setFilterSampleType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const openAdd = () => { setEditTest(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: LabTest) => {
    setEditTest(t);
    const { id, ...rest } = t;
    setForm(rest);
    setDialogOpen(true);
  };
  const openResult = (t: LabTest) => {
    setResultTest(t);
    setResultForm({ result: t.result, abnormal: t.abnormal, notes: t.notes });
    setResultDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.patient || !form.test || !form.doctor) return;
    if (editTest) {
      setTests((prev) => prev.map((t) => t.id === editTest.id ? { ...editTest, ...form } : t));
    } else {
      const nextNum = tests.length > 0 ? Math.max(...tests.map(t => parseInt(t.id.split("-")[1]))) + 1 : 501;
      setTests((prev) => [...prev, { id: `LT-${nextNum}`, ...form }]);
    }
    setDialogOpen(false);
  };

  const handleResultSubmit = () => {
    if (!resultTest) return;
    setTests((prev) => prev.map((t) =>
      t.id === resultTest.id
        ? {
          ...t, result: resultForm.result, abnormal: resultForm.abnormal,
          notes: resultForm.notes, status: "completed" as const,
          sampleStatus: "completed" as const,
          completedDate: new Date().toISOString().split("T")[0],
        }
        : t
    ));
    setResultDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTest) {
      setTests((prev) => prev.filter((t) => t.id !== deleteTest.id));
      setDeleteTest(null);
    }
  };

  const updateSampleStatus = (testId: string, sampleStatus: LabTest["sampleStatus"]) => {
    setTests((prev) => prev.map((t) => {
      if (t.id !== testId) return t;
      const newStatus = sampleStatus === "in-processing" ? "active" as const : t.status;
      return { ...t, sampleStatus, status: newStatus };
    }));
  };

  const filtered = tests.filter((t) => {
    const matchSearch = searchTerm === "" ||
      t.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.test.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchSample = filterSampleType === "all" || t.sampleType === filterSampleType;
    const matchTab = activeTab === "all" || t.status === activeTab;
    return matchSearch && matchStatus && matchPriority && matchSample && matchTab;
  });

  const totalTests = tests.length;
  const completedTests = tests.filter((t) => t.status === "completed").length;
  const pendingTests = tests.filter((t) => t.status === "pending").length;
  const urgentTests = tests.filter((t) => t.priority !== "routine" && t.status !== "completed").length;
  const abnormalResults = tests.filter((t) => t.abnormal).length;

  const columns = [
    { key: "id", header: "Test ID" },
    {
      key: "patient", header: "Patient",
      render: (t: LabTest) => (
        <div>
          <div className="font-medium text-card-foreground">{t.patient}</div>
          <div className="text-xs text-muted-foreground">{t.patientId} · {t.age}y · {t.gender}</div>
        </div>
      ),
    },
    { key: "test", header: "Test Name" },
    {
      key: "sampleType", header: "Sample",
      render: (t: LabTest) => {
        const Icon = sampleTypeIcons[t.sampleType] || TestTube;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{t.sampleType}</span>
          </div>
        );
      },
    },
    {
      key: "priority", header: "Priority",
      render: (t: LabTest) => <StatusBadge status={t.priority} />,
    },
    {
      key: "sampleStatus", header: "Sample Status",
      render: (t: LabTest) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={t.sampleStatus} />
          {t.sampleStatus !== "completed" && t.sampleStatus !== "rejected" && (
            <Select
              value=""
              onValueChange={(v) => updateSampleStatus(t.id, v as LabTest["sampleStatus"])}
            >
              <SelectTrigger className="h-6 w-6 p-0 border-0 [&>svg]:hidden">
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-collected">Not Collected</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="in-processing">In Processing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
    { key: "doctor", header: "Doctor" },
    { key: "date", header: "Date" },
    {
      key: "result", header: "Result",
      render: (t: LabTest) => t.result ? (
        <div>
          <span className={`font-medium ${t.abnormal ? "text-destructive" : "text-card-foreground"}`}>
            {t.result} {t.unit}
          </span>
          {t.abnormal && <AlertTriangle className="w-3 h-3 text-destructive inline ml-1" />}
          <div className="text-xs text-muted-foreground">Ref: {t.normalRange} {t.unit}</div>
        </div>
      ) : (
        <span className="text-muted-foreground italic">Awaiting</span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (t: LabTest) => <StatusBadge status={t.status} />,
    },
    {
      key: "actions", header: "Actions",
      render: (t: LabTest) => (
        <div className="flex items-center gap-1">
          {t.status !== "completed" && (
            <Button variant="ghost" size="icon" title="Enter Result" onClick={() => openResult(t)}>
              <FileText className="w-4 h-4 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTest(t)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const labToolbar = useDataToolbar({ data: tests as unknown as Record<string, unknown>[], dateKey: "date", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Lab_Tests" });

  const handleImportTests = async (file: File) => {
    const rows = await labToolbar.handleImport(file);
    if (rows.length > 0) {
      const nextNum = tests.length > 0 ? Math.max(...tests.map(t => parseInt(t.id.split("-")[1]))) + 1 : 501;
      const newTests: LabTest[] = rows.map((row, i) => ({
        id: `LT-${nextNum + i}`, patient: String(row.patient || ""), patientId: String(row.patientId || ""),
        age: Number(row.age) || 0, gender: (row.gender as LabTest["gender"]) || "Male",
        test: String(row.test || ""), doctor: String(row.doctor || ""),
        date: String(row.date || new Date().toISOString().split("T")[0]), completedDate: "",
        status: "pending", priority: (row.priority as LabTest["priority"]) || "routine",
        sampleType: (row.sampleType as LabTest["sampleType"]) || "blood",
        sampleStatus: "not-collected", result: "", normalRange: "", unit: "",
        abnormal: false, notes: "", technicianAssigned: "",
      }));
      setTests((prev) => [...newTests, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Tests" description="Order, track, and manage laboratory tests with sample tracking and result entry">
      </PageHeader>

      <DataToolbar dateFilter={labToolbar.dateFilter} onDateFilterChange={labToolbar.setDateFilter} viewMode={labToolbar.viewMode} onViewModeChange={labToolbar.setViewMode} onExportExcel={labToolbar.handleExportExcel} onExportPDF={labToolbar.handleExportPDF} onImport={handleImportTests} onDownloadSample={labToolbar.handleDownloadSample} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Tests" value={String(totalTests)} icon={TestTube} />
        <StatCard title="Completed" value={String(completedTests)} icon={CheckCircle} />
        <StatCard title="Pending" value={String(pendingTests)} icon={Clock} />
        <StatCard title="Urgent/Stat" value={String(urgentTests)} icon={AlertTriangle} />
        <StatCard title="Abnormal Results" value={String(abnormalResults)} icon={Activity} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by patient, test, ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {priorityLevels.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSampleType} onValueChange={setFilterSampleType}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sample Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Samples</SelectItem>
              {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {labToolbar.viewMode === "list" ? (
            <DataTable columns={columns} data={filtered} keyExtractor={(t) => t.id} />
          ) : (
            <DataGridView columns={columns} data={filtered} keyExtractor={(t) => t.id} />
          )}
        </TabsContent>
      </Tabs>

      {/* Order / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTest ? "Edit Lab Test" : "Order New Test"}</DialogTitle>
            <DialogDescription>{editTest ? "Update test details and tracking info." : "Fill in the test request details."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Patient Info Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Patient Name *</Label>
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
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input value={form.patientId} readOnly className="bg-muted" placeholder="Auto-filled" />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            {/* Gender & Doctor */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as LabTest["gender"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctorNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Technician</Label>
                <Select value={form.technicianAssigned} onValueChange={(v) => setForm({ ...form, technicianAssigned: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign technician" /></SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Test & Sample */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Test Name *</Label>
                <Select value={form.test} onValueChange={(v) => setForm({ ...form, test: v })}>
                  <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent>
                    {labTestNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sample Type</Label>
                <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v as LabTest["sampleType"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as LabTest["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Date & Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LabTest["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sample Status</Label>
                <Select value={form.sampleStatus} onValueChange={(v) => setForm({ ...form, sampleStatus: v as LabTest["sampleStatus"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-collected">Not Collected</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="in-processing">In Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Reference Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Normal Range</Label>
                <Input value={form.normalRange} onChange={(e) => setForm({ ...form, normalRange: e.target.value })} placeholder="e.g. 70-100" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. mg/dL" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional instructions or notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editTest ? "Update" : "Order Test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Entry Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Test Result</DialogTitle>
            <DialogDescription>
              {resultTest && (
                <span>
                  Recording result for <strong>{resultTest.test}</strong> — {resultTest.patient} ({resultTest.patientId})
                  <br />
                  <span className="text-xs">Reference range: {resultTest.normalRange} {resultTest.unit}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Result Value *</Label>
              <Input
                value={resultForm.result}
                onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })}
                placeholder={resultTest ? `Normal: ${resultTest.normalRange} ${resultTest.unit}` : ""}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="abnormal"
                checked={resultForm.abnormal}
                onCheckedChange={(checked) => setResultForm({ ...resultForm, abnormal: !!checked })}
              />
              <Label htmlFor="abnormal" className="text-sm font-normal cursor-pointer">
                Mark as abnormal result
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Notes / Remarks</Label>
              <Textarea
                value={resultForm.notes}
                onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                rows={3}
                placeholder="Clinical observations, recommendations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResultSubmit}>Save Result</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTest} onOpenChange={(open) => !open && setDeleteTest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete test {deleteTest?.id} ({deleteTest?.test}) for {deleteTest?.patient}? This action cannot be undone.
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

export default LabTestsPage;
