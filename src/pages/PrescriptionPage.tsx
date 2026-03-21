import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import {
  Plus, Eye, Printer, TestTube, Pencil, Trash2, Barcode, Syringe,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NewPrescriptionDialog, { PrescriptionFormData, SelectedTest, InjectionEntry } from "@/components/NewPrescriptionDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { barcodeSVG } from "@/lib/barcode";
import { toast } from "sonner";
import clinicLogo from "@/assets/clinic-logo.png";
import { formatPrice, formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { getSettings } from "@/data/settingsStore";
import { t } from "@/lib/i18n";

interface Prescription {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  medicines: string;
  age?: string;
  gender?: string;
  notes?: string;
  medicineDetails?: { name: string; dosage: string; frequency: string; duration: string }[];
  injections?: InjectionEntry[];
  tests?: SelectedTest[];
  chiefComplaint?: string;
  onExamination?: string;
  investigation?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  advices?: string;
  followUp?: string;
}

const initialPrescriptions: Prescription[] = [
  { id: "RX-201", patient: "Sarah Johnson", doctor: "Dr. Sarah Smith", date: "2026-03-19", medicines: "Amoxicillin 500mg, Paracetamol 650mg", age: "34", gender: "Female", medicineDetails: [{ name: "Amoxicillin 500mg", dosage: "1 cap", frequency: "Thrice daily", duration: "7 days" }, { name: "Paracetamol 650mg", dosage: "1 tab", frequency: "As needed", duration: "5 days" }], injections: [{ name: "Ceftriaxone 1g", dosage: "1 vial", route: "IV", frequency: "Twice daily" }], tests: [{ id: "TN-001", name: "Complete Blood Count", category: "Hematology", sampleType: "blood", price: 350 }, { id: "TN-015", name: "ESR", category: "Hematology", sampleType: "blood", price: 100 }] },
  { id: "RX-202", patient: "Michael Chen", doctor: "Dr. Raj Patel", date: "2026-03-19", medicines: "Metformin 500mg, Glimepiride 2mg", age: "56", gender: "Male", medicineDetails: [{ name: "Metformin 500mg", dosage: "1 tab", frequency: "Twice daily", duration: "30 days" }, { name: "Glimepiride 2mg", dosage: "1 tab", frequency: "Once daily", duration: "30 days" }], injections: [{ name: "Insulin (Regular) 10 IU", dosage: "10 IU", route: "SC", frequency: "Twice daily" }], tests: [{ id: "TN-002", name: "Blood Sugar (Fasting)", category: "Biochemistry", sampleType: "blood", price: 150 }, { id: "TN-003", name: "Blood Sugar (PP)", category: "Biochemistry", sampleType: "blood", price: 150 }, { id: "TN-006", name: "HbA1c", category: "Biochemistry", sampleType: "blood", price: 500 }, { id: "TN-004", name: "Lipid Profile", category: "Biochemistry", sampleType: "blood", price: 800 }, { id: "TN-008", name: "Kidney Function Test", category: "Biochemistry", sampleType: "blood", price: 800 }, { id: "TN-007", name: "Liver Function Test", category: "Biochemistry", sampleType: "blood", price: 900 }, { id: "TN-009", name: "Urine Routine", category: "Urology", sampleType: "urine", price: 200 }] },
  { id: "RX-203", patient: "Emily Davis", doctor: "Dr. Emily Williams", date: "2026-03-18", medicines: "Ibuprofen 400mg, Diclofenac 50mg", age: "28", gender: "Female", medicineDetails: [{ name: "Ibuprofen 400mg", dosage: "1 tab", frequency: "Twice daily", duration: "5 days" }] },
  { id: "RX-204", patient: "James Wilson", doctor: "Dr. Mark Brown", date: "2026-03-18", medicines: "Cetirizine 10mg, Prednisolone 5mg", age: "45", gender: "Male", medicineDetails: [{ name: "Cetirizine 10mg", dosage: "1 tab", frequency: "Once daily", duration: "10 days" }, { name: "Prednisolone 5mg", dosage: "2 tab", frequency: "Once daily", duration: "5 days" }] },
];

const PrescriptionPage = () => {
  useSettings();
  const s = getSettings();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [editRx, setEditRx] = useState<Prescription | null>(null);
  const [deleteRx, setDeleteRx] = useState<Prescription | null>(null);
  const [barcodeRx, setBarcodeRx] = useState<Prescription | null>(null);

  const rxToFormData = (rx: Prescription): PrescriptionFormData => ({
    patient: rx.patient,
    age: rx.age || "",
    gender: rx.gender || "",
    doctor: rx.doctor,
    notes: rx.notes || "",
    medicines: rx.medicineDetails && rx.medicineDetails.length > 0
      ? rx.medicineDetails
      : [{ name: "", dosage: "", frequency: "", duration: "" }],
    injections: rx.injections || [],
    tests: rx.tests || [],
    chiefComplaint: rx.chiefComplaint || "",
    onExamination: rx.onExamination || "",
    investigation: rx.investigation || "",
    diagnosis: rx.diagnosis || "",
    treatmentPlan: rx.treatmentPlan || "",
    advices: rx.advices || "",
    followUp: rx.followUp || "",
  });

  const handleSubmit = (data: PrescriptionFormData) => {
    const medNames = data.medicines.filter((m) => m.name).map((m) => m.name).join(", ");
    const injNames = data.injections.filter((inj) => inj.name).map((inj) => inj.name).join(", ");
    const allMeds = [medNames, injNames].filter(Boolean).join(", ");

    if (editRx) {
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.id === editRx.id
            ? {
                ...p,
                patient: data.patient,
                doctor: data.doctor,
                medicines: allMeds,
                age: data.age,
                gender: data.gender,
                notes: data.notes,
                medicineDetails: data.medicines.filter((m) => m.name),
                injections: data.injections.filter((inj) => inj.name),
                tests: data.tests,
                chiefComplaint: data.chiefComplaint,
                onExamination: data.onExamination,
                investigation: data.investigation,
                diagnosis: data.diagnosis,
                treatmentPlan: data.treatmentPlan,
                advices: data.advices,
                followUp: data.followUp,
              }
            : p
        )
      );
      setEditRx(null);
      toast.success("Prescription updated");
    } else {
      const nextId = `RX-${200 + prescriptions.length + 1}`;
      setPrescriptions((prev) => [
        {
          id: nextId,
          patient: data.patient,
          doctor: data.doctor,
          date: new Date().toISOString().split("T")[0],
          medicines: allMeds,
          age: data.age,
          gender: data.gender,
          notes: data.notes,
          medicineDetails: data.medicines.filter((m) => m.name),
          injections: data.injections.filter((inj) => inj.name),
          tests: data.tests,
          chiefComplaint: data.chiefComplaint,
          onExamination: data.onExamination,
          investigation: data.investigation,
          diagnosis: data.diagnosis,
          treatmentPlan: data.treatmentPlan,
          advices: data.advices,
          followUp: data.followUp,
        },
        ...prev,
      ]);
      toast.success("Prescription created");
    }
    setDialogOpen(false);
  };

  const openEdit = (rx: Prescription) => {
    setEditRx(rx);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditRx(null);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteRx) {
      setPrescriptions((prev) => prev.filter((p) => p.id !== deleteRx.id));
      setDeleteRx(null);
      toast.success("Prescription deleted");
    }
  };

  const handlePrint = (rx: Prescription) => {
    const testRows = (rx.tests || []).map((t, i) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${i + 1}.</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${t.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${t.category}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${formatDualPrice(t.price)}</td></tr>`).join("");
    const medRows = (rx.medicineDetails || []).map((m, i) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${i + 1}.</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${m.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${m.dosage} — ${m.frequency}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${m.duration}</td></tr>`).join("");
    const injRows = (rx.injections || []).map((inj, i) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${i + 1}.</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${inj.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${inj.dosage} — ${inj.route}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${inj.frequency}</td></tr>`).join("");
    const printWin = window.open("", "_blank", "width=700,height=800");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><title>Prescription ${rx.id}</title><style>
      body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:20px}
      .header{background:linear-gradient(135deg,hsl(170,60%,40%),hsl(210,60%,30%));color:#fff;padding:20px;border-radius:8px 8px 0 0}
      .patient-bar{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #ddd;border-top:none}
      .patient-bar div{padding:8px 12px;border-right:1px solid #ddd;font-size:12px}
      .patient-bar div:last-child{border-right:none}
      .patient-bar span{color:#888}
      .two-col{display:grid;grid-template-columns:1fr 1.5fr;min-height:400px;border:1px solid #ddd;border-top:none}
      .left-col{border-right:1px solid #ddd;padding:16px}
      .right-col{padding:16px}
      .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:hsl(170,60%,35%);margin:12px 0 4px;border-bottom:1px solid #eee;padding-bottom:2px}
      .section-title:first-child{margin-top:0}
      .section-text{font-size:12px;color:#333;white-space:pre-line;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{text-align:left;padding:6px 8px;border-bottom:2px solid #333;font-size:11px;text-transform:uppercase;color:#555}
      h3{margin:16px 0 4px;font-size:14px;color:hsl(170,60%,35%)}
      .total{text-align:right;font-weight:700;padding:8px;border-top:2px solid #333;font-size:13px}
      .rx-symbol{font-size:28px;font-weight:bold;color:hsl(170,60%,35%);font-style:italic;margin-bottom:12px}
    </style></head><body>
      <div class="header"><h2 style="margin:0">${rx.doctor}</h2><small>Prescription ID: ${rx.id}</small></div>
      <div class="patient-bar"><div><span>Patient: </span><strong>${rx.patient}</strong></div><div><span>Age/Gender: </span>${rx.age || "—"}, ${rx.gender || "—"}</div><div><span>Date: </span>${rx.date}</div></div>
      <div class="two-col">
        <div class="left-col">
          ${rx.chiefComplaint ? `<p class="section-title">Chief Complaint</p><p class="section-text">${rx.chiefComplaint}</p>` : ""}
          ${rx.onExamination ? `<p class="section-title">On Examination</p><p class="section-text">${rx.onExamination}</p>` : ""}
          ${rx.investigation ? `<p class="section-title">Investigation</p><p class="section-text">${rx.investigation}</p>` : ""}
          ${rx.diagnosis ? `<p class="section-title">Diagnosis</p><p class="section-text">${rx.diagnosis}</p>` : ""}
          ${rx.treatmentPlan ? `<p class="section-title">Treatment Plan</p><p class="section-text">${rx.treatmentPlan}</p>` : ""}
        </div>
        <div class="right-col">
          <div class="rx-symbol">℞</div>
          ${medRows ? `<table><tr><th>#</th><th>Medicine</th><th>Dosage / Frequency</th><th>Duration</th></tr>${medRows}</table>` : ""}
          ${injRows ? `<h3>Injections</h3><table><tr><th>#</th><th>Injection</th><th>Dosage / Route</th><th>Frequency</th></tr>${injRows}</table>` : ""}
          ${testRows ? `<h3>Prescribed Tests (${rx.tests!.length})</h3><table><tr><th>#</th><th>Test Name</th><th>Category</th><th style="text-align:right">Price</th></tr>${testRows}</table><div class="total">Total: ${formatDualPrice(rx.tests!.reduce((s, t) => s + t.price, 0))}</div>` : ""}
          ${rx.advices ? `<p class="section-title" style="margin-top:16px">Advices</p><p class="section-text">${rx.advices}</p>` : ""}
          ${rx.followUp ? `<p class="section-title">Follow-up</p><p class="section-text">${rx.followUp}</p>` : ""}
          ${rx.notes ? `<p class="section-title">Notes</p><p class="section-text">${rx.notes}</p>` : ""}
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:20px 24px">
        <div style="text-align:center;width:180px">
          <div style="border-bottom:1px dashed #999;height:40px;margin-bottom:4px"></div>
          <p style="font-size:12px;font-weight:600;margin:0">${rx.doctor}</p>
          <p style="font-size:10px;color:#888;margin:2px 0 0">Signature</p>
          <p style="font-size:10px;color:#888;margin:2px 0 0">${rx.date}</p>
        </div>
      </div>
    </body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 200);
  };

  const handleBarcodePrint = (rx: Prescription) => {
    const svg = barcodeSVG(rx.id, 260, 60);
    const printWin = window.open("", "_blank", "width=450,height=300");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><title>Barcode: ${rx.id}</title><style>
      @page{size:80mm 40mm;margin:4mm}*{margin:0;padding:0;box-sizing:border-box}
      body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',system-ui,sans-serif}
      .label{width:300px;padding:16px 20px;text-align:center}
      .clinic{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px}
      .patient{font-size:12px;font-weight:700;margin-bottom:2px}
      .meta{font-size:9px;color:#777;margin-bottom:10px}
      .barcode-wrap{display:flex;justify-content:center;margin-bottom:6px}
      .barcode-wrap svg{width:260px;height:60px}
      .code{font-family:'Courier New',monospace;font-size:12px;letter-spacing:4px;font-weight:700}
    </style></head><body><div class="label">
      <div class="clinic">ClinicPOS Prescription</div>
      <div class="patient">${rx.patient}</div>
      <div class="meta">${rx.doctor} · ${rx.date}</div>
      <div class="barcode-wrap">${svg}</div>
      <div class="code">${rx.id}</div>
    </div></body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 200);
  };

  const columns = [
    { key: "id", header: "Rx ID" },
    { key: "patient", header: "Patient" },
    { key: "doctor", header: "Doctor" },
    {
      key: "tests", header: "Test Names", render: (p: Prescription) => (
        p.tests && p.tests.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
                <TestTube className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <Badge variant="secondary" className="text-xs">{p.tests.length} test{p.tests.length > 1 ? "s" : ""}</Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="px-3 py-2 border-b border-border bg-muted/40">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TestTube className="w-3.5 h-3.5 text-primary" />
                  Prescribed Tests ({p.tests.length})
                </p>
              </div>
              <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                {p.tests.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-primary w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="truncate font-medium text-foreground">{t.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{formatDualPrice(t.price)}</span>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-border bg-muted/40 flex justify-end">
                <span className="text-xs font-bold text-foreground">Total: {formatDualPrice(p.tests.reduce((s, tt) => s + tt.price, 0))}</span>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      ),
    },
    { key: "medicines", header: "Medicines", render: (p: Prescription) => (
      <span className="max-w-[200px] truncate block">{p.medicines || "—"}</span>
    ) },
    {
      key: "injections", header: "Injections", render: (p: Prescription) => (
        p.injections && p.injections.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
                <Syringe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <Badge variant="secondary" className="text-xs">{p.injections.length} inj.</Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="px-3 py-2 border-b border-border bg-muted/40">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-primary" />
                  Injections ({p.injections.length})
                </p>
              </div>
              <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                {p.injections.map((inj, i) => (
                  <div key={i} className="px-3 py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="font-medium text-foreground">{inj.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{inj.dosage} · {inj.route} · {inj.frequency}</p>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      ),
    },
    { key: "date", header: "Date" },
    {
      key: "actions", header: "Actions", render: (p: Prescription) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewRx(p)}>
            <Eye className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(p)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => handlePrint(p)}>
            <Printer className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Barcode" onClick={() => setBarcodeRx(p)}>
            <Barcode className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => setDeleteRx(p)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const rxToolbar = useDataToolbar({ data: prescriptions as unknown as Record<string, unknown>[], dateKey: "date", columns: columns.map(c => ({ key: c.key, header: c.header })), title: "Prescriptions" });

  const handleImportRx = async (file: File) => {
    const rows = await rxToolbar.handleImport(file);
    if (rows.length > 0) {
      const newRx: Prescription[] = rows.map((row, i) => ({
        id: `RX-${200 + prescriptions.length + i + 1}`,
        patient: String(row.patient || ""), doctor: String(row.doctor || ""),
        date: String(row.date || new Date().toISOString().split("T")[0]),
        medicines: String(row.medicines || ""),
      }));
      setPrescriptions((prev) => [...newRx, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Prescriptions" description="Create and manage patient prescriptions">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Prescription</Button>
      </PageHeader>

      <DataToolbar dateFilter={rxToolbar.dateFilter} onDateFilterChange={rxToolbar.setDateFilter} viewMode={rxToolbar.viewMode} onViewModeChange={rxToolbar.setViewMode} onExportExcel={rxToolbar.handleExportExcel} onExportPDF={rxToolbar.handleExportPDF} onImport={handleImportRx} onDownloadSample={rxToolbar.handleDownloadSample} />

      {rxToolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={prescriptions} keyExtractor={(p) => p.id} />
      ) : (
        <DataGridView columns={columns} data={prescriptions} keyExtractor={(p) => p.id} />
      )}

      <NewPrescriptionDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditRx(null); }}
        onSubmit={handleSubmit}
        editData={editRx ? rxToFormData(editRx) : null}
      />

      {/* View Prescription Dialog */}
      <Dialog open={!!viewRx} onOpenChange={() => setViewRx(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {viewRx && (
            <div className="bg-background" id="prescription-print">
              <div className="relative bg-gradient-to-r from-[hsl(170,60%,40%)] to-[hsl(210,60%,30%)] px-6 py-5">
                <div className="absolute top-0 right-0 w-32 h-full bg-[hsl(210,60%,25%)] skew-x-[-12deg] translate-x-8" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">{viewRx.doctor}</h2>
                    <p className="text-sm text-white/80">General Physician</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <h3 className="text-lg font-bold text-white">Prime Poly Clinic</h3>
                      <p className="text-xs text-white/70">Healthcare & Wellness</p>
                    </div>
                    <img src={clinicLogo} alt="Prime Poly Clinic" className="w-12 h-12 rounded-lg bg-white/10 p-1" />
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-[hsl(170,60%,40%)] to-[hsl(170,50%,50%)]" />
              <div className="grid grid-cols-3 border-b border-border bg-muted/30 text-sm">
                <div className="px-4 py-2 border-r border-border">
                  <span className="text-muted-foreground text-xs">Patient Name:</span>
                  <span className="ml-2 font-medium text-foreground">{viewRx.patient}</span>
                </div>
                <div className="px-4 py-2 border-r border-border">
                  <span className="text-muted-foreground text-xs">Age / Gender:</span>
                  <span className="ml-2 font-medium text-foreground">{viewRx.age || "—"} yrs, {viewRx.gender || "—"}</span>
                </div>
                <div className="px-4 py-2">
                  <span className="text-muted-foreground text-xs">Date:</span>
                  <span className="ml-2 font-medium text-foreground">{viewRx.date}</span>
                </div>
              </div>
              <div className="relative grid grid-cols-[200px_1fr] min-h-[320px]">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img src={clinicLogo} alt="" className="w-48 h-48 opacity-[0.06]" />
                </div>
                <div className="relative z-10 border-r border-border p-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Chief Complaint</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{viewRx.chiefComplaint || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">On Examination</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{viewRx.onExamination || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Investigation</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{viewRx.investigation || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Diagnosis</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{viewRx.diagnosis || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Treatment Plan</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{viewRx.treatmentPlan || "—"}</p>
                  </div>
                </div>
                <div className="relative z-10 p-4">
                  <p className="text-3xl font-bold text-[hsl(170,60%,35%)] mb-4">
                    R<sub className="text-xl">x</sub>
                  </p>
                  {viewRx.medicineDetails && viewRx.medicineDetails.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {viewRx.medicineDetails.map((m, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-[hsl(170,60%,35%)] mt-0.5">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.dosage && `${m.dosage}`}{m.frequency && ` — ${m.frequency}`}{m.duration && ` — ${m.duration}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Injections in view */}
                  {viewRx.injections && viewRx.injections.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Syringe className="w-4 h-4 text-[hsl(170,60%,35%)]" />
                        <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider">
                          Injections ({viewRx.injections.length})
                        </p>
                      </div>
                      <div className="space-y-2">
                        {viewRx.injections.map((inj, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-bold text-[hsl(170,60%,35%)] mt-0.5">{i + 1}.</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{inj.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {inj.dosage} · {inj.route} · {inj.frequency}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewRx.tests && viewRx.tests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <TestTube className="w-4 h-4 text-[hsl(170,60%,35%)]" />
                        <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider">
                          Prescribed Tests ({viewRx.tests.length})
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {viewRx.tests.map((t, i) => (
                          <div key={t.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/40">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[hsl(170,60%,35%)] w-4">{i + 1}.</span>
                              <span className="font-medium text-foreground">{t.name}</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">{t.category}</Badge>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{formatDualPrice(t.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-2 pt-2 border-t border-border">
                        <p className="text-sm font-bold text-foreground">
                          Test Total: <span className="text-[hsl(170,60%,35%)]">{formatDualPrice(viewRx.tests.reduce((s, tt) => s + tt.price, 0))}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  {viewRx.advices && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Advices</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{viewRx.advices}</p>
                    </div>
                  )}
                  {viewRx.followUp && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-bold text-[hsl(170,60%,35%)] uppercase tracking-wider mb-1">Follow-up</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{viewRx.followUp}</p>
                    </div>
                  )}
                  {viewRx.notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-foreground">{viewRx.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Signature */}
              <div className="px-6 py-4 flex justify-end">
                <div className="text-center w-48">
                  <div className="border-b border-dashed border-foreground/40 mb-1 h-10" />
                  <p className="text-xs font-semibold text-foreground">{viewRx.doctor}</p>
                  <p className="text-[10px] text-muted-foreground">Signature</p>
                  <p className="text-[10px] text-muted-foreground">{viewRx.date}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[hsl(170,60%,40%)] to-[hsl(170,50%,50%)] px-6 py-3 flex items-center justify-between text-white text-xs">
                <span>📞 000 12345 6149</span>
                <span>📍 Clinic Address Here</span>
                <span>🌐 www.clinic.com</span>
              </div>
              <div className="flex justify-end p-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Dialog */}
      <Dialog open={!!barcodeRx} onOpenChange={(open) => !open && setBarcodeRx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Barcode className="w-5 h-5" /> Prescription Barcode</DialogTitle>
          </DialogHeader>
          {barcodeRx && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="bg-white border border-border rounded-lg p-6 w-full shadow-sm text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">ClinicPOS Prescription</p>
                <p className="text-sm font-bold text-gray-900">{barcodeRx.patient}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-4">{barcodeRx.doctor} · {barcodeRx.date}</p>
                <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: barcodeSVG(barcodeRx.id, 260, 60) }} />
                <p className="font-mono text-xs tracking-[0.25em] text-gray-800 font-semibold mt-2">{barcodeRx.id}</p>
                {barcodeRx.tests && barcodeRx.tests.length > 0 && (
                  <p className="text-[9px] text-gray-400 mt-1">{barcodeRx.tests.length} test(s) prescribed</p>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <Button className="flex-1" variant="outline" onClick={() => setBarcodeRx(null)}>Close</Button>
                <Button className="flex-1" onClick={() => handleBarcodePrint(barcodeRx)}>
                  <Printer className="w-4 h-4 mr-1" /> Print Label
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRx} onOpenChange={(open) => !open && setDeleteRx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete prescription <strong>{deleteRx?.id}</strong> for <strong>{deleteRx?.patient}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrescriptionPage;
