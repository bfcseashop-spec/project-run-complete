type Listener = () => void;

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  boxNo: string;
  category: string;
  purchasePrice: number;
  price: number; // selling price
  stock: number; // quantity (total pcs)
  unit: string;
  soldOut: number;
  image: string;
  expiry: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const computeStatus = (stock: number): Medicine["status"] =>
  stock <= 0 ? "out-of-stock" : stock <= 20 ? "low-stock" : "in-stock";

const available = (m: Medicine) => m.stock - m.soldOut;

const initial: Medicine[] = [
  { id: "M001", name: "Amoxicillin 500mg", manufacturer: "BBCA Pharma", boxNo: "-", category: "Antibiotic", purchasePrice: 0.05, price: 0.25, stock: 240, unit: "Caps", soldOut: 12, image: "", expiry: "2028-09-26", status: "in-stock" },
  { id: "M002", name: "Paracetamol 650mg", manufacturer: "Square", boxNo: "-", category: "Analgesic", purchasePrice: 0.02, price: 0.15, stock: 500, unit: "Tabs", soldOut: 35, image: "", expiry: "2028-03-30", status: "in-stock" },
  { id: "M003", name: "Metformin 500mg", manufacturer: "Novo Nordisk", boxNo: "-", category: "Antidiabetic", purchasePrice: 0.04, price: 0.30, stock: 18, unit: "Tabs", soldOut: 5, image: "", expiry: "2027-08-07", status: "low-stock" },
  { id: "M004", name: "Omeprazole 20mg", manufacturer: "Sanofi", boxNo: "-", category: "Antacid", purchasePrice: 0.06, price: 0.35, stock: 0, unit: "Caps", soldOut: 0, image: "", expiry: "2026-06-01", status: "out-of-stock" },
  { id: "M005", name: "Cetirizine 10mg", manufacturer: "Square", boxNo: "-", category: "Antihistamine", purchasePrice: 0.03, price: 0.25, stock: 150, unit: "Tabs", soldOut: 10, image: "", expiry: "2028-01-30", status: "in-stock" },
  { id: "M006", name: "Azithromycin 250mg", manufacturer: "BBCA Pharma", boxNo: "-", category: "Antibiotic", purchasePrice: 0.10, price: 0.50, stock: 45, unit: "Tabs", soldOut: 8, image: "", expiry: "2027-11-22", status: "in-stock" },
  { id: "M007", name: "Ibuprofen 400mg", manufacturer: "PT MediFarma Lab", boxNo: "-", category: "Analgesic", purchasePrice: 0.04, price: 0.20, stock: 300, unit: "Tabs", soldOut: 20, image: "", expiry: "2028-05-15", status: "in-stock" },
  { id: "M008", name: "Ciprofloxacin 500mg", manufacturer: "Korean Drug co.Ltd", boxNo: "-", category: "Antibiotic", purchasePrice: 0.08, price: 0.40, stock: 80, unit: "Tabs", soldOut: 15, image: "", expiry: "2028-02-28", status: "in-stock" },
  { id: "M009", name: "Alatrol", manufacturer: "Square", boxNo: "-", category: "Syrup", purchasePrice: 0.80, price: 4.99, stock: 97, unit: "Bottles", soldOut: 0, image: "", expiry: "2028-08-30", status: "in-stock" },
  { id: "M010", name: "Actrapid", manufacturer: "Novo Nordisk", boxNo: "-", category: "Injection", purchasePrice: 8.50, price: 50.00, stock: 1, unit: "Vials", soldOut: 0, image: "", expiry: "2026-08-31", status: "low-stock" },
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

export const subscribeMedicines = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
