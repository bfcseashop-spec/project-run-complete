import type { InvoiceFormData, SplitPayment } from "@/components/NewInvoiceDialog";

export interface BillingRecord {
  id: string;
  patient: string;
  service: string;
  amount: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  date: string;
  status: "completed" | "pending" | "critical";
  method: string;
  formData?: InvoiceFormData;
}

const initialData: BillingRecord[] = [
  { id: "BIL-001", patient: "Sarah Johnson", service: "Lab Test + Consultation", amount: 350, discount: 20, tax: 16.5, total: 346.5, paid: 346.5, due: 0, date: "2026-03-19", status: "completed", method: "Cash",
    formData: { patient: "Sarah Johnson", doctor: "Dr. Sarah Smith", date: "2026-03-19", service: "Consultation", injection: "", packageItem: "", medicines: [], customItems: [], discount: 20, discountType: "fixed" as const, paidAmount: 346.5, paymentMethod: "Cash", splitPayments: [], lineItems: [{ type: "SVC", name: "Consultation", price: 150, qty: 1 }, { type: "SVC", name: "Lab Test - CBC", price: 200, qty: 1 }] } },
  { id: "BIL-002", patient: "Michael Chen", service: "X-Ray", amount: 200, discount: 0, tax: 10, total: 210, paid: 100, due: 110, date: "2026-03-18", status: "pending", method: "Card",
    formData: { patient: "Michael Chen", doctor: "Dr. Raj Patel", date: "2026-03-18", service: "X-Ray", injection: "", packageItem: "", medicines: [], customItems: [], discount: 0, discountType: "fixed" as const, paidAmount: 100, paymentMethod: "Card", splitPayments: [], lineItems: [{ type: "SVC", name: "X-Ray - Chest PA", price: 200, qty: 1 }] } },
  { id: "BIL-003", patient: "Emily Davis", service: "Ultrasound + Injection", amount: 480, discount: 30, tax: 22.5, total: 472.5, paid: 0, due: 472.5, date: "2026-03-17", status: "critical", method: "—",
    formData: { patient: "Emily Davis", doctor: "Dr. Emily Williams", date: "2026-03-17", service: "Ultrasound", injection: "Vitamin B12", packageItem: "", medicines: [], customItems: [], discount: 30, discountType: "fixed" as const, paidAmount: 0, paymentMethod: "—", splitPayments: [], lineItems: [{ type: "SVC", name: "Ultrasound - Abdomen", price: 300, qty: 1 }, { type: "INJ", name: "Vitamin B12", price: 180, qty: 1 }] } },
  { id: "BIL-004", patient: "James Wilson", service: "Health Checkup", amount: 150, discount: 0, tax: 7.5, total: 157.5, paid: 157.5, due: 0, date: "2026-03-16", status: "completed", method: "Cash",
    formData: { patient: "James Wilson", doctor: "Dr. Mark Brown", date: "2026-03-16", service: "", injection: "", packageItem: "Health Checkup", medicines: [], customItems: [], discount: 0, discountType: "fixed" as const, paidAmount: 157.5, paymentMethod: "Cash", splitPayments: [], lineItems: [{ type: "PKG", name: "Health Checkup", price: 150, qty: 1 }] } },
  { id: "BIL-005", patient: "Rina Akter", service: "Prescription + Medicine", amount: 90, discount: 10, tax: 4, total: 84, paid: 50, due: 34, date: "2026-03-15", status: "pending", method: "ABA",
    formData: { patient: "Rina Akter", doctor: "Dr. Lisa Lee", date: "2026-03-15", service: "Consultation", injection: "", packageItem: "", medicines: [{ name: "Amoxicillin", qty: 2, price: 15 }, { name: "Paracetamol", qty: 3, price: 5 }], customItems: [], discount: 10, discountType: "fixed" as const, paidAmount: 50, paymentMethod: "ABA", splitPayments: [], lineItems: [{ type: "SVC", name: "Consultation", price: 45, qty: 1 }, { type: "MED", name: "Amoxicillin", price: 15, qty: 2 }, { type: "MED", name: "Paracetamol", price: 5, qty: 3 }] } },
  { id: "BIL-006", patient: "Sopheap Ly", service: "Consultation", amount: 120, discount: 0, tax: 6, total: 126, paid: 126, due: 0, date: "2026-03-21", status: "completed", method: "ACleda",
    formData: { patient: "Sopheap Ly", doctor: "Dr. Sarah Smith", date: "2026-03-21", service: "Consultation", injection: "", packageItem: "", medicines: [], customItems: [], discount: 0, discountType: "fixed" as const, paidAmount: 126, paymentMethod: "ACleda", splitPayments: [], lineItems: [{ type: "SVC", name: "Consultation", price: 120, qty: 1 }] } },
  { id: "BIL-007", patient: "Channary Kim", service: "Lab Test", amount: 250, discount: 15, tax: 11.75, total: 246.75, paid: 246.75, due: 0, date: "2026-03-21", status: "completed", method: "ABA",
    formData: { patient: "Channary Kim", doctor: "Dr. Raj Patel", date: "2026-03-21", service: "", injection: "", packageItem: "", medicines: [], customItems: [], discount: 15, discountType: "fixed" as const, paidAmount: 246.75, paymentMethod: "ABA", splitPayments: [], lineItems: [{ type: "SVC", name: "Lab Test - CBC", price: 120, qty: 1 }, { type: "SVC", name: "Lab Test - Lipid Panel", price: 130, qty: 1 }] } },
  { id: "BIL-008", patient: "Dara Meng", service: "Medicine + Injection", amount: 180, discount: 0, tax: 9, total: 189, paid: 189, due: 0, date: "2026-03-21", status: "completed", method: "Cash",
    formData: { patient: "Dara Meng", doctor: "Dr. Emily Williams", date: "2026-03-21", service: "", injection: "Dexamethasone", packageItem: "", medicines: [{ name: "Ibuprofen", qty: 2, price: 10 }], customItems: [], discount: 0, discountType: "fixed" as const, paidAmount: 189, paymentMethod: "Cash", splitPayments: [], lineItems: [{ type: "INJ", name: "Dexamethasone", price: 160, qty: 1 }, { type: "MED", name: "Ibuprofen", price: 10, qty: 2 }] } },
  { id: "BIL-009", patient: "Sokha Phan", service: "X-Ray + Consultation", amount: 320, discount: 20, tax: 15, total: 315, paid: 315, due: 0, date: "2026-03-20", status: "completed", method: "Card",
    formData: { patient: "Sokha Phan", doctor: "Dr. Mark Brown", date: "2026-03-20", service: "X-Ray", injection: "", packageItem: "", medicines: [], customItems: [], discount: 20, discountType: "fixed" as const, paidAmount: 315, paymentMethod: "Card", splitPayments: [], lineItems: [{ type: "SVC", name: "X-Ray - Chest PA", price: 200, qty: 1 }, { type: "SVC", name: "Consultation", price: 120, qty: 1 }] } },
  { id: "BIL-010", patient: "Vanna Sok", service: "Ultrasound", amount: 280, discount: 0, tax: 14, total: 294, paid: 0, due: 294, date: "2026-03-20", status: "critical", method: "—",
    formData: { patient: "Vanna Sok", doctor: "Dr. Lisa Lee", date: "2026-03-20", service: "Ultrasound", injection: "", packageItem: "", medicines: [], customItems: [], discount: 0, discountType: "fixed" as const, paidAmount: 0, paymentMethod: "—", splitPayments: [], lineItems: [{ type: "SVC", name: "Ultrasound - Abdomen", price: 280, qty: 1 }] } },
];

type Listener = () => void;
let records: BillingRecord[] = [...initialData];
const listeners = new Set<Listener>();

function notify() { listeners.forEach((fn) => fn()); }

export function getBillingRecords(): BillingRecord[] { return records; }

export function setBillingRecords(data: BillingRecord[]) { records = data; notify(); }

export function addBillingRecord(record: BillingRecord) { records = [record, ...records]; notify(); }

export function removeBillingRecord(id: string) { records = records.filter((r) => r.id !== id); notify(); }

export function subscribeBilling(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
