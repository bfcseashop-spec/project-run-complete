import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import type { OPDPatient, BloodType, PatientType } from "@/data/opdPatients";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";

interface RegisterPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patient: OPDPatient) => void;
  nextTokenNumber: number;
  editPatient?: OPDPatient | null;
}

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const patientTypes: PatientType[] = ["Walk In", "Indoor", "Outdoor", "Emergency"];

const genderToLabel = (g: string) => (g === "F" ? "Female" : g === "M" ? "Male" : "Other");

const RegisterPatientDialog = ({ open, onOpenChange, onSubmit, nextTokenNumber, editPatient }: RegisterPatientDialogProps) => {
  const doctors = useSyncExternalStore(subscribeDoctors, getActiveDoctorNames);
  const [form, setForm] = useState({
    name: "", age: "", gender: "", doctor: "", complaint: "", time: "",
    bloodType: "", patientType: "", phone: "", medicalHistory: "",
    spo2: "", weight: "", bp: "", rr: "", hr: "", temp: "", onExamination: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editPatient) {
      setForm({
        name: editPatient.name,
        age: String(editPatient.age),
        gender: genderToLabel(editPatient.gender),
        doctor: editPatient.doctor,
        complaint: editPatient.complaint,
        time: editPatient.time,
        bloodType: editPatient.bloodType || "",
        patientType: editPatient.patientType || "",
        phone: editPatient.phone || "",
        medicalHistory: editPatient.medicalHistory || "",
        spo2: editPatient.spo2 || "",
        weight: editPatient.weight || "",
        bp: editPatient.bp || "",
        rr: editPatient.rr || "",
        hr: editPatient.hr || "",
        temp: editPatient.temp || "",
      });
      setImagePreview(editPatient.photo || null);
    } else {
      setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "", bloodType: "", patientType: "", phone: "", medicalHistory: "", spo2: "", weight: "", bp: "", rr: "", hr: "", temp: "" });
      setImagePreview(null);
    }
  }, [editPatient, open]);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return; // silently reject files > 5MB
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Allow saving with partial data — no required fields enforced
    const now = new Date();
    const timeStr = form.time || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const patient: OPDPatient = {
      id: editPatient?.id || `OPD-${nextTokenNumber}`,
      name: form.name,
      age: parseInt(form.age) || 0,
      gender: form.gender === "Female" ? "F" : form.gender === "Other" ? "O" : "M",
      doctor: form.doctor,
      status: editPatient?.status || "pending",
      time: timeStr,
      complaint: form.complaint,
      bloodType: (form.bloodType as BloodType) || undefined,
      patientType: (form.patientType as PatientType) || undefined,
      phone: form.phone || undefined,
      medicalHistory: form.medicalHistory || undefined,
      photo: imagePreview || undefined,
      spo2: form.spo2 || undefined,
      weight: form.weight || undefined,
      bp: form.bp || undefined,
      rr: form.rr || undefined,
      hr: form.hr || undefined,
      temp: form.temp || undefined,
    };
    onSubmit(patient);
    setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "", bloodType: "", patientType: "", phone: "", medicalHistory: "", spo2: "", weight: "", bp: "", rr: "", hr: "", temp: "" });
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {editPatient ? "Edit Patient" : "Register New Patient"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Patient" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Patient Photo</span>
              <span className="text-xs text-muted-foreground">Click to upload (max 5MB)</span>
              {imagePreview && (
                <Button variant="ghost" size="sm" className="h-6 w-fit px-2 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}>
                  <X className="w-3 h-3 mr-1" /> Remove
                </Button>
              )}
            </div>
          </div>

          {/* Row 1: Name, Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="flex items-center gap-1.5">Patient Name <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Recommended</span></Label>
              <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} className={!form.name ? "border-amber-300/50" : "border-green-400/50"} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">Age <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
              <Input placeholder="e.g. 34" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
          </div>

          {/* Row 2: Gender, Blood Type, Patient Type */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="flex items-center gap-1.5">Gender <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">Blood Type <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
              <Select value={form.bloodType} onValueChange={(v) => update("bloodType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">Patient Type <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
              <Select value={form.patientType} onValueChange={(v) => update("patientType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {patientTypes.map((pt) => (
                    <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Doctor, Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1.5">Doctor <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Recommended</span></Label>
              <Select value={form.doctor} onValueChange={(v) => update("doctor", v)}>
                <SelectTrigger className={!form.doctor ? "border-amber-300/50" : "border-green-400/50"}><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">Phone Number <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
              <Input placeholder="e.g. 012 345 678" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>

          {/* Row 4: Complaint */}
          <div>
            <Label className="flex items-center gap-1.5">Complaint <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Recommended</span></Label>
            <Input placeholder="e.g. Fever & Headache" value={form.complaint} onChange={(e) => update("complaint", e.target.value)} className={!form.complaint ? "border-amber-300/50" : "border-green-400/50"} />
          </div>

          {/* Vital Signs */}
          <div>
            <Label className="flex items-center gap-1.5 mb-2">Vital Signs <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">SpO₂ (%)</Label>
                <Input placeholder="e.g. 98" value={form.spo2} onChange={(e) => update("spo2", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Weight / Wt (kg)</Label>
                <Input placeholder="e.g. 65" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">BP (mmHg)</Label>
                <Input placeholder="e.g. 120/80" value={form.bp} onChange={(e) => update("bp", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">RR (breaths/min)</Label>
                <Input placeholder="e.g. 18" value={form.rr} onChange={(e) => update("rr", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">HR (bpm)</Label>
                <Input placeholder="e.g. 72" value={form.hr} onChange={(e) => update("hr", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Temp (°C)</Label>
                <Input placeholder="e.g. 36.5" value={form.temp} onChange={(e) => update("temp", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Row 5: Medical History */}
          <div>
            <Label className="flex items-center gap-1.5">Medical History <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
            <Textarea placeholder="e.g. Diabetes, Hypertension, Previous surgeries..." value={form.medicalHistory} onChange={(e) => update("medicalHistory", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{editPatient ? "Save Changes" : "Register Patient"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPatientDialog;
