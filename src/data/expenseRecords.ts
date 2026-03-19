export interface ExpenseRecord {
  id: string;
  title: string;
  category: "rent" | "utilities" | "supplies" | "salaries" | "equipment" | "maintenance" | "marketing" | "miscellaneous";
  amount: number;
  paidTo: string;
  paymentMethod: "cash" | "bank" | "card" | "cheque";
  date: string;
  receipt: string;
  notes: string;
  status: "paid" | "pending" | "overdue";
}

export const expenseRecords: ExpenseRecord[] = [
  { id: "EXP-001", title: "Monthly Clinic Rent", category: "rent", amount: 2500, paidTo: "Realty Corp", paymentMethod: "bank", date: "2026-03-01", receipt: "RNT-0301", notes: "March rent", status: "paid" },
  { id: "EXP-002", title: "Electricity Bill", category: "utilities", amount: 380, paidTo: "Power Co.", paymentMethod: "bank", date: "2026-03-05", receipt: "UTL-0305", notes: "February cycle", status: "paid" },
  { id: "EXP-003", title: "Surgical Gloves (500 pcs)", category: "supplies", amount: 125, paidTo: "MedSupply Inc.", paymentMethod: "card", date: "2026-03-08", receipt: "SUP-0308", notes: "", status: "paid" },
  { id: "EXP-004", title: "Staff Salary - March", category: "salaries", amount: 12000, paidTo: "Payroll", paymentMethod: "bank", date: "2026-03-15", receipt: "", notes: "10 staff members", status: "pending" },
  { id: "EXP-005", title: "Ultrasound Probe Repair", category: "maintenance", amount: 650, paidTo: "MedTech Services", paymentMethod: "cheque", date: "2026-03-10", receipt: "MNT-0310", notes: "Probe replacement", status: "paid" },
  { id: "EXP-006", title: "Facebook Ads - March", category: "marketing", amount: 200, paidTo: "Meta Platforms", paymentMethod: "card", date: "2026-03-12", receipt: "MKT-0312", notes: "Patient awareness campaign", status: "paid" },
  { id: "EXP-007", title: "New Blood Pressure Monitor", category: "equipment", amount: 320, paidTo: "EquipMed", paymentMethod: "cash", date: "2026-03-14", receipt: "EQP-0314", notes: "", status: "paid" },
  { id: "EXP-008", title: "Water & Internet Bill", category: "utilities", amount: 150, paidTo: "Telecom Ltd", paymentMethod: "bank", date: "2026-03-18", receipt: "", notes: "March cycle", status: "overdue" },
  { id: "EXP-009", title: "Printer Cartridges", category: "supplies", amount: 85, paidTo: "OfficeMax", paymentMethod: "cash", date: "2026-03-17", receipt: "SUP-0317", notes: "Color + B&W", status: "paid" },
  { id: "EXP-010", title: "Pest Control Service", category: "miscellaneous", amount: 180, paidTo: "CleanGuard", paymentMethod: "cash", date: "2026-03-19", receipt: "MSC-0319", notes: "Quarterly service", status: "pending" },
];

export const expenseCategories = [
  "rent", "utilities", "supplies", "salaries", "equipment", "maintenance", "marketing", "miscellaneous",
] as const;

export const paymentMethods = ["cash", "bank", "card", "cheque"] as const;
