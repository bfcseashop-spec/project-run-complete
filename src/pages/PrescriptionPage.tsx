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
  doctorSpecialization?: string;
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
  advices?: string;
  followUp?: string;
}

const initialPrescriptions: Prescription[] = [
  { id: "RX-201", patient: "Sarah Johnson", doctor: "Dr. Sarah Smith", doctorSpecialization: "General Physician", date: "2026-03-19", medicines: "Amoxicillin 500mg, Paracetamol 650mg", age: "34", gender: "Female", medicineDetails: [{ name: "Amoxicillin 500mg", dosage: "1 cap", frequency: "Thrice daily", duration: "7 days" }, { name: "Paracetamol 650mg", dosage: "1 tab", frequency: "As needed", duration: "5 days" }], injections: [{ name: "Ceftriaxone 1g", dosage: "1 vial", route: "IV", frequency: "Twice daily" }], tests: [{ id: "TN-001", name: "Complete Blood Count", category: "Hematology", sampleType: "blood", price: 350 }, { id: "TN-015", name: "ESR", category: "Hematology", sampleType: "blood", price: 100 }] },
  { id: "RX-202", patient: "Michael Chen", doctor: "Dr. Raj Patel", doctorSpecialization: "Diabetologist", date: "2026-03-19", medicines: "Metformin 500mg, Glimepiride 2mg", age: "56", gender: "Male", medicineDetails: [{ name: "Metformin 500mg", dosage: "1 tab", frequency: "Twice daily", duration: "30 days" }, { name: "Glimepiride 2mg", dosage: "1 tab", frequency: "Once daily", duration: "30 days" }], injections: [{ name: "Insulin (Regular) 10 IU", dosage: "10 IU", route: "SC", frequency: "Twice daily" }], tests: [{ id: "TN-002", name: "Blood Sugar (Fasting)", category: "Biochemistry", sampleType: "blood", price: 150 }, { id: "TN-003", name: "Blood Sugar (PP)", category: "Biochemistry", sampleType: "blood", price: 150 }, { id: "TN-006", name: "HbA1c", category: "Biochemistry", sampleType: "blood", price: 500 }, { id: "TN-004", name: "Lipid Profile", category: "Biochemistry", sampleType: "blood", price: 800 }, { id: "TN-008", name: "Kidney Function Test", category: "Biochemistry", sampleType: "blood", price: 800 }, { id: "TN-007", name: "Liver Function Test", category: "Biochemistry", sampleType: "blood", price: 900 }, { id: "TN-009", name: "Urine Routine", category: "Urology", sampleType: "urine", price: 200 }] },
  { id: "RX-203", patient: "Emily Davis", doctor: "Dr. Emily Williams", doctorSpecialization: "Orthopedic Surgeon", date: "2026-03-18", medicines: "Ibuprofen 400mg, Diclofenac 50mg", age: "28", gender: "Female", medicineDetails: [{ name: "Ibuprofen 400mg", dosage: "1 tab", frequency: "Twice daily", duration: "5 days" }] },
  { id: "RX-204", patient: "James Wilson", doctor: "Dr. Mark Brown", doctorSpecialization: "Dermatologist", date: "2026-03-18", medicines: "Cetirizine 10mg, Prednisolone 5mg", age: "45", gender: "Male", medicineDetails: [{ name: "Cetirizine 10mg", dosage: "1 tab", frequency: "Once daily", duration: "10 days" }, { name: "Prednisolone 5mg", dosage: "2 tab", frequency: "Once daily", duration: "5 days" }] },
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
    doctorSpecialization: rx.doctorSpecialization || "",
    notes: rx.notes || "",
    medicines: rx.medicineDetails && rx.medicineDetails.length > 0
      ? rx.medicineDetails
      : [{ name: "", dosage: "", frequency: "", duration: "" }],
    injections: rx.injections || [],
    tests: rx.tests || [],
    chiefComplaint: rx.chiefComplaint || "",
    onExamination: rx.onExamination || "",
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
    const testRows = (rx.tests || []).map((t, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ece9;font-size:12px;color:#888;text-align:center">${i + 1}.</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ece9;font-size:13px;font-weight:500">${t.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ece9">
          <span style="background:#e6f7f2;color:#0d9373;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">${t.category}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ece9;text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${formatDualPrice(t.price)}</td>
      </tr>`).join("");
    const medRows = (rx.medicineDetails || []).map((m, i) => `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;${i > 0 ? 'border-top:1px dashed #e8ece9;' : ''}">
        <span style="font-size:13px;font-weight:700;color:#0d9373;min-width:20px">${i + 1}.</span>
        <div>
          <p style="font-size:14px;font-weight:600;color:#1a2e35;margin:0">${m.name}</p>
          <p style="font-size:11px;color:#6b8a8e;margin:3px 0 0">${m.dosage}${m.frequency ? ` — ${m.frequency}` : ''}${m.duration ? ` — ${m.duration}` : ''}</p>
        </div>
      </div>`).join("");
    const injRows = (rx.injections || []).map((inj, i) => `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;${i > 0 ? 'border-top:1px dashed #e8ece9;' : ''}">
        <span style="font-size:13px;font-weight:700;color:#0d9373;min-width:20px">${i + 1}.</span>
        <div>
          <p style="font-size:14px;font-weight:600;color:#1a2e35;margin:0">${inj.name}</p>
          <p style="font-size:11px;color:#6b8a8e;margin:3px 0 0">${inj.dosage} · ${inj.route} · ${inj.frequency}</p>
        </div>
      </div>`).join("");
    const printWin = window.open("", "_blank", "width=750,height=900");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><title>Prescription ${rx.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1a2e35;background:#fff}
  .page{max-width:720px;margin:0 auto;padding:0;border:1px solid #e0e0e0}
  .header{background:linear-gradient(135deg,#0d4f4f 0%,#0a7a6b 40%,#1a8a75 100%);padding:24px 32px;display:flex;justify-content:space-between;align-items:center}
  .header-left h2{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:2px}
  .header-left p{font-size:11px;color:rgba(255,255,255,0.7)}
  .header-right{text-align:right}
  .header-right h3{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:#fff}
  .header-right p{font-size:10px;color:rgba(255,255,255,0.6)}
  .accent-bar{height:4px;background:linear-gradient(90deg,#0d9373,#4ec6a0,#0d9373)}
  .patient-bar{display:grid;grid-template-columns:1.2fr 1fr 0.8fr;border-bottom:1px solid #e8ece9;background:#f8faf9}
  .patient-bar .cell{padding:10px 16px;border-right:1px solid #e8ece9;font-size:12px}
  .patient-bar .cell:last-child{border-right:none}
  .patient-bar .lbl{color:#6b8a8e;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
  .patient-bar .val{font-weight:600;color:#1a2e35;margin-top:1px}
  .content{display:grid;grid-template-columns:200px 1px 1fr;min-height:380px}
  .left-col{padding:20px 16px;background:#fcfdfb}
  .divider{background:linear-gradient(180deg,#0d9373 0%,#e8ece9 30%,#e8ece9 100%)}
  .right-col{padding:20px 24px}
  .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0d9373;margin-bottom:6px;display:flex;align-items:center;gap:6px}
  .section-label::before{content:'';display:inline-block;width:3px;height:12px;background:#0d9373;border-radius:2px}
  .section-text{font-size:12px;color:#3a5a5e;line-height:1.6;white-space:pre-line;margin-bottom:16px}
  .rx-symbol{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:#0d9373;margin-bottom:16px;line-height:1}
  .rx-symbol sub{font-size:22px}
  .test-section{margin-top:20px;padding-top:16px;border-top:2px solid #e8ece9}
  .test-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
  .test-header span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0d9373}
  .test-table{width:100%;border-collapse:collapse;border:1px solid #e8ece9;border-radius:6px;overflow:hidden}
  .test-table th{background:#f0f7f5;padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b8a8e;font-weight:700;border-bottom:2px solid #d4e5df}
  .test-total{display:flex;justify-content:flex-end;padding:10px 12px;font-size:13px;font-weight:700;color:#1a2e35;border-top:2px solid #0d9373}
  .advice-box{margin-top:16px;padding:12px 16px;background:#f0f7f5;border-left:3px solid #0d9373;border-radius:0 6px 6px 0}
  .advice-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0d9373;margin-bottom:4px}
  .advice-text{font-size:12px;color:#3a5a5e;line-height:1.5}
  .signature{display:flex;justify-content:flex-end;padding:20px 24px}
  .sig-block{text-align:center;width:180px}
  .sig-line{border-bottom:1px dashed #9bb8b2;height:36px;margin-bottom:4px}
  .sig-name{font-size:13px;font-weight:600;color:#1a2e35}
  .sig-sub{font-size:10px;color:#9bb8b2}
  .footer{background:linear-gradient(135deg,#0d4f4f,#0a7a6b);padding:10px 24px;display:flex;justify-content:space-between;color:rgba(255,255,255,0.85);font-size:10px}
  @media print{.page{border:none;max-width:100%}@page{margin:10mm}}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h2>${rx.doctor}</h2>
      <p>Prescription ID: ${rx.id}</p>
    </div>
    <div class="header-right">
      <h3>${s.clinicName}</h3>
      <p>${s.clinicTagline}</p>
      ${s.clinicRegNumber ? `<p style="margin-top:2px;font-size:9px;opacity:0.5">Reg: ${s.clinicRegNumber}</p>` : ""}
    </div>
  </div>
  <div class="accent-bar"></div>
  <div class="patient-bar">
    <div class="cell"><div class="lbl">Patient Name</div><div class="val">${rx.patient}</div></div>
    <div class="cell"><div class="lbl">Age / Gender</div><div class="val">${rx.age || "—"} yrs, ${rx.gender || "—"}</div></div>
    <div class="cell"><div class="lbl">Date</div><div class="val">${rx.date}</div></div>
  </div>
  <div class="content">
    <div class="left-col">
      ${rx.chiefComplaint ? `<div class="section-label">Chief Complaint</div><div class="section-text">${rx.chiefComplaint}</div>` : ""}
      ${rx.onExamination ? `<div class="section-label">On Examination</div><div class="section-text">${rx.onExamination}</div>` : ""}
    </div>
    <div class="divider"></div>
    <div class="right-col">
      <div class="rx-symbol">R<sub>x</sub></div>
      ${medRows ? `<div style="margin-bottom:16px">${medRows}</div>` : ""}
      ${injRows ? `<div style="margin-top:16px;padding-top:12px;border-top:2px solid #e8ece9"><div class="section-label" style="margin-bottom:10px">💉 Injections</div>${injRows}</div>` : ""}
      ${testRows ? `<div class="test-section"><div class="test-header"><span>🧪 Prescribed Tests (${rx.tests!.length})</span></div><table class="test-table"><thead><tr><th style="width:30px">#</th><th>Test Name</th><th style="width:100px">Category</th><th style="text-align:right;width:90px">Price</th></tr></thead><tbody>${testRows}</tbody></table><div class="test-total">Test Total: ${formatDualPrice(rx.tests!.reduce((s, t) => s + t.price, 0))}</div></div>` : ""}
      ${rx.advices ? `<div class="advice-box"><div class="advice-label">Advices</div><div class="advice-text">${rx.advices}</div></div>` : ""}
      ${rx.followUp ? `<div style="margin-top:12px;padding:10px 16px;background:#fff8f0;border-left:3px solid #e8a040;border-radius:0 6px 6px 0"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c07830;margin-bottom:4px">Follow-up</div><div style="font-size:12px;color:#3a5a5e">${rx.followUp}</div></div>` : ""}
      ${rx.notes ? `<div style="margin-top:12px"><div style="font-size:10px;font-weight:600;color:#9bb8b2;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Notes</div><div style="font-size:12px;color:#6b8a8e">${rx.notes}</div></div>` : ""}
    </div>
  </div>
  <div class="signature">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">${rx.doctor}</div>
      <div class="sig-sub">Signature</div>
      <div class="sig-sub">${rx.date}</div>
    </div>
  </div>
  <div class="footer">
    <span>📞 ${s.clinicPhone}</span>
    <span>📍 ${s.clinicAddress}</span>
    <span>🌐 ${s.clinicWebsite}</span>
  </div>
</div>
</body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 300);
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl shadow-2xl">
          {viewRx && (
            <div className="bg-background">
              {/* Premium Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(170,70%,22%)] via-[hsl(170,55%,32%)] to-[hsl(165,50%,40%)] px-7 py-6">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300/60 via-teal-200/80 to-emerald-300/60" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white tracking-wide">{viewRx.doctor}</h2>
                    <p className="text-xs text-white/50 mt-0.5">Prescription ID: {viewRx.id}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <h3 className="text-base font-heading font-bold text-white">{s.clinicName}</h3>
                      <p className="text-[10px] text-white/60">{s.clinicTagline}</p>
                      {s.clinicRegNumber && <p className="text-[9px] text-white/40 mt-0.5">Reg: {s.clinicRegNumber}</p>}
                    </div>
                    <img src={clinicLogo} alt={s.clinicName} className="w-11 h-11 rounded-lg bg-white/10 p-1 ring-1 ring-white/20" />
                  </div>
                </div>
              </div>

              {/* Patient Info Bar */}
              <div className="grid grid-cols-3 bg-muted/30 border-b border-border">
                <div className="px-5 py-3 border-r border-border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Patient Name</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{viewRx.patient}</p>
                </div>
                <div className="px-5 py-3 border-r border-border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Age / Gender</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{viewRx.age || "—"} yrs, {viewRx.gender || "—"}</p>
                </div>
                <div className="px-5 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Date</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{viewRx.date}</p>
                </div>
              </div>

              {/* Two-Column Content */}
              <div className="relative grid grid-cols-[200px_1fr] min-h-[340px]">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img src={clinicLogo} alt="" className="w-44 h-44 opacity-[0.04]" />
                </div>

                {/* Left: Clinical */}
                <div className="relative z-10 border-r border-border p-5 space-y-5 bg-muted/10">
                  {viewRx.chiefComplaint && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary mb-1.5 flex items-center gap-1.5">
                        <span className="w-[3px] h-3 bg-primary rounded-full inline-block" />
                        Chief Complaint
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{viewRx.chiefComplaint}</p>
                    </div>
                  )}
                  {viewRx.onExamination && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary mb-1.5 flex items-center gap-1.5">
                        <span className="w-[3px] h-3 bg-primary rounded-full inline-block" />
                        On Examination
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{viewRx.onExamination}</p>
                    </div>
                  )}
                  {!viewRx.chiefComplaint && !viewRx.onExamination && (
                    <p className="text-xs text-muted-foreground italic">No clinical notes</p>
                  )}
                </div>

                {/* Right: Rx */}
                <div className="relative z-10 p-5">
                  <p className="text-4xl font-heading font-bold text-primary mb-5 tracking-tight">
                    R<sub className="text-2xl">x</sub>
                  </p>

                  {viewRx.medicineDetails && viewRx.medicineDetails.length > 0 && (
                    <div className="space-y-1 mb-5">
                      {viewRx.medicineDetails.map((m, i) => (
                        <div key={i} className="flex items-start gap-2.5 py-1.5" style={i > 0 ? { borderTop: '1px dashed hsl(var(--border))' } : {}}>
                          <span className="text-xs font-bold text-primary mt-0.5 w-5 flex-shrink-0">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {m.dosage}{m.frequency && ` — ${m.frequency}`}{m.duration && ` — ${m.duration}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewRx.injections && viewRx.injections.length > 0 && (
                    <div className="mt-5 pt-4 border-t-2 border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Syringe className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary">
                          Injections ({viewRx.injections.length})
                        </p>
                      </div>
                      <div className="space-y-1">
                        {viewRx.injections.map((inj, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-1.5" style={i > 0 ? { borderTop: '1px dashed hsl(var(--border))' } : {}}>
                            <span className="text-xs font-bold text-primary mt-0.5 w-5 flex-shrink-0">{i + 1}.</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{inj.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{inj.dosage} · {inj.route} · {inj.frequency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewRx.tests && viewRx.tests.length > 0 && (
                    <div className="mt-5 pt-4 border-t-2 border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <TestTube className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary">
                          Prescribed Tests ({viewRx.tests.length})
                        </p>
                      </div>
                      <div className="space-y-1">
                        {viewRx.tests.map((tt, i) => (
                          <div key={tt.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/40">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-primary w-5">{i + 1}.</span>
                              <span className="text-sm font-medium text-foreground">{tt.name}</span>
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-primary/5 border-primary/20 text-primary">{tt.category}</Badge>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{formatDualPrice(tt.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3 pt-2 border-t-2 border-primary/20">
                        <p className="text-sm font-bold text-foreground">
                          Test Total: <span className="text-primary ml-1">{formatDualPrice(viewRx.tests.reduce((s, tt) => s + tt.price, 0))}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {viewRx.advices && (
                    <div className="mt-5 bg-primary/5 border-l-[3px] border-primary rounded-r-md p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[1px] text-primary mb-1">Advices</p>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{viewRx.advices}</p>
                    </div>
                  )}

                  {viewRx.followUp && (
                    <div className="mt-3 bg-warning/10 border-l-[3px] border-warning rounded-r-md p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[1px] text-warning mb-1">Follow-up</p>
                      <p className="text-sm text-foreground">{viewRx.followUp}</p>
                    </div>
                  )}

                  {viewRx.notes && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{viewRx.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="px-7 py-5 flex justify-end border-t border-border">
                <div className="text-center w-48">
                  <div className="border-b border-dashed border-muted-foreground/30 mb-1.5 h-9" />
                  <p className="text-xs font-semibold text-foreground">{viewRx.doctor}</p>
                  <p className="text-[10px] text-muted-foreground">Signature</p>
                  <p className="text-[10px] text-muted-foreground">{viewRx.date}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-[hsl(170,70%,22%)] via-[hsl(170,55%,32%)] to-[hsl(165,50%,40%)] px-7 py-3 flex items-center justify-between text-white/85 text-[10px]">
                <span>📞 {s.clinicPhone}</span>
                <span>📍 {s.clinicAddress}</span>
                <span>🌐 {s.clinicWebsite}</span>
              </div>

              {/* Print Button */}
              <div className="flex justify-end p-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => handlePrint(viewRx)}>
                  <Printer className="w-4 h-4 mr-1.5" /> Print
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
