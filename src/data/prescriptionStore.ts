import { supabase } from "@/integrations/supabase/client";

export interface Prescription {
  id: string;
  patient: string;
  patientId: string;
  age: string;
  gender: string;
  doctor: string;
  doctorSpecialization: string;
  date: string;
  medicines: string;
  medicineDetails: { name: string; dosage: string; frequency: string; duration: string }[];
  injections: { name: string; dosage: string; route: string; frequency: string }[];
  tests: { id: string; name: string; category: string; sampleType: string; price: number }[];
  chiefComplaint: string;
  onExamination: string;
  advices: string;
  followUp: string;
  notes: string;
}

type Listener = () => void;
let records: Prescription[] = [];
let loaded = false;
let listeners: Listener[] = [];

function emit() { listeners.forEach((l) => l()); }

const toRecord = (r: any): Prescription => ({
  id: r.id,
  patient: r.patient,
  patientId: r.patient_id,
  age: r.age,
  gender: r.gender,
  doctor: r.doctor,
  doctorSpecialization: r.doctor_specialization,
  date: r.date,
  medicines: r.medicines,
  medicineDetails: r.medicine_details || [],
  injections: r.injections || [],
  tests: r.tests || [],
  chiefComplaint: r.chief_complaint,
  onExamination: r.on_examination,
  advices: r.advices,
  followUp: r.follow_up,
  notes: r.notes,
});

const load = async () => {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; emit(); }
};
load();

export function getPrescriptions(): Prescription[] { return records; }
export function isPrescriptionsLoaded() { return loaded; }

export function subscribePrescriptions(listener: Listener): () => void {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

export async function addPrescription(rx: Omit<Prescription, "id">): Promise<Prescription> {
  const maxNum = records.reduce((max, r) => {
    const n = parseInt(r.id.replace("RX-", ""));
    return isNaN(n) ? max : Math.max(max, n);
  }, 200);
  const id = `RX-${maxNum + 1}`;
  const newRx: Prescription = { id, ...rx };

  const { error } = await supabase.from("prescriptions").insert({
    id,
    patient: rx.patient,
    patient_id: rx.patientId,
    age: rx.age,
    gender: rx.gender,
    doctor: rx.doctor,
    doctor_specialization: rx.doctorSpecialization,
    date: rx.date,
    medicines: rx.medicines,
    medicine_details: rx.medicineDetails,
    injections: rx.injections,
    tests: rx.tests,
    chief_complaint: rx.chiefComplaint,
    on_examination: rx.onExamination,
    advices: rx.advices,
    follow_up: rx.followUp,
    notes: rx.notes,
  });
  if (error) throw error;
  records = [newRx, ...records]; emit();
  return newRx;
}

export async function updatePrescription(id: string, patch: Partial<Prescription>) {
  const dbUp: Record<string, any> = {};
  if (patch.patient !== undefined) dbUp.patient = patch.patient;
  if (patch.patientId !== undefined) dbUp.patient_id = patch.patientId;
  if (patch.age !== undefined) dbUp.age = patch.age;
  if (patch.gender !== undefined) dbUp.gender = patch.gender;
  if (patch.doctor !== undefined) dbUp.doctor = patch.doctor;
  if (patch.doctorSpecialization !== undefined) dbUp.doctor_specialization = patch.doctorSpecialization;
  if (patch.date !== undefined) dbUp.date = patch.date;
  if (patch.medicines !== undefined) dbUp.medicines = patch.medicines;
  if (patch.medicineDetails !== undefined) dbUp.medicine_details = patch.medicineDetails;
  if (patch.injections !== undefined) dbUp.injections = patch.injections;
  if (patch.tests !== undefined) dbUp.tests = patch.tests;
  if (patch.chiefComplaint !== undefined) dbUp.chief_complaint = patch.chiefComplaint;
  if (patch.onExamination !== undefined) dbUp.on_examination = patch.onExamination;
  if (patch.advices !== undefined) dbUp.advices = patch.advices;
  if (patch.followUp !== undefined) dbUp.follow_up = patch.followUp;
  if (patch.notes !== undefined) dbUp.notes = patch.notes;

  await supabase.from("prescriptions").update(dbUp).eq("id", id);
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
}

export async function deletePrescription(id: string) {
  await supabase.from("prescriptions").delete().eq("id", id);
  records = records.filter((r) => r.id !== id);
  emit();
}
