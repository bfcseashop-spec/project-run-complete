import { labTestNames, sampleTypes as defaultSampleTypes } from "@/data/labTests";

export interface TestNameEntry {
  id: string;
  name: string;
  category: string;
  sampleType: string;
  normalRange: string;
  unit: string;
  price: number;
  active: boolean;
}

export const defaultCategories = [
  "Hematology", "Biochemistry", "Microbiology", "Immunology",
  "Radiology", "Cardiology", "Urology", "Endocrinology", "General",
];

// Keep backward compat export
export const testCategories = defaultCategories;

const initialTests: TestNameEntry[] = labTestNames.map((name, i) => ({
  id: `TN-${(i + 1).toString().padStart(3, "0")}`,
  name,
  category: ["Hematology", "Biochemistry", "Biochemistry", "Biochemistry", "Endocrinology", "Biochemistry", "Biochemistry", "Biochemistry", "Urology", "Microbiology", "Microbiology", "Radiology", "Cardiology", "Radiology", "Hematology", "Immunology", "Biochemistry", "Biochemistry", "Hematology", "Hematology", "Microbiology", "Microbiology", "Microbiology"][i] || "General",
  sampleType: ["blood", "blood", "blood", "blood", "blood", "blood", "blood", "blood", "urine", "urine", "blood", "other", "other", "other", "blood", "blood", "blood", "blood", "blood", "blood", "stool", "sputum", "csf"][i] || "other",
  normalRange: ["4.5-11.0", "70-100", "70-140", "<200", "0.4-4.0", "<5.7", "7-56", "0.7-1.3", "Normal", "No Growth", "No Growth", "Normal", "NSR", "Normal", "0-20", "<6", "30-100", "200-900", "60-170", "11-13.5", "Normal", "No Growth", "Normal"][i] || "-",
  unit: ["x10³/µL", "mg/dL", "mg/dL", "mg/dL", "mIU/L", "%", "U/L", "mg/dL", "", "", "", "", "", "", "mm/hr", "mg/L", "ng/mL", "pg/mL", "µg/dL", "seconds", "", "", ""][i] || "",
  price: [350, 150, 150, 800, 600, 500, 900, 800, 200, 400, 1200, 1500, 300, 2000, 100, 400, 1200, 800, 600, 500, 200, 800, 1500][i] || 500,
  active: true,
}));

// Simple module-level mutable store so all pages share the same list
let _tests: TestNameEntry[] = [...initialTests];
let _categories: string[] = [...defaultCategories];
let _sampleTypes: string[] = [...defaultSampleTypes];
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

export const testNameStore = {
  getTests: () => _tests,
  getActiveTests: () => _tests.filter((t) => t.active),
  getActiveTestNames: () => _tests.filter((t) => t.active).map((t) => t.name),

  findByName: (name: string) => _tests.find((t) => t.name === name),

  addTest: (entry: Omit<TestNameEntry, "id">) => {
    const nextNum = _tests.length + 1;
    const newTest: TestNameEntry = { id: `TN-${nextNum.toString().padStart(3, "0")}`, ...entry };
    _tests = [..._tests, newTest];
    notify();
    return newTest;
  },

  updateTest: (id: string, updates: Partial<Omit<TestNameEntry, "id">>) => {
    _tests = _tests.map((t) => (t.id === id ? { ...t, ...updates } : t));
    notify();
  },

  removeTest: (id: string) => {
    _tests = _tests.filter((t) => t.id !== id);
    notify();
  },

  // Category management
  getCategories: () => _categories,
  addCategory: (name: string) => {
    if (!_categories.includes(name)) {
      _categories = [..._categories, name];
      notify();
    }
  },
  removeCategory: (name: string) => {
    _categories = _categories.filter((c) => c !== name);
    notify();
  },

  // Sample type management
  getSampleTypes: () => _sampleTypes,
  addSampleType: (name: string) => {
    if (!_sampleTypes.includes(name)) {
      _sampleTypes = [..._sampleTypes, name];
      notify();
    }
  },
  removeSampleType: (name: string) => {
    _sampleTypes = _sampleTypes.filter((s) => s !== name);
    notify();
  },

  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  },
};
