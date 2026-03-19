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
}

export const xrayRecords: XRayRecord[] = [
  { id: "XR-2001", patient: "Sarah Johnson", examination: "Chest X-Ray PA", doctor: "Dr. Patel", date: "2026-03-19", reportDate: "2026-03-19", status: "completed", bodyPart: "chest", findings: "Normal", impression: "No active disease", remarks: "Lungs clear, cardiac silhouette normal" },
  { id: "XR-2002", patient: "Michael Chen", examination: "Lumbar Spine AP/Lat", doctor: "Dr. Smith", date: "2026-03-19", reportDate: "", status: "pending", bodyPart: "spine", findings: "", impression: "", remarks: "" },
  { id: "XR-2003", patient: "Emily Davis", examination: "Right Hand AP/Oblique", doctor: "Dr. Lee", date: "2026-03-18", reportDate: "2026-03-18", status: "completed", bodyPart: "extremity", findings: "Fracture noted", impression: "Distal radius fracture", remarks: "Non-displaced fracture of distal radius" },
  { id: "XR-2004", patient: "James Wilson", examination: "Abdomen Supine", doctor: "Dr. Patel", date: "2026-03-19", reportDate: "", status: "in-progress", bodyPart: "abdomen", findings: "", impression: "", remarks: "Film under radiologist review" },
  { id: "XR-2005", patient: "Maria Garcia", examination: "Skull AP/Lat", doctor: "Dr. Smith", date: "2026-03-17", reportDate: "2026-03-18", status: "completed", bodyPart: "skull", findings: "Normal", impression: "No fracture or lesion", remarks: "Normal skull vault and base" },
  { id: "XR-2006", patient: "Robert Brown", examination: "Pelvis AP", doctor: "Dr. Lee", date: "2026-03-18", reportDate: "", status: "pending", bodyPart: "pelvis", findings: "", impression: "", remarks: "" },
  { id: "XR-2007", patient: "Linda Martinez", examination: "Cervical Spine", doctor: "Dr. Patel", date: "2026-03-18", reportDate: "2026-03-19", status: "completed", bodyPart: "spine", findings: "Mild spondylosis", impression: "Degenerative changes C5-C6", remarks: "Osteophyte formation noted" },
  { id: "XR-2008", patient: "David Kim", examination: "OPG (Dental)", doctor: "Dr. Smith", date: "2026-03-19", reportDate: "", status: "in-progress", bodyPart: "dental", findings: "", impression: "", remarks: "Panoramic dental X-ray processing" },
];

export const bodyParts = [
  "chest", "spine", "abdomen", "extremity", "skull", "pelvis", "dental",
] as const;

export const examinationNames = [
  "Chest X-Ray PA",
  "Chest X-Ray AP",
  "Chest X-Ray Lateral",
  "Lumbar Spine AP/Lat",
  "Cervical Spine",
  "Thoracic Spine",
  "Abdomen Supine",
  "Abdomen Erect",
  "Right Hand AP/Oblique",
  "Left Hand AP/Oblique",
  "Right Knee AP/Lat",
  "Left Knee AP/Lat",
  "Right Shoulder AP",
  "Left Shoulder AP",
  "Skull AP/Lat",
  "Pelvis AP",
  "OPG (Dental)",
  "Right Ankle AP/Lat",
  "Left Ankle AP/Lat",
  "Right Wrist AP/Lat",
  "Left Wrist AP/Lat",
];
