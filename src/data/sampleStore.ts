import { supabase } from "@/integrations/supabase/client";
import { SampleRecord } from "./sampleRecords";

type Listener = () => void;
let records: SampleRecord[] = [];
let loaded = false;
let listeners: Listener[] = [];

function emit() { listeners.forEach((l) => l()); }

const toRecord = (r: any): SampleRecord => ({
  id: r.id, patient: r.patient, patientId: r.patient_id, age: r.age,
  gender: r.gender, testName: r.test_name, doctor: r.doctor,
  collectionDate: r.collection_date, collectionTime: r.collection_time,
  sampleType: r.sample_type, status: r.status, priority: r.priority,
  collectedBy: r.collected_by, storageTemp: r.storage_temp, barcode: r.barcode,
  rejectionReason: r.rejection_reason, notes: r.notes,
});

const load = async () => {
  const { data, error } = await supabase.from("sample_records").select("*").order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; emit(); }
};
load();

export function getSampleRecords(): SampleRecord[] { return records; }
export function isSamplesLoaded() { return loaded; }

export function subscribeSamples(listener: Listener): () => void {
  listeners.push(listener);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

export async function addSampleRecord(record: Omit<SampleRecord, "id">): Promise<SampleRecord> {
  const maxNum = records.reduce((max, r) => {
    const n = parseInt(r.id.split("-")[1]); return isNaN(n) ? max : Math.max(max, n);
  }, 3000);
  const id = `SC-${maxNum + 1}`;
  const barcode = record.barcode || `BC-${90000 + records.length + 1}`;
  const newRecord: SampleRecord = { id, ...record, barcode };
  const { error } = await supabase.from("sample_records").insert({
    id, patient: record.patient, patient_id: record.patientId, age: record.age,
    gender: record.gender, test_name: record.testName, doctor: record.doctor,
    collection_date: record.collectionDate, collection_time: record.collectionTime,
    sample_type: record.sampleType, status: record.status, priority: record.priority,
    collected_by: record.collectedBy, storage_temp: record.storageTemp, barcode,
    rejection_reason: record.rejectionReason, notes: record.notes,
  });
  if (error) throw error;
  records = [newRecord, ...records]; emit();
  return newRecord;
}

export async function addSampleRecords(newRecords: Omit<SampleRecord, "id">[]): Promise<SampleRecord[]> {
  const added: SampleRecord[] = [];
  for (const r of newRecords) {
    added.push(await addSampleRecord(r));
  }
  return added;
}

export async function updateSampleRecord(id: string, patch: Partial<SampleRecord>) {
  const dbUp: Record<string, any> = {};
  if (patch.patient !== undefined) dbUp.patient = patch.patient;
  if (patch.patientId !== undefined) dbUp.patient_id = patch.patientId;
  if (patch.age !== undefined) dbUp.age = patch.age;
  if (patch.gender !== undefined) dbUp.gender = patch.gender;
  if (patch.testName !== undefined) dbUp.test_name = patch.testName;
  if (patch.doctor !== undefined) dbUp.doctor = patch.doctor;
  if (patch.collectionDate !== undefined) dbUp.collection_date = patch.collectionDate;
  if (patch.collectionTime !== undefined) dbUp.collection_time = patch.collectionTime;
  if (patch.sampleType !== undefined) dbUp.sample_type = patch.sampleType;
  if (patch.status !== undefined) dbUp.status = patch.status;
  if (patch.priority !== undefined) dbUp.priority = patch.priority;
  if (patch.collectedBy !== undefined) dbUp.collected_by = patch.collectedBy;
  if (patch.storageTemp !== undefined) dbUp.storage_temp = patch.storageTemp;
  if (patch.barcode !== undefined) dbUp.barcode = patch.barcode;
  if (patch.rejectionReason !== undefined) dbUp.rejection_reason = patch.rejectionReason;
  if (patch.notes !== undefined) dbUp.notes = patch.notes;
  await supabase.from("sample_records").update(dbUp).eq("id", id);
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r)); emit();
}

export async function removeSampleRecord(id: string) {
  await supabase.from("sample_records").delete().eq("id", id);
  records = records.filter((r) => r.id !== id); emit();
}

export async function bulkAddSampleRecords(newRecords: SampleRecord[]) {
  for (const r of newRecords) {
    await addSampleRecord(r);
  }
}
