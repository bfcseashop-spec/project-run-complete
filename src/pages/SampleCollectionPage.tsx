import { useState, useMemo, useSyncExternalStore } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import SampleGroupedTable from "@/components/SampleGroupedTable";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PatientSearchSelect } from "@/components/PatientSearchSelect";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Pipette, Clock, CheckCircle, PackageCheck,
  Search, AlertTriangle, Snowflake, Thermometer, ThermometerSun,
  Droplets, FlaskConical, TestTube, ClipboardList, Eye, Printer, Barcode as BarcodeIcon, XCircle, SendHorizonal, Trash2, User,
} from "lucide-react";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import { type SampleRecord, sampleTypes, storageTempOptions } from "@/data/sampleRecords";
import { getTechnicians, subscribeTechnicians } from "@/data/technicianStore";
import ManageTechniciansDialog from "@/components/ManageTechniciansDialog";
import { getSampleRecords, subscribeSamples, addSampleRecord, updateSampleRecord, removeSampleRecord, bulkAddSampleRecords } from "@/data/sampleStore";
import { createReportFromSample } from "@/data/labReportStore";
import { labTestNames } from "@/data/labTests";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { toast } from "sonner";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";

const sampleTypeIcons: Record<string, React.ElementType> = {
  blood: Droplets, urine: FlaskConical, stool: FlaskConical, sputum: FlaskConical,
  swab: TestTube, tissue: TestTube, csf: Droplets, other: ClipboardList,
};

const storageTempIcons: Record<string, React.ElementType> = {
  room: ThermometerSun, refrigerated: Thermometer, frozen: Snowflake,
};

const emptyForm: Omit<SampleRecord, "id"> = {
  patient: "", patientId: "", age: 0, gender: "Male", testName: "", doctor: "",
  collectionDate: new Date().toISOString().split("T")[0], collectionTime: "",
  sampleType: "blood", status: "pending", priority: "routine", collectedBy: "",
  storageTemp: "room", barcode: "", rejectionReason: "", notes: "",
};

const sampleColumns = [
  { key: "id", header: "Sample ID" },
  { key: "patient", header: "Patient" },
  { key: "testName", header: "Test" },
  { key: "sampleType", header: "Sample Type" },
  { key: "priority", header: "Priority" },
  { key: "barcode", header: "Barcode" },
  { key: "collectionDate", header: "Collected" },
  { key: "storageTemp", header: "Storage" },
  { key: "collectedBy", header: "Collect By" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

const SampleCollectionPage = () => {
  const records = useSyncExternalStore(subscribeSamples, getSampleRecords);
  const patients = useSyncExternalStore(subscribePatients, getPatients);
  const doctorNames = useSyncExternalStore(subscribeDoctors, getActiveDoctorNames);
  const technicianList = useSyncExternalStore(subscribeTechnicians, getTechnicians);
  const { activeTests } = useTestNameStore();
  const allTestNames = useMemo(() => {
    const storeNames = activeTests.map(t => t.name);
    const merged = new Set([...labTestNames, ...storeNames]);
    return Array.from(merged).sort();
  }, [activeTests]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);
  const [editRecord, setEditRecord] = useState<SampleRecord | null>(null);
  const [confirmRecord, setConfirmRecord] = useState<SampleRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<SampleRecord | null>(null);
  const [bulkConfirmRecords, setBulkConfirmRecords] = useState<SampleRecord[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSampleType, setFilterSampleType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const toolbar = useDataToolbar({ data: records as unknown as Record<string, unknown>[], dateKey: "collectionDate", columns: sampleColumns, title: "Sample_Collection" });

  const handleImportSamples = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const newRecords: SampleRecord[] = rows.map((row, i) => ({
        id: `SC-imp-${Date.now()}-${i}`,
        patient: String(row.patient || ""), patientId: String(row.patientId || ""),
        age: Number(row.age) || 0, gender: (row.gender as SampleRecord["gender"]) || "Male",
        testName: String(row.testName || ""), doctor: String(row.doctor || ""),
        collectionDate: String(row.collectionDate || new Date().toISOString().split("T")[0]),
        collectionTime: String(row.collectionTime || ""), sampleType: (row.sampleType as SampleRecord["sampleType"]) || "blood",
        status: "pending" as const, priority: (row.priority as SampleRecord["priority"]) || "routine",
        collectedBy: String(row.collectedBy || ""), storageTemp: (row.storageTemp as SampleRecord["storageTemp"]) || "room",
        barcode: `BC-${90000 + records.length + i + 1}`, rejectionReason: "", notes: String(row.notes || ""),
      }));
      bulkAddSampleRecords(newRecords);
    }
  };

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: SampleRecord) => {
    setEditRecord(r);
    const { id, ...rest } = r;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.patient || !form.testName || !form.doctor) return;
    if (editRecord) {
      updateSampleRecord(editRecord.id, form);
    } else {
      addSampleRecord(form);
    }
    setDialogOpen(false);
  };

  const handleConfirmCollected = () => {
    if (!confirmRecord) return;
    // Mark as collected
    const now = new Date();
    updateSampleRecord(confirmRecord.id, {
      status: "collected",
      collectionDate: confirmRecord.collectionDate || now.toISOString().split("T")[0],
      collectionTime: confirmRecord.collectionTime || now.toTimeString().slice(0, 5),
    });
    // Create a pending lab report
    const updated = { ...confirmRecord, status: "collected" as const };
    createReportFromSample({
      patient: updated.patient,
      patientId: updated.patientId,
      age: updated.age,
      gender: updated.gender,
      testName: updated.testName,
      doctor: updated.doctor,
      sampleType: updated.sampleType,
      collectionDate: updated.collectionDate || now.toISOString().split("T")[0],
      collectionTime: updated.collectionTime || now.toTimeString().slice(0, 5),
      collectedBy: updated.collectedBy,
    });
    toast.success(`Sample ${confirmRecord.id} confirmed & sent to Lab Reports`);
    setConfirmRecord(null);
  };

  const handleBulkConfirm = async () => {
    if (!bulkConfirmRecords) return;
    const now = new Date();
    for (const rec of bulkConfirmRecords) {
      await updateSampleRecord(rec.id, {
        status: "collected",
        collectionDate: rec.collectionDate || now.toISOString().split("T")[0],
        collectionTime: rec.collectionTime || now.toTimeString().slice(0, 5),
      });
      await createReportFromSample({
        patient: rec.patient, patientId: rec.patientId, age: rec.age,
        gender: rec.gender, testName: rec.testName, doctor: rec.doctor,
        sampleType: rec.sampleType,
        collectionDate: rec.collectionDate || now.toISOString().split("T")[0],
        collectionTime: rec.collectionTime || now.toTimeString().slice(0, 5),
        collectedBy: rec.collectedBy,
      });
    }
    toast.success(`${bulkConfirmRecords.length} samples confirmed & sent to Lab Reports`);
    setBulkConfirmRecords(null);
  };

  const tabFilter = (r: SampleRecord) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  };

  const filtered = records.filter((r) => {
    const matchSearch = searchTerm === "" ||
      r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSample = filterSampleType === "all" || r.sampleType === filterSampleType;
    return matchSearch && matchSample && tabFilter(r);
  });

  const total = records.length;
  const pending = records.filter((r) => r.status === "pending").length;
  const collected = records.filter((r) => r.status === "collected").length;
  const rejected = records.filter((r) => r.status === "rejected").length;
  const failed = records.filter((r) => r.status === "failed").length;

  const columns = [
    { key: "id", header: "Sample ID" },
    {
      key: "patient", header: "Patient",
      render: (r: SampleRecord) => (
        <div>
          <div className="font-medium text-card-foreground">{r.patient}</div>
          <div className="text-xs text-muted-foreground">{r.patientId} · {r.age}y · {r.gender}</div>
        </div>
      ),
    },
    { key: "testName", header: "Test" },
    {
      key: "sampleType", header: "Sample Type",
      render: (r: SampleRecord) => {
        const Icon = sampleTypeIcons[r.sampleType] || TestTube;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{r.sampleType}</span>
          </div>
        );
      },
    },
    {
      key: "priority", header: "Priority",
      render: (r: SampleRecord) => <StatusBadge status={r.priority} />,
    },
    {
      key: "barcode", header: "Barcode",
      render: (r: SampleRecord) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{r.barcode}</span>
      ),
    },
    {
      key: "collectionTime", header: "Collected",
      render: (r: SampleRecord) => r.collectionTime ? (
        <div className="text-sm">
          <div className="text-card-foreground">{r.collectionDate}</div>
          <div className="text-xs text-muted-foreground">{r.collectionTime}</div>
        </div>
      ) : (
        <span className="text-muted-foreground italic text-xs">Not yet</span>
      ),
    },
    {
      key: "storageTemp", header: "Storage",
      render: (r: SampleRecord) => {
        const Icon = storageTempIcons[r.storageTemp] || Thermometer;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize text-xs">{r.storageTemp}</span>
          </div>
        );
      },
    },
    {
      key: "collectedBy", header: "Collect By",
      render: (r: SampleRecord) => r.collectedBy || <span className="text-muted-foreground italic text-xs">Unassigned</span>,
    },
    {
      key: "status", header: "Status",
      render: (r: SampleRecord) => {
        const mapped = r.status === "failed" ? "rejected" : r.status;
        return <StatusBadge status={mapped as any} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: SampleRecord) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewRecord(r)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(r)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Barcode" onClick={() => printBarcode(r.id, r.patient)}>
            <BarcodeIcon className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => printRecordReport({
            id: r.id, sectionTitle: "Sample Collection Report", fields: [
              { label: "Patient", value: r.patient }, { label: "Patient ID", value: r.patientId },
              { label: "Test", value: r.testName }, { label: "Sample Type", value: r.sampleType },
              { label: "Priority", value: r.priority }, { label: "Barcode", value: r.barcode },
              { label: "Collection Date", value: r.collectionDate }, { label: "Collection Time", value: r.collectionTime || "N/A" },
              { label: "Storage", value: r.storageTemp }, { label: "Lab Technician", value: r.collectedBy || "Unassigned" },
              { label: "Status", value: r.status }, { label: "Notes", value: r.notes || "—" },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          {(r.status === "pending" || r.status === "collected") && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title={r.status === "pending" ? "Confirm & Send to Lab" : "Send to Lab Reports"} onClick={() => setConfirmRecord(r)}>
              <SendHorizonal className="w-3.5 h-3.5 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sample Collection" description="Track sample collection, chain of custody, and storage management">
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Sample</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImportSamples} onDownloadSample={toolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Samples" value={String(total)} icon={Pipette} />
        <StatCard title="Pending" value={String(pending)} icon={Clock} />
        <StatCard title="Collected" value={String(collected)} icon={CheckCircle} />
        <StatCard title="Rejected" value={String(rejected)} icon={AlertTriangle} />
        <StatCard title="Failed" value={String(failed)} icon={XCircle} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Samples</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="collected">Collected</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by patient, test, barcode, or ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterSampleType} onValueChange={setFilterSampleType}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sample Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {toolbar.viewMode === "list" ? (
            <SampleGroupedTable
              data={filtered}
              onView={setViewRecord}
              onEdit={openEdit}
              onConfirm={setConfirmRecord}
              onDelete={setDeleteRecord}
              onBulkConfirm={setBulkConfirmRecords}
            />
          ) : (
            <DataGridView columns={columns} data={filtered} keyExtractor={(r) => r.id} />
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sample Details — {viewRecord?.id}</DialogTitle>
            <DialogDescription>View sample collection record details.</DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="grid grid-cols-2 gap-3 py-2 text-sm">
              <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{viewRecord.patient}</span></div>
              <div><span className="text-muted-foreground">Patient ID:</span> <span className="font-medium">{viewRecord.patientId}</span></div>
              <div><span className="text-muted-foreground">Age/Gender:</span> <span className="font-medium">{viewRecord.age}y / {viewRecord.gender}</span></div>
              <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{viewRecord.doctor}</span></div>
              <div><span className="text-muted-foreground">Test:</span> <span className="font-medium">{viewRecord.testName}</span></div>
              <div><span className="text-muted-foreground">Sample Type:</span> <span className="font-medium capitalize">{viewRecord.sampleType}</span></div>
              <div><span className="text-muted-foreground">Priority:</span> <span className="font-medium capitalize">{viewRecord.priority}</span></div>
              <div><span className="text-muted-foreground">Barcode:</span> <span className="font-mono font-medium">{viewRecord.barcode}</span></div>
              <div><span className="text-muted-foreground">Collection Date:</span> <span className="font-medium">{viewRecord.collectionDate}</span></div>
              <div><span className="text-muted-foreground">Collection Time:</span> <span className="font-medium">{viewRecord.collectionTime || "Not yet"}</span></div>
              <div><span className="text-muted-foreground">Storage:</span> <span className="font-medium capitalize">{viewRecord.storageTemp}</span></div>
              <div><span className="text-muted-foreground">Lab Technician:</span> <span className="font-medium">{viewRecord.collectedBy || "Unassigned"}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={viewRecord.status === "failed" ? "rejected" : viewRecord.status as any} /></div>
              {viewRecord.rejectionReason && <div className="col-span-2"><span className="text-muted-foreground">Rejection Reason:</span> <span className="font-medium text-destructive">{viewRecord.rejectionReason}</span></div>}
              {viewRecord.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> <span className="font-medium">{viewRecord.notes}</span></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
            <Button onClick={() => { if (viewRecord) printRecordReport({ id: viewRecord.id, sectionTitle: "Sample Collection Report", fields: [
              { label: "Patient", value: viewRecord.patient }, { label: "Test", value: viewRecord.testName },
              { label: "Sample Type", value: viewRecord.sampleType }, { label: "Status", value: viewRecord.status },
              { label: "Barcode", value: viewRecord.barcode }, { label: "Lab Technician", value: viewRecord.collectedBy || "Unassigned" },
            ]}); }}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden rounded-xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 py-5 relative">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <TestTube className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{editRecord ? "Edit Sample Record" : "New Sample Collection"}</h2>
                <p className="text-[11px] text-white/50">{editRecord ? "Update sample details" : "Register a new sample for collection"}</p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-160px)] px-6 py-5 space-y-5">
            {/* Patient Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Patient Information</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-[11px] font-semibold flex items-center gap-1">Patient Name <span className="text-destructive">*</span></Label>
                  <PatientSearchSelect
                    patients={patients}
                    value={form.patient}
                    onSelect={(p) => setForm({ ...form, patient: p.name, patientId: p.id, age: (p as any).age, gender: (p as any).gender as any })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Patient ID</Label>
                  <Input value={form.patientId} readOnly className="bg-muted/50 h-9 text-xs" placeholder="Auto-filled" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Age</Label>
                  <Input type="number" className="h-9 text-xs" value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as SampleRecord["gender"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold flex items-center gap-1">Doctor <span className="text-destructive">*</span></Label>
                  <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctorNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-[11px] font-semibold flex items-center gap-1">Test Name <span className="text-destructive">*</span></Label>
                  <Select value={form.testName} onValueChange={(v) => setForm({ ...form, testName: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      {allTestNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sample Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Sample Details</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Sample Type</Label>
                  <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v as SampleRecord["sampleType"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as SampleRecord["priority"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">Stat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Storage Temp</Label>
                  <Select value={form.storageTemp} onValueChange={(v) => setForm({ ...form, storageTemp: v as SampleRecord["storageTemp"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {storageTempOptions.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Lab Technician</Label>
                    <ManageTechniciansDialog />
                  </div>
                  <Select value={form.collectedBy} onValueChange={(v) => setForm({ ...form, collectedBy: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Assign" /></SelectTrigger>
                    <SelectContent>
                      {technicianList.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Collection & Status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Collection & Status</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Collection Date</Label>
                  <Input type="date" className="h-9 text-xs" value={form.collectionDate} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Collection Time</Label>
                  <Input type="time" className="h-9 text-xs" value={form.collectionTime} onChange={(e) => setForm({ ...form, collectionTime: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SampleRecord["status"] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Special instructions, patient prep notes..." className="text-xs" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>{editRecord ? "Update Record" : "Register Sample"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Collection & Send to Lab */}
      <AlertDialog open={!!confirmRecord} onOpenChange={(open) => !open && setConfirmRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sample & Send to Lab Reports</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRecord?.status === "pending"
                ? `Mark sample ${confirmRecord?.id} as "Collected" and create a pending Lab Report for "${confirmRecord?.testName}"?`
                : `Send collected sample ${confirmRecord?.id} ("${confirmRecord?.testName}") to Lab Reports for processing?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCollected}>Confirm & Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sample Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete sample <strong>{deleteRecord?.id}</strong> for {deleteRecord?.patient}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              if (deleteRecord) {
                removeSampleRecord(deleteRecord.id);
                toast.success(`Sample ${deleteRecord.id} deleted`);
                setDeleteRecord(null);
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bulk Confirm & Send to Lab */}
      <AlertDialog open={!!bulkConfirmRecords} onOpenChange={(open) => !open && setBulkConfirmRecords(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Confirm & Send to Lab Reports</AlertDialogTitle>
            <AlertDialogDescription>
              Send {bulkConfirmRecords?.length} samples for <strong>{bulkConfirmRecords?.[0]?.patient}</strong> to Lab Reports?
              <div className="mt-2 space-y-1">
                {bulkConfirmRecords?.map(r => (
                  <div key={r.id} className="text-xs flex items-center gap-2">
                    <span className="font-mono">{r.id}</span>
                    <span>—</span>
                    <span>{r.testName}</span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm}>Confirm All & Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SampleCollectionPage;
