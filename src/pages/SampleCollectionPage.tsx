import { useState } from "react";
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
  Plus, Pencil, Trash2, Pipette, Clock, CheckCircle, PackageCheck,
  Search, AlertTriangle, Truck, Snowflake, Thermometer, ThermometerSun,
  Droplets, FlaskConical, TestTube, ClipboardList, XCircle,
} from "lucide-react";
import {
  sampleRecords as initialRecords, type SampleRecord, sampleTypes,
  storageTempOptions, collectors, rejectionReasons,
} from "@/data/sampleRecords";
import { labTestNames } from "@/data/labTests";

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
  sampleType: "blood", status: "scheduled", priority: "routine", collectedBy: "",
  storageTemp: "room", barcode: "", rejectionReason: "", notes: "",
};

const SampleCollectionPage = () => {
  const [records, setRecords] = useState<SampleRecord[]>(initialRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SampleRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<SampleRecord | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRecord, setRejectRecord] = useState<SampleRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSampleType, setFilterSampleType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

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

  const handleDelete = () => {
    if (deleteRecord) {
      setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id));
      setDeleteRecord(null);
    }
  };

  const advanceStatus = (id: string) => {
    setRecords((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const flow: Record<string, SampleRecord["status"]> = {
        scheduled: "collected", collected: "in-transit", "in-transit": "received",
      };
      const next = flow[r.status];
      if (!next) return r;
      const updates: Partial<SampleRecord> = { status: next };
      if (next === "collected" && !r.collectionTime) {
        updates.collectionTime = new Date().toTimeString().slice(0, 5);
      }
      return { ...r, ...updates };
    }));
  };

  const openReject = (r: SampleRecord) => {
    setRejectRecord(r);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (rejectRecord && rejectReason) {
      setRecords((prev) => prev.map((r) =>
        r.id === rejectRecord.id ? { ...r, status: "rejected" as const, rejectionReason: rejectReason } : r
      ));
      setRejectDialogOpen(false);
    }
  };

  const tabFilter = (r: SampleRecord) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return r.status === "collected" || r.status === "in-transit";
    return r.status === activeTab;
  };

  const filtered = records.filter((r) => {
    const matchSearch = searchTerm === "" ||
      r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSample = filterSampleType === "all" || r.sampleType === filterSampleType;
    return matchSearch && matchStatus && matchSample && tabFilter(r);
  });

  const total = records.length;
  const scheduled = records.filter((r) => r.status === "scheduled").length;
  const collected = records.filter((r) => r.status === "collected" || r.status === "in-transit").length;
  const received = records.filter((r) => r.status === "received").length;
  const rejected = records.filter((r) => r.status === "rejected").length;

  const statusFlowLabel: Record<string, string> = {
    scheduled: "Mark Collected", collected: "Mark In-Transit", "in-transit": "Mark Received",
  };

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
      key: "collectedBy", header: "Collector",
      render: (r: SampleRecord) => r.collectedBy || <span className="text-muted-foreground italic text-xs">Unassigned</span>,
    },
    {
      key: "status", header: "Status",
      render: (r: SampleRecord) => {
        const mapped = r.status === "in-transit" ? "active" : r.status === "scheduled" ? "pending" : r.status;
        return <StatusBadge status={mapped as any} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: SampleRecord) => (
        <div className="flex items-center gap-1">
          {statusFlowLabel[r.status] && (
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary" onClick={() => advanceStatus(r.id)}>
              {statusFlowLabel[r.status]}
            </Button>
          )}
          {r.status !== "rejected" && r.status !== "received" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Reject" onClick={() => openReject(r)}>
              <XCircle className="w-4 h-4 text-destructive" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-4 h-4 text-destructive" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Samples" value={String(total)} icon={Pipette} />
        <StatCard title="Scheduled" value={String(scheduled)} icon={Clock} />
        <StatCard title="In Process" value={String(collected)} icon={Truck} />
        <StatCard title="Received" value={String(received)} icon={PackageCheck} />
        <StatCard title="Rejected" value={String(rejected)} icon={AlertTriangle} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Samples</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="active">In Process</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
          <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
        </TabsContent>
      </Tabs>

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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Sample</DialogTitle>
            <DialogDescription>
              Rejecting sample {rejectRecord?.id} for {rejectRecord?.patient}. Select a reason below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {rejectionReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Reject Sample</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sample Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete sample {deleteRecord?.id} for {deleteRecord?.patient}? This action cannot be undone.
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

export default SampleCollectionPage;
