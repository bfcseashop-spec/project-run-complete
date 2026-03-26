import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Heart, Thermometer, Wind, Activity, Weight, Droplets } from "lucide-react";
import { printRecordReport } from "@/lib/printUtils";
import StatusBadge from "@/components/StatusBadge";
import type { OPDPatient } from "@/data/opdPatients";

interface ViewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: OPDPatient | null;
}

const ViewPatientDialog = ({ open, onOpenChange, patient }: ViewPatientDialogProps) => {
  if (!patient) return null;

  const typeStyles: Record<string, string> = {
    "Walk In": "bg-primary/10 text-primary",
    "Indoor": "bg-blue-500/10 text-blue-600",
    "Outdoor": "bg-emerald-500/10 text-emerald-600",
    "Emergency": "bg-destructive/10 text-destructive",
  };

  const vitals = [
    { label: "SpO₂", value: patient.spo2, icon: Droplets, unit: "%", color: "text-blue-600 bg-blue-50" },
    { label: "BP", value: patient.bp, icon: Activity, unit: "mmHg", color: "text-rose-600 bg-rose-50" },
    { label: "HR", value: patient.hr, icon: Heart, unit: "bpm", color: "text-red-600 bg-red-50" },
    { label: "Temp", value: patient.temp, icon: Thermometer, unit: "°F", color: "text-amber-600 bg-amber-50" },
    { label: "RR", value: patient.rr, icon: Wind, unit: "/min", color: "text-teal-600 bg-teal-50" },
    { label: "Weight", value: patient.weight, icon: Weight, unit: "kg", color: "text-purple-600 bg-purple-50" },
  ];

  const hasVitals = vitals.some((v) => v.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Patient Details — {patient.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 text-xl font-semibold text-muted-foreground border-2 border-border">
              {patient.photo ? (
                <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover" />
              ) : (
                patient.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.age} yrs · {patient.gender === "F" ? "Female" : patient.gender === "M" ? "Male" : patient.gender}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Token" value={patient.id} />
            <InfoRow label="Phone" value={patient.phone || "—"} />
            <InfoRow label="Blood Type" value={patient.bloodType || "—"} />
            <div>
              <span className="text-muted-foreground text-xs">Patient Type</span>
              <div className="mt-0.5">
                {patient.patientType ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles[patient.patientType] || "bg-muted text-muted-foreground"}`}>
                    {patient.patientType}
                  </span>
                ) : "—"}
              </div>
            </div>
            <InfoRow label="Doctor" value={patient.doctor} />
            <InfoRow label="Time" value={patient.time} />
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs">Complaint</span>
              <p className="mt-0.5 font-medium">{patient.complaint}</p>
            </div>
            {patient.onExamination && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">On Examination</span>
                <p className="mt-0.5 text-foreground">{patient.onExamination}</p>
              </div>
            )}
            {patient.medicalHistory && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Medical History</span>
                <p className="mt-0.5 text-foreground">{patient.medicalHistory}</p>
              </div>
            )}
          </div>

          {/* Vital Signs */}
          {hasVitals && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vital Signs</h4>
              <div className="grid grid-cols-3 gap-2">
                {vitals.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className={`rounded-lg p-2.5 text-center ${v.value ? v.color : "bg-muted/50 text-muted-foreground"}`}>
                      <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <p className="text-[11px] opacity-70">{v.label}</p>
                      <p className="text-sm font-semibold">{v.value || "—"}{v.value ? ` ${v.unit}` : ""}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => {
            const fields = [
              { label: "Patient Name", value: patient.name }, { label: "Age", value: String(patient.age) },
              { label: "Gender", value: patient.gender }, { label: "Blood Type", value: patient.bloodType || "N/A" },
              { label: "Patient Type", value: patient.patientType || "N/A" }, { label: "Phone", value: patient.phone || "N/A" },
              { label: "Complaint", value: patient.complaint }, { label: "Doctor", value: patient.doctor },
              { label: "Time", value: patient.time }, { label: "Status", value: patient.status },
              { label: "Medical History", value: patient.medicalHistory || "N/A" },
              { label: "On Examination", value: patient.onExamination || "N/A" },
              { label: "SpO₂", value: patient.spo2 ? `${patient.spo2}%` : "N/A" },
              { label: "BP", value: patient.bp ? `${patient.bp} mmHg` : "N/A" },
              { label: "HR", value: patient.hr ? `${patient.hr} bpm` : "N/A" },
              { label: "Temp", value: patient.temp ? `${patient.temp} °F` : "N/A" },
              { label: "RR", value: patient.rr ? `${patient.rr} /min` : "N/A" },
              { label: "Weight", value: patient.weight ? `${patient.weight} kg` : "N/A" },
            ];
            printRecordReport({ id: patient.id, sectionTitle: "OPD Patient Record", fields, photo: patient.photo });
          }}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-muted-foreground text-xs">{label}</span>
    <p className="mt-0.5 font-medium">{value}</p>
  </div>
);

export default ViewPatientDialog;
