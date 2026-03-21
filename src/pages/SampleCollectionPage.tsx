import { useState, useSyncExternalStore } from "react";
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
  Plus, Pencil, Pipette, Clock, CheckCircle, PackageCheck,
  Search, AlertTriangle, Snowflake, Thermometer, ThermometerSun,
  Droplets, FlaskConical, TestTube, ClipboardList, Eye, Printer, Barcode as BarcodeIcon, XCircle, SendHorizonal,
} from "lucide-react";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import { type SampleRecord, sampleTypes, storageTempOptions, collectors } from "@/data/sampleRecords";
import { getSampleRecords, subscribeSamples, addSampleRecord, updateSampleRecord, bulkAddSampleRecords } from "@/data/sampleStore";
import { createReportFromSample } from "@/data/labReportStore";
import { labTestNames } from "@/data/labTests";
import { toast } from "sonner";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);
  const [editRecord, setEditRecord] = useState<SampleRecord | null>(null);
  const [confirmRecord, setConfirmRecord] = useState<SampleRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSampleType, setFilterSampleType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const toolbar = useDataToolbar({ data: records as unknown as Record<string, unknown>[], dateKey: "collectionDate", columns: sampleColumns, title: "Sample_Collection" });

  const handleImportSamples = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const nextNum = records.length > 0 ? Math.max(...records.map(r => parseInt(r.id.split("-")[1]))) + 1 : 3001;
      const newRecords: SampleRecord[] = rows.map((row, i) => ({
        id: `SC-${nextNum + i}`, patient: String(row.patient || ""), patientId: String(row.patientId || ""),
        age: Number(row.age) || 0, gender: (row.gender as SampleRecord["gender"]) || "Male",
        testName: String(row.testName || ""), doctor: String(row.doctor || ""),
        collectionDate: String(row.collectionDate || new Date().toISOString().split("T")[0]),
        collectionTime: String(row.collectionTime || ""), sampleType: (row.sampleType as SampleRecord["sampleType"]) || "blood",
        status: "pending" as const, priority: (row.priority as SampleRecord["priority"]) || "routine",
        collectedBy: String(row.collectedBy || ""), storageTemp: (row.storageTemp as SampleRecord["storageTemp"]) || "room",
        barcode: `BC-${90000 + records.length + i + 1}`, rejectionReason: "", notes: String(row.notes || ""),
      }));
      setRecords((prev) => [...newRecords, ...prev]);
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
    const barcode = form.barcode || `BC-${90000 + records.length + 1}`;
    if (editRecord) {
      setRecords((prev) => prev.map((r) => r.id === editRecord.id ? { ...editRecord, ...form, barcode } : r));
    } else {
      const nextNum = records.length > 0 ? Math.max(...records.map(r => parseInt(r.id.split("-")[1]))) + 1 : 3001;
      setRecords((prev) => [...prev, { id: `SC-${nextNum}`, ...form, barcode }]);
    }
    setDialogOpen(false);
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
              { label: "Storage", value: r.storageTemp }, { label: "Collected By", value: r.collectedBy || "Unassigned" },
              { label: "Status", value: r.status }, { label: "Notes", value: r.notes || "—" },
            ],
          })}>
            <Printer className="w-3.5 h-3.5 text-primary" />
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
            <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
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
              <div><span className="text-muted-foreground">Collected By:</span> <span className="font-medium">{viewRecord.collectedBy || "Unassigned"}</span></div>
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
              { label: "Barcode", value: viewRecord.barcode }, { label: "Collected By", value: viewRecord.collectedBy || "Unassigned" },
            ]}); }}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Sample Record" : "New Sample Collection"}</DialogTitle>
            <DialogDescription>{editRecord ? "Update sample details." : "Register a new sample for collection."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Patient Name *</Label>
                <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="P-XXX" />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as SampleRecord["gender"] })}>
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
                <Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Test Name *</Label>
                <Select value={form.testName} onValueChange={(v) => setForm({ ...form, testName: v })}>
                  <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent>
                    {labTestNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Sample Type</Label>
                <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v as SampleRecord["sampleType"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as SampleRecord["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">Stat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Storage Temp</Label>
                <Select value={form.storageTemp} onValueChange={(v) => setForm({ ...form, storageTemp: v as SampleRecord["storageTemp"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {storageTempOptions.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Collector</Label>
                <Select value={form.collectedBy} onValueChange={(v) => setForm({ ...form, collectedBy: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                  <SelectContent>
                    {collectors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Collection Date</Label>
                <Input type="date" value={form.collectionDate} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Collection Time</Label>
                <Input type="time" value={form.collectionTime} onChange={(e) => setForm({ ...form, collectionTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SampleRecord["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Special instructions, patient prep notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editRecord ? "Update" : "Register Sample"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SampleCollectionPage;
