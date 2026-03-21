import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <div className="mt-0.5"><StatusBadge status={patient.status} /></div>
            </div>
            {patient.medicalHistory && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Medical History</span>
                <p className="mt-0.5 text-foreground">{patient.medicalHistory}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
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
