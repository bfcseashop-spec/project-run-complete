import { supabase } from "@/integrations/supabase/client";

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

export const testCategories = defaultCategories;

let _tests: TestNameEntry[] = [];
let _categories: string[] = [...defaultCategories];
let _sampleTypes: string[] = ["blood", "urine", "stool", "sputum", "swab", "tissue", "csf", "other"];
let loaded = false;
let _listeners: Array<() => void> = [];

function notify() { _listeners.forEach((fn) => fn()); }

const toTest = (r: any): TestNameEntry => ({
  id: r.id, name: r.name, category: r.category, sampleType: r.sample_type,
  normalRange: r.normal_range, unit: r.unit, price: Number(r.price), active: r.active,
});

const load = async () => {
  const [testRes, catRes, stRes] = await Promise.all([
    supabase.from("test_names").select("*").order("created_at", { ascending: true }),
    supabase.from("test_categories").select("*").order("name", { ascending: true }),
    supabase.from("test_sample_types").select("*").order("name", { ascending: true }),
  ]);
  if (!testRes.error && testRes.data) _tests = testRes.data.map(toTest);
  if (!catRes.error && catRes.data) _categories = catRes.data.map((r: any) => r.name);
  if (!stRes.error && stRes.data) _sampleTypes = stRes.data.map((r: any) => r.name);
  loaded = true;
  notify();
};
load();

export const testNameStore = {
  getTests: () => _tests,
  getActiveTests: () => _tests.filter((t) => t.active),
  getActiveTestNames: () => _tests.filter((t) => t.active).map((t) => t.name),
  findByName: (name: string) => _tests.find((t) => t.name === name),

  addTest: async (entry: Omit<TestNameEntry, "id">) => {
    const id = `TN-${String(Date.now()).slice(-6)}`;
    const newTest: TestNameEntry = { id, ...entry };
    const { error } = await supabase.from("test_names").insert({
      id, name: entry.name, category: entry.category, sample_type: entry.sampleType,
      normal_range: entry.normalRange, unit: entry.unit, price: entry.price, active: entry.active,
    });
    if (error) throw error;
    _tests = [..._tests, newTest]; notify();
    return newTest;
  },

  updateTest: async (id: string, updates: Partial<Omit<TestNameEntry, "id">>) => {
    const dbUp: Record<string, any> = {};
    if (updates.name !== undefined) dbUp.name = updates.name;
    if (updates.category !== undefined) dbUp.category = updates.category;
    if (updates.sampleType !== undefined) dbUp.sample_type = updates.sampleType;
    if (updates.normalRange !== undefined) dbUp.normal_range = updates.normalRange;
    if (updates.unit !== undefined) dbUp.unit = updates.unit;
    if (updates.price !== undefined) dbUp.price = updates.price;
    if (updates.active !== undefined) dbUp.active = updates.active;
    await supabase.from("test_names").update(dbUp).eq("id", id);
    _tests = _tests.map((t) => (t.id === id ? { ...t, ...updates } : t)); notify();
  },

  removeTest: async (id: string) => {
    await supabase.from("test_names").delete().eq("id", id);
    _tests = _tests.filter((t) => t.id !== id); notify();
  },

  getCategories: () => _categories,
  addCategory: async (name: string) => {
    if (!_categories.includes(name)) {
      await supabase.from("test_categories").insert({ name });
      _categories = [..._categories, name]; notify();
    }
  },
  removeCategory: async (name: string) => {
    await supabase.from("test_categories").delete().eq("name", name);
    _categories = _categories.filter((c) => c !== name); notify();
  },

  getSampleTypes: () => _sampleTypes,
  addSampleType: async (name: string) => {
    if (!_sampleTypes.includes(name)) {
      await supabase.from("test_sample_types").insert({ name });
      _sampleTypes = [..._sampleTypes, name]; notify();
    }
  },
  removeSampleType: async (name: string) => {
    await supabase.from("test_sample_types").delete().eq("name", name);
    _sampleTypes = _sampleTypes.filter((s) => s !== name); notify();
  },

  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  },
};
