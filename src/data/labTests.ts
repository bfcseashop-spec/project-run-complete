export interface LabTest {
  id: string;
  patient: string;
  patientId: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  test: string;
  doctor: string;
  date: string;
  completedDate: string;
  status: "pending" | "active" | "completed";
  priority: "urgent" | "routine" | "stat";
  sampleType: "blood" | "urine" | "stool" | "sputum" | "swab" | "tissue" | "csf" | "other";
  sampleStatus: "not-collected" | "collected" | "in-processing" | "completed" | "rejected";
  result: string;
  normalRange: string;
  unit: string;
  abnormal: boolean;
  notes: string;
  technicianAssigned: string;
}

export const labTests: LabTest[] = [
  {
    id: "LT-501", patient: "Sarah Johnson", patientId: "P-101", age: 34, gender: "Female",
    test: "Complete Blood Count", doctor: "Dr. Patel", date: "2026-03-19", completedDate: "",
    status: "pending", priority: "routine", sampleType: "blood",
    sampleStatus: "collected", result: "", normalRange: "4.5-11.0", unit: "x10³/µL",
    abnormal: false, notes: "", technicianAssigned: "Tech. Ravi"
  },
  {
    id: "LT-502", patient: "Michael Chen", patientId: "P-102", age: 52, gender: "Male",
    test: "Blood Sugar (Fasting)", doctor: "Dr. Patel", date: "2026-03-19", completedDate: "2026-03-19",
    status: "completed", priority: "urgent", sampleType: "blood",
    sampleStatus: "completed", result: "112", normalRange: "70-100", unit: "mg/dL",
    abnormal: true, notes: "Slightly elevated, recommend follow-up", technicianAssigned: "Tech. Priya"
  },
  {
    id: "LT-503", patient: "Emily Davis", patientId: "P-103", age: 45, gender: "Female",
    test: "Lipid Profile", doctor: "Dr. Smith", date: "2026-03-18", completedDate: "2026-03-18",
    status: "completed", priority: "routine", sampleType: "blood",
    sampleStatus: "completed", result: "220", normalRange: "<200", unit: "mg/dL",
    abnormal: true, notes: "Total cholesterol borderline high, LDL elevated", technicianAssigned: "Tech. Ravi"
  },
  {
    id: "LT-504", patient: "James Wilson", patientId: "P-104", age: 61, gender: "Male",
    test: "Thyroid Panel", doctor: "Dr. Lee", date: "2026-03-19", completedDate: "",
    status: "pending", priority: "routine", sampleType: "blood",
    sampleStatus: "not-collected", result: "", normalRange: "0.4-4.0", unit: "mIU/L",
    abnormal: false, notes: "", technicianAssigned: ""
  },
  {
    id: "LT-505", patient: "Maria Garcia", patientId: "P-105", age: 38, gender: "Female",
    test: "HbA1c", doctor: "Dr. Patel", date: "2026-03-19", completedDate: "",
    status: "active", priority: "urgent", sampleType: "blood",
    sampleStatus: "in-processing", result: "", normalRange: "<5.7", unit: "%",
    abnormal: false, notes: "Patient is pre-diabetic, monitor closely", technicianAssigned: "Tech. Priya"
  },
  {
    id: "LT-506", patient: "Robert Brown", patientId: "P-106", age: 29, gender: "Male",
    test: "Urine Routine", doctor: "Dr. Smith", date: "2026-03-18", completedDate: "2026-03-18",
    status: "completed", priority: "routine", sampleType: "urine",
    sampleStatus: "completed", result: "Normal", normalRange: "Normal", unit: "",
    abnormal: false, notes: "No abnormalities detected", technicianAssigned: "Tech. Ravi"
  },
  {
    id: "LT-507", patient: "Linda Martinez", patientId: "P-107", age: 55, gender: "Female",
    test: "Liver Function Test", doctor: "Dr. Lee", date: "2026-03-17", completedDate: "2026-03-18",
    status: "completed", priority: "stat", sampleType: "blood",
    sampleStatus: "completed", result: "ALT: 68", normalRange: "7-56", unit: "U/L",
    abnormal: true, notes: "ALT slightly elevated, advise hepatology consult", technicianAssigned: "Tech. Priya"
  },
  {
    id: "LT-508", patient: "David Kim", patientId: "P-108", age: 42, gender: "Male",
    test: "Blood Culture", doctor: "Dr. Patel", date: "2026-03-19", completedDate: "",
    status: "active", priority: "stat", sampleType: "blood",
    sampleStatus: "in-processing", result: "", normalRange: "No Growth", unit: "",
    abnormal: false, notes: "Suspected sepsis, 48-hour culture pending", technicianAssigned: "Tech. Ravi"
  },
  {
    id: "LT-509", patient: "Patricia Taylor", patientId: "P-109", age: 67, gender: "Female",
    test: "Kidney Function Test", doctor: "Dr. Smith", date: "2026-03-18", completedDate: "",
    status: "pending", priority: "urgent", sampleType: "blood",
    sampleStatus: "collected", result: "", normalRange: "0.7-1.3", unit: "mg/dL",
    abnormal: false, notes: "", technicianAssigned: ""
  },
  {
    id: "LT-510", patient: "Thomas Anderson", patientId: "P-110", age: 50, gender: "Male",
    test: "ECG", doctor: "Dr. Lee", date: "2026-03-19", completedDate: "2026-03-19",
    status: "completed", priority: "routine", sampleType: "other",
    sampleStatus: "completed", result: "Normal Sinus Rhythm", normalRange: "NSR", unit: "",
    abnormal: false, notes: "No arrhythmias detected", technicianAssigned: "Tech. Priya"
  },
];

export const labTestNames = [
  "Complete Blood Count",
  "Blood Sugar (Fasting)",
  "Blood Sugar (PP)",
  "Lipid Profile",
  "Thyroid Panel",
  "HbA1c",
  "Liver Function Test",
  "Kidney Function Test",
  "Urine Routine",
  "Urine Culture",
  "Blood Culture",
  "Chest X-Ray",
  "ECG",
  "Ultrasound Abdomen",
  "ESR",
  "CRP",
  "Vitamin D",
  "Vitamin B12",
  "Iron Studies",
  "Coagulation Profile",
  "Stool Routine",
  "Sputum Culture",
  "CSF Analysis",
];

export const sampleTypes = [
  "blood", "urine", "stool", "sputum", "swab", "tissue", "csf", "other",
] as const;

export const priorityLevels = ["routine", "urgent", "stat"] as const;

export const technicians = [
  "Tech. Ravi",
  "Tech. Priya",
  "Tech. Anand",
  "Tech. Meera",
];
