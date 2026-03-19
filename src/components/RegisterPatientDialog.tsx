import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import type { OPDPatient } from "@/data/opdPatients";

interface RegisterPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patient: OPDPatient) => void;
  nextTokenNumber: number;
  editPatient?: OPDPatient | null;
}

const doctors = [
  "Dr. Smith", "Dr. Patel", "Dr. Williams", "Dr. Brown", "Dr. Lee",
];

const genderToLabel = (g: string) => (g === "F" ? "Female" : g === "M" ? "Male" : "Other");

const RegisterPatientDialog = ({ open, onOpenChange, onSubmit, nextTokenNumber, editPatient }: RegisterPatientDialogProps) => {
  const [form, setForm] = useState({
    name: "", age: "", gender: "", doctor: "", complaint: "", time: "",
  });

  useEffect(() => {
    if (editPatient) {
      setForm({
        name: editPatient.name,
        age: String(editPatient.age),
        gender: genderToLabel(editPatient.gender),
        doctor: editPatient.doctor,
        complaint: editPatient.complaint,
        time: editPatient.time,
      });
    } else {
      setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "" });
    }
  }, [editPatient, open]);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.doctor || !form.complaint) return;
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
    };
    onSubmit(patient);
    setForm({ name: "", age: "", gender: "", doctor: "", complaint: "", time: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {editPatient ? "Edit Patient" : "Register New Patient"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-2">
              <Label>Patient Name *</Label>
              <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label>Age</Label>
              <Input placeholder="e.g. 34" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gender</Label>
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
              <Label>Doctor *</Label>
              <Select value={form.doctor} onValueChange={(v) => update("doctor", v)}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Complaint *</Label>
            <Input placeholder="e.g. Fever & Headache" value={form.complaint} onChange={(e) => update("complaint", e.target.value)} />
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
