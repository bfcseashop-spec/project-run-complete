export interface OPDPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  doctor: string;
  status: "active" | "completed" | "pending";
  time: string;
  complaint: string;
}

export const opdPatients: OPDPatient[] = [
  { id: "OPD-401", name: "Sarah Johnson", age: 34, gender: "F", doctor: "Dr. Smith", status: "active", time: "09:15 AM", complaint: "Fever & Headache" },
  { id: "OPD-402", name: "Michael Chen", age: 56, gender: "M", doctor: "Dr. Patel", status: "completed", time: "09:30 AM", complaint: "Routine Checkup" },
  { id: "OPD-403", name: "Emily Davis", age: 28, gender: "F", doctor: "Dr. Williams", status: "pending", time: "10:00 AM", complaint: "Back Pain" },
  { id: "OPD-404", name: "James Wilson", age: 45, gender: "M", doctor: "Dr. Brown", status: "pending", time: "10:15 AM", complaint: "Allergic Reaction" },
  { id: "OPD-405", name: "Maria Garcia", age: 62, gender: "F", doctor: "Dr. Lee", status: "active", time: "10:30 AM", complaint: "Blood Pressure Review" },
];
