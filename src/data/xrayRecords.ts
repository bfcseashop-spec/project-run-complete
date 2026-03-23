import { supabase } from "@/integrations/supabase/client";

export interface XRayImage {
  id: string;
  name: string;
  url: string;
  type: "image" | "pdf";
  size: number;
}

export interface XRayRecord {
  id: string;
  patient: string;
  examination: string;
  doctor: string;
  date: string;
  reportDate: string;
  status: "pending" | "completed" | "in-progress";
  bodyPart: "chest" | "spine" | "abdomen" | "extremity" | "skull" | "pelvis" | "dental";
  findings: string;
  impression: string;
  remarks: string;
  images: XRayImage[];
}

type Listener = () => void;
let records: XRayRecord[] = [];
let loaded = false;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

const toRecord = (r: any): XRayRecord => ({
  id: r.id, patient: r.patient, examination: r.examination, doctor: r.doctor,
  date: r.date, reportDate: r.report_date, status: r.status, bodyPart: r.body_part,
  findings: r.findings, impression: r.impression, remarks: r.remarks,
  images: (r.images as XRayImage[]) || [],
});

const load = async () => {
  const { data, error } = await supabase.from("xray_records").select("*").order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; notify(); }
};
load();

export const getXrayRecords = () => records;
export const isXrayLoaded = () => loaded;

export const addXrayRecord = async (record: XRayRecord) => {
  const { error } = await supabase.from("xray_records").insert({
    id: record.id, patient: record.patient, examination: record.examination, doctor: record.doctor,
    date: record.date, report_date: record.reportDate, status: record.status, body_part: record.bodyPart,
    findings: record.findings, impression: record.impression, remarks: record.remarks,
    images: JSON.parse(JSON.stringify(record.images)),
  });
  if (error) throw error;
  records = [record, ...records]; notify();
};

export const updateXrayRecord = async (id: string, updates: Partial<XRayRecord>) => {
  const dbUp: Record<string, any> = {};
  if (updates.patient !== undefined) dbUp.patient = updates.patient;
  if (updates.examination !== undefined) dbUp.examination = updates.examination;
  if (updates.doctor !== undefined) dbUp.doctor = updates.doctor;
  if (updates.date !== undefined) dbUp.date = updates.date;
  if (updates.reportDate !== undefined) dbUp.report_date = updates.reportDate;
  if (updates.status !== undefined) dbUp.status = updates.status;
  if (updates.bodyPart !== undefined) dbUp.body_part = updates.bodyPart;
  if (updates.findings !== undefined) dbUp.findings = updates.findings;
  if (updates.impression !== undefined) dbUp.impression = updates.impression;
  if (updates.remarks !== undefined) dbUp.remarks = updates.remarks;
  if (updates.images !== undefined) dbUp.images = JSON.parse(JSON.stringify(updates.images));
  await supabase.from("xray_records").update(dbUp).eq("id", id);
  records = records.map((r) => (r.id === id ? { ...r, ...updates } : r)); notify();
};

export const removeXrayRecord = async (id: string) => {
  await supabase.from("xray_records").delete().eq("id", id);
  records = records.filter((r) => r.id !== id); notify();
};

export const subscribeXray = (fn: Listener) => {
  listeners.add(fn); return () => listeners.delete(fn);
};

// Keep backward compat exports
export const xrayRecords = records; // deprecated, use getXrayRecords()

export const bodyParts = [
  "chest", "spine", "abdomen", "extremity", "skull", "pelvis", "dental",
] as const;

export const examinationNames = [
  "Chest X-Ray PA", "Chest X-Ray AP", "Chest X-Ray Lateral",
  "Lumbar Spine AP/Lat", "Cervical Spine", "Thoracic Spine",
  "Abdomen Supine", "Abdomen Erect",
  "Right Hand AP/Oblique", "Left Hand AP/Oblique",
  "Right Knee AP/Lat", "Left Knee AP/Lat",
  "Right Shoulder AP", "Left Shoulder AP",
  "Skull AP/Lat", "Pelvis AP", "OPG (Dental)",
  "Right Ankle AP/Lat", "Left Ankle AP/Lat",
  "Right Wrist AP/Lat", "Left Wrist AP/Lat",
];
