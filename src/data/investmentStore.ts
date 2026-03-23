type Listener = () => void;

export interface Investor {
  id: string;
  name: string;
  sharePercent: number;
  investmentName: string;
  capitalAmount: number;
  paid: number;
  color: string;
}

export type ContributionCategory =
  | "Rental" | "Salary" | "Electricity" | "Water Bill" | "Internet Service"
  | "Medicine" | "Medical Instrument" | "Ultrasound Payment" | "Lab Equipment"
  | "Maintenance" | "Furniture" | "Marketing" | "Tax" | "Other";

export const categoryColors: Record<ContributionCategory, string> = {
  Rental: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Salary: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Electricity: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Water Bill": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Internet Service": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Medicine: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Medical Instrument": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Ultrasound Payment": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Lab Equipment": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  Maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Furniture: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Marketing: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Tax: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export const allCategories: ContributionCategory[] = Object.keys(categoryColors) as ContributionCategory[];

export interface Contribution {
  id: string;
  date: string;
  investmentName: string;
  investorId: string;
  category: ContributionCategory;
  amount: number;
  slipCount: number;
  note: string;
}

// --- Initial Data ---
let investors: Investor[] = [
  { id: "inv-1", name: "JamesBond", sharePercent: 85, investmentName: "Capital Amount Investment", capitalAmount: 212500, paid: 147837.60, color: "hsl(217, 91%, 60%)" },
  { id: "inv-2", name: "Vvaple", sharePercent: 15, investmentName: "Capital Amount Investment", capitalAmount: 37500, paid: 30413.09, color: "hsl(270, 60%, 55%)" },
];

let contributions: Contribution[] = [
  { id: "c-001", date: "2026-03-12", investmentName: "Capital Amount Investment", investorId: "inv-2", category: "Rental", amount: 2000, slipCount: 1, note: "Sister Paid to Me - fro Clinic Rental - 2k" },
  { id: "c-002", date: "2026-03-12", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Rental", amount: 3800, slipCount: 2, note: "Sister Paid - 2k And me -3800" },
  { id: "c-003", date: "2026-03-11", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Water Bill", amount: 155.40, slipCount: 1, note: "-" },
  { id: "c-004", date: "2026-03-11", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Electricity", amount: 802.55, slipCount: 1, note: "-" },
  { id: "c-005", date: "2026-03-06", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Internet Service", amount: 220, slipCount: 1, note: "Internet service bill" },
  { id: "c-006", date: "2026-03-01", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Salary", amount: 2100, slipCount: 5, note: "Dr- 1050 nurse- 200, Reception - 200- pahrmacis -200, ..." },
  { id: "c-007", date: "2026-02-22", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Medical Instrument", amount: 351.80, slipCount: 1, note: "Oxygen cylinder- purchased" },
  { id: "c-008", date: "2026-02-21", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Medicine", amount: 125, slipCount: 1, note: "pay to Dr- buy Medicine" },
  { id: "c-009", date: "2026-02-19", investmentName: "Capital Amount Investment", investorId: "inv-1", category: "Ultrasound Payment", amount: 1000, slipCount: 1, note: "Tbs - ultrasound machine" },
  { id: "c-010", date: "2026-02-19", investmentName: "Capital Amount Investment", investorId: "inv-2", category: "Water Bill", amount: 7.40, slipCount: 1, note: "Water-bill.jan" },
];

let investorCounter = investors.length;
let contribCounter = contributions.length;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((fn) => fn());

// --- Getters ---
export const getInvestors = () => investors;
export const getContributions = () => contributions;
export const getInvestorById = (id: string) => investors.find((i) => i.id === id);

// --- Investor CRUD ---
export const addInvestor = (data: Omit<Investor, "id">) => {
  investorCounter++;
  const inv: Investor = { ...data, id: `inv-${investorCounter}` };
  investors = [...investors, inv];
  notify();
  return inv;
};

export const updateInvestor = (id: string, updates: Partial<Investor>) => {
  investors = investors.map((i) => (i.id === id ? { ...i, ...updates } : i));
  notify();
};

export const removeInvestor = (id: string) => {
  investors = investors.filter((i) => i.id !== id);
  notify();
};

// --- Contribution CRUD ---
export const addContribution = (data: Omit<Contribution, "id">) => {
  contribCounter++;
  const c: Contribution = { ...data, id: `c-${String(contribCounter).padStart(3, "0")}` };
  contributions = [c, ...contributions];
  // Auto-update investor paid amount
  const inv = investors.find((i) => i.id === data.investorId);
  if (inv) updateInvestor(inv.id, { paid: inv.paid + data.amount });
  notify();
  return c;
};

export const updateContribution = (id: string, updates: Partial<Contribution>) => {
  const old = contributions.find((c) => c.id === id);
  contributions = contributions.map((c) => (c.id === id ? { ...c, ...updates } : c));
  // Adjust investor paid if amount changed
  if (old && updates.amount !== undefined && updates.amount !== old.amount) {
    const diff = updates.amount - old.amount;
    const inv = investors.find((i) => i.id === (updates.investorId || old.investorId));
    if (inv) updateInvestor(inv.id, { paid: inv.paid + diff });
  }
  notify();
};

export const removeContribution = (id: string) => {
  const c = contributions.find((x) => x.id === id);
  if (c) {
    const inv = investors.find((i) => i.id === c.investorId);
    if (inv) updateInvestor(inv.id, { paid: Math.max(0, inv.paid - c.amount) });
  }
  contributions = contributions.filter((x) => x.id !== id);
  notify();
};

export const subscribeInvestments = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
