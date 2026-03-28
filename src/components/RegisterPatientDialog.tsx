import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import {
  Dialog, DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Camera, X, User, Stethoscope, Phone, ClipboardList, Activity,
  Heart, Thermometer, Wind, Weight, Droplets, FileText, Gauge, UserCheck
} from "lucide-react";
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
        onExamination: editPatient.onExamination || "",
      });
      setImagePreview(editPatient.photo || null);
    } else {
      setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "", bloodType: "", patientType: "", phone: "", medicalHistory: "", spo2: "", weight: "", bp: "", rr: "", hr: "", temp: "", onExamination: "" });
      setImagePreview(null);
    }
  }, [editPatient, open]);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const now = new Date();
    const timeStr = form.time || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const patient: OPDPatient = {
      id: editPatient?.id || `OPD-TEMP`,
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
      onExamination: form.onExamination || undefined,
    };
    onSubmit(patient);
    setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "", bloodType: "", patientType: "", phone: "", medicalHistory: "", spo2: "", weight: "", bp: "", rr: "", hr: "", temp: "", onExamination: "" });
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0 rounded-xl border-0 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 py-5">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white/90" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold tracking-tight">
                {editPatient ? "Edit Patient" : "Register New Patient"}
              </h2>
              <p className="text-white/50 text-xs">
                {editPatient ? `Editing ${editPatient.id}` : `Token: OPD-${nextTokenNumber}`}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[calc(92vh-140px)] px-6 py-5 space-y-5">

          {/* Photo + Name + Age row */}
          <div className="flex items-start gap-4">
            <div
              className="relative w-[72px] h-[72px] rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all bg-muted/20 shrink-0 group"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Patient" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[9px] text-muted-foreground">Photo</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview && (
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm"
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FieldLabel icon={User} label="Patient Name" recommended />
                <Input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={`h-9 ${!form.name ? "border-amber-300/50 focus:border-amber-400" : "border-emerald-400/50"}`}
                />
              </div>
              <div>
                <FieldLabel label="Age" />
                <Input placeholder="e.g. 34" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Demographics Section */}
          <div className="space-y-3">
            <SectionTitle icon={User} title="Demographics" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel label="Gender" />
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel label="Blood Type" />
                <Select value={form.bloodType} onValueChange={(v) => update("bloodType", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((bt) => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel label="Patient Type" />
                <Select value={form.patientType} onValueChange={(v) => update("patientType", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {patientTypes.map((pt) => (
                      <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={Stethoscope} label="Doctor" recommended />
                <Select value={form.doctor} onValueChange={(v) => update("doctor", v)}>
                  <SelectTrigger className={`h-9 ${!form.doctor ? "border-amber-300/50" : "border-emerald-400/50"}`}>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel icon={Phone} label="Phone Number" />
                <Input placeholder="e.g. 012 345 678" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Clinical Section */}
          <div className="space-y-3">
            <SectionTitle icon={ClipboardList} title="Clinical Information" />
            <div>
              <FieldLabel icon={ClipboardList} label="Chief Complaint" recommended />
              <Input
                placeholder="e.g. Fever & Headache"
                value={form.complaint}
                onChange={(e) => update("complaint", e.target.value)}
                className={`h-9 ${!form.complaint ? "border-amber-300/50" : "border-emerald-400/50"}`}
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Vital Signs */}
          <div className="space-y-3">
            <SectionTitle icon={Activity} title="Vital Signs" />
            <div className="grid grid-cols-3 gap-3">
              <VitalInput icon={Droplets} label="SpO₂ (%)" placeholder="e.g. 98" value={form.spo2} onChange={(v) => update("spo2", v)} />
              <VitalInput icon={Weight} label="Weight (kg)" placeholder="e.g. 65" value={form.weight} onChange={(v) => update("weight", v)} />
              <VitalInput icon={Gauge} label="BP (mmHg)" placeholder="e.g. 120/80" value={form.bp} onChange={(v) => update("bp", v)} />
              <VitalInput icon={Wind} label="RR (/min)" placeholder="e.g. 18" value={form.rr} onChange={(v) => update("rr", v)} />
              <VitalInput icon={Heart} label="HR (bpm)" placeholder="e.g. 72" value={form.hr} onChange={(v) => update("hr", v)} />
              <VitalInput icon={Thermometer} label="Temp (°C)" placeholder="e.g. 36.5" value={form.temp} onChange={(v) => update("temp", v)} />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Notes Section */}
          <div className="space-y-3">
            <SectionTitle icon={FileText} title="Notes & History" />
            <div>
              <FieldLabel label="On Examination" />
              <Textarea
                placeholder="e.g. SLR positive, Tenderness over L4-L5, Sensory intact..."
                value={form.onExamination}
                onChange={(e) => update("onExamination", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <div>
              <FieldLabel label="Medical History" />
              <Textarea
                placeholder="e.g. Diabetes, Hypertension, Previous surgeries..."
                value={form.medicalHistory}
                onChange={(e) => update("medicalHistory", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-5">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-9 px-6 bg-gradient-to-r from-primary to-primary/80 shadow-md font-semibold">
            {editPatient ? "Save Changes" : "Register Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Sub-components */

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
  </div>
);

const FieldLabel = ({ icon: Icon, label, recommended }: { icon?: any; label: string; recommended?: boolean }) => (
  <Label className="flex items-center gap-1 mb-1 text-xs">
    {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
    <span className="font-medium text-foreground">{label}</span>
    {recommended && (
      <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">Recommended</span>
    )}
    {!recommended && (
      <span className="text-[10px] text-muted-foreground ml-1">Optional</span>
    )}
  </Label>
);

const VitalInput = ({ icon: Icon, label, placeholder, value, onChange }: {
  icon: any; label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    </div>
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 text-sm"
    />
  </div>
);

export default RegisterPatientDialog;
