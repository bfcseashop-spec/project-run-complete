import { OPDPatient } from "@/data/opdPatients";

// Shared mutable patient list so OPD additions appear in Prescriptions
let _patients: OPDPatient[] = [];
const _listeners: Set<() => void> = new Set();

export function initPatients(initial: OPDPatient[]) {
  if (_patients.length === 0) _patients = [...initial];
}

export function getPatients(): OPDPatient[] {
  return _patients;
}

export function addPatient(patient: OPDPatient) {
  _patients = [patient, ..._patients];
  _listeners.forEach((fn) => fn());
}

export function updatePatient(id: string, updated: OPDPatient) {
  _patients = _patients.map((p) => (p.id === id ? updated : p));
  _listeners.forEach((fn) => fn());
}

export function removePatient(id: string) {
  _patients = _patients.filter((p) => p.id !== id);
  _listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}
