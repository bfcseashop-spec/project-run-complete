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
}

export const ultrasoundRecords: UltrasoundRecord[] = [
  { id: "US-3001", patient: "Sarah Johnson", examination: "Whole Abdomen USG", doctor: "Dr. Patel", date: "2026-03-19", reportDate: "2026-03-19", status: "completed", region: "abdomen", findings: "Normal liver, GB, pancreas, spleen, kidneys", impression: "Normal study", remarks: "No focal lesion seen" },
  { id: "US-3002", patient: "Michael Chen", examination: "Obstetric USG (2nd Trimester)", doctor: "Dr. Smith", date: "2026-03-19", reportDate: "", status: "pending", region: "obstetric", findings: "", impression: "", remarks: "" },
  { id: "US-3003", patient: "Emily Davis", examination: "Thyroid USG", doctor: "Dr. Lee", date: "2026-03-18", reportDate: "2026-03-18", status: "completed", region: "thyroid", findings: "Small nodule right lobe", impression: "Benign thyroid nodule (TIRADS 2)", remarks: "6mm hypoechoic nodule, follow-up in 6 months" },
  { id: "US-3004", patient: "James Wilson", examination: "Pelvic USG", doctor: "Dr. Patel", date: "2026-03-19", reportDate: "", status: "in-progress", region: "pelvis", findings: "", impression: "", remarks: "Scan in progress" },
  { id: "US-3005", patient: "Maria Garcia", examination: "Breast USG (Bilateral)", doctor: "Dr. Smith", date: "2026-03-17", reportDate: "2026-03-18", status: "completed", region: "breast", findings: "Normal bilateral breast parenchyma", impression: "BIRADS 1 - Normal", remarks: "No mass or cyst identified" },
  { id: "US-3006", patient: "Robert Brown", examination: "Carotid Doppler", doctor: "Dr. Lee", date: "2026-03-18", reportDate: "", status: "pending", region: "vascular", findings: "", impression: "", remarks: "" },
  { id: "US-3007", patient: "Linda Martinez", examination: "Echocardiography", doctor: "Dr. Patel", date: "2026-03-18", reportDate: "2026-03-19", status: "completed", region: "cardiac", findings: "Normal LV function, EF 60%", impression: "Normal echocardiogram", remarks: "No valvular abnormality" },
  { id: "US-3008", patient: "David Kim", examination: "Musculoskeletal USG (Right Shoulder)", doctor: "Dr. Smith", date: "2026-03-19", reportDate: "", status: "in-progress", region: "musculoskeletal", findings: "", impression: "", remarks: "Evaluating rotator cuff" },
];

export const regions = [
  "abdomen", "pelvis", "obstetric", "thyroid", "breast", "musculoskeletal", "vascular", "cardiac",
] as const;

export const examinationNames = [
  "Whole Abdomen USG",
  "Upper Abdomen USG",
  "KUB (Kidney, Ureter, Bladder)",
  "Liver & GB USG",
  "Pelvic USG",
  "Transvaginal USG",
  "Obstetric USG (1st Trimester)",
  "Obstetric USG (2nd Trimester)",
  "Obstetric USG (3rd Trimester)",
  "NT Scan",
  "Anomaly Scan",
  "Growth Scan",
  "Thyroid USG",
  "Breast USG (Bilateral)",
  "Breast USG (Unilateral)",
  "Carotid Doppler",
  "Venous Doppler (Lower Limb)",
  "Arterial Doppler (Lower Limb)",
  "Renal Doppler",
  "Echocardiography",
  "Musculoskeletal USG (Shoulder)",
  "Musculoskeletal USG (Knee)",
  "Musculoskeletal USG (Other)",
  "Scrotal USG",
  "Soft Tissue USG",
];
