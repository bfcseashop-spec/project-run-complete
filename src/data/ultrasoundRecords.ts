import { supabase } from "@/integrations/supabase/client";
import { type XRayImage } from "@/data/xrayRecords";

export type UltrasoundImage = XRayImage;

export interface UltrasoundRecord {
  id: string;
  patient: string;
  examination: string;
  doctor: string;
  date: string;
  reportDate: string;
  status: "pending" | "completed" | "in-progress";
  region: "abdomen" | "pelvis" | "obstetric" | "thyroid" | "breast" | "musculoskeletal" | "vascular" | "cardiac";
  findings: string;
  impression: string;
  remarks: string;
  images: UltrasoundImage[];
}

type Listener = () => void;
let records: UltrasoundRecord[] = [];
let loaded = false;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

const toRecord = (r: any): UltrasoundRecord => ({
  id: r.id, patient: r.patient, examination: r.examination, doctor: r.doctor,
  date: r.date, reportDate: r.report_date, status: r.status, region: r.region,
  findings: r.findings, impression: r.impression, remarks: r.remarks,
  images: (r.images as UltrasoundImage[]) || [],
});

const load = async () => {
  const { data, error } = await supabase.from("ultrasound_records").select("*").order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; notify(); }
};
load();

export const getUltrasoundRecords = () => records;
export const isUltrasoundLoaded = () => loaded;

export const addUltrasoundRecord = async (record: UltrasoundRecord) => {
  const { error } = await supabase.from("ultrasound_records").insert({
    id: record.id, patient: record.patient, examination: record.examination, doctor: record.doctor,
    date: record.date, report_date: record.reportDate, status: record.status, region: record.region,
    findings: record.findings, impression: record.impression, remarks: record.remarks,
    images: JSON.parse(JSON.stringify(record.images)),
  });
  if (error) throw error;
  records = [record, ...records]; notify();
};

export const updateUltrasoundRecord = async (id: string, updates: Partial<UltrasoundRecord>) => {
  const dbUp: Record<string, any> = {};
  if (updates.patient !== undefined) dbUp.patient = updates.patient;
  if (updates.examination !== undefined) dbUp.examination = updates.examination;
  if (updates.doctor !== undefined) dbUp.doctor = updates.doctor;
  if (updates.date !== undefined) dbUp.date = updates.date;
  if (updates.reportDate !== undefined) dbUp.report_date = updates.reportDate;
  if (updates.status !== undefined) dbUp.status = updates.status;
  if (updates.region !== undefined) dbUp.region = updates.region;
  if (updates.findings !== undefined) dbUp.findings = updates.findings;
  if (updates.impression !== undefined) dbUp.impression = updates.impression;
  if (updates.remarks !== undefined) dbUp.remarks = updates.remarks;
  if (updates.images !== undefined) dbUp.images = JSON.parse(JSON.stringify(updates.images));
  await supabase.from("ultrasound_records").update(dbUp).eq("id", id);
  records = records.map((r) => (r.id === id ? { ...r, ...updates } : r)); notify();
};

export const removeUltrasoundRecord = async (id: string) => {
  await supabase.from("ultrasound_records").delete().eq("id", id);
  records = records.filter((r) => r.id !== id); notify();
};

export const subscribeUltrasound = (fn: Listener) => {
  listeners.add(fn); return () => listeners.delete(fn);
};

// Keep these exports for backward compat
export const ultrasoundRecords = records; // deprecated, use getUltrasoundRecords()

export const regions = [
  "abdomen", "pelvis", "obstetric", "thyroid", "breast", "musculoskeletal", "vascular", "cardiac",
] as const;

export const examinationNames = [
  "Whole Abdomen USG", "Upper Abdomen USG", "KUB (Kidney, Ureter, Bladder)",
  "Liver & GB USG", "Pelvic USG", "Transvaginal USG",
  "Obstetric USG (1st Trimester)", "Obstetric USG (2nd Trimester)", "Obstetric USG (3rd Trimester)",
  "NT Scan", "Anomaly Scan", "Growth Scan", "Thyroid USG",
  "Breast USG (Bilateral)", "Breast USG (Unilateral)", "Carotid Doppler",
  "Venous Doppler (Lower Limb)", "Arterial Doppler (Lower Limb)", "Renal Doppler",
  "Echocardiography", "Musculoskeletal USG (Shoulder)", "Musculoskeletal USG (Knee)",
  "Musculoskeletal USG (Other)", "Scrotal USG", "Soft Tissue USG",
];
