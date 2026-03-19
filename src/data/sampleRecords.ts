export interface SampleRecord {
  id: string;
  patient: string;
  patientId: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  testName: string;
  doctor: string;
  collectionDate: string;
  collectionTime: string;
  sampleType: "blood" | "urine" | "stool" | "sputum" | "swab" | "tissue" | "csf" | "other";
  status: "scheduled" | "collected" | "in-transit" | "received" | "rejected";
  priority: "routine" | "urgent" | "stat";
  collectedBy: string;
  storageTemp: "room" | "refrigerated" | "frozen";
  barcode: string;
  rejectionReason: string;
  notes: string;
}

export const sampleRecords: SampleRecord[] = [
  { id: "SC-3001", patient: "Sarah Johnson", patientId: "P-101", age: 34, gender: "Female", testName: "Complete Blood Count", doctor: "Dr. Patel", collectionDate: "2026-03-19", collectionTime: "08:30", sampleType: "blood", status: "collected", priority: "routine", collectedBy: "Tech. Ravi", storageTemp: "room", barcode: "BC-90001", rejectionReason: "", notes: "" },
  { id: "SC-3002", patient: "Michael Chen", patientId: "P-102", age: 52, gender: "Male", testName: "Blood Sugar (Fasting)", doctor: "Dr. Patel", collectionDate: "2026-03-19", collectionTime: "07:15", sampleType: "blood", status: "received", priority: "urgent", collectedBy: "Tech. Priya", storageTemp: "refrigerated", barcode: "BC-90002", rejectionReason: "", notes: "Fasting confirmed" },
  { id: "SC-3003", patient: "Emily Davis", patientId: "P-103", age: 45, gender: "Female", testName: "Urine Routine", doctor: "Dr. Smith", collectionDate: "2026-03-18", collectionTime: "09:00", sampleType: "urine", status: "received", priority: "routine", collectedBy: "Tech. Anand", storageTemp: "refrigerated", barcode: "BC-90003", rejectionReason: "", notes: "" },
  { id: "SC-3004", patient: "James Wilson", patientId: "P-104", age: 61, gender: "Male", testName: "Thyroid Panel", doctor: "Dr. Lee", collectionDate: "2026-03-19", collectionTime: "", sampleType: "blood", status: "scheduled", priority: "routine", collectedBy: "", storageTemp: "room", barcode: "BC-90004", rejectionReason: "", notes: "Patient arriving at 11:00 AM" },
  { id: "SC-3005", patient: "Maria Garcia", patientId: "P-105", age: 38, gender: "Female", testName: "HbA1c", doctor: "Dr. Patel", collectionDate: "2026-03-19", collectionTime: "08:45", sampleType: "blood", status: "in-transit", priority: "urgent", collectedBy: "Tech. Priya", storageTemp: "room", barcode: "BC-90005", rejectionReason: "", notes: "Pre-diabetic monitoring" },
  { id: "SC-3006", patient: "Robert Brown", patientId: "P-106", age: 29, gender: "Male", testName: "Stool Routine", doctor: "Dr. Smith", collectionDate: "2026-03-18", collectionTime: "10:30", sampleType: "stool", status: "rejected", priority: "routine", collectedBy: "Tech. Ravi", storageTemp: "room", barcode: "BC-90006", rejectionReason: "Insufficient quantity", notes: "Recollection required" },
  { id: "SC-3007", patient: "Linda Martinez", patientId: "P-107", age: 55, gender: "Female", testName: "Blood Culture", doctor: "Dr. Lee", collectionDate: "2026-03-19", collectionTime: "06:00", sampleType: "blood", status: "received", priority: "stat", collectedBy: "Tech. Meera", storageTemp: "room", barcode: "BC-90007", rejectionReason: "", notes: "Suspected sepsis — immediate processing" },
  { id: "SC-3008", patient: "David Kim", patientId: "P-108", age: 42, gender: "Male", testName: "Sputum Culture", doctor: "Dr. Patel", collectionDate: "2026-03-19", collectionTime: "", sampleType: "sputum", status: "scheduled", priority: "urgent", collectedBy: "", storageTemp: "room", barcode: "BC-90008", rejectionReason: "", notes: "Early morning sample preferred" },
  { id: "SC-3009", patient: "Patricia Taylor", patientId: "P-109", age: 67, gender: "Female", testName: "Kidney Function Test", doctor: "Dr. Smith", collectionDate: "2026-03-18", collectionTime: "09:20", sampleType: "blood", status: "collected", priority: "urgent", collectedBy: "Tech. Anand", storageTemp: "refrigerated", barcode: "BC-90009", rejectionReason: "", notes: "" },
  { id: "SC-3010", patient: "Thomas Anderson", patientId: "P-110", age: 50, gender: "Male", testName: "CSF Analysis", doctor: "Dr. Lee", collectionDate: "2026-03-19", collectionTime: "11:00", sampleType: "csf", status: "in-transit", priority: "stat", collectedBy: "Tech. Meera", storageTemp: "frozen", barcode: "BC-90010", rejectionReason: "", notes: "Lumbar puncture by Dr. Lee, handle with care" },
];

export const sampleTypes = ["blood", "urine", "stool", "sputum", "swab", "tissue", "csf", "other"] as const;
export const storageTempOptions = ["room", "refrigerated", "frozen"] as const;
export const collectors = ["Tech. Ravi", "Tech. Priya", "Tech. Anand", "Tech. Meera"];
export const rejectionReasons = [
  "Insufficient quantity",
  "Hemolyzed sample",
  "Clotted sample",
  "Wrong container",
  "Unlabeled sample",
  "Contaminated",
  "Expired sample",
  "Patient ID mismatch",
];
