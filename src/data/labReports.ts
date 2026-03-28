import { supabase } from "@/integrations/supabase/client";

export interface ReportInvestigation {
  name: string;
  result: string;
  referenceValue: string;
  unit: string;
  flag?: "High" | "Low";
  isHeader?: boolean;
}

export interface ReportSection {
  title: string;
  investigations: ReportInvestigation[];
}

export interface LabReport {
  id: string;
  patient: string;
  patientId: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  testName: string;
  doctor: string;
  date: string;
  resultDate: string;
  status: "pending" | "completed" | "in-progress";
  category: "hematology" | "biochemistry" | "microbiology" | "pathology" | "radiology" | "immunology";
  result: string;
  normalRange: string;
  remarks: string;
  sampleType: string;
  collectedAt: string;
  reportedAt: string;
  technician: string;
  pathologist: string;
  instrument: string;
  expectedTAT?: string; // e.g. "4h", "2d", "1w"
  sections: ReportSection[];
  attachments?: { name: string; url: string; type: string; uploadedAt: string }[];
}

// ===== TEMPLATES =====

const cbcSections: ReportSection[] = [
  {
    title: "HEMOGLOBIN",
    investigations: [
      { name: "Hemoglobin (Hb)", result: "12.5", referenceValue: "13.0 - 17.0", unit: "g/dL", flag: "Low" },
    ],
  },
  {
    title: "RBC COUNT",
    investigations: [
      { name: "Total RBC count", result: "5.2", referenceValue: "4.5 - 5.5", unit: "mill/cumm" },
    ],
  },
  {
    title: "BLOOD INDICES",
    investigations: [
      { name: "Packed Cell Volume (PCV)", result: "57.5", referenceValue: "40 - 50", unit: "%", flag: "High" },
      { name: "Mean Corpuscular Volume (MCV)", result: "87.75", referenceValue: "83 - 101", unit: "fL" },
      { name: "MCH", result: "27.2", referenceValue: "27 - 32", unit: "pg" },
      { name: "MCHC", result: "32.8", referenceValue: "32.5 - 34.5", unit: "g/dL" },
      { name: "RDW", result: "13.6", referenceValue: "11.6 - 14.0", unit: "%" },
    ],
  },
  {
    title: "WBC COUNT",
    investigations: [
      { name: "Total WBC count", result: "9000", referenceValue: "4000 - 11000", unit: "cumm" },
    ],
  },
  {
    title: "DIFFERENTIAL COUNT",
    investigations: [
      { name: "Neutrophils", result: "60", referenceValue: "50 - 62", unit: "%" },
      { name: "Lymphocytes", result: "31", referenceValue: "20 - 40", unit: "%" },
      { name: "Eosinophils", result: "1", referenceValue: "00 - 06", unit: "%" },
      { name: "Monocytes", result: "7", referenceValue: "00 - 10", unit: "%" },
      { name: "Basophils", result: "1", referenceValue: "00 - 02", unit: "%" },
    ],
  },
  {
    title: "ABSOLUTE COUNT",
    investigations: [
      { name: "Absolute Neutrophils", result: "6000", referenceValue: "1500 - 7500", unit: "cells/mcL" },
      { name: "Absolute Lymphocytes", result: "3100", referenceValue: "1300 - 3500", unit: "cells/mcL" },
      { name: "Absolute Eosinophils", result: "100", referenceValue: "00 - 500", unit: "cells/mcL" },
      { name: "Absolute Monocytes", result: "700", referenceValue: "200 - 950", unit: "cells/mcL" },
      { name: "Absolute Basophils", result: "100", referenceValue: "00 - 300", unit: "cells/mcL" },
    ],
  },
  {
    title: "PLATELET COUNT",
    investigations: [
      { name: "Platelet Count", result: "320000", referenceValue: "150000 - 410000", unit: "cumm" },
    ],
  },
];

const lipidSections: ReportSection[] = [
  {
    title: "LIPID PROFILE",
    investigations: [
      { name: "Total Cholesterol", result: "220", referenceValue: "< 200", unit: "mg/dL", flag: "High" },
      { name: "HDL Cholesterol", result: "45", referenceValue: "> 40", unit: "mg/dL" },
      { name: "LDL Cholesterol", result: "148", referenceValue: "< 130", unit: "mg/dL", flag: "High" },
      { name: "VLDL Cholesterol", result: "27", referenceValue: "< 30", unit: "mg/dL" },
      { name: "Triglycerides", result: "135", referenceValue: "< 150", unit: "mg/dL" },
      { name: "Total Cholesterol/HDL Ratio", result: "4.9", referenceValue: "< 4.5", unit: "", flag: "High" },
    ],
  },
];

const hba1cSections: ReportSection[] = [
  {
    title: "GLYCATED HEMOGLOBIN",
    investigations: [
      { name: "HbA1c", result: "6.2", referenceValue: "< 5.7", unit: "%", flag: "High" },
      { name: "Estimated Average Glucose (eAG)", result: "131", referenceValue: "< 117", unit: "mg/dL", flag: "High" },
    ],
  },
];

const urineCultureSections: ReportSection[] = [
  {
    title: "URINE CULTURE & SENSITIVITY",
    investigations: [
      { name: "Culture Result", result: "No Growth", referenceValue: "Negative", unit: "" },
      { name: "Colony Count", result: "< 10,000", referenceValue: "< 10,000", unit: "CFU/mL" },
      { name: "Incubation Period", result: "48", referenceValue: "24 - 48", unit: "hours" },
    ],
  },
];

const thyroidSections: ReportSection[] = [
  {
    title: "THYROID FUNCTION TEST",
    investigations: [
      { name: "T3 (Triiodothyronine)", result: "1.45", referenceValue: "0.8 - 2.0", unit: "ng/mL" },
      { name: "T4 (Thyroxine)", result: "9.2", referenceValue: "5.1 - 14.1", unit: "µg/dL" },
      { name: "TSH (Thyroid Stimulating Hormone)", result: "5.8", referenceValue: "0.4 - 4.0", unit: "mIU/L", flag: "High" },
      { name: "Free T3", result: "2.9", referenceValue: "2.0 - 4.4", unit: "pg/mL" },
      { name: "Free T4", result: "1.1", referenceValue: "0.93 - 1.7", unit: "ng/dL" },
    ],
  },
];

const lftSections: ReportSection[] = [
  {
    title: "LIVER ENZYMES",
    investigations: [
      { name: "SGPT / ALT", result: "68", referenceValue: "7 - 56", unit: "U/L", flag: "High" },
      { name: "SGOT / AST", result: "42", referenceValue: "5 - 40", unit: "U/L", flag: "High" },
      { name: "Alkaline Phosphatase (ALP)", result: "95", referenceValue: "44 - 147", unit: "U/L" },
      { name: "GGT (Gamma GT)", result: "38", referenceValue: "9 - 48", unit: "U/L" },
    ],
  },
  {
    title: "BILIRUBIN",
    investigations: [
      { name: "Total Bilirubin", result: "1.4", referenceValue: "0.1 - 1.2", unit: "mg/dL", flag: "High" },
      { name: "Direct Bilirubin", result: "0.5", referenceValue: "0.0 - 0.3", unit: "mg/dL", flag: "High" },
      { name: "Indirect Bilirubin", result: "0.9", referenceValue: "0.1 - 1.0", unit: "mg/dL" },
    ],
  },
  {
    title: "PROTEINS",
    investigations: [
      { name: "Total Protein", result: "7.2", referenceValue: "6.0 - 8.3", unit: "g/dL" },
      { name: "Albumin", result: "4.0", referenceValue: "3.5 - 5.5", unit: "g/dL" },
      { name: "Globulin", result: "3.2", referenceValue: "2.0 - 3.5", unit: "g/dL" },
      { name: "A/G Ratio", result: "1.25", referenceValue: "1.1 - 2.5", unit: "" },
    ],
  },
];

const kftSections: ReportSection[] = [
  {
    title: "KIDNEY FUNCTION",
    investigations: [
      { name: "Blood Urea", result: "45", referenceValue: "15 - 40", unit: "mg/dL", flag: "High" },
      { name: "Blood Urea Nitrogen (BUN)", result: "21", referenceValue: "7 - 20", unit: "mg/dL", flag: "High" },
      { name: "Serum Creatinine", result: "1.4", referenceValue: "0.7 - 1.3", unit: "mg/dL", flag: "High" },
      { name: "BUN/Creatinine Ratio", result: "15", referenceValue: "10 - 20", unit: "" },
      { name: "eGFR", result: "62", referenceValue: "> 90", unit: "mL/min/1.73m²", flag: "Low" },
    ],
  },
  {
    title: "URIC ACID",
    investigations: [
      { name: "Serum Uric Acid", result: "7.8", referenceValue: "3.5 - 7.2", unit: "mg/dL", flag: "High" },
    ],
  },
  {
    title: "ELECTROLYTES",
    investigations: [
      { name: "Sodium (Na+)", result: "140", referenceValue: "136 - 145", unit: "mEq/L" },
      { name: "Potassium (K+)", result: "4.5", referenceValue: "3.5 - 5.1", unit: "mEq/L" },
      { name: "Chloride (Cl-)", result: "102", referenceValue: "98 - 106", unit: "mEq/L" },
      { name: "Calcium", result: "9.2", referenceValue: "8.5 - 10.5", unit: "mg/dL" },
      { name: "Phosphorus", result: "4.0", referenceValue: "2.5 - 4.5", unit: "mg/dL" },
    ],
  },
];

const bloodSugarFastingSections: ReportSection[] = [
  {
    title: "BLOOD SUGAR",
    investigations: [
      { name: "Fasting Blood Sugar", result: "112", referenceValue: "70 - 100", unit: "mg/dL", flag: "High" },
    ],
  },
  {
    title: "INTERPRETATION",
    investigations: [
      { name: "Normal", result: "", referenceValue: "< 100 mg/dL", unit: "" },
      { name: "Pre-Diabetes (IFG)", result: "", referenceValue: "100 - 125 mg/dL", unit: "" },
      { name: "Diabetes Mellitus", result: "", referenceValue: "> 126 mg/dL", unit: "" },
    ],
  },
];

const bloodSugarPPSections: ReportSection[] = [
  {
    title: "BLOOD SUGAR (POST PRANDIAL)",
    investigations: [
      { name: "Blood Sugar (PP) - 2 hrs after meal", result: "165", referenceValue: "< 140", unit: "mg/dL", flag: "High" },
    ],
  },
];

const urineRoutineSections: ReportSection[] = [
  {
    title: "PHYSICAL EXAMINATION",
    investigations: [
      { name: "Colour", result: "Pale Yellow", referenceValue: "Pale Yellow", unit: "" },
      { name: "Appearance", result: "Clear", referenceValue: "Clear", unit: "" },
      { name: "Specific Gravity", result: "1.020", referenceValue: "1.005 - 1.030", unit: "" },
      { name: "pH", result: "6.0", referenceValue: "4.5 - 8.0", unit: "" },
    ],
  },
  {
    title: "CHEMICAL EXAMINATION",
    investigations: [
      { name: "Protein", result: "Nil", referenceValue: "Nil", unit: "" },
      { name: "Glucose", result: "Nil", referenceValue: "Nil", unit: "" },
      { name: "Ketone Bodies", result: "Nil", referenceValue: "Nil", unit: "" },
      { name: "Bilirubin", result: "Nil", referenceValue: "Nil", unit: "" },
      { name: "Urobilinogen", result: "Normal", referenceValue: "Normal", unit: "" },
      { name: "Blood", result: "Nil", referenceValue: "Nil", unit: "" },
      { name: "Nitrite", result: "Negative", referenceValue: "Negative", unit: "" },
      { name: "Leukocyte Esterase", result: "Negative", referenceValue: "Negative", unit: "" },
    ],
  },
  {
    title: "MICROSCOPIC EXAMINATION",
    investigations: [
      { name: "Pus Cells", result: "2-3", referenceValue: "0 - 5", unit: "/HPF" },
      { name: "RBCs", result: "Nil", referenceValue: "0 - 2", unit: "/HPF" },
      { name: "Epithelial Cells", result: "Few", referenceValue: "Few", unit: "/HPF" },
      { name: "Casts", result: "Nil", referenceValue: "Nil", unit: "/LPF" },
      { name: "Crystals", result: "Nil", referenceValue: "Nil", unit: "/HPF" },
      { name: "Bacteria", result: "Nil", referenceValue: "Nil", unit: "" },
    ],
  },
];

const esrSections: ReportSection[] = [
  {
    title: "ERYTHROCYTE SEDIMENTATION RATE",
    investigations: [
      { name: "ESR (Westergren Method) - 1st hour", result: "28", referenceValue: "0 - 20", unit: "mm/hr", flag: "High" },
    ],
  },
];

const crpSections: ReportSection[] = [
  {
    title: "C-REACTIVE PROTEIN",
    investigations: [
      { name: "CRP (Quantitative)", result: "12.5", referenceValue: "< 6.0", unit: "mg/L", flag: "High" },
      { name: "hs-CRP", result: "3.2", referenceValue: "< 1.0", unit: "mg/L", flag: "High" },
    ],
  },
  {
    title: "INTERPRETATION",
    investigations: [
      { name: "Low Risk (Cardiovascular)", result: "", referenceValue: "< 1.0 mg/L", unit: "" },
      { name: "Moderate Risk", result: "", referenceValue: "1.0 - 3.0 mg/L", unit: "" },
      { name: "High Risk", result: "", referenceValue: "> 3.0 mg/L", unit: "" },
    ],
  },
];

const vitaminDSections: ReportSection[] = [
  {
    title: "VITAMIN D",
    investigations: [
      { name: "25-Hydroxy Vitamin D", result: "18.5", referenceValue: "30 - 100", unit: "ng/mL", flag: "Low" },
    ],
  },
  {
    title: "INTERPRETATION",
    investigations: [
      { name: "Deficient", result: "", referenceValue: "< 20 ng/mL", unit: "" },
      { name: "Insufficient", result: "", referenceValue: "20 - 29 ng/mL", unit: "" },
      { name: "Sufficient", result: "", referenceValue: "30 - 100 ng/mL", unit: "" },
      { name: "Toxic", result: "", referenceValue: "> 100 ng/mL", unit: "" },
    ],
  },
];

const vitaminB12Sections: ReportSection[] = [
  {
    title: "VITAMIN B12",
    investigations: [
      { name: "Serum Vitamin B12", result: "180", referenceValue: "211 - 946", unit: "pg/mL", flag: "Low" },
    ],
  },
  {
    title: "INTERPRETATION",
    investigations: [
      { name: "Deficient", result: "", referenceValue: "< 200 pg/mL", unit: "" },
      { name: "Borderline", result: "", referenceValue: "200 - 300 pg/mL", unit: "" },
      { name: "Normal", result: "", referenceValue: "> 300 pg/mL", unit: "" },
    ],
  },
];

const ironStudiesSections: ReportSection[] = [
  {
    title: "IRON STUDIES",
    investigations: [
      { name: "Serum Iron", result: "45", referenceValue: "60 - 170", unit: "µg/dL", flag: "Low" },
      { name: "Total Iron Binding Capacity (TIBC)", result: "420", referenceValue: "250 - 370", unit: "µg/dL", flag: "High" },
      { name: "Transferrin Saturation", result: "10.7", referenceValue: "20 - 50", unit: "%", flag: "Low" },
      { name: "Serum Ferritin", result: "8", referenceValue: "12 - 150", unit: "ng/mL", flag: "Low" },
    ],
  },
];

const coagulationSections: ReportSection[] = [
  {
    title: "COAGULATION PROFILE",
    investigations: [
      { name: "Prothrombin Time (PT)", result: "13.5", referenceValue: "11.0 - 13.5", unit: "seconds" },
      { name: "INR", result: "1.1", referenceValue: "0.8 - 1.1", unit: "" },
      { name: "aPTT", result: "32", referenceValue: "25 - 35", unit: "seconds" },
      { name: "Bleeding Time (BT)", result: "3.0", referenceValue: "1 - 6", unit: "minutes" },
      { name: "Clotting Time (CT)", result: "6.5", referenceValue: "4 - 9", unit: "minutes" },
      { name: "Fibrinogen", result: "280", referenceValue: "200 - 400", unit: "mg/dL" },
      { name: "D-Dimer", result: "0.35", referenceValue: "< 0.5", unit: "µg/mL" },
    ],
  },
];

const bloodCultureSections: ReportSection[] = [
  {
    title: "BLOOD CULTURE & SENSITIVITY",
    investigations: [
      { name: "Culture Result", result: "No Growth", referenceValue: "Negative", unit: "" },
      { name: "Incubation Period", result: "72", referenceValue: "48 - 72", unit: "hours" },
      { name: "Aerobic Culture", result: "No Growth", referenceValue: "Negative", unit: "" },
      { name: "Anaerobic Culture", result: "No Growth", referenceValue: "Negative", unit: "" },
    ],
  },
];

const defaultSections: ReportSection[] = [
  {
    title: "TEST RESULTS",
    investigations: [
      { name: "Result", result: "Pending", referenceValue: "-", unit: "" },
    ],
  },
];

// Template map for getSectionsForTest
const templateMap: Record<string, ReportSection[]> = {
  "Complete Blood Count": cbcSections,
  "Lipid Profile": lipidSections,
  "HbA1c": hba1cSections,
  "Urine Culture": urineCultureSections,
  "Thyroid Panel": thyroidSections,
  "Liver Function Test": lftSections,
  "Kidney Function Test": kftSections,
  "Blood Sugar (Fasting)": bloodSugarFastingSections,
  "Blood Sugar (PP)": bloodSugarPPSections,
  "Urine Routine": urineRoutineSections,
  "ESR": esrSections,
  "CRP": crpSections,
  "Vitamin D": vitaminDSections,
  "Vitamin B12": vitaminB12Sections,
  "Iron Studies": ironStudiesSections,
  "Coagulation Profile": coagulationSections,
  "Blood Culture": bloodCultureSections,
};

export function getSectionsForTest(testName: string, status: string): ReportSection[] {
  if (status !== "completed") return defaultSections;
  return templateMap[testName] || defaultSections;
}

export function getTemplateSections(testName: string): ReportSection[] {
  return templateMap[testName] || defaultSections;
}

// ===== REPORT DATA =====

export const labReports: LabReport[] = [
  {
    id: "LR-1001", patient: "Sarah Johnson", patientId: "P-101", age: 34, gender: "Female",
    testName: "Complete Blood Count", doctor: "Dr. Patel", date: "2026-03-19", resultDate: "2026-03-19",
    status: "completed", category: "hematology", result: "Normal", normalRange: "4.5-11.0 x10³/µL",
    remarks: "All values within range", sampleType: "Blood",
    collectedAt: "08:30 AM", reportedAt: "04:35 PM",
    technician: "Tech. Priya", pathologist: "Dr. Vimal Shah", instrument: "Fully automated cell counter - Mindray 300",
    sections: cbcSections,
  },
  {
    id: "LR-1002", patient: "Michael Chen", patientId: "P-102", age: 52, gender: "Male",
    testName: "Blood Sugar (Fasting)", doctor: "Dr. Patel", date: "2026-03-19", resultDate: "2026-03-19",
    status: "completed", category: "biochemistry", result: "Pre-Diabetic", normalRange: "70-100 mg/dL",
    remarks: "Fasting blood sugar elevated, recommend HbA1c", sampleType: "Blood",
    collectedAt: "07:15 AM", reportedAt: "11:30 AM",
    technician: "Tech. Ravi", pathologist: "Dr. Vimal Shah", instrument: "Semi-automated analyzer - Erba Chem 5x",
    sections: bloodSugarFastingSections,
  },
  {
    id: "LR-1003", patient: "Emily Davis", patientId: "P-103", age: 45, gender: "Female",
    testName: "Lipid Profile", doctor: "Dr. Smith", date: "2026-03-18", resultDate: "2026-03-18",
    status: "completed", category: "biochemistry", result: "Borderline High", normalRange: "<200 mg/dL",
    remarks: "LDL slightly elevated, dietary modifications advised", sampleType: "Blood",
    collectedAt: "09:15 AM", reportedAt: "03:20 PM",
    technician: "Tech. Ravi", pathologist: "Dr. Vimal Shah", instrument: "Semi-automated analyzer - Erba Chem 5x",
    sections: lipidSections,
  },
  {
    id: "LR-1004", patient: "James Wilson", patientId: "P-104", age: 61, gender: "Male",
    testName: "Thyroid Panel", doctor: "Dr. Lee", date: "2026-03-19", resultDate: "2026-03-19",
    status: "completed", category: "immunology", result: "Subclinical Hypothyroidism", normalRange: "0.4-4.0 mIU/L",
    remarks: "TSH elevated with normal T3/T4. Suggest clinical correlation and follow-up in 6 weeks.", sampleType: "Blood",
    collectedAt: "10:00 AM", reportedAt: "05:15 PM",
    technician: "Tech. Anand", pathologist: "Dr. Vimal Shah", instrument: "ECLIA - Cobas e411",
    sections: thyroidSections,
  },
  {
    id: "LR-1005", patient: "Maria Garcia", patientId: "P-105", age: 38, gender: "Female",
    testName: "HbA1c", doctor: "Dr. Patel", date: "2026-03-17", resultDate: "2026-03-18",
    status: "completed", category: "biochemistry", result: "6.2%", normalRange: "<5.7%",
    remarks: "Pre-diabetic range, follow-up recommended", sampleType: "Blood",
    collectedAt: "07:45 AM", reportedAt: "02:10 PM",
    technician: "Tech. Priya", pathologist: "Dr. Vimal Shah", instrument: "HPLC Analyzer - Bio-Rad D-10",
    sections: hba1cSections,
  },
  {
    id: "LR-1006", patient: "Robert Brown", patientId: "P-106", age: 29, gender: "Male",
    testName: "Liver Function Test", doctor: "Dr. Smith", date: "2026-03-18", resultDate: "2026-03-18",
    status: "completed", category: "biochemistry", result: "Mildly Deranged", normalRange: "7-56 U/L",
    remarks: "SGPT and Total Bilirubin mildly elevated. Rule out fatty liver. Advise USG Abdomen.", sampleType: "Blood",
    collectedAt: "08:00 AM", reportedAt: "02:45 PM",
    technician: "Tech. Meera", pathologist: "Dr. Vimal Shah", instrument: "Fully automated analyzer - Beckman AU480",
    sections: lftSections,
  },
  {
    id: "LR-1007", patient: "Linda Martinez", patientId: "P-107", age: 55, gender: "Female",
    testName: "Urine Culture", doctor: "Dr. Lee", date: "2026-03-17", resultDate: "2026-03-19",
    status: "completed", category: "microbiology", result: "No Growth", normalRange: "Negative",
    remarks: "No bacterial growth after 48hrs", sampleType: "Urine",
    collectedAt: "06:30 AM", reportedAt: "06:30 PM",
    technician: "Tech. Meera", pathologist: "Dr. Vimal Shah", instrument: "Incubator & Culture plates",
    sections: urineCultureSections,
  },
  {
    id: "LR-1008", patient: "David Kim", patientId: "P-108", age: 42, gender: "Male",
    testName: "Kidney Function Test", doctor: "Dr. Smith", date: "2026-03-16", resultDate: "2026-03-17",
    status: "completed", category: "biochemistry", result: "Impaired", normalRange: "0.7-1.3 mg/dL",
    remarks: "eGFR reduced, Creatinine and Urea elevated. Mild renal impairment. Nephrology referral advised.", sampleType: "Blood",
    collectedAt: "09:00 AM", reportedAt: "03:30 PM",
    technician: "Tech. Ravi", pathologist: "Dr. Vimal Shah", instrument: "Fully automated analyzer - Beckman AU480",
    sections: kftSections,
  },
  {
    id: "LR-1009", patient: "Patricia Taylor", patientId: "P-109", age: 67, gender: "Female",
    testName: "Vitamin D", doctor: "Dr. Patel", date: "2026-03-17", resultDate: "2026-03-18",
    status: "completed", category: "biochemistry", result: "Deficient", normalRange: "30-100 ng/mL",
    remarks: "Severe Vitamin D deficiency. Supplement with 60,000 IU weekly for 8 weeks.", sampleType: "Blood",
    collectedAt: "08:15 AM", reportedAt: "04:00 PM",
    technician: "Tech. Priya", pathologist: "Dr. Vimal Shah", instrument: "ECLIA - Cobas e411",
    sections: vitaminDSections,
  },
  {
    id: "LR-1010", patient: "Thomas Anderson", patientId: "P-110", age: 50, gender: "Male",
    testName: "Iron Studies", doctor: "Dr. Lee", date: "2026-03-18", resultDate: "2026-03-19",
    status: "completed", category: "hematology", result: "Iron Deficiency", normalRange: "60-170 µg/dL",
    remarks: "Low Serum Iron and Ferritin with high TIBC — consistent with iron deficiency anemia.", sampleType: "Blood",
    collectedAt: "07:30 AM", reportedAt: "01:45 PM",
    technician: "Tech. Anand", pathologist: "Dr. Vimal Shah", instrument: "Fully automated analyzer - Beckman AU480",
    sections: ironStudiesSections,
  },
  {
    id: "LR-1011", patient: "Susan White", patientId: "P-111", age: 33, gender: "Female",
    testName: "Urine Routine", doctor: "Dr. Smith", date: "2026-03-19", resultDate: "2026-03-19",
    status: "completed", category: "biochemistry", result: "Normal", normalRange: "Normal",
    remarks: "No abnormalities detected in physical, chemical, or microscopic examination.", sampleType: "Urine",
    collectedAt: "09:30 AM", reportedAt: "12:15 PM",
    technician: "Tech. Meera", pathologist: "Dr. Vimal Shah", instrument: "Urine Analyzer - Sysmex UF-1000i",
    sections: urineRoutineSections,
  },
  {
    id: "LR-1012", patient: "Richard Lee", patientId: "P-112", age: 58, gender: "Male",
    testName: "ESR", doctor: "Dr. Patel", date: "2026-03-18", resultDate: "2026-03-18",
    status: "completed", category: "hematology", result: "Elevated", normalRange: "0-20 mm/hr",
    remarks: "ESR elevated. Correlate clinically — may indicate infection or inflammation.", sampleType: "Blood",
    collectedAt: "08:45 AM", reportedAt: "10:00 AM",
    technician: "Tech. Ravi", pathologist: "Dr. Vimal Shah", instrument: "ESR Analyzer - Vacuette",
    sections: esrSections,
  },
  {
    id: "LR-1013", patient: "Nancy Clark", patientId: "P-113", age: 44, gender: "Female",
    testName: "Vitamin B12", doctor: "Dr. Lee", date: "2026-03-19", resultDate: "",
    status: "in-progress", category: "biochemistry", result: "", normalRange: "211-946 pg/mL",
    remarks: "", sampleType: "Blood",
    collectedAt: "10:30 AM", reportedAt: "",
    technician: "Tech. Priya", pathologist: "", instrument: "ECLIA - Cobas e411",
    sections: defaultSections,
  },
  {
    id: "LR-1014", patient: "George Harris", patientId: "P-114", age: 72, gender: "Male",
    testName: "Coagulation Profile", doctor: "Dr. Smith", date: "2026-03-19", resultDate: "",
    status: "pending", category: "hematology", result: "", normalRange: "",
    remarks: "", sampleType: "Blood",
    collectedAt: "", reportedAt: "",
    technician: "", pathologist: "", instrument: "",
    sections: defaultSections,
  },
];

export const reportCategories = [
  "hematology",
  "biochemistry",
  "microbiology",
  "pathology",
  "radiology",
  "immunology",
] as const;

export const reportTestNames = [
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
  "Biopsy Report",
  "Blood Culture",
  "ESR",
  "CRP",
  "Vitamin D",
  "Vitamin B12",
  "Iron Studies",
  "Coagulation Profile",
];
