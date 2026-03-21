type Listener = () => void;

export interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  expiry: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const computeStatus = (stock: number): Medicine["status"] =>
  stock <= 0 ? "out-of-stock" : stock <= 20 ? "low-stock" : "in-stock";

const initial: Medicine[] = [
  { id: "M001", name: "Amoxicillin 500mg", category: "Antibiotic", stock: 240, unit: "Caps", price: 15, expiry: "2025-12-15", status: "in-stock" },
  { id: "M002", name: "Paracetamol 650mg", category: "Analgesic", stock: 500, unit: "Tabs", price: 5, expiry: "2026-03-20", status: "in-stock" },
  { id: "M003", name: "Metformin 500mg", category: "Antidiabetic", stock: 18, unit: "Tabs", price: 8, expiry: "2025-08-10", status: "low-stock" },
  { id: "M004", name: "Omeprazole 20mg", category: "Antacid", stock: 0, unit: "Caps", price: 12, expiry: "2025-06-01", status: "out-of-stock" },
  { id: "M005", name: "Cetirizine 10mg", category: "Antihistamine", stock: 150, unit: "Tabs", price: 6, expiry: "2026-01-30", status: "in-stock" },
  { id: "M006", name: "Azithromycin 250mg", category: "Antibiotic", stock: 45, unit: "Tabs", price: 20, expiry: "2025-11-22", status: "low-stock" },
  { id: "M007", name: "Ibuprofen 400mg", category: "Analgesic", stock: 300, unit: "Tabs", price: 10, expiry: "2026-05-15", status: "in-stock" },
  { id: "M008", name: "Ciprofloxacin 500mg", category: "Antibiotic", stock: 80, unit: "Tabs", price: 18, expiry: "2026-02-28", status: "in-stock" },
];

let medicines: Medicine[] = [...initial];
let counter = initial.length;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const getMedicines = () => medicines;

export const addMedicine = (med: Omit<Medicine, "id" | "status">) => {
  counter++;
  const newMed: Medicine = { ...med, id: `M${String(counter).padStart(3, "0")}`, status: computeStatus(med.stock) };
  medicines = [newMed, ...medicines];
  notify();
  return newMed;
};

export const updateMedicine = (id: string, updates: Partial<Medicine>) => {
  medicines = medicines.map((m) => {
    if (m.id !== id) return m;
    const updated = { ...m, ...updates };
    updated.status = computeStatus(updated.stock);
    return updated;
  });
  notify();
};

export const restockMedicine = (name: string, qty: number) => {
  const med = medicines.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
  if (med) {
    updateMedicine(med.id, { stock: med.stock + qty });
  }
};

export const deductMedicine = (name: string, qty: number): boolean => {
  const med = medicines.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
  if (med && med.stock >= qty) {
    updateMedicine(med.id, { stock: med.stock - qty });
    return true;
  }
  return false;
};

export const deleteMedicine = (id: string) => {
  medicines = medicines.filter((m) => m.id !== id);
  notify();
};

export const subscribeMedicines = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
