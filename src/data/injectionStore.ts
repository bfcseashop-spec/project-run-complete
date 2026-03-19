export interface InjectionItem {
  id: string;
  name: string;
  category: string;
  strength: string;
  route: string;
  stock: number;
  unit: string;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const initialInjections: InjectionItem[] = [
  { id: "INJ-001", name: "Insulin (Regular)", category: "Antidiabetic", strength: "10 IU/ml", route: "SC", stock: 120, unit: "Vials", price: 250, status: "in-stock" },
  { id: "INJ-002", name: "Insulin (Mixtard)", category: "Antidiabetic", strength: "20 IU/ml", route: "SC", stock: 85, unit: "Vials", price: 320, status: "in-stock" },
  { id: "INJ-003", name: "Ceftriaxone", category: "Antibiotic", strength: "1g", route: "IV/IM", stock: 200, unit: "Vials", price: 180, status: "in-stock" },
  { id: "INJ-004", name: "Gentamicin", category: "Antibiotic", strength: "80mg/2ml", route: "IM", stock: 15, unit: "Amps", price: 45, status: "low-stock" },
  { id: "INJ-005", name: "Ondansetron", category: "Antiemetic", strength: "4mg/2ml", route: "IV/IM", stock: 90, unit: "Amps", price: 35, status: "in-stock" },
  { id: "INJ-006", name: "Ranitidine", category: "Antacid", strength: "50mg/2ml", route: "IV/IM", stock: 0, unit: "Amps", price: 25, status: "out-of-stock" },
  { id: "INJ-007", name: "Dexamethasone", category: "Corticosteroid", strength: "4mg/ml", route: "IV/IM", stock: 60, unit: "Amps", price: 40, status: "in-stock" },
  { id: "INJ-008", name: "Diclofenac", category: "Analgesic", strength: "75mg/3ml", route: "IM", stock: 10, unit: "Amps", price: 30, status: "low-stock" },
  { id: "INJ-009", name: "Tramadol", category: "Analgesic", strength: "50mg/ml", route: "IV/IM", stock: 45, unit: "Amps", price: 55, status: "in-stock" },
  { id: "INJ-010", name: "Vitamin B12", category: "Supplement", strength: "1000mcg/ml", route: "IM", stock: 150, unit: "Amps", price: 20, status: "in-stock" },
  { id: "INJ-011", name: "Furosemide", category: "Diuretic", strength: "20mg/2ml", route: "IV/IM", stock: 70, unit: "Amps", price: 15, status: "in-stock" },
  { id: "INJ-012", name: "Metoclopramide", category: "Antiemetic", strength: "10mg/2ml", route: "IV/IM", stock: 0, unit: "Amps", price: 18, status: "out-of-stock" },
];

type Listener = () => void;
let injections: InjectionItem[] = [...initialInjections];
const listeners: Set<Listener> = new Set();

const notify = () => listeners.forEach((fn) => fn());

export const getInjections = () => injections;

export const addInjection = (inj: InjectionItem) => {
  injections = [inj, ...injections];
  notify();
};

export const updateInjection = (id: string, data: Partial<InjectionItem>) => {
  injections = injections.map((i) => (i.id === id ? { ...i, ...data } : i));
  notify();
};

export const deleteInjection = (id: string) => {
  injections = injections.filter((i) => i.id !== id);
  notify();
};

export const subscribeInjections = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const computeInjectionStatus = (stock: number): InjectionItem["status"] => {
  if (stock === 0) return "out-of-stock";
  if (stock <= 20) return "low-stock";
  return "in-stock";
};
