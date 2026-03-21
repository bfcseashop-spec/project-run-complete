import { SampleRecord, sampleRecords as initialRecords } from "./sampleRecords";

type Listener = () => void;

let records: SampleRecord[] = [...initialRecords];
let listeners: Listener[] = [];
let nextNum = Math.max(...records.map(r => parseInt(r.id.split("-")[1]))) + 1;

function emit() {
  listeners.forEach((l) => l());
}

export function getSampleRecords(): SampleRecord[] {
  return records;
}

export function subscribeSamples(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function addSampleRecord(record: Omit<SampleRecord, "id">): SampleRecord {
  const id = `SC-${nextNum++}`;
  const barcode = record.barcode || `BC-${90000 + records.length + 1}`;
  const newRecord: SampleRecord = { id, ...record, barcode };
  records = [newRecord, ...records];
  emit();
  return newRecord;
}

export function addSampleRecords(newRecords: Omit<SampleRecord, "id">[]): SampleRecord[] {
  const added: SampleRecord[] = newRecords.map((r) => {
    const id = `SC-${nextNum++}`;
    const barcode = r.barcode || `BC-${90000 + records.length + 1}`;
    return { id, ...r, barcode } as SampleRecord;
  });
  records = [...added, ...records];
  emit();
  return added;
}

export function updateSampleRecord(id: string, patch: Partial<SampleRecord>) {
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
}

export function removeSampleRecord(id: string) {
  records = records.filter((r) => r.id !== id);
  emit();
}

export function bulkAddSampleRecords(newRecords: SampleRecord[]) {
  records = [...newRecords, ...records];
  emit();
}
