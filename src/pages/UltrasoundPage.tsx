import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
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
  Plus, Pencil, Trash2, MonitorSpeaker, Clock, CheckCircle, Activity,
  Search, Heart, Baby, Scan, CircleDot, Waves, Printer,
} from "lucide-react";
import {
  ultrasoundRecords, type UltrasoundRecord, regions, examinationNames,
} from "@/data/ultrasoundRecords";

const regionIcons: Record<string, React.ElementType> = {
  abdomen: Scan,
  pelvis: CircleDot,
  obstetric: Baby,
  thyroid: Waves,
  breast: CircleDot,
  musculoskeletal: Activity,
  vascular: Waves,
  cardiac: Heart,
};

const emptyForm: Omit<UltrasoundRecord, "id"> = {
  patient: "", examination: "", doctor: "", date: new Date().toISOString().split("T")[0],
  reportDate: "", status: "pending", region: "abdomen", findings: "",
  impression: "", remarks: "",
};

function printReport(r: UltrasoundRecord, clinic: { name: string; tagline: string; phone: string; email: string; address: string; regNumber: string }) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Ultrasound Report - ${r.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:0;background:#fff}
.page{max-width:760px;margin:0 auto;padding:32px 40px}
.header{text-align:center;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:20px}
.header h1{font-size:22px;font-weight:700;color:#0f766e;letter-spacing:0.5px}
.header .tagline{font-size:12px;color:#666;margin-top:2px}
.header .contact{font-size:11px;color:#888;margin-top:6px}
.report-title{text-align:center;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:6px;padding:10px;margin-bottom:20px}
.report-title h2{font-size:16px;font-weight:600;color:#0f766e;text-transform:uppercase;letter-spacing:1px}
.report-title .id{font-size:11px;color:#888;margin-top:2px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px}
.info-cell{padding:10px 14px;border-bottom:1px solid #e5e7eb}
.info-cell:nth-child(odd){border-right:1px solid #e5e7eb}
.info-cell .lbl{font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600}
.info-cell .val{font-size:13px;color:#1a1a1a;font-weight:500;margin-top:2px}
.section{margin-bottom:16px}
.section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#0f766e;border-bottom:2px solid #ccfbf1;padding-bottom:4px;margin-bottom:8px}
.section-body{font-size:13px;line-height:1.7;color:#333;padding:8px 12px;background:#fafafa;border-radius:4px;min-height:40px;white-space:pre-wrap}
.section-body.empty{color:#aaa;font-style:italic}
.footer{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;padding-top:20px}
.signature{text-align:center;min-width:200px}
.signature .line{border-top:1px solid #333;margin-bottom:4px}
.signature .name{font-size:13px;font-weight:600}
.signature .label{font-size:10px;color:#888;text-transform:uppercase}
.stamp{font-size:10px;color:#888;text-align:center;margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px}
@media print{body{padding:0}.page{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="page">
  <div class="header">
    <h1>${clinic.name}</h1>
    <div class="tagline">${clinic.tagline}</div>
    <div class="contact">${clinic.address} &bull; ${clinic.phone} &bull; ${clinic.email}</div>
    ${clinic.regNumber ? `<div class="contact">Reg: ${clinic.regNumber}</div>` : ""}
  </div>
  <div class="report-title">
    <h2>Ultrasonography Report</h2>
    <div class="id">Report ID: ${r.id}</div>
  </div>
  <div class="info-grid">
    <div class="info-cell"><div class="lbl">Patient Name</div><div class="val">${r.patient || "—"}</div></div>
    <div class="info-cell"><div class="lbl">Referring Doctor</div><div class="val">${r.doctor || "—"}</div></div>
    <div class="info-cell"><div class="lbl">Examination</div><div class="val">${r.examination || "—"}</div></div>
    <div class="info-cell"><div class="lbl">Region</div><div class="val" style="text-transform:capitalize">${r.region || "—"}</div></div>
    <div class="info-cell"><div class="lbl">Scan Date</div><div class="val">${r.date || "—"}</div></div>
    <div class="info-cell"><div class="lbl">Report Date</div><div class="val">${r.reportDate || "—"}</div></div>
  </div>
  <div class="section">
    <div class="section-title">Findings</div>
    <div class="section-body ${r.findings ? "" : "empty"}">${r.findings || "No findings recorded yet."}</div>
  </div>
  <div class="section">
    <div class="section-title">Impression</div>
    <div class="section-body ${r.impression ? "" : "empty"}">${r.impression || "Pending radiologist review."}</div>
  </div>
  <div class="section">
    <div class="section-title">Remarks</div>
    <div class="section-body ${r.remarks ? "" : "empty"}">${r.remarks || "No additional remarks."}</div>
  </div>
  <div class="footer">
    <div></div>
    <div class="signature">
      <div class="line" style="width:200px"></div>
      <div class="name">${r.doctor}</div>
      <div class="label">Sonologist / Radiologist</div>
    </div>
  </div>
  <div class="stamp">This is a computer-generated report from ${clinic.name}. Printed on ${new Date().toLocaleDateString()}.</div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

const UltrasoundPage = () => {
  const [records, setRecords] = useState<UltrasoundRecord[]>(ultrasoundRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UltrasoundRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<UltrasoundRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: UltrasoundRecord) => {
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
      const nextId = `US-${3000 + records.length + 1}`;
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

  const filtered = records.filter((r) => {
    const matchSearch = searchTerm === "" ||
      r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.examination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchRegion = filterRegion === "all" || r.region === filterRegion;
    return matchSearch && matchStatus && matchRegion;
  });

  const totalRecords = records.length;
  const completedRecords = records.filter((r) => r.status === "completed").length;
  const pendingRecords = records.filter((r) => r.status === "pending").length;
  const inProgressRecords = records.filter((r) => r.status === "in-progress").length;

  const columns = [
    { key: "id", header: "USG ID" },
    { key: "patient", header: "Patient" },
    { key: "examination", header: "Examination" },
    {
      key: "region", header: "Region",
      render: (r: UltrasoundRecord) => {
        const Icon = regionIcons[r.region] || Scan;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="capitalize">{r.region}</span>
          </div>
        );
      },
    },
    { key: "doctor", header: "Doctor" },
    { key: "date", header: "Date" },
    {
      key: "findings", header: "Findings",
      render: (r: UltrasoundRecord) => r.findings ? (
        <span className="font-medium text-card-foreground">{r.findings}</span>
      ) : (
        <span className="text-muted-foreground italic">Awaiting</span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (r: UltrasoundRecord) => {
        const mapped = r.status === "in-progress" ? "active" : r.status;
        return <StatusBadge status={mapped as "active" | "completed" | "pending"} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (r: UltrasoundRecord) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({ data: records as unknown as Record<string, unknown>[], dateKey: "date", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Ultrasound" });

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const nextId = 3000 + records.length + 1;
      const newRecords: UltrasoundRecord[] = rows.map((row, i) => ({
        id: `US-${nextId + i}`, patient: String(row.patient || ""), examination: String(row.examination || ""),
        doctor: String(row.doctor || ""), date: String(row.date || new Date().toISOString().split("T")[0]),
        reportDate: "", status: "pending", region: (row.region as UltrasoundRecord["region"]) || "abdomen",
        findings: "", impression: "", remarks: "",
      }));
      setRecords((prev) => [...newRecords, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ultrasound" description="Manage ultrasound orders, imaging results, and sonography reports">
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Ultrasound</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scans" value={String(totalRecords)} icon={MonitorSpeaker} />
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
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Ultrasound Record" : "New Ultrasound Order"}</DialogTitle>
            <DialogDescription>{editRecord ? "Update the ultrasound record details." : "Enter details for the new ultrasound order."}</DialogDescription>
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
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v as UltrasoundRecord["region"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
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
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as UltrasoundRecord["status"] })}>
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
            <AlertDialogTitle>Delete Ultrasound Record</AlertDialogTitle>
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

export default UltrasoundPage;
