export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type PatientType = "Walk In" | "Indoor" | "Outdoor" | "Emergency";

export interface OPDPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  doctor: string;
  status: "active" | "completed" | "pending";
  time: string;
  complaint: string;
  bloodType?: BloodType;
  patientType?: PatientType;
  phone?: string;
  medicalHistory?: string;
}

export const opdPatients: OPDPatient[] = [
  { id: "OPD-401", name: "Sarah Johnson", age: 34, gender: "F", doctor: "Dr. Smith", status: "active", time: "09:15 AM", complaint: "Fever & Headache", bloodType: "O+", patientType: "Walk In", phone: "012345678" },
  { id: "OPD-402", name: "Michael Chen", age: 56, gender: "M", doctor: "Dr. Patel", status: "completed", time: "09:30 AM", complaint: "Routine Checkup", bloodType: "A+", patientType: "Outdoor", phone: "098765432" },
  { id: "OPD-403", name: "Emily Davis", age: 28, gender: "F", doctor: "Dr. Williams", status: "pending", time: "10:00 AM", complaint: "Back Pain", bloodType: "B+", patientType: "Walk In", phone: "077123456" },
  { id: "OPD-404", name: "James Wilson", age: 45, gender: "M", doctor: "Dr. Brown", status: "pending", time: "10:15 AM", complaint: "Allergic Reaction", bloodType: "AB-", patientType: "Emergency", phone: "088654321" },
  { id: "OPD-405", name: "Maria Garcia", age: 62, gender: "F", doctor: "Dr. Lee", status: "active", time: "10:30 AM", complaint: "Blood Pressure Review", bloodType: "O-", patientType: "Indoor", phone: "096111222" },
];
  { id: "OPD-401", name: "Sarah Johnson", age: 34, gender: "F", doctor: "Dr. Smith", status: "active", time: "09:15 AM", complaint: "Fever & Headache" },
  { id: "OPD-402", name: "Michael Chen", age: 56, gender: "M", doctor: "Dr. Patel", status: "completed", time: "09:30 AM", complaint: "Routine Checkup" },
  { id: "OPD-403", name: "Emily Davis", age: 28, gender: "F", doctor: "Dr. Williams", status: "pending", time: "10:00 AM", complaint: "Back Pain" },
  { id: "OPD-404", name: "James Wilson", age: 45, gender: "M", doctor: "Dr. Brown", status: "pending", time: "10:15 AM", complaint: "Allergic Reaction" },
  { id: "OPD-405", name: "Maria Garcia", age: 62, gender: "F", doctor: "Dr. Lee", status: "active", time: "10:30 AM", complaint: "Blood Pressure Review" },
];
