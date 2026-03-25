import { supabase } from "@/integrations/supabase/client";
import { OPDPatient } from "@/data/opdPatients";

type Listener = () => void;
let _patients: OPDPatient[] = [];
let loaded = false;
const _listeners: Set<Listener> = new Set();
const notify = () => _listeners.forEach((fn) => fn());

const toPatient = (r: any): OPDPatient => ({
  id: r.id, name: r.name, age: r.age, gender: r.gender,
  doctor: r.doctor, status: r.status, time: r.time, complaint: r.complaint,
  bloodType: r.blood_type || undefined, patientType: r.patient_type || undefined,
  phone: r.phone || undefined, medicalHistory: r.medical_history || undefined,
  photo: r.photo || undefined,
  spo2: r.spo2 || undefined, weight: r.weight || undefined,
  bp: r.bp || undefined, rr: r.rr || undefined,
  hr: r.hr || undefined, temp: r.temp || undefined,
});

const load = async () => {
  const { data, error } = await supabase.from("opd_patients").select("*").order("created_at", { ascending: false });
  if (!error && data) { _patients = data.map(toPatient); loaded = true; notify(); }
};
load();

export function initPatients(_initial: OPDPatient[]) { /* no-op, loaded from DB */ }
export function getPatients(): OPDPatient[] { return _patients; }
export function isPatientsLoaded() { return loaded; }

export async function addPatient(patient: OPDPatient) {
  const { error } = await supabase.from("opd_patients").insert({
    id: patient.id, name: patient.name, age: patient.age, gender: patient.gender,
    doctor: patient.doctor, status: patient.status, time: patient.time, complaint: patient.complaint,
    blood_type: patient.bloodType || null, patient_type: patient.patientType || null,
    phone: patient.phone || null, medical_history: patient.medicalHistory || null,
    photo: patient.photo || null,
  });
  if (error) throw error;
  _patients = [patient, ..._patients]; notify();
}

export async function updatePatient(id: string, updated: OPDPatient) {
  const { error } = await supabase.from("opd_patients").update({
    name: updated.name, age: updated.age, gender: updated.gender,
    doctor: updated.doctor, status: updated.status, time: updated.time, complaint: updated.complaint,
    blood_type: updated.bloodType || null, patient_type: updated.patientType || null,
    phone: updated.phone || null, medical_history: updated.medicalHistory || null,
    photo: updated.photo || null,
  }).eq("id", id);
  if (error) throw error;
  _patients = _patients.map((p) => (p.id === id ? updated : p)); notify();
}

export async function removePatient(id: string) {
  const { error } = await supabase.from("opd_patients").delete().eq("id", id);
  if (error) throw error;
  _patients = _patients.filter((p) => p.id !== id); notify();
}

export function subscribe(fn: Listener) {
  _listeners.add(fn); return () => { _listeners.delete(fn); };
}
