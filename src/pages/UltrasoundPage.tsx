import { useState, useRef, useSyncExternalStore } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  Plus, Pencil, Trash2, MonitorSpeaker, Clock, CheckCircle, Activity,
  Search, Heart, Baby, Scan, CircleDot, Waves, Printer, Eye, Barcode as BarcodeIcon,
  Upload, X, FileText, ImageIcon,
} from "lucide-react";
import { printUltrasoundReport, printBarcode } from "@/lib/printUtils";
import {
  ultrasoundRecords, type UltrasoundRecord, type UltrasoundImage, regions, examinationNames,
} from "@/data/ultrasoundRecords";
import { toast } from "sonner";
import ImageLightbox from "@/components/ImageLightbox";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";

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
  impression: "", remarks: "", images: [],
};

function printReport(r: UltrasoundRecord) {
  printUltrasoundReport({
    id: r.id, patient: r.patient, examination: r.examination,
    region: r.region, doctor: r.doctor, date: r.date,
    reportDate: r.reportDate, status: r.status, findings: r.findings,
    impression: r.impression, remarks: r.remarks,
  });
}

const UltrasoundPage = () => {
  const { settings } = useSettings();
  const [records, setRecords] = useState<UltrasoundRecord[]>(ultrasoundRecords);
  const patients = useSyncExternalStore(subscribePatients, getPatients);
  const doctorNames = useSyncExternalStore(subscribeDoctors, getActiveDoctorNames);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UltrasoundRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<UltrasoundRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<UltrasoundRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formImages, setFormImages] = useState<UltrasoundImage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<UltrasoundImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: UltrasoundImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setFormImages([]); setDialogOpen(true); };
  const openEdit = (r: UltrasoundRecord) => {
    setEditRecord(r);
    const { id, ...rest } = r;
    setForm(rest);
    setFormImages(r.images || []);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.patient || !form.examination || !form.doctor) return;
    if (editRecord) {
      setRecords((prev) => prev.map((r) => r.id === editRecord.id ? { ...editRecord, ...form, images: formImages } : r));
    } else {
      const nextId = `US-${3000 + records.length + 1}`;
      setRecords((prev) => [...prev, { id: nextId, ...form, images: formImages }]);
    }
    setDialogOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: UltrasoundImage[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) {
        toast.error(`"${file.name}" is not supported. Use images or PDF.`);
        return;
      }
      newImages.push({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: isPdf ? "pdf" : "image",
        size: file.size,
      });
    });
    setFormImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) toast.success(`${newImages.length} file(s) added`);
    e.target.value = "";
  };

  const removeImage = (imgId: string) => {
    setFormImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewRecord(r)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(r)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print Report" onClick={() => printReport(r)}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/10" title="Barcode" onClick={() => printBarcode(r.id, r.patient)}>
            <BarcodeIcon className="w-3.5 h-3.5 text-accent" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
        findings: "", impression: "", remarks: "", images: [],
      }));
      setRecords((prev) => [...newRecords, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ultrasound" description="Manage ultrasound orders, imaging results, and sonography reports">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
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
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      )}

      {/* View Dialog (Read-Only) */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ultrasound Record Details</DialogTitle>
            <DialogDescription>Viewing record {viewRecord?.id}</DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MonitorSpeaker className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{viewRecord.patient}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{viewRecord.id}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={viewRecord.status === "in-progress" ? "active" : viewRecord.status as "completed" | "pending"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Examination</p><p className="font-medium">{viewRecord.examination}</p></div>
                <div><p className="text-muted-foreground text-xs">Region</p><p className="font-medium capitalize">{viewRecord.region}</p></div>
                <div><p className="text-muted-foreground text-xs">Doctor</p><p className="font-medium">{viewRecord.doctor}</p></div>
                <div><p className="text-muted-foreground text-xs">Date</p><p className="font-medium">{viewRecord.date}</p></div>
                <div><p className="text-muted-foreground text-xs">Report Date</p><p className="font-medium">{viewRecord.reportDate || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><p className="font-medium capitalize">{viewRecord.status}</p></div>
              </div>
              {viewRecord.findings && (
                <div className="text-sm"><p className="text-muted-foreground text-xs">Findings</p><p className="font-medium">{viewRecord.findings}</p></div>
              )}
              {viewRecord.impression && (
                <div className="text-sm"><p className="text-muted-foreground text-xs">Impression</p><p className="font-medium">{viewRecord.impression}</p></div>
              )}
              {viewRecord.remarks && (
                <div className="text-sm"><p className="text-muted-foreground text-xs">Remarks</p><p className="font-medium">{viewRecord.remarks}</p></div>
              )}
              {viewRecord.images && viewRecord.images.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Attached Images ({viewRecord.images.length}) — click to view fullscreen</p>
                  <div className="grid grid-cols-3 gap-2">
                    {viewRecord.images.map((img, idx) => (
                      <div
                        key={img.id}
                        className="border border-border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => openLightbox(viewRecord.images, idx)}
                      >
                        {img.type === "image" ? (
                          <img src={img.url} alt={img.name} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="w-full h-20 bg-muted flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-[10px] p-1 truncate text-muted-foreground">{img.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
            <Button onClick={() => {
              if (viewRecord) printReport(viewRecord);
            }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button onClick={() => { if (viewRecord) { openEdit(viewRecord); setViewRecord(null); } }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Ultrasound Record" : "New Ultrasound Order"}</DialogTitle>
            <DialogDescription>{editRecord ? "Update the ultrasound record details." : "Enter details for the new ultrasound order."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Select value={form.patient} onValueChange={(v) => setForm({ ...form, patient: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Ultrasound Images / Documents</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload ultrasound images</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP, PDF — multiple files allowed</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} />
              {formImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {formImages.map((img) => (
                    <div key={img.id} className="relative group border border-border rounded-lg overflow-hidden bg-muted/30 cursor-pointer" onClick={() => openLightbox(formImages, formImages.indexOf(img))}>
                      {img.type === "image" ? (
                        <img src={img.url} alt={img.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex flex-col items-center justify-center gap-1 bg-muted/50">
                          <FileText className="w-8 h-8 text-destructive/70" />
                          <span className="text-[10px] text-muted-foreground">PDF</span>
                        </div>
                      )}
                      <div className="p-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{img.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatFileSize(img.size)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}>
                          <X className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {formImages.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{formImages.length} file(s) attached</span>
                  <Badge variant="outline" className="text-[10px]">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {formImages.filter(i => i.type === "image").length} images, {formImages.filter(i => i.type === "pdf").length} PDFs
                  </Badge>
                </div>
              )}
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

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Ultrasound Record(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected ultrasound record(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
};

export default UltrasoundPage;
