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
  Plus, Pencil, Trash2, ScanLine, Clock, CheckCircle, Activity,
  Search, Bone, Brain, Heart, Hand, Skull, Eye, Printer, Barcode as BarcodeIcon,
} from "lucide-react";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import { xrayRecords, type XRayRecord, bodyParts, examinationNames } from "@/data/xrayRecords";

const bodyPartIcons: Record<string, React.ElementType> = {
  chest: Heart,
  spine: Bone,
  abdomen: Activity,
  extremity: Hand,
  skull: Skull,
  pelvis: Bone,
  dental: Brain,
};

const emptyForm: Omit<XRayRecord, "id"> = {
  patient: "", examination: "", doctor: "", date: new Date().toISOString().split("T")[0],
  reportDate: "", status: "pending", bodyPart: "chest", findings: "",
  impression: "", remarks: "",
};

const XRayPage = () => {
  const [records, setRecords] = useState<XRayRecord[]>(xrayRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<XRayRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<XRayRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBodyPart, setFilterBodyPart] = useState<string>("all");

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: XRayRecord) => {
    setEditRecord(r);
    const { id, ...rest } = r;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.patient || !form.examination || !form.doctor) return;
    if (editRecord) {
      setRecords((prev) => prev.map((r) => r.id === editRecord.id ? { ...editRecord, ...form } : r));
    } else {
      const nextId = `XR-${2000 + records.length + 1}`;
      setRecords((prev) => [...prev, { id: nextId, ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteRecord) {
      setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id));
      setDeleteRecord(null);
    }
  };

  const handleBulkDelete = () => {
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const filtered = records.filter((r) => {
    const matchSearch = searchTerm === "" ||
      r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.examination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchBody = filterBodyPart === "all" || r.bodyPart === filterBodyPart;
    return matchSearch && matchStatus && matchBody;
  });

  const totalRecords = records.length;
  const completedRecords = records.filter((r) => r.status === "completed").length;
  const pendingRecords = records.filter((r) => r.status === "pending").length;
  const inProgressRecords = records.filter((r) => r.status === "in-progress").length;

  const columns = [
    { key: "id", header: "X-Ray ID" },
    { key: "patient", header: "Patient" },
    { key: "examination", header: "Examination" },
    {
      key: "bodyPart", header: "Body Part",
      render: (r: XRayRecord) => {
        const Icon = bodyPartIcons[r.bodyPart] || Bone;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{r.bodyPart}</span>
          </div>
        );
      },
    },
    { key: "doctor", header: "Doctor" },
    { key: "date", header: "Date" },
    {
      key: "findings", header: "Findings",
      render: (r: XRayRecord) => r.findings ? (
        <span className="font-medium text-card-foreground">{r.findings}</span>
      ) : (
        <span className="text-muted-foreground italic">Awaiting</span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (r: XRayRecord) => {
        const mapped = r.status === "in-progress" ? "active" : r.status;
        return <StatusBadge status={mapped as "active" | "completed" | "pending"} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: XRayRecord) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => printRecordReport({
            id: r.id, sectionTitle: "X-Ray Record", fields: [
              { label: "Patient", value: r.patient }, { label: "Examination", value: r.examination },
              { label: "Body Part", value: r.bodyPart }, { label: "Doctor", value: r.doctor },
              { label: "Date", value: r.date }, { label: "Report Date", value: r.reportDate },
              { label: "Findings", value: r.findings }, { label: "Impression", value: r.impression },
              { label: "Remarks", value: r.remarks }, { label: "Status", value: r.status },
            ],
          })}><Eye className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(r)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => printRecordReport({
            id: r.id, sectionTitle: "X-Ray Report", fields: [
              { label: "Patient", value: r.patient }, { label: "Examination", value: r.examination },
              { label: "Body Part", value: r.bodyPart }, { label: "Doctor", value: r.doctor },
              { label: "Date", value: r.date }, { label: "Report Date", value: r.reportDate },
              { label: "Findings", value: r.findings }, { label: "Impression", value: r.impression },
              { label: "Remarks", value: r.remarks }, { label: "Status", value: r.status },
            ],
          })}><Printer className="w-3.5 h-3.5 text-primary" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Barcode" onClick={() => printBarcode(r.id, r.patient)}>
            <BarcodeIcon className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const xrayToolbar = useDataToolbar({ data: records as unknown as Record<string, unknown>[], dateKey: "date", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "X-Ray" });

  const handleImportXray = async (file: File) => {
    const rows = await xrayToolbar.handleImport(file);
    if (rows.length > 0) {
      const nextId = 2000 + records.length + 1;
      const newRecords: XRayRecord[] = rows.map((row, i) => ({
        id: `XR-${nextId + i}`, patient: String(row.patient || ""), examination: String(row.examination || ""),
        doctor: String(row.doctor || ""), date: String(row.date || new Date().toISOString().split("T")[0]),
        reportDate: "", status: "pending", bodyPart: (row.bodyPart as XRayRecord["bodyPart"]) || "chest",
        findings: "", impression: "", remarks: "",
      }));
      setRecords((prev) => [...newRecords, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="X-Ray" description="Manage X-ray orders, imaging results, and radiology reports">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New X-Ray</Button>
      </PageHeader>

      <DataToolbar dateFilter={xrayToolbar.dateFilter} onDateFilterChange={xrayToolbar.setDateFilter} viewMode={xrayToolbar.viewMode} onViewModeChange={xrayToolbar.setViewMode} onExportExcel={xrayToolbar.handleExportExcel} onExportPDF={xrayToolbar.handleExportPDF} onImport={handleImportXray} onDownloadSample={xrayToolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total X-Rays" value={String(totalRecords)} icon={ScanLine} />
        <StatCard title="Completed" value={String(completedRecords)} icon={CheckCircle} />
        <StatCard title="Pending" value={String(pendingRecords)} icon={Clock} />
        <StatCard title="In Progress" value={String(inProgressRecords)} icon={Activity} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by patient, exam, or ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
        <Select value={filterBodyPart} onValueChange={setFilterBodyPart}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Body Part" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Body Parts</SelectItem>
            {bodyParts.map((b) => (
              <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {xrayToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit X-Ray Record" : "New X-Ray Order"}</DialogTitle>
            <DialogDescription>{editRecord ? "Update the X-ray record details." : "Enter details for the new X-ray order."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Examination *</Label>
                <Select value={form.examination} onValueChange={(v) => setForm({ ...form, examination: v })}>
                  <SelectTrigger><SelectValue placeholder="Select examination" /></SelectTrigger>
                  <SelectContent>
                    {examinationNames.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Part</Label>
                <Select value={form.bodyPart} onValueChange={(v) => setForm({ ...form, bodyPart: v as XRayRecord["bodyPart"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bodyParts.map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Report Date</Label>
                <Input type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as XRayRecord["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Findings</Label>
                <Input value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Impression</Label>
                <Input value={form.impression} onChange={(e) => setForm({ ...form, impression: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editRecord ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete X-Ray Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete record {deleteRecord?.id} for {deleteRecord?.patient}? This action cannot be undone.
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

export default XRayPage;
