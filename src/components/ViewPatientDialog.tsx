import {
  Dialog, DialogContent, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Printer, Heart, Thermometer, Wind, Activity, Weight, Droplets,
  Phone, Clock, User, Stethoscope, FileText, ClipboardList, AlertCircle,
  Droplet, UserCheck, X
} from "lucide-react";
import { printRecordReport } from "@/lib/printUtils";
import type { OPDPatient } from "@/data/opdPatients";

interface ViewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: OPDPatient | null;
}

const ViewPatientDialog = ({ open, onOpenChange, patient }: ViewPatientDialogProps) => {
  if (!patient) return null;

  const typeStyles: Record<string, string> = {
    "Walk In": "bg-primary/15 text-primary border-primary/20",
    "Indoor": "bg-blue-500/10 text-blue-600 border-blue-200",
    "Outdoor": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    "Emergency": "bg-destructive/10 text-destructive border-destructive/20",
  };

  const vitals = [
    { label: "SpO₂", value: patient.spo2, icon: Droplets, unit: "%", gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "BP", value: patient.bp, icon: Activity, unit: "mmHg", gradient: "from-rose-500 to-pink-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "HR", value: patient.hr, icon: Heart, unit: "bpm", gradient: "from-red-500 to-orange-400", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Temp", value: patient.temp, icon: Thermometer, unit: "°F", gradient: "from-amber-500 to-yellow-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "RR", value: patient.rr, icon: Wind, unit: "/min", gradient: "from-teal-500 to-emerald-400", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { label: "Weight", value: patient.weight, icon: Weight, unit: "kg", gradient: "from-purple-500 to-violet-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
  ];

  const hasVitals = vitals.some((v) => v.value);

  const genderFull = patient.gender === "F" ? "Female" : patient.gender === "M" ? "Male" : patient.gender;

  const handlePrint = () => {
    const fields = [
      { label: "Patient Name", value: patient.name }, { label: "Age", value: String(patient.age) },
      { label: "Gender", value: patient.gender }, { label: "Blood Type", value: patient.bloodType || "N/A" },
      { label: "Patient Type", value: patient.patientType || "N/A" }, { label: "Phone", value: patient.phone || "N/A" },
      { label: "Chief Complaint", value: patient.complaint }, { label: "Doctor", value: patient.doctor },
      { label: "Time", value: patient.time },
      { label: "On Examination", value: patient.onExamination || "N/A" },
      { label: "Medical History", value: patient.medicalHistory || "N/A" },
      { label: "SpO₂", value: patient.spo2 ? `${patient.spo2}%` : "N/A" },
      { label: "BP", value: patient.bp ? `${patient.bp} mmHg` : "N/A" },
      { label: "HR", value: patient.hr ? `${patient.hr} bpm` : "N/A" },
      { label: "Temp", value: patient.temp ? `${patient.temp} °F` : "N/A" },
      { label: "RR", value: patient.rr ? `${patient.rr} /min` : "N/A" },
      { label: "Weight", value: patient.weight ? `${patient.weight} kg` : "N/A" },
    ];
    printRecordReport({ id: patient.id, sectionTitle: "OPD Patient Record", fields, photo: patient.photo });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 pt-6 pb-14 rounded-t-xl">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Patient Record</span>
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight">{patient.id}</h2>
        </div>

        {/* Patient card overlapping header */}
        <div className="px-5 -mt-10 relative z-10">
          <div className="bg-card rounded-xl border border-border shadow-lg p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 text-lg font-bold text-primary border-2 border-primary/20 shadow-sm">
                {patient.photo ? (
                  <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover" />
                ) : (
                  patient.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">{patient.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{patient.age} yrs · {genderFull}</span>
                  {patient.bloodType && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-semibold">
                      <Droplet className="w-2.5 h-2.5" /> {patient.bloodType}
                    </span>
                  )}
                  {patient.patientType && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeStyles[patient.patientType] || "bg-muted text-muted-foreground border-border"}`}>
                      {patient.patientType}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Quick info chips */}
          <div className="grid grid-cols-3 gap-2">
            <InfoChip icon={Phone} label="Phone" value={patient.phone || "—"} />
            <InfoChip icon={Stethoscope} label="Doctor" value={patient.doctor} />
            <InfoChip icon={Clock} label="Time" value={patient.time} />
          </div>

          <Separator />

          {/* Clinical Notes */}
          <div className="space-y-3">
            <SectionHeader icon={ClipboardList} title="Clinical Notes" />

            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <NoteField label="Chief Complaint" value={patient.complaint} accent />
              {patient.onExamination && (
                <NoteField label="On Examination" value={patient.onExamination} />
              )}
              {patient.medicalHistory && (
                <NoteField label="Medical History" value={patient.medicalHistory} />
              )}
              {!patient.complaint && !patient.onExamination && !patient.medicalHistory && (
                <p className="text-xs text-muted-foreground italic text-center py-2">No clinical notes recorded</p>
              )}
            </div>
          </div>

          {/* Vital Signs */}
          {hasVitals && (
            <div className="space-y-3">
              <SectionHeader icon={Activity} title="Vital Signs" />
              <div className="grid grid-cols-3 gap-2">
                {vitals.filter(v => v.value).map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className={`relative rounded-xl ${v.bg} p-3 text-center border border-border/50 overflow-hidden`}>
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.gradient}`} />
                      <Icon className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-lg font-bold text-foreground leading-none">{v.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">{v.unit} · {v.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
          <Button size="sm" onClick={handlePrint} className="h-9 bg-gradient-to-r from-primary to-primary/80 shadow-md">
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoChip = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-xs font-semibold text-foreground truncate">{value}</p>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
      <Icon className="w-3 h-3 text-primary" />
    </div>
    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h4>
  </div>
);

const NoteField = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div>
    <span className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-primary" : "text-muted-foreground"}`}>
      {label}
    </span>
    <p className="text-sm text-foreground mt-0.5 leading-relaxed">{value}</p>
  </div>
);

export default ViewPatientDialog;
