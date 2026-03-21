import { LabReport, labReports as initialReports, getTemplateSections } from "./labReports";

type Listener = () => void;

let reports: LabReport[] = [...initialReports];
let listeners: Listener[] = [];
let nextNum = Math.max(...reports.map(r => parseInt(r.id.split("-")[1]))) + 1;

function emit() {
  listeners.forEach((l) => l());
}

export function getLabReports(): LabReport[] {
  return reports;
}

export function subscribeLabReports(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function addLabReport(report: Omit<LabReport, "id">): LabReport {
  const id = `LR-${nextNum++}`;
  const newReport: LabReport = { id, ...report };
  reports = [newReport, ...reports];
  emit();
  return newReport;
}

export function updateLabReport(id: string, patch: Partial<LabReport>) {
  reports = reports.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
}

export function removeLabReport(id: string) {
  reports = reports.filter((r) => r.id !== id);
  emit();
}

/** Create a pending lab report from a collected sample */
export function createReportFromSample(sample: {
  patient: string;
  patientId: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  testName: string;
  doctor: string;
  sampleType: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
}): LabReport {
  const sections = getTemplateSections(sample.testName);
  return addLabReport({
    patient: sample.patient,
    patientId: sample.patientId,
    age: sample.age,
    gender: sample.gender,
    testName: sample.testName,
    doctor: sample.doctor,
    date: sample.collectionDate,
    resultDate: "",
    status: "pending",
    category: "biochemistry",
    result: "",
    normalRange: "",
    remarks: "",
    sampleType: sample.sampleType,
    collectedAt: sample.collectionTime,
    reportedAt: "",
    technician: sample.collectedBy,
    pathologist: "",
    instrument: "",
    sections,
  });
}
