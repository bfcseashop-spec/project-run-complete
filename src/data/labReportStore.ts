import { supabase } from "@/integrations/supabase/client";
import { LabReport, getTemplateSections } from "./labReports";

type Listener = () => void;
let reports: LabReport[] = [];
let loaded = false;
let listeners: Listener[] = [];

function emit() { listeners.forEach((l) => l()); }

const toReport = (r: any): LabReport => ({
  id: r.id, patient: r.patient, patientId: r.patient_id, age: r.age,
  gender: r.gender, testName: r.test_name, doctor: r.doctor, date: r.date,
  resultDate: r.result_date, status: r.status, category: r.category,
  result: r.result, normalRange: r.normal_range, remarks: r.remarks,
  sampleType: r.sample_type, collectedAt: r.collected_at, reportedAt: r.reported_at,
  technician: r.technician, pathologist: r.pathologist, instrument: r.instrument,
  expectedTAT: r.expected_tat || undefined, sections: r.sections as any[] || [],
  attachments: (r.attachments as any[]) || [],
});

const load = async () => {
  const { data, error } = await supabase.from("lab_reports").select("*").order("created_at", { ascending: false });
  if (!error && data) { reports = data.map(toReport); loaded = true; emit(); }
};
load();

export function getLabReports(): LabReport[] { return reports; }
export function isLabReportsLoaded() { return loaded; }

export function subscribeLabReports(listener: Listener): () => void {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

export async function addLabReport(report: Omit<LabReport, "id">): Promise<LabReport> {
  const maxNum = reports.reduce((max, r) => {
    const n = parseInt(r.id.split("-")[1]); return isNaN(n) ? max : Math.max(max, n);
  }, 1000);
  const id = `LR-${maxNum + 1}`;
  const newReport: LabReport = { id, ...report };
  const { error } = await supabase.from("lab_reports").insert({
    id, patient: report.patient, patient_id: report.patientId, age: report.age,
    gender: report.gender, test_name: report.testName, doctor: report.doctor,
    date: report.date, result_date: report.resultDate, status: report.status,
    category: report.category, result: report.result, normal_range: report.normalRange,
    remarks: report.remarks, sample_type: report.sampleType, collected_at: report.collectedAt,
    reported_at: report.reportedAt, technician: report.technician, pathologist: report.pathologist,
    instrument: report.instrument, expected_tat: report.expectedTAT || null,
    sections: JSON.parse(JSON.stringify(report.sections)),
  });
  if (error) throw error;
  reports = [newReport, ...reports]; emit();
  return newReport;
}

export async function updateLabReport(id: string, patch: Partial<LabReport>) {
  const dbUp: Record<string, any> = {};
  if (patch.patient !== undefined) dbUp.patient = patch.patient;
  if (patch.patientId !== undefined) dbUp.patient_id = patch.patientId;
  if (patch.age !== undefined) dbUp.age = patch.age;
  if (patch.gender !== undefined) dbUp.gender = patch.gender;
  if (patch.testName !== undefined) dbUp.test_name = patch.testName;
  if (patch.doctor !== undefined) dbUp.doctor = patch.doctor;
  if (patch.date !== undefined) dbUp.date = patch.date;
  if (patch.resultDate !== undefined) dbUp.result_date = patch.resultDate;
  if (patch.status !== undefined) dbUp.status = patch.status;
  if (patch.category !== undefined) dbUp.category = patch.category;
  if (patch.result !== undefined) dbUp.result = patch.result;
  if (patch.normalRange !== undefined) dbUp.normal_range = patch.normalRange;
  if (patch.remarks !== undefined) dbUp.remarks = patch.remarks;
  if (patch.sampleType !== undefined) dbUp.sample_type = patch.sampleType;
  if (patch.collectedAt !== undefined) dbUp.collected_at = patch.collectedAt;
  if (patch.reportedAt !== undefined) dbUp.reported_at = patch.reportedAt;
  if (patch.technician !== undefined) dbUp.technician = patch.technician;
  if (patch.pathologist !== undefined) dbUp.pathologist = patch.pathologist;
  if (patch.instrument !== undefined) dbUp.instrument = patch.instrument;
  if (patch.sections !== undefined) dbUp.sections = JSON.parse(JSON.stringify(patch.sections));
  await supabase.from("lab_reports").update(dbUp).eq("id", id);
  reports = reports.map((r) => (r.id === id ? { ...r, ...patch } : r)); emit();
}

export async function removeLabReport(id: string) {
  await supabase.from("lab_reports").delete().eq("id", id);
  reports = reports.filter((r) => r.id !== id); emit();
}

export async function createReportFromSample(sample: {
  patient: string; patientId: string; age: number;
  gender: "Male" | "Female" | "Other"; testName: string;
  doctor: string; sampleType: string; collectionDate: string;
  collectionTime: string; collectedBy: string;
}): Promise<LabReport> {
  const sections = getTemplateSections(sample.testName);
  return addLabReport({
    patient: sample.patient, patientId: sample.patientId, age: sample.age,
    gender: sample.gender, testName: sample.testName, doctor: sample.doctor,
    date: sample.collectionDate, resultDate: "", status: "pending",
    category: "biochemistry", result: "", normalRange: "", remarks: "",
    sampleType: sample.sampleType, collectedAt: sample.collectionTime,
    reportedAt: "", technician: sample.collectedBy, pathologist: "",
    instrument: "", sections,
  });
}
